-- Enhanced Profile Stats and Study Streak System
-- This file implements automatic profile updates based on mock test performance and daily login tracking

-- 1. Create mock_test_sessions table to track when tests start and complete
CREATE TABLE IF NOT EXISTS mock_test_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
    total_questions INTEGER NOT NULL,
    questions_attempted INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    time_taken_minutes INTEGER,
    score INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create mock_test_results table to store final test results
CREATE TABLE IF NOT EXISTS mock_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES mock_test_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
    score INTEGER NOT NULL, -- Raw score (e.g., 15 out of 20)
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_taken_minutes INTEGER,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create function to update profile when mock test starts
CREATE OR REPLACE FUNCTION update_profile_on_test_start()
RETURNS TRIGGER AS $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Get the current profile
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE id = NEW.user_id;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Update profile with questions attempted (this counts as "answered" even if not completed)
    UPDATE profiles 
    SET 
        total_questions_answered = COALESCE(total_questions_answered, 0) + NEW.total_questions,
        last_active = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to update profile when mock test starts
DROP TRIGGER IF EXISTS trigger_update_profile_on_test_start ON mock_test_sessions;
CREATE TRIGGER trigger_update_profile_on_test_start
    AFTER INSERT ON mock_test_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_on_test_start();

-- 5. Create function to update profile when mock test completes
CREATE OR REPLACE FUNCTION update_profile_on_test_complete()
RETURNS TRIGGER AS $$
DECLARE
    profile_record RECORD;
    accuracy_score REAL;
    new_ai_ability REAL;
BEGIN
    -- Only proceed if test is completed
    IF NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;
    
    -- Get the current profile
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE id = NEW.user_id;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Calculate accuracy percentage
    accuracy_score := (NEW.correct_answers::REAL / NEW.total_questions::REAL) * 100;
    
    -- Calculate new AI ability estimate (weighted average)
    new_ai_ability := COALESCE(
        (profile_record.ai_ability_estimate * 0.7) + (accuracy_score * 0.3),
        accuracy_score
    );
    
    -- Update profile with final results
    UPDATE profiles 
    SET 
        correct_answers = COALESCE(correct_answers, 0) + NEW.correct_answers,
        ai_ability_estimate = new_ai_ability,
        last_active = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    -- Update weak/strong topics based on performance
    PERFORM update_user_topics_from_mock_test(NEW.user_id, NEW.mock_test_id, accuracy_score);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to update profile when mock test completes
DROP TRIGGER IF EXISTS trigger_update_profile_on_test_complete ON mock_test_sessions;
CREATE TRIGGER trigger_update_profile_on_test_complete
    AFTER UPDATE OF status ON mock_test_sessions
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_profile_on_test_complete();

-- 7. Create function to update weak/strong topics based on mock test performance
CREATE OR REPLACE FUNCTION update_user_topics_from_mock_test(
    user_uuid UUID, 
    test_uuid UUID, 
    accuracy REAL
)
RETURNS void AS $$
DECLARE
    test_topics TEXT[];
    current_weak_topics TEXT[];
    current_strong_topics TEXT[];
    new_weak_topics TEXT[];
    new_strong_topics TEXT[];
BEGIN
    -- Get topics from the mock test
    SELECT ARRAY_AGG(DISTINCT topic) INTO test_topics
    FROM mock_questions 
    WHERE mock_test_id = test_uuid 
    AND topic IS NOT NULL;
    
    -- Get current weak/strong topics
    SELECT weak_topics, strong_topics INTO current_weak_topics, current_strong_topics
    FROM profiles WHERE id = user_uuid;
    
    -- Initialize arrays if NULL
    current_weak_topics := COALESCE(current_weak_topics, '{}');
    current_strong_topics := COALESCE(current_strong_topics, '{}');
    
    -- Determine new weak/strong topics based on accuracy
    IF accuracy < 60 THEN
        -- Poor performance - add to weak topics
        new_weak_topics := array_cat(current_weak_topics, test_topics);
        new_strong_topics := current_strong_topics;
    ELSIF accuracy > 80 THEN
        -- Good performance - add to strong topics
        new_strong_topics := array_cat(current_strong_topics, test_topics);
        new_weak_topics := current_weak_topics;
    ELSE
        -- Average performance - keep current state
        new_weak_topics := current_weak_topics;
        new_strong_topics := current_strong_topics;
    END IF;
    
    -- Remove duplicates
    new_weak_topics := array_remove(array_remove(new_weak_topics, NULL), '');
    new_strong_topics := array_remove(array_remove(new_strong_topics, NULL), '');
    
    -- Update profile with new topic analysis
    UPDATE profiles 
    SET 
        weak_topics = new_weak_topics,
        strong_topics = new_strong_topics,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to track daily login and update study streak
CREATE OR REPLACE FUNCTION update_study_streak_on_login()
RETURNS TRIGGER AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    last_active_date DATE;
    current_streak INTEGER;
    new_streak INTEGER;
BEGIN
    -- Get current streak and last active date
    SELECT study_streak, last_active::date INTO current_streak, last_active_date
    FROM profiles 
    WHERE id = NEW.id;
    
    -- Initialize if NULL
    current_streak := COALESCE(current_streak, 0);
    last_active_date := COALESCE(last_active_date, current_date - INTERVAL '1 day');
    
    -- Calculate new streak
    IF last_active_date = current_date - INTERVAL '1 day' THEN
        -- Consecutive day - continue streak
        new_streak := current_streak + 1;
    ELSIF last_active_date = current_date THEN
        -- Same day - keep current streak
        new_streak := current_streak;
    ELSE
        -- Gap in days - reset streak
        new_streak := 1;
    END IF;
    
    -- Update profile with new streak and last active
    UPDATE profiles 
    SET 
        study_streak = new_streak,
        last_active = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to update study streak when user logs in (profile is updated)
DROP TRIGGER IF EXISTS trigger_update_streak_on_login ON profiles;
CREATE TRIGGER trigger_update_streak_on_login
    AFTER UPDATE OF last_active ON profiles
    FOR EACH ROW
    WHEN (OLD.last_active IS DISTINCT FROM NEW.last_active)
    EXECUTE FUNCTION update_study_streak_on_login();

-- 10. Create function to calculate overall student accuracy
CREATE OR REPLACE FUNCTION calculate_student_accuracy(user_uuid UUID)
RETURNS TABLE(
    total_questions INTEGER,
    total_correct INTEGER,
    accuracy_percentage REAL,
    mock_test_count INTEGER,
    average_mock_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.total_questions_answered, 0) as total_questions,
        COALESCE(p.correct_answers, 0) as total_correct,
        CASE 
            WHEN p.total_questions_answered > 0 
            THEN (p.correct_answers::REAL / p.total_questions_answered::REAL) * 100
            ELSE 0 
        END as accuracy_percentage,
        COUNT(mts.id) as mock_test_count,
        (AVG(mts.score::REAL / mts.total_questions::REAL) * 100) as average_mock_score
    FROM profiles p
    LEFT JOIN mock_test_sessions mts ON p.id = mts.user_id AND mts.status = 'completed'
    WHERE p.id = user_uuid
    GROUP BY p.id, p.total_questions_answered, p.correct_answers;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get student performance insights
CREATE OR REPLACE FUNCTION get_student_performance_insights(user_uuid UUID)
RETURNS TABLE(
    study_streak INTEGER,
    total_study_time_hours REAL,
    weak_topics TEXT[],
    strong_topics TEXT[],
    recommended_focus TEXT[],
    next_goals TEXT[]
) AS $$
DECLARE
    user_profile RECORD;
    weak_topics_array TEXT[];
    strong_topics_array TEXT[];
BEGIN
    -- Get user profile
    SELECT * INTO user_profile FROM profiles WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Get weak and strong topics
    weak_topics_array := COALESCE(user_profile.weak_topics, '{}');
    strong_topics_array := COALESCE(user_profile.strong_topics, '{}');
    
    RETURN QUERY
    SELECT 
        user_profile.study_streak,
        COALESCE(user_profile.total_questions_answered * 2 / 60.0, 0) as total_study_time_hours, -- Estimate 2 min per question
        weak_topics_array,
        strong_topics_array,
        weak_topics_array as recommended_focus,
        ARRAY[
            CASE 
                WHEN user_profile.study_streak < 3 THEN 'Build daily study habit'
                WHEN user_profile.study_streak < 7 THEN 'Maintain weekly consistency'
                ELSE 'Focus on weak topics improvement'
            END,
            CASE 
                WHEN array_length(weak_topics_array, 1) > 3 THEN 'Prioritize top 3 weak areas'
                ELSE 'Strengthen current weak topics'
            END
        ] as next_goals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to reset study streak if user hasn't logged in for more than 1 day
CREATE OR REPLACE FUNCTION reset_inactive_streaks()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    current_date DATE := CURRENT_DATE;
BEGIN
    FOR profile_record IN 
        SELECT id, study_streak, last_active 
        FROM profiles 
        WHERE last_active < current_date - INTERVAL '1 day'
        AND study_streak > 0
    LOOP
        UPDATE profiles 
        SET 
            study_streak = 0,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = profile_record.id;
        
        RAISE NOTICE 'Reset streak for user % from % to 0', profile_record.id, profile_record.study_streak;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_user_id ON mock_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_status ON mock_test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mock_test_results_user_id ON mock_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_results_test_id ON mock_test_results(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_results_completed_at ON mock_test_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);
CREATE INDEX IF NOT EXISTS idx_profiles_study_streak ON profiles(study_streak);

-- 14. Add RLS policies for the new tables
ALTER TABLE mock_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for mock_test_sessions
CREATE POLICY "Users can view their own mock test sessions" ON mock_test_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own mock test sessions" ON mock_test_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own mock test sessions" ON mock_test_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS policies for mock_test_results
CREATE POLICY "Users can view their own mock test results" ON mock_test_results
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own mock test results" ON mock_test_results
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own mock test results" ON mock_test_results
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 15. Create a view for easy access to student performance data
CREATE OR REPLACE VIEW student_performance_summary AS
SELECT 
    p.id,
    p.full_name,
    p.exam_type,
    p.total_questions_answered,
    p.correct_answers,
    p.study_streak,
    p.weak_topics,
    p.strong_topics,
    p.last_active,
    p.ai_ability_estimate,
    CASE 
        WHEN p.total_questions_answered > 0 
        THEN (p.correct_answers::REAL / p.total_questions_answered::REAL) * 100
        ELSE 0 
    END as overall_accuracy,
    COUNT(mts.id) as total_mock_tests,
    (AVG(mts.score::REAL / mts.total_questions::REAL) * 100) as average_mock_score,
    MAX(mts.completed_at) as last_mock_test_date
FROM profiles p
LEFT JOIN mock_test_sessions mts ON p.id = mts.user_id AND mts.status = 'completed'
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.exam_type, p.total_questions_answered, p.correct_answers, 
         p.study_streak, p.weak_topics, p.strong_topics, p.last_active, p.ai_ability_estimate;

-- Grant access to the view
GRANT SELECT ON student_performance_summary TO authenticated;

-- 16. Create function to manually trigger streak update (useful for testing)
CREATE OR REPLACE FUNCTION force_streak_update(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- Update last_active to trigger streak calculation
    UPDATE profiles 
    SET last_active = CURRENT_TIMESTAMP
    WHERE id = user_uuid;
    
    GET DIAGNOSTICS result = ROW_COUNT;
    
    IF result > 0 THEN
        RETURN 'Streak updated successfully for user ' || user_uuid;
    ELSE
        RETURN 'User not found: ' || user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION force_streak_update(UUID) TO authenticated;

-- 17. Final verification - check if everything was created correctly
SELECT 
    'Tables created:' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('mock_test_sessions', 'mock_test_results')
AND table_schema = 'public'

UNION ALL

SELECT 
    'Functions created:' as status,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN ('update_profile_on_test_start', 'update_profile_on_test_complete', 
                       'update_user_topics_from_mock_test', 'update_study_streak_on_login', 
                       'calculate_student_accuracy', 'get_student_performance_insights', 
                       'reset_inactive_streaks', 'force_streak_update')
AND routine_schema = 'public'

UNION ALL

SELECT 
    'Triggers created:' as status,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_update_profile_on_test_start', 'trigger_update_profile_on_test_complete', 
                       'trigger_update_streak_on_login')
AND trigger_schema = 'public'

UNION ALL

SELECT 
    'Profiles updated:' as status,
    COUNT(*) as count
FROM profiles 
WHERE total_questions_answered IS NOT NULL 
AND correct_answers IS NOT NULL 
AND study_streak IS NOT NULL;

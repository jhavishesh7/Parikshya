-- Recreate Tables with Correct Foreign Key References
-- This file completely recreates the mock_test_sessions and mock_test_results tables with proper references

-- 1. Drop all dependent objects first (views, triggers, functions)
DROP VIEW IF EXISTS student_performance_summary CASCADE;
DROP VIEW IF EXISTS user_study_stats CASCADE;

DROP TRIGGER IF EXISTS trigger_update_profile_on_test_start ON mock_test_sessions;
DROP TRIGGER IF EXISTS trigger_update_profile_on_test_complete ON mock_test_sessions;
DROP TRIGGER IF EXISTS trigger_update_streak_on_login ON profiles;

DROP FUNCTION IF EXISTS update_profile_on_test_start();
DROP FUNCTION IF EXISTS update_profile_on_test_complete();
DROP FUNCTION IF EXISTS update_user_topics_from_mock_test(UUID, UUID, REAL);
DROP FUNCTION IF EXISTS update_study_streak_on_login();
DROP FUNCTION IF EXISTS calculate_student_accuracy(UUID);
DROP FUNCTION IF EXISTS get_student_performance_insights(UUID);
DROP FUNCTION IF EXISTS reset_inactive_streaks();
DROP FUNCTION IF EXISTS force_streak_update(UUID);

-- 2. Drop tables with CASCADE to remove all dependencies
DROP TABLE IF EXISTS mock_test_results CASCADE;
DROP TABLE IF EXISTS mock_test_sessions CASCADE;

-- 3. Recreate mock_test_sessions table with correct foreign key
CREATE TABLE mock_test_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will reference auth.users(id)
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

-- 4. Recreate mock_test_results table with correct foreign key
CREATE TABLE mock_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES mock_test_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Will reference auth.users(id)
    mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
    score INTEGER NOT NULL, -- Raw score (e.g., 15 out of 20)
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    time_taken_minutes INTEGER,
    completed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Add the correct foreign key constraints to auth.users
ALTER TABLE mock_test_sessions 
ADD CONSTRAINT mock_test_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE mock_test_results 
ADD CONSTRAINT mock_test_results_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Recreate the trigger function for test start
CREATE OR REPLACE FUNCTION update_profile_on_test_start()
RETURNS TRIGGER AS $$
DECLARE
    profile_record RECORD;
    user_email TEXT;
BEGIN
    -- Get the current profile using user_id from auth.users
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE user_id = NEW.user_id;
    
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    
    IF NOT FOUND THEN
        -- If no profile exists, create one
        INSERT INTO profiles (user_id, email, full_name, exam_type, role, total_questions_answered, correct_answers, study_streak, weak_topics, strong_topics, last_active, created_at, updated_at)
        VALUES (
            NEW.user_id,
            user_email,
            'Student',
            'IOE',
            'student',
            NEW.total_questions,
            0,
            0,
            '{}',
            '{}',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        RETURN NEW;
    END IF;
    
    -- Update profile with questions attempted (this counts as "answered" even if not completed)
    UPDATE profiles 
    SET 
        total_questions_answered = COALESCE(total_questions_answered, 0) + NEW.total_questions,
        last_active = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Recreate the trigger function for test completion
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
    WHERE user_id = NEW.user_id;
    
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
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Recreate the trigger function for study streak updates
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

-- 9. Recreate the triggers
CREATE TRIGGER trigger_update_profile_on_test_start
    AFTER INSERT ON mock_test_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_on_test_start();

CREATE TRIGGER trigger_update_profile_on_test_complete
    AFTER UPDATE OF status ON mock_test_sessions
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_profile_on_test_complete();

CREATE TRIGGER trigger_update_streak_on_login
    AFTER UPDATE OF last_active ON profiles
    FOR EACH ROW
    WHEN (OLD.last_active IS DISTINCT FROM NEW.last_active)
    EXECUTE FUNCTION update_study_streak_on_login();

-- 10. Create indexes for better performance
CREATE INDEX idx_mock_test_sessions_user_id ON mock_test_sessions(user_id);
CREATE INDEX idx_mock_test_sessions_status ON mock_test_sessions(status);
CREATE INDEX idx_mock_test_results_user_id ON mock_test_results(user_id);
CREATE INDEX idx_mock_test_results_test_id ON mock_test_results(mock_test_id);

-- 11. Recreate the student performance summary view
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
LEFT JOIN mock_test_sessions mts ON p.user_id = mts.user_id AND mts.status = 'completed'
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.exam_type, p.total_questions_answered, p.correct_answers, 
         p.study_streak, p.weak_topics, p.strong_topics, p.last_active, p.ai_ability_estimate;

-- Grant access to the view
GRANT SELECT ON student_performance_summary TO authenticated;

-- 12. Verify the tables and constraints were created correctly
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('mock_test_sessions', 'mock_test_results');

-- 13. Test the setup by checking if everything exists
SELECT 'Tables' as type, COUNT(*) as count FROM information_schema.tables 
WHERE table_name IN ('mock_test_sessions', 'mock_test_results')
AND table_schema = 'public'

UNION ALL

SELECT 'Functions' as type, COUNT(*) as count FROM information_schema.routines 
WHERE routine_name IN ('update_profile_on_test_start', 'update_profile_on_test_complete', 'update_study_streak_on_login')
AND routine_schema = 'public'

UNION ALL

SELECT 'Triggers' as type, COUNT(*) as count FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_update_profile_on_test_start', 'trigger_update_profile_on_test_complete', 'trigger_update_streak_on_login')
AND trigger_schema = 'public'

UNION ALL

SELECT 'Views' as type, COUNT(*) as count FROM information_schema.views 
WHERE table_name = 'student_performance_summary'
AND table_schema = 'public';

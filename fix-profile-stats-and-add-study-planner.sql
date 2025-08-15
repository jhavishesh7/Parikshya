-- Fix Profile Stats and Add Study Planner Functionality
-- Run this file to fix the profile table issues and add study planner features

-- 1. First, let's create a function to properly update profile stats when test sessions are completed
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
DECLARE
    profile_record RECORD;
    questions_attempted INTEGER;
    correct_answers_count INTEGER;
    new_streak INTEGER;
    last_active_date DATE;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Get the current profile
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE id = NEW.user_id;
    
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Calculate questions attempted and correct answers for this session
    SELECT 
        COUNT(*) as questions_attempted,
        COUNT(*) FILTER (WHERE is_correct = true) as correct_answers
    INTO questions_attempted, correct_answers_count
    FROM responses 
    WHERE session_id = NEW.id;
    
    -- Update profile with new stats
    UPDATE profiles 
    SET 
        total_questions_answered = COALESCE(total_questions_answered, 0) + questions_attempted,
        correct_answers = COALESCE(correct_answers, 0) + correct_answers_count,
        last_active = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    -- Update study streak logic
    last_active_date := profile_record.last_active::date;
    
    IF last_active_date IS NULL OR last_active_date < current_date - INTERVAL '1 day' THEN
        -- Reset streak if more than 1 day gap
        IF last_active_date = current_date - INTERVAL '1 day' THEN
            -- Continue streak
            new_streak := COALESCE(profile_record.study_streak, 0) + 1;
        ELSE
            -- Reset streak
            new_streak := 1;
        END IF;
        
        UPDATE profiles 
        SET study_streak = new_streak
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger to automatically update profile stats when test sessions are completed
DROP TRIGGER IF EXISTS trigger_update_profile_stats ON test_sessions;
CREATE TRIGGER trigger_update_profile_stats
    AFTER UPDATE OF end_time ON test_sessions
    FOR EACH ROW
    WHEN (NEW.end_time IS NOT NULL AND OLD.end_time IS NULL)
    EXECUTE FUNCTION update_profile_stats();

-- 3. Create study_plans table for storing user study plans
CREATE TABLE IF NOT EXISTS study_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES subjects(id),
    topics TEXT[] DEFAULT '{}',
    study_hours_per_day INTEGER DEFAULT 2,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    reminder_time TIME DEFAULT '09:00:00',
    pomodoro_duration INTEGER DEFAULT 25, -- in minutes
    break_duration INTEGER DEFAULT 5, -- in minutes
    long_break_duration INTEGER DEFAULT 15, -- in minutes
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create study_sessions table to track actual study time
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration_minutes INTEGER,
    topics_covered TEXT[],
    notes TEXT,
    pomodoro_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create study_reminders table for alarms and notifications
CREATE TABLE IF NOT EXISTS study_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    reminder_time TIMESTAMP NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Create function to update weak/strong topics based on performance
CREATE OR REPLACE FUNCTION update_user_topics()
RETURNS TRIGGER AS $$
DECLARE
    weak_topics TEXT[];
    strong_topics TEXT[];
    topic_performance RECORD;
BEGIN
    -- Get topic performance from recent sessions
    SELECT 
        questions.topic,
        AVG(CASE WHEN responses.is_correct THEN 1.0 ELSE 0.0 END) as accuracy,
        COUNT(*) as attempts
    INTO topic_performance
    FROM responses
    JOIN questions ON responses.question_id = questions.id
    JOIN test_sessions ON responses.session_id = test_sessions.id
    WHERE test_sessions.user_id = NEW.user_id
    AND test_sessions.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY questions.topic
    HAVING COUNT(*) >= 3; -- Only consider topics with at least 3 attempts
    
    -- Determine weak and strong topics based on accuracy
    IF topic_performance.accuracy < 0.6 THEN
        weak_topics := ARRAY[topic_performance.topic];
    ELSIF topic_performance.accuracy > 0.8 THEN
        strong_topics := ARRAY[topic_performance.topic];
    END IF;
    
    -- Update profile with new topic analysis
    UPDATE profiles 
    SET 
        weak_topics = COALESCE(weak_topics, '{}'),
        strong_topics = COALESCE(strong_topics, '{}'),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to update topics when test sessions are completed
DROP TRIGGER IF EXISTS trigger_update_user_topics ON test_sessions;
CREATE TRIGGER trigger_update_user_topics
    AFTER UPDATE OF end_time ON test_sessions
    FOR EACH ROW
    WHEN (NEW.end_time IS NOT NULL AND OLD.end_time IS NULL)
    EXECUTE FUNCTION update_user_topics();

-- 8. Create function to calculate and update study streak daily
CREATE OR REPLACE FUNCTION update_study_streaks()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    last_active_date DATE;
    current_date DATE := CURRENT_DATE;
    new_streak INTEGER;
BEGIN
    FOR profile_record IN SELECT * FROM profiles LOOP
        last_active_date := profile_record.last_active::date;
        
        IF last_active_date IS NOT NULL THEN
            IF last_active_date = current_date - INTERVAL '1 day' THEN
                -- Continue streak
                new_streak := COALESCE(profile_record.study_streak, 0) + 1;
            ELSIF last_active_date < current_date - INTERVAL '1 day' THEN
                -- Reset streak
                new_streak := 0;
            ELSE
                -- Same day, keep current streak
                new_streak := profile_record.study_streak;
            END IF;
            
            UPDATE profiles 
            SET study_streak = new_streak
            WHERE id = profile_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. Create a cron job or scheduled function to run daily (you'll need to set this up in your Supabase dashboard)
-- This function should be called daily to update study streaks

-- 10. Insert sample study plan data for existing users
INSERT INTO study_plans (user_id, title, description, study_hours_per_day, reminder_time, pomodoro_duration)
SELECT 
    id,
    'Default Study Plan',
    'Automatically generated study plan based on your performance',
    2,
    '09:00:00',
    25
FROM profiles 
WHERE role = 'student'
ON CONFLICT DO NOTHING;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_reminders_user_id ON study_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id_created ON test_sessions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);

-- 12. Add RLS policies for the new tables
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_plans
CREATE POLICY "Users can view their own study plans" ON study_plans
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own study plans" ON study_plans
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own study plans" ON study_plans
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own study plans" ON study_plans
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS policies for study_sessions
CREATE POLICY "Users can view their own study sessions" ON study_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own study sessions" ON study_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own study sessions" ON study_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS policies for study_reminders
CREATE POLICY "Users can view their own study reminders" ON study_reminders
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own study reminders" ON study_reminders
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own study reminders" ON study_reminders
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own study reminders" ON study_reminders
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 13. Update existing profiles to fix any NULL values
UPDATE profiles 
SET 
    total_questions_answered = COALESCE(total_questions_answered, 0),
    correct_answers = COALESCE(correct_answers, 0),
    study_streak = COALESCE(study_streak, 0),
    weak_topics = COALESCE(weak_topics, '{}'),
    strong_topics = COALESCE(strong_topics, '{}'),
    last_active = COALESCE(last_active, created_at),
    updated_at = CURRENT_TIMESTAMP
WHERE 
    total_questions_answered IS NULL 
    OR correct_answers IS NULL 
    OR study_streak IS NULL 
    OR weak_topics IS NULL 
    OR strong_topics IS NULL 
    OR last_active IS NULL;

-- 14. Create a view for easy access to user study statistics
CREATE OR REPLACE VIEW user_study_stats AS
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
    CASE 
        WHEN p.total_questions_answered > 0 
        THEN ROUND((p.correct_answers::numeric / p.total_questions_answered) * 100, 2)
        ELSE 0 
    END as accuracy_percentage,
    COUNT(sp.id) as active_study_plans,
    COUNT(ss.id) as total_study_sessions,
    COALESCE(SUM(ss.duration_minutes), 0) as total_study_minutes
FROM profiles p
LEFT JOIN study_plans sp ON p.id = sp.user_id AND sp.is_active = true
LEFT JOIN study_sessions ss ON p.id = ss.user_id
GROUP BY p.id, p.full_name, p.exam_type, p.total_questions_answered, p.correct_answers, 
         p.study_streak, p.weak_topics, p.strong_topics, p.last_active;

-- Grant access to the view
GRANT SELECT ON user_study_stats TO authenticated;

-- 15. Create function to get user's study recommendations
CREATE OR REPLACE FUNCTION get_study_recommendations(user_uuid UUID)
RETURNS TABLE(
    weak_topics TEXT[],
    strong_topics TEXT[],
    recommended_subjects TEXT[],
    study_hours_recommended INTEGER,
    next_session_topics TEXT[]
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
        weak_topics_array,
        strong_topics_array,
        ARRAY['physics', 'chemistry', 'mathematics']::TEXT[] as recommended_subjects,
        CASE 
            WHEN user_profile.study_streak >= 7 THEN 3
            WHEN user_profile.study_streak >= 3 THEN 2
            ELSE 1
        END as study_hours_recommended,
        weak_topics_array as next_session_topics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_study_recommendations(UUID) TO authenticated;

-- 16. Final verification - check if everything was created correctly
SELECT 
    'Tables created:' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('study_plans', 'study_sessions', 'study_reminders')
AND table_schema = 'public'

UNION ALL

SELECT 
    'Functions created:' as status,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN ('update_profile_stats', 'update_user_topics', 'update_study_streaks', 'get_study_recommendations')
AND routine_schema = 'public'

UNION ALL

SELECT 
    'Triggers created:' as status,
    COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_update_profile_stats', 'trigger_update_user_topics')
AND trigger_schema = 'public'

UNION ALL

SELECT 
    'Profiles updated:' as status,
    COUNT(*) as count
FROM profiles 
WHERE total_questions_answered IS NOT NULL 
AND correct_answers IS NOT NULL 
AND study_streak IS NOT NULL;

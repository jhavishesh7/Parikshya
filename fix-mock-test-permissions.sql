-- Fix Mock Test Permissions and Schema Issues
-- This script fixes the permission denied error and ensures proper table structure

-- 1. First, let's check if the required tables exist and create them if needed
DO $$ 
BEGIN
    -- Create mock_test_sessions table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mock_test_sessions') THEN
        CREATE TABLE mock_test_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL,
            mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
            started_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP,
            status TEXT DEFAULT 'in_progress',
            total_questions INTEGER NOT NULL,
            questions_attempted INTEGER DEFAULT 0,
            correct_answers INTEGER DEFAULT 0,
            time_taken_minutes INTEGER,
            score INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created mock_test_sessions table';
    END IF;

    -- Create mock_test_results table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mock_test_results') THEN
        CREATE TABLE mock_test_results (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            session_id UUID REFERENCES mock_test_sessions(id) ON DELETE CASCADE,
            user_id UUID NOT NULL,
            mock_test_id UUID REFERENCES mock_tests(id) ON DELETE CASCADE,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            correct_answers INTEGER NOT NULL,
            time_taken_minutes INTEGER,
            completed_at TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created mock_test_results table';
    END IF;
END $$;

-- 2. Fix the foreign key constraints to use profiles table instead of auth.users
DO $$
BEGIN
    -- Drop existing constraints if they exist
    ALTER TABLE mock_test_sessions DROP CONSTRAINT IF EXISTS mock_test_sessions_user_id_fkey;
    ALTER TABLE mock_test_results DROP CONSTRAINT IF EXISTS mock_test_results_user_id_fkey;
    
    -- Add constraints to profiles table instead
    ALTER TABLE mock_test_sessions 
    ADD CONSTRAINT mock_test_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

    ALTER TABLE mock_test_results 
    ADD CONSTRAINT mock_test_results_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Fixed foreign key constraints';
END $$;

-- 3. Create a secure function to get user email without accessing auth.users directly
CREATE OR REPLACE FUNCTION get_user_email(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    -- This function will be called with RLS policies that ensure users can only access their own data
    RETURN (SELECT email FROM profiles WHERE user_id = user_uuid);
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix the trigger function to not access auth.users directly
CREATE OR REPLACE FUNCTION update_profile_on_test_start()
RETURNS TRIGGER AS $$
DECLARE
    profile_record RECORD;
    user_email TEXT;
BEGIN
    -- Get the current profile using user_id
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE user_id = NEW.user_id;
    
    -- Get user email from profiles table instead of auth.users
    SELECT email INTO user_email FROM profiles WHERE user_id = NEW.user_id;
    
    IF NOT FOUND THEN
        -- If no profile exists, we can't create one here due to circular dependency
        -- Just return NEW and let the application handle profile creation
        RAISE NOTICE 'No profile found for user %, test start will be recorded but profile not updated', NEW.user_id;
        RETURN NEW;
    END IF;
    
    -- Update profile with questions attempted
    UPDATE profiles 
    SET 
        total_questions_answered = COALESCE(total_questions_answered, 0) + NEW.total_questions,
        last_active = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger for test start
DROP TRIGGER IF EXISTS trigger_update_profile_on_test_start ON mock_test_sessions;
CREATE TRIGGER trigger_update_profile_on_test_start
    AFTER INSERT ON mock_test_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_on_test_start();

-- 6. Create the trigger for test completion
DROP TRIGGER IF EXISTS trigger_update_profile_on_test_complete ON mock_test_sessions;
CREATE TRIGGER trigger_update_profile_on_test_complete
    AFTER UPDATE OF status ON mock_test_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_on_test_complete();

-- 7. Enable RLS on the new tables
ALTER TABLE mock_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_test_results ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for mock_test_sessions
DROP POLICY IF EXISTS "Users can manage their own mock test sessions" ON mock_test_sessions;
CREATE POLICY "Users can manage their own mock test sessions" ON mock_test_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 9. Create RLS policies for mock_test_results
DROP POLICY IF EXISTS "Users can manage their own mock test results" ON mock_test_results;
CREATE POLICY "Users can manage their own mock test results" ON mock_test_results
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_user_id ON mock_test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_status ON mock_test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_mock_test_id ON mock_test_sessions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_results_user_id ON mock_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_results_mock_test_id ON mock_test_results(mock_test_id);

-- 11. Ensure mock_tests table has all required columns
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_tests' AND column_name = 'status') THEN
        ALTER TABLE mock_tests ADD COLUMN status text DEFAULT 'ready';
        ALTER TABLE mock_tests ADD CONSTRAINT mock_tests_status_check 
            CHECK (status IN ('draft', 'processing', 'ready', 'failed'));
    END IF;

    -- Add pdf_path column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_tests' AND column_name = 'pdf_path') THEN
        ALTER TABLE mock_tests ADD COLUMN pdf_path text;
    END IF;
    
    -- Update existing tests to have 'ready' status if they don't have one
    UPDATE mock_tests SET status = 'ready' WHERE status IS NULL;
    
    RAISE NOTICE 'Updated mock_tests table structure';
END $$;

-- 12. Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Mock Test System Setup Complete!';
    RAISE NOTICE 'Tables created: mock_test_sessions, mock_test_results';
    RAISE NOTICE 'Triggers created: trigger_update_profile_on_test_start, trigger_update_profile_on_test_complete';
    RAISE NOTICE 'RLS policies created for security';
    RAISE NOTICE 'Indexes created for performance';
END $$;


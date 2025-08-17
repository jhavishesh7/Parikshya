-- Fix Start Mock Test Button - Minimal Fix
-- This script only fixes what's needed for the start button to work

-- 1. Create mock_test_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS mock_test_sessions (
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

-- 2. Create a simple function to handle test start without complex triggers
CREATE OR REPLACE FUNCTION simple_test_start()
RETURNS TRIGGER AS $$
BEGIN
    -- Just return NEW to allow the insert
    -- We'll handle profile updates in the application instead
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a simple trigger
DROP TRIGGER IF EXISTS simple_test_start_trigger ON mock_test_sessions;
CREATE TRIGGER simple_test_start_trigger
    AFTER INSERT ON mock_test_sessions
    FOR EACH ROW
    EXECUTE FUNCTION simple_test_start();

-- 4. Enable RLS and create basic policy
ALTER TABLE mock_test_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can start their own tests" ON mock_test_sessions;
CREATE POLICY "Users can start their own tests" ON mock_test_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_user_test ON mock_test_sessions(user_id, mock_test_id);

-- 6. Verify the setup
SELECT 'Mock Test Sessions Table Created Successfully!' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_name = 'mock_test_sessions';

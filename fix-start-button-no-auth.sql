-- Fix Start Mock Test Button - No Auth.users Access Required
-- This script creates the table without complex foreign key constraints

-- 1. Drop the table if it exists to start fresh
DROP TABLE IF EXISTS mock_test_sessions CASCADE;

-- 2. Create mock_test_sessions table with minimal constraints
CREATE TABLE mock_test_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Will store the user ID from the application
    mock_test_id UUID NOT NULL, -- Will store the mock test ID
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

-- 3. Add basic foreign key to mock_tests (this should work)
ALTER TABLE mock_test_sessions 
ADD CONSTRAINT mock_test_sessions_mock_test_fkey 
FOREIGN KEY (mock_test_id) REFERENCES mock_tests(id) ON DELETE CASCADE;

-- 4. Create index for performance
CREATE INDEX idx_mock_test_sessions_user_test ON mock_test_sessions(user_id, mock_test_id);
CREATE INDEX idx_mock_test_sessions_status ON mock_test_sessions(status);

-- 5. Enable RLS with a simple policy
ALTER TABLE mock_test_sessions ENABLE ROW LEVEL SECURITY;

-- 6. Create a very permissive policy for now (you can tighten this later)
CREATE POLICY "Allow all authenticated users" ON mock_test_sessions
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. Verify the setup
SELECT 'Mock Test Sessions Table Created Successfully!' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_name = 'mock_test_sessions';

-- 8. Show the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mock_test_sessions' 
ORDER BY ordinal_position;

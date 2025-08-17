-- Fix Foreign Key Constraint Issue
-- This file fixes the mock_test_sessions foreign key constraint error

-- 1. First, let's check what constraints exist
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
    AND tc.table_name = 'mock_test_sessions';

-- 2. Drop the existing foreign key constraint
ALTER TABLE mock_test_sessions DROP CONSTRAINT IF EXISTS mock_test_sessions_user_id_fkey;

-- 3. Drop the existing foreign key constraint (alternative name)
ALTER TABLE mock_test_sessions DROP CONSTRAINT IF EXISTS mock_test_sessions_user_id_fkey;

-- 4. Add the correct foreign key constraint to auth.users
ALTER TABLE mock_test_sessions 
ADD CONSTRAINT mock_test_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. Verify the constraint was created correctly
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
    AND tc.table_name = 'mock_test_sessions';

-- 6. Test inserting a mock test session (this should work now)
-- Note: Replace 'your-user-id-here' with an actual user ID from auth.users
-- INSERT INTO mock_test_sessions (user_id, mock_test_id, total_questions, status) 
-- VALUES ('your-user-id-here', 'your-mock-test-id-here', 5, 'in_progress');

-- 7. Check if the trigger function exists and works
SELECT 
    routine_name, 
    routine_type, 
    routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'update_profile_on_test_start' 
AND routine_schema = 'public';

-- 8. Verify the trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_profile_on_test_start' 
AND trigger_schema = 'public';

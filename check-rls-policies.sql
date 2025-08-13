-- Check RLS policies on mock_tests table
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'mock_tests';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'mock_tests';

-- Check if table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mock_tests'
ORDER BY ordinal_position;

-- Check current user and permissions
SELECT current_user, session_user;

-- Check if we can select from the table
-- This will help identify permission issues
SELECT COUNT(*) FROM mock_tests LIMIT 1;

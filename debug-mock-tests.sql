-- Debug Mock Tests Visibility Issue
-- This file helps identify why only 3 mock tests are showing instead of 5

-- 1. Check how many mock tests exist in total
SELECT 
    'Total Mock Tests' as description,
    COUNT(*) as count
FROM mock_tests;

-- 2. Check mock tests with their status
SELECT 
    id,
    name,
    description,
    status,
    subject_id,
    created_at,
    updated_at
FROM mock_tests
ORDER BY created_at DESC;

-- 3. Check if there are any status filters being applied
SELECT 
    'Status Distribution' as description,
    status,
    COUNT(*) as count
FROM mock_tests
GROUP BY status;

-- 4. Check mock tests with their subject information
SELECT 
    mt.id,
    mt.name,
    mt.status,
    mt.subject_id,
    s.display_name as subject_name,
    s.name as subject_code,
    (SELECT COUNT(*) FROM mock_questions WHERE mock_test_id = mt.id) as question_count
FROM mock_tests mt
LEFT JOIN subjects s ON mt.subject_id = s.id
ORDER BY mt.created_at DESC;

-- 5. Check if there are any RLS policies blocking access
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

-- 6. Check user permissions and roles
SELECT 
    'Current User' as description,
    auth.uid() as user_id,
    auth.email() as user_email,
    auth.role() as user_role;

-- 7. Test the exact query that the frontend uses
-- This simulates what the frontend is doing
SELECT 
    mt.*,
    s.display_name as subject_display_name,
    s.name as subject_name,
    (SELECT COUNT(*) FROM mock_questions WHERE mock_test_id = mt.id) as mock_questions_count
FROM mock_tests mt
LEFT JOIN subjects s ON mt.subject_id = s.id
ORDER BY mt.created_at DESC;

-- 8. Check if there are any mock tests with missing subject relationships
SELECT 
    'Mock Tests without Subjects' as description,
    COUNT(*) as count
FROM mock_tests mt
LEFT JOIN subjects s ON mt.subject_id = s.id
WHERE s.id IS NULL;

-- 9. Check if there are any mock tests with missing questions
SELECT 
    'Mock Tests without Questions' as description,
    COUNT(*) as count
FROM mock_tests mt
LEFT JOIN mock_questions mq ON mt.id = mq.mock_test_id
WHERE mq.id IS NULL;

-- 10. Check the exact data that should be returned
SELECT 
    mt.id,
    mt.name,
    mt.description,
    mt.status,
    mt.subject_id,
    s.display_name,
    s.name,
    (SELECT COUNT(*) FROM mock_questions WHERE mock_test_id = mt.id) as question_count
FROM mock_tests mt
INNER JOIN subjects s ON mt.subject_id = s.id
ORDER BY mt.created_at DESC;

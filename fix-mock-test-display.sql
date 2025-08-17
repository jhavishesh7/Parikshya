-- Fix Mock Test Display Issues
-- This script ensures all mock tests are properly displayed and accessible

-- 1. First, let's check what mock tests exist and their current status
SELECT 
    mt.id,
    mt.name,
    mt.status,
    mt.subject_id,
    s.display_name as subject_name,
    COUNT(mq.id) as question_count
FROM mock_tests mt
LEFT JOIN subjects s ON mt.subject_id = s.id
LEFT JOIN mock_questions mq ON mt.id = mq.mock_test_id
GROUP BY mt.id, mt.name, mt.status, mt.subject_id, s.display_name
ORDER BY mt.created_at DESC;

-- 2. Fix any mock tests that don't have a subject_id
UPDATE mock_tests 
SET subject_id = (
    SELECT id FROM subjects WHERE name = 'physics' LIMIT 1
)
WHERE subject_id IS NULL;

-- 3. Ensure all mock tests have a valid status
UPDATE mock_tests 
SET status = 'ready' 
WHERE status IS NULL OR status NOT IN ('draft', 'processing', 'ready', 'failed');

-- 4. Fix the mock_questions table structure if needed
DO $$ 
BEGIN
    -- Add question_id column if it doesn't exist (for linking to existing questions)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_questions' AND column_name = 'question_id') THEN
        ALTER TABLE mock_questions ADD COLUMN question_id UUID;
    END IF;
    
    -- Add question_text column if it doesn't exist (for direct question storage)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_questions' AND column_name = 'question_text') THEN
        ALTER TABLE mock_questions ADD COLUMN question_text TEXT;
    END IF;
    
    -- Add options column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_questions' AND column_name = 'options') THEN
        ALTER TABLE mock_questions ADD COLUMN options JSONB;
    END IF;
    
    -- Add correct_answer column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_questions' AND column_name = 'correct_answer') THEN
        ALTER TABLE mock_questions ADD COLUMN correct_answer INTEGER;
    END IF;
    
    RAISE NOTICE 'Updated mock_questions table structure';
END $$;

-- 5. Create sample mock tests if none exist
DO $$
DECLARE
    physics_subject_id UUID;
    chemistry_subject_id UUID;
    math_subject_id UUID;
    biology_subject_id UUID;
    english_subject_id UUID;
BEGIN
    -- Get subject IDs
    SELECT id INTO physics_subject_id FROM subjects WHERE name = 'physics' LIMIT 1;
    SELECT id INTO chemistry_subject_id FROM subjects WHERE name = 'chemistry' LIMIT 1;
    SELECT id INTO math_subject_id FROM subjects WHERE name = 'mathematics' LIMIT 1;
    SELECT id INTO biology_subject_id FROM subjects WHERE name = 'biology' LIMIT 1;
    SELECT id INTO english_subject_id FROM subjects WHERE name = 'english' LIMIT 1;
    
    -- Create sample mock tests if they don't exist
    IF NOT EXISTS (SELECT 1 FROM mock_tests WHERE name = 'Physics Fundamentals Test') THEN
        INSERT INTO mock_tests (name, description, subject_id, exam_type, duration_minutes, total_questions, difficulty_level, instructions, passing_score, status)
        VALUES (
            'Physics Fundamentals Test',
            'Test your knowledge of basic physics concepts including mechanics, thermodynamics, and waves.',
            physics_subject_id,
            'IOE',
            60,
            20,
            'moderate',
            'Answer all questions within 60 minutes. Each question has 4 options with only one correct answer.',
            60,
            'ready'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM mock_tests WHERE name = 'Chemistry Basics Quiz') THEN
        INSERT INTO mock_tests (name, description, subject_id, exam_type, duration_minutes, total_questions, difficulty_level, instructions, passing_score, status)
        VALUES (
            'Chemistry Basics Quiz',
            'Evaluate your understanding of fundamental chemistry principles and reactions.',
            chemistry_subject_id,
            'CEE',
            45,
            15,
            'easy',
            'Complete this quiz in 45 minutes. Focus on accuracy rather than speed.',
            70,
            'ready'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM mock_tests WHERE name = 'Mathematics Practice Test') THEN
        INSERT INTO mock_tests (name, description, subject_id, exam_type, duration_minutes, total_questions, difficulty_level, instructions, passing_score, status)
        VALUES (
            'Mathematics Practice Test',
            'Practice mathematical concepts including algebra, calculus, and geometry.',
            math_subject_id,
            'IOE',
            90,
            25,
            'difficult',
            'This is a comprehensive test covering advanced mathematical topics. You have 90 minutes.',
            65,
            'ready'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM mock_tests WHERE name = 'Biology Concepts Test') THEN
        INSERT INTO mock_tests (name, description, subject_id, exam_type, duration_minutes, total_questions, difficulty_level, instructions, passing_score, status)
        VALUES (
            'Biology Concepts Test',
            'Test your knowledge of biological systems, cell biology, and genetics.',
            biology_subject_id,
            'CEE',
            75,
            30,
            'moderate',
            'Answer 30 questions in 75 minutes. This test covers various biology topics.',
            60,
            'ready'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM mock_tests WHERE name = 'English Comprehension Test') THEN
        INSERT INTO mock_tests (name, description, subject_id, exam_type, duration_minutes, total_questions, difficulty_level, instructions, passing_score, status)
        VALUES (
            'English Comprehension Test',
            'Improve your English reading comprehension and grammar skills.',
            english_subject_id,
            'IOE',
            50,
            20,
            'easy',
            'Read passages carefully and answer questions. You have 50 minutes.',
            75,
            'ready'
        );
    END IF;
    
    RAISE NOTICE 'Created sample mock tests';
END $$;

-- 6. Add sample questions to mock tests if they don't have any
DO $$
DECLARE
    test_record RECORD;
    question_counter INTEGER;
BEGIN
    FOR test_record IN SELECT id, total_questions FROM mock_tests WHERE status = 'ready' LOOP
        -- Check if this test already has questions
        IF NOT EXISTS (SELECT 1 FROM mock_questions WHERE mock_test_id = test_record.id) THEN
            -- Add sample questions
            FOR question_counter IN 1..LEAST(test_record.total_questions, 5) LOOP
                INSERT INTO mock_questions (
                    mock_test_id,
                    question_text,
                    options,
                    correct_answer,
                    subject_id,
                    difficulty_level,
                    explanation,
                    topic
                ) VALUES (
                    test_record.id,
                    'Sample question ' || question_counter || ' for test ' || test_record.id,
                    '["Option A", "Option B", "Option C", "Option D"]',
                    (question_counter % 4) + 1,
                    (SELECT subject_id FROM mock_tests WHERE id = test_record.id),
                    'moderate',
                    'This is a sample question for testing purposes.',
                    'General'
                );
            END LOOP;
            
            RAISE NOTICE 'Added sample questions to test %', test_record.id;
        END IF;
    END LOOP;
END $$;

-- 7. Update the total_questions count to match actual questions
UPDATE mock_tests 
SET total_questions = (
    SELECT COUNT(*) 
    FROM mock_questions 
    WHERE mock_test_id = mock_tests.id
)
WHERE id IN (
    SELECT mock_test_id 
    FROM mock_questions 
    GROUP BY mock_test_id
);

-- 8. Verify the final state
SELECT 
    'Final Mock Test Count' as info,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_tests,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_tests
FROM mock_tests;

SELECT 
    'Mock Test Details' as info,
    mt.name,
    mt.status,
    mt.total_questions,
    s.display_name as subject,
    COUNT(mq.id) as actual_questions
FROM mock_tests mt
LEFT JOIN subjects s ON mt.subject_id = s.id
LEFT JOIN mock_questions mq ON mt.id = mq.mock_test_id
GROUP BY mt.id, mt.name, mt.status, mt.total_questions, s.display_name
ORDER BY mt.created_at DESC;


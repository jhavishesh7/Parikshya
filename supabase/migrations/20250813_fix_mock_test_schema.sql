-- Fix Mock Test Schema and Add Text Content Support
-- This migration fixes any missing columns and ensures proper table structure for text-based uploads

-- First, let's make sure the mock_tests table has all required fields
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_tests' AND column_name = 'status') THEN
        ALTER TABLE mock_tests ADD COLUMN status text DEFAULT 'draft';
        ALTER TABLE mock_tests ADD CONSTRAINT mock_tests_status_check 
            CHECK (status IN ('draft', 'processing', 'ready', 'failed'));
    END IF;

    -- Add pdf_path column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_tests' AND column_name = 'pdf_path') THEN
        ALTER TABLE mock_tests ADD COLUMN pdf_path text;
    END IF;
END $$;

-- Ensure mock_questions table has all required fields
DO $$ 
BEGIN
    -- Add subject_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_questions' AND column_name = 'subject_id') THEN
        ALTER TABLE mock_questions ADD COLUMN subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE;
    END IF;

    -- Add difficulty_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_questions' AND column_name = 'difficulty_level') THEN
        ALTER TABLE mock_questions ADD COLUMN difficulty_level text DEFAULT 'moderate';
    END IF;

    -- Add explanation column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_questions' AND column_name = 'explanation') THEN
        ALTER TABLE mock_questions ADD COLUMN explanation text;
    END IF;

    -- Add topic column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'mock_questions' AND column_name = 'topic') THEN
        ALTER TABLE mock_questions ADD COLUMN topic text;
    END IF;
END $$;

-- Add content field to notes table for text content
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notes' AND column_name = 'content') THEN
        ALTER TABLE notes ADD COLUMN content text;
    END IF;
END $$;

-- Enable RLS on mock_tests and mock_questions if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'mock_tests' AND rowsecurity = true) THEN
        ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'mock_questions' AND rowsecurity = true) THEN
        ALTER TABLE mock_questions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can read mock tests" ON mock_tests;
DROP POLICY IF EXISTS "Only admins can modify mock tests" ON mock_tests;
DROP POLICY IF EXISTS "Users can read mock questions" ON mock_questions;
DROP POLICY IF EXISTS "Only admins can modify mock questions" ON mock_questions;

-- Create RLS policies for mock_tests
CREATE POLICY "Users can read mock tests" ON mock_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify mock tests" ON mock_tests FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for mock_questions
CREATE POLICY "Users can read mock questions" ON mock_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify mock questions" ON mock_questions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create indexes for better performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_mock_tests_status ON mock_tests(status);
CREATE INDEX IF NOT EXISTS idx_mock_tests_subject_id ON mock_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_test_id ON mock_questions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_subject_id ON mock_questions(subject_id);

-- Verify the table structure
DO $$
BEGIN
    RAISE NOTICE 'Mock Tests table structure:';
    RAISE NOTICE '%', (SELECT string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) 
                       FROM information_schema.columns 
                       WHERE table_name = 'mock_tests');
    
    RAISE NOTICE 'Mock Questions table structure:';
    RAISE NOTICE '%', (SELECT string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) 
                       FROM information_schema.columns 
                       WHERE table_name = 'mock_questions');
END $$;

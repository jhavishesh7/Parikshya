-- Run this in your Supabase SQL Editor to fix the notes table

-- First, let's see what columns actually exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notes'
ORDER BY ordinal_position;

-- Make file_path nullable since we now support direct text input
ALTER TABLE notes ALTER COLUMN file_path DROP NOT NULL;

-- Add content column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notes' AND column_name = 'content') THEN
        ALTER TABLE notes ADD COLUMN content text;
    END IF;
    
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notes' AND column_name = 'title') THEN
        ALTER TABLE notes ADD COLUMN title text;
    END IF;
    
    -- Add exam_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notes' AND column_name = 'exam_type') THEN
        ALTER TABLE notes ADD COLUMN exam_type text DEFAULT 'IOE';
    END IF;
    
    -- Add difficulty_level column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notes' AND column_name = 'difficulty_level') THEN
        ALTER TABLE notes ADD COLUMN difficulty_level text DEFAULT 'moderate';
    END IF;
    
    -- Add uploaded_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notes' AND column_name = 'uploaded_by') THEN
        ALTER TABLE notes ADD COLUMN uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add a check constraint to ensure either content or file_path is provided
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_content_or_file_check;
ALTER TABLE notes ADD CONSTRAINT notes_content_or_file_check 
    CHECK (content IS NOT NULL OR file_path IS NOT NULL);

-- Verify the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notes'
ORDER BY ordinal_position;

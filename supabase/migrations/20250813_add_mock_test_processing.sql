-- Add missing fields for mock test PDF processing
-- This migration adds fields needed for the AI-powered PDF processing feature

-- Add status and pdf_path fields to mock_tests table
ALTER TABLE mock_tests 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'ready', 'failed')),
ADD COLUMN IF NOT EXISTS pdf_path text;

-- Add RLS policies for mock_tests and mock_questions
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mock_tests
CREATE POLICY "Users can read mock tests" ON mock_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify mock tests" ON mock_tests FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for mock_questions
CREATE POLICY "Users can read mock questions" ON mock_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify mock questions" ON mock_questions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mock_tests_status ON mock_tests(status);
CREATE INDEX IF NOT EXISTS idx_mock_tests_subject_id ON mock_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_test_id ON mock_questions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_subject_id ON mock_questions(subject_id);

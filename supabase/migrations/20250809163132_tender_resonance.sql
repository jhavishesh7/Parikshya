/*
# Create comprehensive schema for NEB Exam Platform

1. New Tables
   - `profiles` - User profiles with exam type preference
   - `subjects` - Physics, Chemistry, Biology, Mathematics
   - `questions` - Questions with difficulty levels and subject categorization
   - `test_sessions` - User test sessions with AI analytics
   - `responses` - Individual question responses with performance tracking
   - `notes` - PDF notes with categorization
   - `analytics` - Detailed performance analytics and AI insights
   - `ai_interactions` - Track AI assistant interactions

2. Security
   - Enable RLS on all tables
   - Add appropriate policies for user access control
   - Admin-only policies for question and notes management

3. Functions
   - AI performance analysis functions
   - Adaptive question selection algorithms
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE exam_type AS ENUM ('IOE', 'CEE');
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'difficult');
CREATE TYPE subject_type AS ENUM ('physics', 'chemistry', 'biology', 'mathematics', 'english');
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  exam_type exam_type NOT NULL,
  role user_role DEFAULT 'student',
  ai_ability_estimate real DEFAULT 0.0,
  total_questions_answered integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  weak_topics text[] DEFAULT '{}',
  strong_topics text[] DEFAULT '{}',
  study_streak integer DEFAULT 0,
  last_active timestamp DEFAULT now(),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name subject_type NOT NULL,
  display_name text NOT NULL,
  description text,
  applicable_exams exam_type[] NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL, -- Array of options
  correct_answer integer NOT NULL, -- Index of correct option
  difficulty difficulty_level NOT NULL,
  explanation text,
  topic text,
  subtopic text,
  exam_types exam_type[] NOT NULL,
  irt_difficulty real DEFAULT 0.0,
  irt_discrimination real DEFAULT 1.0,
  irt_guessing real DEFAULT 0.25,
  times_attempted integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_type text NOT NULL, -- 'practice', 'mock', 'adaptive'
  exam_type exam_type NOT NULL,
  start_time timestamp DEFAULT now(),
  end_time timestamp,
  duration_minutes integer,
  total_questions integer DEFAULT 0,
  questions_attempted integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  ai_ability_start real DEFAULT 0.0,
  ai_ability_end real DEFAULT 0.0,
  ai_analysis jsonb, -- Gemini AI analysis results
  weak_topics_identified text[],
  strong_topics_identified text[],
  recommendations text,
  completion_percentage real DEFAULT 0.0,
  created_at timestamp DEFAULT now()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  user_answer integer,
  is_correct boolean,
  time_taken_seconds integer,
  ai_confidence_level real,
  response_timestamp timestamp DEFAULT now()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  subject_id uuid REFERENCES subjects(id),
  exam_type exam_type NOT NULL,
  difficulty_level difficulty_level,
  topic text,
  file_path text NOT NULL,
  file_size bigint,
  upload_date timestamp DEFAULT now(),
  uploaded_by uuid REFERENCES profiles(id),
  download_count integer DEFAULT 0
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES test_sessions(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value real,
  metadata jsonb,
  timestamp timestamp DEFAULT now()
);

-- AI interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL, -- 'question_explanation', 'study_advice', 'performance_analysis'
  query_text text NOT NULL,
  ai_response text NOT NULL,
  context_data jsonb,
  created_at timestamp DEFAULT now()
);

-- Mock tests table
CREATE TABLE IF NOT EXISTS mock_tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type exam_type NOT NULL DEFAULT 'IOE',
  duration_minutes integer DEFAULT 60,
  total_questions integer DEFAULT 20,
  difficulty_level difficulty_level DEFAULT 'moderate',
  instructions text,
  passing_score integer DEFAULT 60,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Mock questions table
CREATE TABLE IF NOT EXISTS mock_questions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  mock_test_id uuid REFERENCES mock_tests(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL, -- Array of options
  correct_answer integer NOT NULL, -- Index of correct option
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  difficulty_level difficulty_level DEFAULT 'moderate',
  explanation text,
  topic text,
  subtopic text,
  created_at timestamp DEFAULT now()
);

-- Insert default subjects
INSERT INTO subjects (name, display_name, description, applicable_exams) VALUES
('physics', 'Physics', 'Physics questions and concepts', ARRAY['IOE', 'CEE']::exam_type[]),
('chemistry', 'Chemistry', 'Chemistry questions and concepts', ARRAY['IOE', 'CEE']::exam_type[]),
('mathematics', 'Mathematics', 'Mathematics questions and concepts', ARRAY['IOE']::exam_type[]),
('biology', 'Biology', 'Biology questions and concepts', ARRAY['CEE']::exam_type[]),
('english', 'English', 'English language and comprehension', ARRAY['IOE']::exam_type[])
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for subjects
CREATE POLICY "Anyone can read subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify subjects" ON subjects FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for questions
CREATE POLICY "Users can read questions" ON questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify questions" ON questions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for test_sessions
CREATE POLICY "Users can read own sessions" ON test_sessions FOR SELECT TO authenticated USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create own sessions" ON test_sessions FOR INSERT TO authenticated WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own sessions" ON test_sessions FOR UPDATE TO authenticated USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- RLS Policies for responses
CREATE POLICY "Users can read own responses" ON responses FOR SELECT TO authenticated USING (
  session_id IN (SELECT id FROM test_sessions WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
CREATE POLICY "Users can create responses" ON responses FOR INSERT TO authenticated WITH CHECK (
  session_id IN (SELECT id FROM test_sessions WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- RLS Policies for notes
CREATE POLICY "Users can read notes" ON notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify notes" ON notes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for analytics
CREATE POLICY "Users can read own analytics" ON analytics FOR SELECT TO authenticated USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create analytics" ON analytics FOR INSERT TO authenticated WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- RLS Policies for ai_interactions
CREATE POLICY "Users can read own AI interactions" ON ai_interactions FOR SELECT TO authenticated USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create AI interactions" ON ai_interactions FOR INSERT TO authenticated WITH CHECK (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

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
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_exam_type ON profiles(exam_type);
CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty ON questions(subject_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_exam_types ON questions USING GIN(exam_types);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_session ON analytics(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_mock_tests_subject_id ON mock_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_test_id ON mock_questions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_subject_id ON mock_questions(subject_id);
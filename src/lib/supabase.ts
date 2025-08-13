import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  exam_type: 'IOE' | 'CEE';
  role: 'student' | 'admin';
  ai_ability_estimate: number;
  total_questions_answered: number;
  correct_answers: number;
  weak_topics: string[];
  strong_topics: string[];
  study_streak: number;
  last_active: string;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  name: 'physics' | 'chemistry' | 'biology' | 'mathematics' | 'english';
  display_name: string;
  description: string;
  applicable_exams: ('IOE' | 'CEE')[];
  created_at: string;
};

export type Question = {
  id: string;
  subject_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  explanation?: string;
  topic?: string;
  subtopic?: string;
  exam_types: ('IOE' | 'CEE')[];
  irt_difficulty: number;
  irt_discrimination: number;
  irt_guessing: number;
  times_attempted: number;
  times_correct: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
};

export type TestSession = {
  id: string;
  user_id: string;
  session_type: string;
  exam_type: 'IOE' | 'CEE';
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  total_questions: number;
  questions_attempted: number;
  correct_answers: number;
  ai_ability_start: number;
  ai_ability_end: number;
  ai_analysis?: any;
  weak_topics_identified: string[];
  strong_topics_identified: string[];
  recommendations?: string;
  completion_percentage: number;
  created_at: string;
};

export type Note = {
  id: string;
  title: string;
  description?: string;
  subject_id: string;
  exam_type: 'IOE' | 'CEE';
  topic?: string;
  file_path: string;
  file_size?: number;
  upload_date: string;
  uploaded_by?: string;
  download_count: number;
};
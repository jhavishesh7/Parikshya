-- Seed demo subjects
INSERT INTO subjects (id, name, display_name, description, applicable_exams, created_at) VALUES
  (gen_random_uuid(), 'physics', 'Physics', 'Physics subject', ARRAY['IOE','CEE'], now()),
  (gen_random_uuid(), 'chemistry', 'Chemistry', 'Chemistry subject', ARRAY['IOE','CEE'], now()),
  (gen_random_uuid(), 'biology', 'Biology', 'Biology subject', ARRAY['IOE','CEE'], now()),
  (gen_random_uuid(), 'mathematics', 'Mathematics', 'Mathematics subject', ARRAY['IOE','CEE'], now()),
  (gen_random_uuid(), 'english', 'English', 'English subject', ARRAY['IOE','CEE'], now());

-- Seed demo mock tests (one per subject)
INSERT INTO mock_tests (id, name, description, subject_id, created_at) VALUES
  (gen_random_uuid(), 'Physics Demo Test', 'Demo test for Physics', (SELECT id FROM subjects WHERE name='physics' LIMIT 1), now()),
  (gen_random_uuid(), 'Chemistry Demo Test', 'Demo test for Chemistry', (SELECT id FROM subjects WHERE name='chemistry' LIMIT 1), now()),
  (gen_random_uuid(), 'Biology Demo Test', 'Demo test for Biology', (SELECT id FROM subjects WHERE name='biology' LIMIT 1), now()),
  (gen_random_uuid(), 'Mathematics Demo Test', 'Demo test for Mathematics', (SELECT id FROM subjects WHERE name='mathematics' LIMIT 1), now()),
  (gen_random_uuid(), 'English Demo Test', 'Demo test for English', (SELECT id FROM subjects WHERE name='english' LIMIT 1), now());

-- Seed demo mock questions for Physics Demo Test
INSERT INTO mock_questions (id, mock_test_id, question_text, options, correct_answer, subject_id, created_at) VALUES
  (gen_random_uuid(), (SELECT id FROM mock_tests WHERE name='Physics Demo Test' LIMIT 1), 'What is the SI unit of force?', ARRAY['Newton', 'Joule', 'Watt', 'Pascal'], 0, (SELECT id FROM subjects WHERE name='physics' LIMIT 1), now()),
  (gen_random_uuid(), (SELECT id FROM mock_tests WHERE name='Physics Demo Test' LIMIT 1), 'What is the acceleration due to gravity on Earth?', ARRAY['8.9 m/s^2', '9.8 m/s^2', '10.8 m/s^2', '7.8 m/s^2'], 1, (SELECT id FROM subjects WHERE name='physics' LIMIT 1), now()),
  (gen_random_uuid(), (SELECT id FROM mock_tests WHERE name='Physics Demo Test' LIMIT 1), 'Who is known as the father of modern physics?', ARRAY['Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Niels Bohr'], 1, (SELECT id FROM subjects WHERE name='physics' LIMIT 1), now()),
  (gen_random_uuid(), (SELECT id FROM mock_tests WHERE name='Physics Demo Test' LIMIT 1), 'What is the speed of light in vacuum?', ARRAY['3x10^8 m/s', '3x10^6 m/s', '3x10^5 m/s', '3x10^7 m/s'], 0, (SELECT id FROM subjects WHERE name='physics' LIMIT 1), now());

-- Add more demo questions for other subjects as needed

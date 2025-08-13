-- Mock Data for NEB Exam Platform
-- This script inserts sample data in the correct order to respect foreign key constraints

-- First, insert subjects (no dependencies)
INSERT INTO subjects (id, name, display_name, description, applicable_exams, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'physics', 'Physics', 'Study of matter, energy, and their interactions', '{IOE,CEE}', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'chemistry', 'Chemistry', 'Study of substances and their properties', '{IOE,CEE}', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'biology', 'Biology', 'Study of living organisms and life processes', '{IOE,CEE}', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'mathematics', 'Mathematics', 'Study of numbers, quantities, and shapes', '{IOE,CEE}', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'english', 'English', 'Study of language, literature, and communication', '{IOE,CEE}', NOW());

-- Insert questions (depends on subjects)
INSERT INTO questions (id, subject_id, question_text, options, correct_answer, difficulty, explanation, topic, subtopic, exam_types, irt_difficulty, irt_discrimination, irt_guessing, times_attempted, times_correct, created_at, updated_at) VALUES
-- Physics Questions
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'What is the SI unit of force?', '["Newton", "Joule", "Watt", "Pascal"]', 0, 'easy', 'The SI unit of force is Newton (N), defined as the force required to accelerate 1 kg at 1 m/s²', 'Mechanics', 'Forces', '{IOE,CEE}', 0.3, 0.8, 0.25, 15, 12, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'According to Boyle''s Law, what happens to the volume of a gas when pressure increases?', '["Volume increases", "Volume decreases", "Volume remains constant", "Volume becomes zero"]', 1, 'moderate', 'Boyle''s Law states that at constant temperature, the volume of a gas is inversely proportional to its pressure', 'Gases', 'Gas Laws', '{IOE,CEE}', 0.6, 0.9, 0.25, 20, 16, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'What is the formula for kinetic energy?', '["KE = mgh", "KE = ½mv²", "KE = Fd", "KE = Pt"]', 1, 'moderate', 'Kinetic energy is calculated using KE = ½mv², where m is mass and v is velocity', 'Energy', 'Kinetic Energy', '{IOE,CEE}', 0.7, 0.85, 0.25, 18, 14, NOW(), NOW()),

-- Chemistry Questions
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'What is the chemical symbol for gold?', '["Ag", "Au", "Fe", "Cu"]', 1, 'easy', 'The chemical symbol for gold is Au, derived from the Latin word "aurum"', 'Elements', 'Chemical Symbols', '{IOE,CEE}', 0.2, 0.9, 0.25, 25, 23, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'What type of bond is formed between sodium and chlorine in NaCl?', '["Covalent", "Ionic", "Metallic", "Hydrogen"]', 1, 'moderate', 'NaCl forms an ionic bond where sodium donates an electron to chlorine', 'Chemical Bonding', 'Ionic Bonds', '{IOE,CEE}', 0.6, 0.8, 0.25, 22, 18, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'What is the pH of a neutral solution?', '["0", "7", "14", "10"]', 1, 'easy', 'A neutral solution has a pH of 7, with acidic solutions below 7 and basic solutions above 7', 'Acids and Bases', 'pH Scale', '{IOE,CEE}', 0.3, 0.9, 0.25, 30, 27, NOW(), NOW()),

-- Biology Questions
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', 'What is the powerhouse of the cell?', '["Nucleus", "Mitochondria", "Endoplasmic Reticulum", "Golgi Apparatus"]', 1, 'easy', 'Mitochondria is called the powerhouse of the cell because it produces energy through cellular respiration', 'Cell Biology', 'Organelles', '{IOE,CEE}', 0.2, 0.9, 0.25, 28, 25, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'What process do plants use to make their own food?', '["Respiration", "Photosynthesis", "Digestion", "Excretion"]', 1, 'easy', 'Photosynthesis is the process where plants convert sunlight, CO2, and water into glucose and oxygen', 'Plant Biology', 'Photosynthesis', '{IOE,CEE}', 0.3, 0.9, 0.25, 26, 24, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', 'What is the largest organ in the human body?', '["Heart", "Brain", "Liver", "Skin"]', 3, 'moderate', 'The skin is the largest organ in the human body, covering approximately 20 square feet', 'Human Anatomy', 'Integumentary System', '{IOE,CEE}', 0.5, 0.8, 0.25, 24, 20, NOW(), NOW()),

-- Mathematics Questions
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'What is the value of π (pi) to two decimal places?', '["3.12", "3.14", "3.16", "3.18"]', 1, 'easy', 'The value of π (pi) is approximately 3.14159, so to two decimal places it is 3.14', 'Geometry', 'Pi', '{IOE,CEE}', 0.2, 0.9, 0.25, 32, 30, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440004', 'Solve for x: 2x + 5 = 13', '["x = 3", "x = 4", "x = 5", "x = 6"]', 1, 'moderate', '2x + 5 = 13, subtract 5 from both sides: 2x = 8, divide by 2: x = 4', 'Algebra', 'Linear Equations', '{IOE,CEE}', 0.6, 0.85, 0.25, 29, 25, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', 'What is the area of a circle with radius 5 units?', '["25π", "50π", "75π", "100π"]', 0, 'moderate', 'Area of a circle = πr² = π(5)² = 25π square units', 'Geometry', 'Circle Area', '{IOE,CEE}', 0.7, 0.8, 0.25, 27, 22, NOW(), NOW()),

-- English Questions
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440005', 'What is a simile?', '["A comparison using like or as", "A direct comparison", "A word that sounds like what it means", "A word that means the opposite"]', 0, 'easy', 'A simile is a figure of speech that compares two things using "like" or "as"', 'Literature', 'Figurative Language', '{IOE,CEE}', 0.4, 0.9, 0.25, 23, 20, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440005', 'What is the past tense of "go"?', '["Goed", "Went", "Gone", "Going"]', 1, 'easy', 'The past tense of "go" is "went", which is an irregular verb', 'Grammar', 'Irregular Verbs', '{IOE,CEE}', 0.3, 0.9, 0.25, 31, 28, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440005', 'What type of sentence is "How beautiful!"?', '["Declarative", "Interrogative", "Imperative", "Exclamatory"]', 3, 'moderate', 'An exclamatory sentence expresses strong emotion and ends with an exclamation mark', 'Grammar', 'Sentence Types', '{IOE,CEE}', 0.5, 0.8, 0.25, 25, 21, NOW(), NOW());

-- Insert notes (no foreign key dependencies to profiles for now)
INSERT INTO notes (id, title, subject, topic, subtopic, difficulty_level, content_url, file_size, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Physics Mechanics Notes', 'physics', 'Mechanics', 'Forces and Motion', 'moderate', 'https://example.com/notes/physics-mechanics.pdf', 2048576, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'Chemistry Bonding Guide', 'chemistry', 'Chemical Bonding', 'Ionic and Covalent Bonds', 'moderate', 'https://example.com/notes/chemistry-bonding.pdf', 1536000, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'Biology Cell Structure', 'biology', 'Cell Biology', 'Cell Organelles', 'easy', 'https://example.com/notes/biology-cells.pdf', 1024000, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440004', 'Mathematics Algebra Basics', 'mathematics', 'Algebra', 'Linear Equations', 'easy', 'https://example.com/notes/math-algebra.pdf', 1792000, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440005', 'English Grammar Rules', 'english', 'Grammar', 'Parts of Speech', 'easy', 'https://example.com/notes/english-grammar.pdf', 1280000, NOW(), NOW());

-- Note: We cannot insert into profiles table due to foreign key constraint with auth.users
-- The profiles table requires user_id to exist in auth.users table
-- This would need to be handled through the application's user registration process

-- Note: We cannot insert into test_sessions, responses, analytics, or ai_interactions tables
-- because they all depend on profiles table which we cannot populate due to auth.users constraint

-- To test the application with mock data, you would need to:
-- 1. Create actual user accounts through the application (which creates entries in auth.users)
-- 2. Then insert profile data for those users
-- 3. Finally insert the dependent data (test_sessions, responses, etc.)

-- For now, this script provides:
-- - 5 subjects (physics, chemistry, biology, mathematics, english)
-- - 15 sample questions across all subjects with proper difficulty levels
-- - 5 sample notes for different topics
-- - All data uses valid UUIDs and proper data types

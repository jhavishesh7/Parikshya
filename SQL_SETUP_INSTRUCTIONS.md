# SQL Setup Instructions for Profile Stats and Study Planner

This document explains how to run the SQL files to fix profile table issues and implement the enhanced study planner system.

## Files Overview

1. **`fix-profile-stats-and-add-study-planner.sql`** - Basic study planner functionality
2. **`enhanced-profile-stats-and-streak-system.sql`** - Enhanced mock test scoring and streak tracking

## Step-by-Step Setup

### Step 1: Run the Basic Study Planner Setup

First, run the basic study planner setup:

```sql
-- Run this in your Supabase SQL editor
\i fix-profile-stats-and-add-study-planner.sql
```

This will create:
- Study plans, sessions, and reminders tables
- Functions for updating profile stats
- Basic RLS policies

### Step 2: Run the Enhanced Profile Stats System

Next, run the enhanced system:

```sql
-- Run this in your Supabase SQL editor
\i enhanced-profile-stats-and-streak-system.sql
```

This will create:
- `mock_test_results` table for storing test scores
- Automatic profile updates when mock tests are completed
- Daily login streak tracking
- Weak/strong topics analysis based on performance

### Step 3: Verify the Setup

After running both files, verify everything was created correctly:

```sql
-- Check if all tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('study_plans', 'study_sessions', 'study_reminders', 'mock_test_results');

-- Check if all functions were created
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%update%' OR routine_name LIKE '%streak%';

-- Check if all triggers were created
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## How It Works

### 1. Mock Test Completion
When a student completes a mock test:
- A record is inserted into `mock_test_results`
- The trigger automatically updates the student's profile:
  - Increases `total_questions_answered`
  - Increases `correct_answers`
  - Updates `ai_ability_estimate`
  - Analyzes weak/strong topics based on performance

### 2. Daily Login Streak
Every time a student logs in:
- The `last_active` timestamp is updated
- The trigger calculates the study streak:
  - If logged in yesterday: streak continues
  - If gap > 1 day: streak resets to 1
  - If same day: streak remains unchanged

### 3. Weak/Strong Topics Analysis
Based on mock test performance:
- Accuracy < 60%: Topics added to weak topics
- Accuracy > 80%: Topics added to strong topics
- Accuracy 60-80%: No change to topic classification

## Testing the System

### Test Mock Test Completion
```sql
-- Insert a test mock test result
INSERT INTO mock_test_results (user_id, mock_test_id, score, total_questions, correct_answers, time_taken_minutes)
VALUES (
    'your-user-uuid-here',
    'your-mock-test-uuid-here',
    15, -- score
    20, -- total questions
    15, -- correct answers
    45  -- time taken in minutes
);

-- Check if profile was updated
SELECT total_questions_answered, correct_answers, study_streak, weak_topics, strong_topics
FROM profiles WHERE id = 'your-user-uuid-here';
```

### Test Streak Update
```sql
-- Manually trigger a streak update (simulates login)
SELECT force_streak_update('your-user-uuid-here');

-- Check the updated streak
SELECT study_streak, last_active FROM profiles WHERE id = 'your-user-uuid-here';
```

### Test Performance Insights
```sql
-- Get student performance insights
SELECT * FROM get_student_performance_insights('your-user-uuid-here');

-- Calculate student accuracy
SELECT * FROM calculate_student_accuracy('your-user-uuid-here');
```

## Frontend Integration

The frontend components are already updated to use the new system:

1. **Dashboard**: Now shows StudyPlanner instead of PerformanceChart
2. **StudyPlanner**: Displays weak/strong topics, study plans, and Pomodoro timer
3. **Profile stats**: Automatically updated when mock tests are completed

## Important Notes

1. **RLS Policies**: All new tables have Row Level Security enabled
2. **Triggers**: Automatic updates happen via database triggers
3. **Performance**: Indexes are created for optimal query performance
4. **Data Integrity**: Functions handle NULL values and edge cases

## Troubleshooting

### Common Issues

1. **"Function not found" errors**: Make sure you ran both SQL files in order
2. **RLS policy errors**: Check if the user is authenticated and has proper permissions
3. **Trigger not firing**: Verify the trigger was created and the function exists

### Reset Everything
If you need to start over:

```sql
-- Drop all created objects (BE CAREFUL!)
DROP TRIGGER IF EXISTS trigger_update_profile_from_mock_test ON mock_test_results;
DROP TRIGGER IF EXISTS trigger_update_streak_on_login ON profiles;
DROP FUNCTION IF EXISTS update_profile_from_mock_test();
DROP FUNCTION IF EXISTS update_user_topics_from_mock_test(UUID, UUID, REAL);
DROP FUNCTION IF EXISTS update_study_streak_on_login();
DROP TABLE IF EXISTS mock_test_results;
DROP TABLE IF EXISTS study_plans;
DROP TABLE IF EXISTS study_sessions;
DROP TABLE IF EXISTS study_reminders;
```

## Next Steps

After running the SQL files:

1. Test the system with sample data
2. Verify the frontend components work correctly
3. Monitor the database for any errors
4. Set up daily cron jobs if needed (for streak resets)

## Support

If you encounter any issues:
1. Check the Supabase logs for errors
2. Verify all functions and triggers were created
3. Test with simple queries first
4. Ensure your user has proper permissions

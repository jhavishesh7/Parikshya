# Mock Test Setup Guide

## Issues Fixed

1. **Permission denied for table users** - Fixed by removing direct access to `auth.users` table
2. **Only three tests displayed** - Fixed by correcting the database schema and query logic
3. **Foreign key constraint error** - Fixed by ensuring profiles table has proper constraints

## Step-by-Step Setup

### ⚠️ IMPORTANT: Run Scripts in This Exact Order

### Step 1: Fix Profiles Table Constraints (MUST RUN FIRST)

Run this script in your Supabase SQL editor to fix the profiles table constraint issue:

```sql
-- Copy and paste the contents of fix-profiles-table-constraint.sql
```

This script will:
- Check the current profiles table structure
- Add unique constraint to `user_id` column if missing
- Add primary key if missing
- Verify the constraints are properly set

**Why this is needed**: The `profiles` table must have a unique constraint on `user_id` before we can create foreign key references to it.

### Step 2: Run the Permission Fix Script

After Step 1 completes successfully, run this script:

```sql
-- Copy and paste the contents of fix-mock-test-permissions.sql
```

This script will:
- Create the missing `mock_test_sessions` and `mock_test_results` tables
- Fix foreign key constraints to use the `profiles` table instead of `auth.users`
- Create proper RLS policies for security
- Set up triggers for profile updates

### Step 3: Run the Display Fix Script

Finally, run this script to fix the display issues:

```sql
-- Copy and paste the contents of fix-mock-test-display.sql
```

This script will:
- Check existing mock tests and their status
- Fix any tests without subject IDs
- Ensure all tests have 'ready' status
- Create sample mock tests if none exist
- Add sample questions to tests
- Update question counts

## What Was Fixed

### Database Schema Issues
- Missing `mock_test_sessions` table
- Missing `mock_test_results` table
- Incorrect foreign key references to `auth.users`
- Missing RLS policies
- **Missing unique constraint on profiles.user_id**

### Query Issues
- INNER JOIN with subjects table was filtering out tests
- Status filter was commented out
- No filtering for tests with questions

### Permission Issues
- Direct access to `auth.users` table (requires special permissions)
- Missing RLS policies for new tables
- Incorrect trigger function implementation

## Current Status

After running the scripts in order:
- ✅ Profiles table constraints fixed
- ✅ Mock test sessions table created
- ✅ Mock test results table created
- ✅ Proper foreign key constraints
- ✅ RLS policies for security
- ✅ Sample mock tests with questions
- ✅ Fixed query logic
- ✅ No more permission errors

## Troubleshooting

### If you get the foreign key constraint error:
1. **Make sure you ran Step 1 first** - the profiles table constraint fix
2. **Check the console output** from Step 1 to ensure it completed successfully
3. **Verify the profiles table** has a unique constraint on user_id

### If you still see issues:
1. **Check browser console** for any JavaScript errors
2. **Verify tables exist** by running the verification queries in the scripts
3. **Check RLS policies** are properly applied
4. **Ensure user authentication** is working correctly

## Verification Queries

After running all scripts, you can verify the setup with these queries:

```sql
-- Check profiles table constraints
SELECT constraint_name, constraint_type, column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles';

-- Check mock test tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('mock_test_sessions', 'mock_test_results');

-- Check mock tests count
SELECT COUNT(*) as total_tests FROM mock_tests WHERE status = 'ready';
```

## Next Steps

Once the basic system is working:
1. Add more mock tests through the admin panel
2. Upload real questions instead of sample ones
3. Customize test parameters and instructions
4. Add more subjects and question types


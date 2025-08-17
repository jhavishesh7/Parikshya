-- Fix Profiles Table Constraint Issue
-- This script ensures the profiles table has the proper unique constraint on user_id

-- 1. First, let's check the current structure of the profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Check if there are any existing constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'profiles';

-- 3. Check if user_id column exists and its current state
DO $$
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
        RAISE EXCEPTION 'user_id column does not exist in profiles table';
    END IF;
    
    -- Check if user_id has a unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'profiles' 
        AND kcu.column_name = 'user_id'
        AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    ) THEN
        RAISE NOTICE 'user_id column exists but has no unique constraint. Adding one...';
        
        -- Add unique constraint to user_id
        ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint to profiles.user_id';
    ELSE
        RAISE NOTICE 'user_id column already has a unique constraint';
    END IF;
    
    -- Check if there's a primary key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' AND constraint_type = 'PRIMARY KEY'
    ) THEN
        RAISE NOTICE 'No primary key found. Adding one on user_id...';
        
        -- Add primary key on user_id
        ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);
        RAISE NOTICE 'Added primary key on profiles.user_id';
    ELSE
        RAISE NOTICE 'Primary key already exists';
    END IF;
    
END $$;

-- 4. Verify the final state
SELECT 
    'Final Profiles Table Constraints' as info,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles'
ORDER BY tc.constraint_type, kcu.column_name;

-- 5. Now we can safely create the foreign key constraints
DO $$
BEGIN
    RAISE NOTICE 'Profiles table constraints fixed. Now you can run the mock test permissions script.';
END $$;

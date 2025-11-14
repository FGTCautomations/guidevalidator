-- ============================================
-- FIX PROFILES TABLE FOREIGN KEY CONSTRAINT
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check the current foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'profiles'
    AND tc.constraint_name = 'profiles_id_fkey';

-- Step 2: Drop the foreign key constraint that requires profiles.id to exist in auth.users
-- This allows us to create profiles for imported guides without auth accounts
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 3: Verify the constraint has been removed
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'profiles';

SELECT 'Foreign key constraint removed! You can now run the setup script again.' as status;

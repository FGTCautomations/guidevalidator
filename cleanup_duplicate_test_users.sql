-- ============================================================================
-- CLEANUP DUPLICATE TEST USERS
-- This script removes test users that were created during bulk upload testing
-- Run this in Supabase SQL Editor before retrying bulk upload
-- https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new
-- ============================================================================

-- First, let's see what test users exist
SELECT
  p.id,
  p.role,
  p.full_name,
  au.email,
  p.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email IN (
  'test@example.com',
  'test2@hotmail.com',
  'test3@gmail.com',
  'test4@outlook.com',
  'contact@travelagency.com',
  'contact@dmccompany.com',
  'contact@transportco.com'
)
ORDER BY au.email;

-- ============================================================================
-- STEP 1: Delete related guide records (if any)
-- ============================================================================
DELETE FROM public.guides
WHERE profile_id IN (
  SELECT au.id
  FROM auth.users au
  WHERE au.email IN (
    'test@example.com',
    'test2@hotmail.com',
    'test3@gmail.com',
    'test4@outlook.com'
  )
);

-- ============================================================================
-- STEP 2: Delete related agency records (if any)
-- ============================================================================
DELETE FROM public.agencies
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  WHERE au.email IN (
    'contact@travelagency.com',
    'contact@dmccompany.com',
    'contact@transportco.com'
  )
);

-- ============================================================================
-- STEP 3: Delete profile records
-- ============================================================================
DELETE FROM public.profiles
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  WHERE au.email IN (
    'test@example.com',
    'test2@hotmail.com',
    'test3@gmail.com',
    'test4@outlook.com',
    'contact@travelagency.com',
    'contact@dmccompany.com',
    'contact@transportco.com'
  )
);

-- ============================================================================
-- STEP 4: Delete auth users (this is the final step)
-- Note: You may need to use Supabase Auth Admin API for this step
-- Or run this in a separate script with service role access
-- ============================================================================

-- Verification: Check if all test users are deleted
SELECT
  'Test users remaining:' AS status,
  COUNT(*) AS count
FROM auth.users au
WHERE au.email IN (
  'test@example.com',
  'test2@hotmail.com',
  'test3@gmail.com',
  'test4@outlook.com',
  'contact@travelagency.com',
  'contact@dmccompany.com',
  'contact@transportco.com'
);

SELECT 'Cleanup complete! You can now retry the bulk upload.' AS message;

-- First, check if you're authenticated
SELECT auth.uid() as my_user_id;

-- If the above returns a UUID, then you're authenticated but have no profile
-- Let's check auth.users table
SELECT
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE id = auth.uid();

-- Now let's see if there's ANY profile for this user (might be soft-deleted?)
SELECT
  id,
  role,
  organization_id,
  deleted_at
FROM public.profiles
WHERE id = auth.uid();

-- Check if there are any applications from this user
SELECT
  id,
  role_type,
  status,
  created_at
FROM public.applications
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

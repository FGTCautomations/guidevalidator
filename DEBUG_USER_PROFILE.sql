-- Debug query to check current user's profile and permissions
-- Run this in Supabase SQL Editor while logged in as the agency user

-- Check current auth user
SELECT
  auth.uid() as current_user_id,
  auth.jwt() ->> 'email' as email;

-- Check profile details with detailed info
SELECT
  id,
  role,
  role IN ('agency', 'dmc') as role_is_agency_or_dmc,
  organization_id,
  organization_id IS NOT NULL as has_organization_id,
  created_at,
  full_name
FROM public.profiles
WHERE id = auth.uid();

-- Check if organization exists
SELECT
  a.id,
  a.name,
  a.created_at
FROM public.agencies a
JOIN public.profiles p ON p.organization_id = a.id
WHERE p.id = auth.uid();

-- Check agency_members relationship
SELECT
  am.*
FROM public.agency_members am
WHERE am.profile_id = auth.uid()
  AND am.removed_at IS NULL;

-- Test if the user can pass the INSERT policy check
SELECT
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('agency', 'dmc')
      AND p.organization_id IS NOT NULL
  ) as can_insert_job;

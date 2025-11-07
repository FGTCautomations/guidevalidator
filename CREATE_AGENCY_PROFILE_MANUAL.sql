-- Manual fix to create agency profile and organization
-- Run this ONLY if you confirmed you have NO profile

-- Step 1: First, let's see your user ID and email
SELECT
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- Step 2: Create an agency for you (replace 'My Agency Name' with your actual agency name)
-- Copy the UUID that gets returned - you'll need it!
INSERT INTO public.agencies (
  id,
  name,
  country_code,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'My Agency Name',  -- CHANGE THIS to your agency name
  'US',              -- CHANGE THIS to your country code (e.g., 'US', 'GB', 'FR')
  now(),
  now()
)
RETURNING id, name;

-- Step 3: Create your profile linked to the agency
-- IMPORTANT: Replace 'YOUR-AGENCY-ID-FROM-STEP-2' with the UUID from step 2
INSERT INTO public.profiles (
  id,
  role,
  organization_id,
  full_name,
  created_at,
  updated_at
) VALUES (
  auth.uid(),
  'agency',
  'YOUR-AGENCY-ID-FROM-STEP-2'::uuid,  -- REPLACE THIS with the agency ID from step 2
  'Agency Admin',    -- CHANGE THIS to your name
  now(),
  now()
)
RETURNING id, role, organization_id;

-- Step 4: Add yourself to agency_members
-- IMPORTANT: Replace 'YOUR-AGENCY-ID-FROM-STEP-2' with the UUID from step 2
INSERT INTO public.agency_members (
  agency_id,
  profile_id,
  role,
  created_at
) VALUES (
  'YOUR-AGENCY-ID-FROM-STEP-2'::uuid,  -- REPLACE THIS
  auth.uid(),
  'admin',
  now()
)
RETURNING *;

-- Step 5: Verify everything worked
SELECT
  p.id,
  p.role,
  p.organization_id,
  a.name as agency_name
FROM public.profiles p
LEFT JOIN public.agencies a ON a.id = p.organization_id
WHERE p.id = auth.uid();

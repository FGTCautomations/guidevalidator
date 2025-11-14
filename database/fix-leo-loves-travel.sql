-- ============================================================================
-- FIX: Create missing agency record for "Leo Loves Travel"
-- ============================================================================
-- Profile exists but agency record is missing in agencies table
-- Profile ID: 6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac
--
-- Date: 2025-11-10
-- ============================================================================

-- First, let's verify the profile exists
SELECT
  id,
  full_name,
  role,
  created_at,
  organization_id
FROM profiles
WHERE id = '6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac';

-- Get auth user metadata (for additional details)
SELECT
  id,
  email,
  created_at,
  banned_until,
  raw_user_meta_data
FROM auth.users
WHERE id = '6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac';

-- Create the missing agency record
INSERT INTO agencies (
  id,
  type,
  name,
  slug,
  contact_email,
  application_status,
  application_submitted_at,
  created_at,
  updated_at,
  verified
)
SELECT
  p.id,
  'agency',
  p.full_name,
  LOWER(REGEXP_REPLACE(p.full_name, '[^a-zA-Z0-9]+', '-', 'g')), -- Create slug from name
  u.email, -- Get email from auth.users
  'pending',
  p.created_at, -- Use profile creation date as submission date
  p.created_at,
  NOW(),
  false
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.id = '6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac'
ON CONFLICT (id) DO NOTHING; -- Skip if already exists

-- Update the profile to link to the agency
UPDATE profiles
SET organization_id = '6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac'
WHERE id = '6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac'
  AND organization_id IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the agency was created
SELECT
  id,
  name,
  type,
  application_status,
  application_submitted_at,
  created_at,
  verified
FROM agencies
WHERE id = '6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac';

-- Verify the profile is linked
SELECT
  p.id,
  p.full_name,
  p.role,
  p.organization_id,
  a.name as agency_name,
  a.application_status
FROM profiles p
LEFT JOIN agencies a ON a.id = p.organization_id
WHERE p.id = '6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac';

-- Show all pending agency applications (this should include Leo Loves Travel now)
SELECT
  id,
  name,
  type,
  application_status,
  application_submitted_at,
  contact_email,
  created_at
FROM agencies
WHERE application_status = 'pending'
  AND type = 'agency'
ORDER BY application_submitted_at DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ Created missing agency record for "Leo Loves Travel"';
  RAISE NOTICE '  Profile ID: 6d07c82b-d6f7-4e6b-883a-a5981bd7a1ac';
  RAISE NOTICE '  Status: pending';
  RAISE NOTICE '';
  RAISE NOTICE 'Leo Loves Travel should now appear in /admin/applications';
END $$;

-- Create 3 test profiles for DMC, Agency, and Transport segments
-- Run this in Supabase SQL Editor

-- First, let's check if we have these roles in the system
SELECT DISTINCT role FROM profiles WHERE role IN ('agency', 'dmc', 'transport');

-- ===================================
-- 1. CREATE TEST AGENCY PROFILE
-- ===================================

-- Insert profile for agency
INSERT INTO profiles (
  id,
  full_name,
  email,
  role,
  country_code,
  application_status,
  verified,
  profile_completed,
  profile_completion_percentage,
  application_data
)
VALUES (
  gen_random_uuid(),
  'Sunrise Travel Agency',
  'test-agency@example.com',
  'agency',
  'VN',
  'approved',
  true,
  true,
  100,
  jsonb_build_object(
    'websiteUrl', 'https://sunrisetravelagency.com',
    'logoUrl', 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=STA',
    'registrationCountry', 'VN',
    'companyDescription', 'Leading travel agency specializing in Southeast Asian tours'
  )
)
RETURNING id;

-- Store the agency profile ID (you'll need to copy this from the result above)
-- For now, we'll select it in the next query

-- Insert into agencies table
INSERT INTO agencies (
  id,
  languages,
  specialties,
  niche_focus,
  created_at,
  updated_at
)
SELECT 
  id,
  ARRAY['en', 'vi', 'fr']::text[],
  ARRAY['Cultural Tours', 'Adventure Travel', 'Beach Holidays']::text[],
  ARRAY['Family Travel', 'Luxury Tours']::text[],
  NOW(),
  NOW()
FROM profiles 
WHERE email = 'test-agency@example.com' 
  AND role = 'agency'
LIMIT 1;

-- ===================================
-- 2. CREATE TEST DMC PROFILE
-- ===================================

-- Insert profile for DMC
INSERT INTO profiles (
  id,
  full_name,
  email,
  role,
  country_code,
  application_status,
  verified,
  profile_completed,
  profile_completion_percentage,
  application_data
)
VALUES (
  gen_random_uuid(),
  'Thailand DMC Services',
  'test-dmc@example.com',
  'dmc',
  'TH',
  'approved',
  true,
  true,
  100,
  jsonb_build_object(
    'websiteUrl', 'https://thailanddmc.com',
    'logoUrl', 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=TDMC',
    'registrationCountry', 'TH',
    'companyDescription', 'Premier destination management company in Thailand'
  )
)
RETURNING id;

-- Insert into agencies table (DMCs also use agencies table with role='dmc')
INSERT INTO agencies (
  id,
  languages,
  specialties,
  niche_focus,
  created_at,
  updated_at
)
SELECT 
  id,
  ARRAY['en', 'th', 'zh']::text[],
  ARRAY['Ground Transportation', 'Hotel Bookings', 'Event Management', 'MICE Services']::text[],
  ARRAY['Corporate Events', 'Incentive Travel']::text[],
  NOW(),
  NOW()
FROM profiles 
WHERE email = 'test-dmc@example.com' 
  AND role = 'dmc'
LIMIT 1;

-- ===================================
-- 3. CREATE TEST TRANSPORT PROFILE
-- ===================================

-- Insert profile for Transport
INSERT INTO profiles (
  id,
  full_name,
  email,
  role,
  country_code,
  application_status,
  verified,
  profile_completed,
  profile_completion_percentage,
  application_data
)
VALUES (
  gen_random_uuid(),
  'Manila Express Transport',
  'test-transport@example.com',
  'transport',
  'PH',
  'approved',
  true,
  true,
  100,
  jsonb_build_object(
    'websiteUrl', 'https://manilaexpress.ph',
    'logoUrl', 'https://via.placeholder.com/150/95E1D3/000000?text=MET',
    'registrationCountry', 'PH',
    'companyDescription', 'Reliable transport services across the Philippines'
  )
)
RETURNING id;

-- Note: Transport profiles go directly in profiles table, 
-- but we need to check if there's a transport_fleet or similar table
-- For now, let's just add service types to application_data

UPDATE profiles
SET application_data = application_data || jsonb_build_object(
  'serviceTypes', ARRAY['Airport Transfers', 'Private Car Hire', 'Bus Services', 'Van Rentals']
)
WHERE email = 'test-transport@example.com' 
  AND role = 'transport';

-- ===================================
-- VERIFY THE PROFILES WERE CREATED
-- ===================================

SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role,
  p.country_code,
  p.application_status,
  p.verified,
  a.languages as agency_languages,
  a.specialties as agency_specialties
FROM profiles p
LEFT JOIN agencies a ON a.id = p.id
WHERE p.email IN ('test-agency@example.com', 'test-dmc@example.com', 'test-transport@example.com')
ORDER BY p.role;

-- Check if we need to create auth users (optional - only if you need login functionality)
-- For directory listing purposes, profiles are sufficient

-- ===================================
-- REFRESH MATERIALIZED VIEWS
-- ===================================

REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;

-- ===================================
-- VERIFY DATA IN MATERIALIZED VIEWS
-- ===================================

SELECT 'agencies_browse_v' as view_name, COUNT(*) as row_count FROM agencies_browse_v
UNION ALL
SELECT 'dmcs_browse_v', COUNT(*) FROM dmcs_browse_v
UNION ALL
SELECT 'transport_browse_v', COUNT(*) FROM transport_browse_v;

-- View the actual data
SELECT * FROM agencies_browse_v;
SELECT * FROM dmcs_browse_v;
SELECT * FROM transport_browse_v;


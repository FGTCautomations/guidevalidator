-- Debug Ads System
-- Run these queries in Supabase SQL Editor to diagnose why ads aren't showing

-- 1. Check all ads in database
SELECT
  id,
  advertiser_name,
  ad_type,
  placement,
  is_active,
  start_at,
  end_at,
  now() as current_time,
  CASE
    WHEN NOT is_active THEN 'INACTIVE'
    WHEN now() < start_at THEN 'NOT STARTED YET'
    WHEN now() > end_at THEN 'EXPIRED'
    ELSE 'ACTIVE AND IN DATE RANGE'
  END as status
FROM ads
ORDER BY id DESC;

-- 2. Check if any ads match homepage_mid placement
SELECT
  id,
  advertiser_name,
  placement,
  is_active,
  now() BETWEEN start_at AND end_at as in_date_range
FROM ads
WHERE placement @> ARRAY['homepage_mid']::text[];

-- 3. Check if any ads match footer placement
SELECT
  id,
  advertiser_name,
  placement,
  is_active,
  now() BETWEEN start_at AND end_at as in_date_range
FROM ads
WHERE placement @> ARRAY['footer']::text[];

-- 4. Test the RPC function directly
SELECT * FROM select_ad('homepage_mid', null, null);
SELECT * FROM select_ad('footer', null, null);
SELECT * FROM select_ad('listings', null, 'guides');

-- 5. Check what the RPC function sees
SELECT
  id,
  advertiser_name,
  ad_type,
  placement,
  is_active,
  start_at,
  end_at,
  now() as current_time
FROM ads
WHERE is_active = true
  AND now() BETWEEN start_at AND end_at
  AND placement @> ARRAY['homepage_mid']::text[];

-- 6. If you see ads above but RPC returns empty, check the RPC function logic
-- The issue might be in the weighted random selection

-- 7. QUICK FIX: Create a simple test ad that WILL work
INSERT INTO ads (
  advertiser_name,
  ad_type,
  placement,
  target_url,
  image_url,
  headline,
  description,
  cta_label,
  start_at,
  end_at,
  is_active,
  weight
) VALUES (
  'Working Test Ad',
  'banner',
  ARRAY['homepage_mid', 'footer', 'listings'],
  'https://example.com',
  'https://placehold.co/728x90/green/white?text=Test+Ad',
  'Test Advertisement',
  'This ad should definitely show up',
  'Click Here',
  now() - interval '1 hour',  -- Started 1 hour ago
  now() + interval '365 days', -- Valid for 1 year
  true,
  1
) RETURNING id, advertiser_name, placement;

-- 8. Verify the new ad works
SELECT * FROM select_ad('homepage_mid', null, null);
SELECT * FROM select_ad('footer', null, null);

-- 9. Check if there are timezone issues
SELECT
  id,
  advertiser_name,
  start_at,
  end_at,
  now() as current_time_utc,
  start_at AT TIME ZONE 'UTC' as start_local,
  end_at AT TIME ZONE 'UTC' as end_local,
  now() BETWEEN start_at AND end_at as is_in_range
FROM ads;

-- 10. If still not working, check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'ads';

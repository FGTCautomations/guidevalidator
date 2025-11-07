-- FINAL FIX: Run this ONE query to diagnose and fix the ads issue
-- Copy and paste this ENTIRE file into Supabase SQL Editor

-- Step 1: Check what ads currently exist
SELECT
  'CURRENT ADS:' as info,
  id,
  advertiser_name,
  ad_type,
  placement,
  is_active,
  to_char(start_at, 'YYYY-MM-DD HH24:MI') as start_at,
  to_char(end_at, 'YYYY-MM-DD HH24:MI') as end_at,
  to_char(now(), 'YYYY-MM-DD HH24:MI') as current_time,
  CASE
    WHEN NOT is_active THEN '❌ INACTIVE'
    WHEN now() < start_at THEN '⏰ NOT STARTED (future date)'
    WHEN now() > end_at THEN '⏰ EXPIRED (past date)'
    ELSE '✅ ACTIVE AND IN DATE RANGE'
  END as status
FROM ads
ORDER BY id DESC;

-- Step 2: Delete ALL test ads (clean slate)
DELETE FROM ads;

-- Step 3: Create a working test ad
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
  ARRAY['homepage_mid', 'footer', 'listings']::text[],
  'https://example.com',
  'https://placehold.co/728x90/1FA947/white?text=Test+Advertisement',
  'Test Banner Advertisement',
  'This ad should appear everywhere',
  'Click Here',
  (now() - interval '1 hour')::timestamptz,
  (now() + interval '365 days')::timestamptz,
  true,
  1
) RETURNING
  'CREATED AD:' as info,
  id,
  advertiser_name,
  is_active,
  placement;

-- Step 4: Verify the ad is queryable
SELECT
  'VERIFICATION:' as info,
  id,
  advertiser_name,
  is_active,
  now() > start_at as has_started,
  now() < end_at as not_expired,
  placement
FROM ads;

-- Step 5: Test RPC function for homepage
SELECT 'TEST homepage_mid RPC:' as info, * FROM select_ad('homepage_mid', null, null);

-- Step 6: Test RPC function for footer
SELECT 'TEST footer RPC:' as info, * FROM select_ad('footer', null, null);

-- Step 7: Test RPC function for listings
SELECT 'TEST listings RPC:' as info, * FROM select_ad('listings', null, 'guides');

-- If all above return results, the ad system is working!
-- If RPC returns empty, there's an issue with the RPC function itself.

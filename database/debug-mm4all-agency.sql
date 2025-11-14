-- DIAGNOSTIC QUERY: Check mm4all agency status
-- Run this in Supabase SQL Editor to see what's wrong

-- 1. Check if the agency exists in agencies table
SELECT
    id,
    name,
    type,
    application_status,
    verified,
    deleted_at,
    country_code,
    created_at
FROM agencies
WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%';

-- 2. Check if it's in the materialized view
SELECT
    id,
    name,
    country_code,
    verified,
    featured,
    rating,
    review_count
FROM agencies_browse_v
WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%';

-- 3. Check the full materialized view (see all agencies)
SELECT
    id,
    name,
    country_code,
    verified,
    created_at
FROM agencies_browse_v
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if refresh functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%refresh%view%';

-- 5. Count records in each
SELECT
    (SELECT COUNT(*) FROM agencies WHERE type = 'agency' AND application_status = 'approved') as approved_agencies,
    (SELECT COUNT(*) FROM agencies_browse_v) as agencies_in_view;

-- ================================================
-- ACTIVATE AGENCIES FOR DIRECTORY
-- ================================================

-- Step 1: Set agencies to approved (so they show in directory)
UPDATE agencies
SET
    application_status = 'approved',
    verified = true,  -- Mark as active/verified for directory
    updated_at = NOW()
WHERE country_code = 'VN';

-- Step 2: Check the update
SELECT
    application_status,
    verified,
    COUNT(*) as count
FROM agencies
GROUP BY application_status, verified;

-- Step 3: Check if there's a materialized view for agencies
SELECT
    schemaname,
    matviewname,
    ispopulated,
    definition
FROM pg_matviews
WHERE matviewname LIKE '%agenc%' OR matviewname LIKE '%browse%';

-- Step 4: If materialized view exists, refresh it
-- REFRESH MATERIALIZED VIEW agencies_browse_v;
-- (Run this after checking Step 3)

-- Step 5: Sample agencies that should now be active
SELECT
    id,
    name,
    type,
    application_status,
    verified,
    website_url,
    contact_email
FROM agencies
WHERE country_code = 'VN'
LIMIT 10;

-- ================================================
-- EXPECTED RESULTS:
-- Step 2: Should show all as 'approved' and verified=true
-- Step 3: Check if materialized view exists
-- Step 5: Should show 10 active agencies
-- ================================================

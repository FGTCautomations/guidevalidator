-- COMPLETE FIX: Make mm4all visible in agencies directory
-- Run this entire script in Supabase SQL Editor

-- Step 1: Create refresh functions
CREATE OR REPLACE FUNCTION refresh_agencies_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_dmcs_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_transport_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_guides_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;
END;
$$;

-- Step 2: Check current status of mm4all
DO $$
DECLARE
    v_agency_count INT;
    v_view_count INT;
    v_agency_status TEXT;
    v_agency_verified BOOLEAN;
BEGIN
    -- Check in agencies table
    SELECT COUNT(*), MAX(application_status), MAX(verified::text)::boolean
    INTO v_agency_count, v_agency_status, v_agency_verified
    FROM agencies
    WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%';

    RAISE NOTICE '=== MM4ALL STATUS ===';
    RAISE NOTICE 'Found in agencies table: %', v_agency_count;
    IF v_agency_count > 0 THEN
        RAISE NOTICE 'Application status: %', v_agency_status;
        RAISE NOTICE 'Verified: %', v_agency_verified;
    END IF;

    -- Check in materialized view
    SELECT COUNT(*)
    INTO v_view_count
    FROM agencies_browse_v
    WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%';

    RAISE NOTICE 'Found in agencies_browse_v: %', v_view_count;
    RAISE NOTICE '=====================';
END $$;

-- Step 3: Force refresh all materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;
REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;

-- Step 4: Verify mm4all is now in the view
SELECT
    'SUCCESS: mm4all is now visible' as status,
    id,
    name,
    country_code,
    verified,
    featured,
    rating,
    review_count,
    created_at
FROM agencies_browse_v
WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%'

UNION ALL

-- If not found, show what we're looking for
SELECT
    'CHECKING: Agencies table' as status,
    id,
    name,
    country_code,
    verified::text,
    'N/A',
    NULL,
    NULL,
    created_at
FROM agencies
WHERE (name ILIKE '%mm4all%' OR name ILIKE '%meditation%')
AND NOT EXISTS (
    SELECT 1 FROM agencies_browse_v
    WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%'
);

-- Step 5: Show summary
SELECT
    'SUMMARY' as info,
    (SELECT COUNT(*) FROM agencies WHERE type = 'agency' AND application_status = 'approved' AND deleted_at IS NULL) as total_approved_agencies,
    (SELECT COUNT(*) FROM agencies_browse_v) as agencies_in_directory;

-- COMPLETE VERIFICATION AND FIX FOR MM4ALL
-- This script will check everything and fix any issues

-- ============================================================
-- STEP 1: Check what's wrong with mm4all
-- ============================================================

-- Check the agency record
SELECT
    '1. AGENCY TABLE CHECK' as step,
    id,
    name,
    type,
    application_status,
    verified,
    deleted_at,
    country_code,
    languages,
    specialties,
    logo_url,
    website,
    description,
    created_at
FROM agencies
WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%' OR id = 'f0aee3b7-284e-4180-ae43-def24168b991';

-- ============================================================
-- STEP 2: Check materialized view requirements
-- ============================================================

-- The materialized view requires:
-- 1. type = 'agency'
-- 2. application_status = 'approved'
-- 3. deleted_at IS NULL

SELECT
    '2. REQUIREMENTS CHECK' as step,
    CASE
        WHEN type = 'agency' THEN '✓ type is agency'
        ELSE '✗ type is ' || type || ' (should be agency)'
    END as type_check,
    CASE
        WHEN application_status = 'approved' THEN '✓ status is approved'
        ELSE '✗ status is ' || COALESCE(application_status, 'NULL') || ' (should be approved)'
    END as status_check,
    CASE
        WHEN deleted_at IS NULL THEN '✓ not deleted'
        ELSE '✗ deleted_at is set: ' || deleted_at::text
    END as deleted_check
FROM agencies
WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%' OR id = 'f0aee3b7-284e-4180-ae43-def24168b991';

-- ============================================================
-- STEP 3: Fix any issues (if needed)
-- ============================================================

-- Ensure application_status is 'approved'
UPDATE agencies
SET
    application_status = 'approved',
    verified = true,
    application_reviewed_at = NOW()
WHERE (name ILIKE '%mm4all%' OR name ILIKE '%meditation%' OR id = 'f0aee3b7-284e-4180-ae43-def24168b991')
AND (application_status != 'approved' OR verified != true);

-- Ensure deleted_at is NULL
UPDATE agencies
SET deleted_at = NULL
WHERE (name ILIKE '%mm4all%' OR name ILIKE '%meditation%' OR id = 'f0aee3b7-284e-4180-ae43-def24168b991')
AND deleted_at IS NOT NULL;

-- Ensure type is 'agency'
UPDATE agencies
SET type = 'agency'
WHERE (name ILIKE '%mm4all%' OR name ILIKE '%meditation%' OR id = 'f0aee3b7-284e-4180-ae43-def24168b991')
AND type != 'agency';

-- ============================================================
-- STEP 4: Create refresh functions (if they don't exist)
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_agencies_view()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v; END; $$;

CREATE OR REPLACE FUNCTION refresh_dmcs_view()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v; END; $$;

CREATE OR REPLACE FUNCTION refresh_transport_view()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v; END; $$;

CREATE OR REPLACE FUNCTION refresh_guides_view()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v; END; $$;

-- ============================================================
-- STEP 5: Refresh the materialized view
-- ============================================================

REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;

-- ============================================================
-- STEP 6: Verify it's now in the view
-- ============================================================

SELECT
    '3. MATERIALIZED VIEW CHECK (AFTER REFRESH)' as step,
    id,
    name,
    country_code,
    verified,
    featured,
    rating,
    review_count,
    sort_key,
    created_at,
    updated_at
FROM agencies_browse_v
WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%';

-- ============================================================
-- STEP 7: Final summary
-- ============================================================

SELECT
    '4. FINAL SUMMARY' as step,
    (SELECT COUNT(*) FROM agencies WHERE type = 'agency' AND application_status = 'approved' AND deleted_at IS NULL) as approved_agencies_in_table,
    (SELECT COUNT(*) FROM agencies_browse_v) as agencies_in_directory_view,
    (SELECT COUNT(*) FROM agencies_browse_v WHERE name ILIKE '%mm4all%' OR name ILIKE '%meditation%') as mm4all_in_view;

-- ============================================================
-- If mm4all is still not showing, let's see ALL agencies
-- ============================================================

SELECT
    '5. ALL AGENCIES IN VIEW (First 10)' as info,
    name,
    country_code,
    verified,
    created_at
FROM agencies_browse_v
ORDER BY created_at DESC
LIMIT 10;

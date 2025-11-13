-- ============================================================
-- COMPLETE MIGRATION: Add active field and update directory views
-- ============================================================

-- Step 1: Add active column to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;

-- Step 2: Create index for active field
CREATE INDEX IF NOT EXISTS idx_agencies_active ON agencies(active);

-- Step 3: Set all Vietnamese agencies to active=true
UPDATE agencies
SET active = true
WHERE country_code = 'VN';

-- Step 4: Copy website_url to website for agencies where website is null
UPDATE agencies
SET website = website_url
WHERE website_url IS NOT NULL
  AND website_url != ''
  AND (website IS NULL OR website = '');

-- Step 5: Drop existing materialized views
DROP MATERIALIZED VIEW IF EXISTS agencies_browse_v CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dmcs_browse_v CASCADE;
DROP MATERIALIZED VIEW IF EXISTS transport_browse_v CASCADE;

-- ============================================================
-- MATERIALIZED VIEW: agencies_browse_v (with active field)
-- ============================================================
CREATE MATERIALIZED VIEW agencies_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  a.languages,
  a.specialties,
  a.logo_url,
  a.website_url as website,
  a.description,
  a.verified,
  a.featured,
  a.active,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  CASE
    WHEN a.featured AND a.verified THEN 50
    WHEN a.featured THEN 40
    WHEN a.verified THEN 30
    ELSE 20
  END::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))) as search_text,
  a.created_at,
  a.updated_at
FROM agencies a
LEFT JOIN LATERAL (
  SELECT
    AVG(overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM reviews r
  WHERE r.reviewee_id = a.id
  AND r.status = 'approved'
) pr ON true
WHERE a.type = 'agency'
  AND a.active = true  -- Filter by active instead of approved
  AND a.deleted_at IS NULL;

-- Create indexes on materialized view
CREATE UNIQUE INDEX agencies_browse_v_id_idx ON agencies_browse_v(id);
CREATE INDEX agencies_browse_v_country_idx ON agencies_browse_v(country_code);
CREATE INDEX agencies_browse_v_sort_idx ON agencies_browse_v(sort_key DESC, name);
CREATE INDEX agencies_browse_v_rating_idx ON agencies_browse_v(rating DESC);
CREATE INDEX agencies_browse_v_search_idx ON agencies_browse_v USING gin(search_text);
CREATE INDEX agencies_browse_v_languages_idx ON agencies_browse_v USING gin(languages);
CREATE INDEX agencies_browse_v_specialties_idx ON agencies_browse_v USING gin(specialties);
CREATE INDEX agencies_browse_v_active_idx ON agencies_browse_v(active);

-- ============================================================
-- MATERIALIZED VIEW: dmcs_browse_v (with active field)
-- ============================================================
CREATE MATERIALIZED VIEW dmcs_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  a.languages,
  a.specialties,
  a.logo_url,
  a.website_url as website,
  a.description,
  a.verified,
  a.featured,
  a.active,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  CASE
    WHEN a.featured AND a.verified THEN 50
    WHEN a.featured THEN 40
    WHEN a.verified THEN 30
    ELSE 20
  END::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))) as search_text,
  a.created_at,
  a.updated_at
FROM agencies a
LEFT JOIN LATERAL (
  SELECT
    AVG(overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM reviews r
  WHERE r.reviewee_id = a.id
  AND r.status = 'approved'
) pr ON true
WHERE a.type = 'dmc'
  AND a.active = true  -- Filter by active instead of approved
  AND a.deleted_at IS NULL;

-- Create indexes on materialized view
CREATE UNIQUE INDEX dmcs_browse_v_id_idx ON dmcs_browse_v(id);
CREATE INDEX dmcs_browse_v_country_idx ON dmcs_browse_v(country_code);
CREATE INDEX dmcs_browse_v_sort_idx ON dmcs_browse_v(sort_key DESC, name);
CREATE INDEX dmcs_browse_v_rating_idx ON dmcs_browse_v(rating DESC);
CREATE INDEX dmcs_browse_v_search_idx ON dmcs_browse_v USING gin(search_text);
CREATE INDEX dmcs_browse_v_languages_idx ON dmcs_browse_v USING gin(languages);
CREATE INDEX dmcs_browse_v_specialties_idx ON dmcs_browse_v USING gin(specialties);
CREATE INDEX dmcs_browse_v_active_idx ON dmcs_browse_v(active);

-- ============================================================
-- MATERIALIZED VIEW: transport_browse_v (with active field)
-- ============================================================
CREATE MATERIALIZED VIEW transport_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  a.languages,
  COALESCE((a.fleet_data->>'service_types')::text[], ARRAY[]::text[]) as service_types,
  a.logo_url,
  a.website_url as website,
  a.description,
  a.verified,
  a.featured,
  a.active,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  CASE
    WHEN a.featured AND a.verified THEN 50
    WHEN a.featured THEN 40
    WHEN a.verified THEN 30
    ELSE 20
  END::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))) as search_text,
  a.created_at,
  a.updated_at
FROM agencies a
LEFT JOIN LATERAL (
  SELECT
    AVG(overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM reviews r
  WHERE r.reviewee_id = a.id
  AND r.status = 'approved'
) pr ON true
WHERE a.type = 'transport'
  AND a.active = true  -- Filter by active instead of approved
  AND a.deleted_at IS NULL;

-- Create indexes on materialized view
CREATE UNIQUE INDEX transport_browse_v_id_idx ON transport_browse_v(id);
CREATE INDEX transport_browse_v_country_idx ON transport_browse_v(country_code);
CREATE INDEX transport_browse_v_sort_idx ON transport_browse_v(sort_key DESC, name);
CREATE INDEX transport_browse_v_rating_idx ON transport_browse_v(rating DESC);
CREATE INDEX transport_browse_v_search_idx ON transport_browse_v USING gin(search_text);
CREATE INDEX transport_browse_v_languages_idx ON transport_browse_v USING gin(languages);
CREATE INDEX transport_browse_v_service_types_idx ON transport_browse_v USING gin(service_types);
CREATE INDEX transport_browse_v_active_idx ON transport_browse_v(active);

-- ============================================================
-- GRANT SELECT PERMISSIONS
-- ============================================================
GRANT SELECT ON agencies_browse_v TO anon, authenticated;
GRANT SELECT ON dmcs_browse_v TO anon, authenticated;
GRANT SELECT ON transport_browse_v TO anon, authenticated;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
DO $$
DECLARE
  v_agencies_count int;
  v_dmcs_count int;
  v_transport_count int;
BEGIN
  -- Count records in each view
  SELECT COUNT(*) INTO v_agencies_count FROM agencies_browse_v WHERE country_code = 'VN';
  SELECT COUNT(*) INTO v_dmcs_count FROM dmcs_browse_v WHERE country_code = 'VN';
  SELECT COUNT(*) INTO v_transport_count FROM transport_browse_v WHERE country_code = 'VN';

  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Added active column to agencies table';
  RAISE NOTICE '  - Set % Vietnamese agencies to active=true', v_agencies_count;
  RAISE NOTICE '  - Normalized website fields';
  RAISE NOTICE '  - Recreated all materialized views with active filter';
  RAISE NOTICE '';
  RAISE NOTICE 'Directory Counts (Vietnam):';
  RAISE NOTICE '  - Agencies: %', v_agencies_count;
  RAISE NOTICE '  - DMCs: %', v_dmcs_count;
  RAISE NOTICE '  - Transport: %', v_transport_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Visit /directory/agencies?country=VN to see agencies';
  RAISE NOTICE '  2. All agencies are active with pending status';
  RAISE NOTICE '  3. Create ads at /admin/ads and select directory';
  RAISE NOTICE '';
END $$;

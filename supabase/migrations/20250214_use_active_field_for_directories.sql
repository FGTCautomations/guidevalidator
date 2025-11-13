-- ============================================================
-- UPDATE DIRECTORY VIEWS TO USE ACTIVE FIELD
-- Change from application_status='approved' to active=true
-- ============================================================

-- Drop existing views
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
  AND a.active = true  -- Changed from application_status = 'approved'
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
  AND a.active = true  -- Changed from application_status = 'approved'
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
  AND a.active = true  -- Changed from application_status = 'approved'
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
-- SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Directory views updated to use active field!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Materialized views now filter by active=true instead of application_status=approved';
  RAISE NOTICE '  - Agencies with active=true will now appear in directories';
  RAISE NOTICE '  - Added active index to all views for better performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Verify:';
  RAISE NOTICE '  SELECT COUNT(*) FROM agencies_browse_v;  -- Should show active agencies';
  RAISE NOTICE '  SELECT COUNT(*) FROM dmcs_browse_v;';
  RAISE NOTICE '  SELECT COUNT(*) FROM transport_browse_v;';
END $$;

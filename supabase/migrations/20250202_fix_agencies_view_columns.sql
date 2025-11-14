-- Fix agencies materialized views to use correct column names
-- The views were selecting wrong columns (languages, specialties, website)
-- Should be selecting (languages_supported, services_offered, website_url)

-- ============================================================
-- FIX: agencies_browse_v
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS agencies_browse_v CASCADE;

CREATE MATERIALIZED VIEW agencies_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  COALESCE(a.languages_supported, ARRAY[]::text[]) as languages,  -- FIXED: was a.languages, with NULL protection
  COALESCE(a.services_offered, ARRAY[]::text[]) as specialties,    -- FIXED: was a.specialties, with NULL protection
  a.logo_url,
  a.website_url as website,             -- FIXED: was a.website
  a.description,
  a.verified,
  a.featured,
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
  AND a.application_status = 'approved'
  AND a.deleted_at IS NULL;

-- Recreate indexes
CREATE UNIQUE INDEX agencies_browse_v_id_idx ON agencies_browse_v(id);
CREATE INDEX agencies_browse_v_country_idx ON agencies_browse_v(country_code);
CREATE INDEX agencies_browse_v_sort_idx ON agencies_browse_v(sort_key DESC, name);
CREATE INDEX agencies_browse_v_rating_idx ON agencies_browse_v(rating DESC);
CREATE INDEX agencies_browse_v_search_idx ON agencies_browse_v USING gin(search_text);
CREATE INDEX agencies_browse_v_languages_idx ON agencies_browse_v USING gin(languages);
CREATE INDEX agencies_browse_v_specialties_idx ON agencies_browse_v USING gin(specialties);

-- ============================================================
-- FIX: dmcs_browse_v
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS dmcs_browse_v CASCADE;

CREATE MATERIALIZED VIEW dmcs_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  COALESCE(a.languages_supported, ARRAY[]::text[]) as languages,  -- FIXED: was a.languages, with NULL protection
  COALESCE(a.services_offered, ARRAY[]::text[]) as specialties,    -- FIXED: was a.specialties, with NULL protection
  a.logo_url,
  a.website_url as website,             -- FIXED: was a.website
  a.description,
  a.verified,
  a.featured,
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
  AND a.application_status = 'approved'
  AND a.deleted_at IS NULL;

-- Recreate indexes
CREATE UNIQUE INDEX dmcs_browse_v_id_idx ON dmcs_browse_v(id);
CREATE INDEX dmcs_browse_v_country_idx ON dmcs_browse_v(country_code);
CREATE INDEX dmcs_browse_v_sort_idx ON dmcs_browse_v(sort_key DESC, name);
CREATE INDEX dmcs_browse_v_rating_idx ON dmcs_browse_v(rating DESC);
CREATE INDEX dmcs_browse_v_search_idx ON dmcs_browse_v USING gin(search_text);
CREATE INDEX dmcs_browse_v_languages_idx ON dmcs_browse_v USING gin(languages);
CREATE INDEX dmcs_browse_v_specialties_idx ON dmcs_browse_v USING gin(specialties);

-- ============================================================
-- FIX: transport_browse_v
-- ============================================================
DROP MATERIALIZED VIEW IF EXISTS transport_browse_v CASCADE;

CREATE MATERIALIZED VIEW transport_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  COALESCE(a.languages_supported, ARRAY[]::text[]) as languages,  -- FIXED: was a.languages, with NULL protection
  COALESCE(a.services_offered, ARRAY[]::text[]) as specialties,    -- FIXED: was a.specialties, with NULL protection
  a.logo_url,
  a.website_url as website,             -- FIXED: was a.website
  a.description,
  a.verified,
  a.featured,
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
  AND a.application_status = 'approved'
  AND a.deleted_at IS NULL;

-- Recreate indexes
CREATE UNIQUE INDEX transport_browse_v_id_idx ON transport_browse_v(id);
CREATE INDEX transport_browse_v_country_idx ON transport_browse_v(country_code);
CREATE INDEX transport_browse_v_sort_idx ON transport_browse_v(sort_key DESC, name);
CREATE INDEX transport_browse_v_rating_idx ON transport_browse_v(rating DESC);
CREATE INDEX transport_browse_v_search_idx ON transport_browse_v USING gin(search_text);
CREATE INDEX transport_browse_v_languages_idx ON transport_browse_v USING gin(languages);
CREATE INDEX transport_browse_v_specialties_idx ON transport_browse_v USING gin(specialties);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed all materialized views to use correct column names:';
  RAISE NOTICE '   - languages_supported → languages';
  RAISE NOTICE '   - services_offered → specialties';
  RAISE NOTICE '   - website_url → website';
  RAISE NOTICE '';
  RAISE NOTICE 'Views recreated:';
  RAISE NOTICE '   - agencies_browse_v: % rows', (SELECT COUNT(*) FROM agencies_browse_v);
  RAISE NOTICE '   - dmcs_browse_v: % rows', (SELECT COUNT(*) FROM dmcs_browse_v);
  RAISE NOTICE '   - transport_browse_v: % rows', (SELECT COUNT(*) FROM transport_browse_v);
END $$;

-- ============================================================
-- Add name_english to agencies directory materialized views
-- ============================================================

-- Drop existing materialized views
DROP MATERIALIZED VIEW IF EXISTS agencies_browse_v CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dmcs_browse_v CASCADE;
DROP MATERIALIZED VIEW IF EXISTS transport_browse_v CASCADE;

-- ============================================================
-- MATERIALIZED VIEW: agencies_browse_v (with name_english)
-- ============================================================
CREATE MATERIALIZED VIEW agencies_browse_v AS
SELECT
  a.id,
  a.name,
  a.name_english,  -- Add English name
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
  to_tsvector('simple', unaccent(
    COALESCE(a.name, '') || ' ' ||
    COALESCE(a.name_english, '') || ' ' ||
    COALESCE(a.description, '')
  )) as search_text,
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
  AND a.active = true
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
-- MATERIALIZED VIEW: dmcs_browse_v (with name_english)
-- ============================================================
CREATE MATERIALIZED VIEW dmcs_browse_v AS
SELECT
  a.id,
  a.name,
  a.name_english,  -- Add English name
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
  to_tsvector('simple', unaccent(
    COALESCE(a.name, '') || ' ' ||
    COALESCE(a.name_english, '') || ' ' ||
    COALESCE(a.description, '')
  )) as search_text,
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
  AND a.active = true
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
-- MATERIALIZED VIEW: transport_browse_v (with name_english)
-- ============================================================
CREATE MATERIALIZED VIEW transport_browse_v AS
SELECT
  a.id,
  a.name,
  a.name_english,  -- Add English name
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
  to_tsvector('simple', unaccent(
    COALESCE(a.name, '') || ' ' ||
    COALESCE(a.name_english, '') || ' ' ||
    COALESCE(a.description, '')
  )) as search_text,
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
  AND a.active = true
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
-- UPDATE RPC FUNCTIONS TO INCLUDE name_english
-- ============================================================
CREATE OR REPLACE FUNCTION api_agencies_search(
  p_country text DEFAULT NULL,
  p_languages text[] DEFAULT NULL,
  p_specialties text[] DEFAULT NULL,
  p_niche_focus text[] DEFAULT NULL,
  p_q text DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_license_only boolean DEFAULT false,
  p_sort text DEFAULT 'featured',
  p_cursor text DEFAULT NULL,
  p_limit int DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_results jsonb;
  v_facets jsonb;
  v_cursor_name text;
  v_cursor_sort_key bigint;
BEGIN
  -- Parse cursor if provided
  IF p_cursor IS NOT NULL AND p_cursor != '' THEN
    v_cursor_name := split_part(p_cursor, '|', 1);
    v_cursor_sort_key := split_part(p_cursor, '|', 2)::bigint;
  END IF;

  -- Build results
  WITH filtered AS (
    SELECT *
    FROM agencies_browse_v v
    WHERE (p_country IS NULL OR v.country_code = p_country)
      AND (p_languages IS NULL OR v.languages && p_languages)
      AND (p_specialties IS NULL OR v.specialties && p_specialties)
      AND (p_q IS NULL OR v.search_text @@ plainto_tsquery('simple', unaccent(p_q)))
      AND (p_min_rating IS NULL OR v.rating >= p_min_rating)
      AND (NOT p_license_only OR v.verified = true)
      AND (p_cursor IS NULL OR (v.sort_key, v.name) < (v_cursor_sort_key, v_cursor_name))
    ORDER BY v.sort_key DESC, v.name
    LIMIT p_limit + 1
  ),
  results_with_next AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'id', f.id,
          'name', f.name,
          'name_english', f.name_english,  -- Include English name
          'country', f.country_code,
          'languages', f.languages,
          'specialties', f.specialties,
          'logoUrl', f.logo_url,
          'websiteUrl', f.website,
          'description', f.description,
          'verified', f.verified,
          'rating', ROUND(f.rating::numeric, 2),
          'reviewCount', f.review_count
        )
        ORDER BY f.sort_key DESC, f.name
      ) FILTER (WHERE rn <= p_limit) as results,
      CASE
        WHEN COUNT(*) > p_limit THEN
          (SELECT f2.name || '|' || f2.sort_key::text
           FROM filtered f2
           ORDER BY f2.sort_key DESC, f2.name
           OFFSET p_limit LIMIT 1)
        ELSE NULL
      END as next_cursor
    FROM (
      SELECT *, ROW_NUMBER() OVER (ORDER BY sort_key DESC, name) as rn
      FROM filtered
    ) f
  )
  SELECT jsonb_build_object(
    'results', COALESCE(r.results, '[]'::jsonb),
    'nextCursor', r.next_cursor
  )
  INTO v_results
  FROM results_with_next r;

  -- Build facets
  WITH base AS (
    SELECT *
    FROM agencies_browse_v v
    WHERE (p_country IS NULL OR v.country_code = p_country)
  )
  SELECT jsonb_build_object(
    'languages', (
      SELECT jsonb_object_agg(lang, cnt)
      FROM (
        SELECT UNNEST(languages) as lang, COUNT(*) as cnt
        FROM base
        GROUP BY lang
        ORDER BY cnt DESC
        LIMIT 50
      ) x
    ),
    'specialties', (
      SELECT jsonb_object_agg(specialty, cnt)
      FROM (
        SELECT UNNEST(specialties) as specialty, COUNT(*) as cnt
        FROM base
        GROUP BY specialty
        ORDER BY cnt DESC
        LIMIT 50
      ) x
    ),
    'total', (SELECT COUNT(*) FROM base)
  ) INTO v_facets;

  -- Return combined response
  RETURN v_results || jsonb_build_object('facets', v_facets);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION api_agencies_search TO anon, authenticated;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
DO $$
DECLARE
  v_agencies_count int;
  v_agencies_with_english int;
BEGIN
  SELECT COUNT(*) INTO v_agencies_count FROM agencies_browse_v WHERE country_code = 'VN';
  SELECT COUNT(*) INTO v_agencies_with_english FROM agencies_browse_v WHERE country_code = 'VN' AND name_english IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION COMPLETED: Added name_english to directory views';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Added name_english column to all browse views';
  RAISE NOTICE '  - Updated search_text to include English names';
  RAISE NOTICE '  - Updated api_agencies_search to return name_english';
  RAISE NOTICE '';
  RAISE NOTICE 'Vietnamese Agencies:';
  RAISE NOTICE '  - Total: %', v_agencies_count;
  RAISE NOTICE '  - With English names: %', v_agencies_with_english;
  RAISE NOTICE '';
END $$;

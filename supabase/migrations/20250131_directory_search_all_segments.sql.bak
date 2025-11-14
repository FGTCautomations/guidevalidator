-- Create materialized views and search functions for Agencies, DMCs, and Transport
-- Following the same pattern as guides_browse_v

-- ============================================================================
-- AGENCIES BROWSE VIEW & SEARCH
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agencies_browse_v AS
SELECT
  a.id,
  p.full_name as name,
  a.languages,
  a.specialties,
  a.logo_url,
  a.website_url,
  a.registration_country as country_code,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  (
    CASE
      WHEN a.license_verified THEN 50
      ELSE 0
    END
  )::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(p.full_name, ''))) as search_text
FROM agencies a
INNER JOIN profiles p ON a.profile_id = p.id
LEFT JOIN LATERAL (
  SELECT
    AVG(r.overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM profile_reviews r
  WHERE r.reviewee_id = p.id
) pr ON true
WHERE p.application_status = 'approved';

CREATE UNIQUE INDEX IF NOT EXISTS agencies_browse_v_id_idx ON agencies_browse_v(id);
CREATE INDEX IF NOT EXISTS agencies_browse_v_country_idx ON agencies_browse_v(country_code);
CREATE INDEX IF NOT EXISTS agencies_browse_v_languages_idx ON agencies_browse_v USING GIN(languages);
CREATE INDEX IF NOT EXISTS agencies_browse_v_specialties_idx ON agencies_browse_v USING GIN(specialties);
CREATE INDEX IF NOT EXISTS agencies_browse_v_search_idx ON agencies_browse_v USING GIN(search_text);
CREATE INDEX IF NOT EXISTS agencies_browse_v_sort_idx ON agencies_browse_v(sort_key DESC, id DESC);

-- Conditional indexes for coverage tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'dmc_countries') THEN
    CREATE INDEX IF NOT EXISTS idx_dmc_countries_agency_country ON dmc_countries(agency_id, country_code);
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'dmc_regions') THEN
    CREATE INDEX IF NOT EXISTS idx_dmc_regions_agency_region ON dmc_regions(agency_id, region_id);
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'dmc_cities') THEN
    CREATE INDEX IF NOT EXISTS idx_dmc_cities_agency_city ON dmc_cities(agency_id, city_id);
  END IF;
END $$;

-- Agency search RPC function
CREATE OR REPLACE FUNCTION api_agencies_search(
  p_country text,
  p_region_id uuid DEFAULT NULL,
  p_city_id uuid DEFAULT NULL,
  p_languages text[] DEFAULT NULL,
  p_specialties text[] DEFAULT NULL,
  p_niche_focus text[] DEFAULT NULL,
  p_q text DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_license_only boolean DEFAULT false,
  p_sort text DEFAULT 'featured',
  p_after_cursor text DEFAULT NULL,
  p_limit int DEFAULT 24
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_q tsquery;
  v_location_filter uuid[];
  v_has_location_tables boolean := false;
  v_results json;
  v_cursor_sort_key bigint;
  v_cursor_id text;
BEGIN
  IF p_q IS NOT NULL AND p_q != '' THEN
    v_q := plainto_tsquery('simple', unaccent(p_q));
  END IF;

  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('dmc_regions', 'dmc_cities')
  ) INTO v_has_location_tables;

  IF v_has_location_tables THEN
    IF p_region_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(agency_id) FROM dmc_regions WHERE region_id = $1'
      INTO v_location_filter
      USING p_region_id;
    ELSIF p_city_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(agency_id) FROM dmc_cities WHERE city_id = $1'
      INTO v_location_filter
      USING p_city_id;
    END IF;
  END IF;

  IF p_after_cursor IS NOT NULL THEN
    v_cursor_sort_key := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 1)::bigint;
    v_cursor_id := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 2);
  END IF;

  WITH base AS (
    SELECT
      id, name, logo_url, website_url, country_code,
      languages, specialties,
      rating, review_count,
      CASE p_sort
        WHEN 'rating' THEN (1000 - COALESCE(rating * 100, 0))::bigint
        ELSE sort_key
      END as sort_key
    FROM agencies_browse_v a
    WHERE country_code = UPPER(p_country)
      AND (v_location_filter IS NULL OR id = ANY(v_location_filter))
      AND (p_languages IS NULL OR languages @> p_languages)
      AND (p_specialties IS NULL OR specialties && p_specialties)
      AND (p_niche_focus IS NULL OR specialties && p_niche_focus)
      AND (p_min_rating IS NULL OR rating >= p_min_rating)
      AND (v_q IS NULL OR search_text @@ v_q)
  ),

  paged AS (
    SELECT *
    FROM base
    WHERE (
      p_after_cursor IS NULL
      OR (sort_key, id::text) < (v_cursor_sort_key, v_cursor_id)
    )
    ORDER BY sort_key DESC, id DESC
    LIMIT p_limit
  ),

  results_agg AS (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'logo_url', logo_url,
        'website_url', website_url,
        'country_code', country_code,
        'languages', languages,
        'specialties', specialties,
        'rating', rating,
        'review_count', review_count
      )
      ORDER BY sort_key DESC, id DESC
    ) as data
    FROM paged
  ),

  lang_facets AS (
    SELECT json_agg(
      json_build_object('value', lang, 'count', cnt)
      ORDER BY cnt DESC
    ) as data
    FROM (
      SELECT UNNEST(languages) as lang, COUNT(*) as cnt
      FROM base
      GROUP BY lang
      ORDER BY cnt DESC
      LIMIT 50
    ) f
  ),

  spec_facets AS (
    SELECT json_agg(
      json_build_object('value', spec, 'count', cnt)
      ORDER BY cnt DESC
    ) as data
    FROM (
      SELECT UNNEST(specialties) as spec, COUNT(*) as cnt
      FROM base
      WHERE specialties IS NOT NULL AND array_length(specialties, 1) > 0
      GROUP BY spec
      ORDER BY cnt DESC
      LIMIT 50
    ) f
  ),

  total_ct AS (
    SELECT COUNT(*) as total FROM base
  ),

  last_row AS (
    SELECT
      sort_key,
      id::text as id_text,
      COUNT(*) OVER () as page_count
    FROM paged
    ORDER BY sort_key ASC, id ASC
    LIMIT 1
  )

  SELECT json_build_object(
    'results', COALESCE((SELECT data FROM results_agg), '[]'::json),
    'facets', json_build_object(
      'languages', COALESCE((SELECT data FROM lang_facets), '[]'::json),
      'specialties', COALESCE((SELECT data FROM spec_facets), '[]'::json),
      'total', (SELECT total FROM total_ct)
    ),
    'nextCursor',
      CASE
        WHEN (SELECT page_count FROM last_row) = p_limit THEN
          encode(
            convert_to(
              (SELECT sort_key FROM last_row)::text || ':' || (SELECT id_text FROM last_row),
              'UTF8'
            ),
            'base64'
          )
        ELSE NULL
      END
  ) INTO v_results;

  RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION api_agencies_search TO anon, authenticated;

-- ============================================================================
-- DMCS BROWSE VIEW & SEARCH
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS dmcs_browse_v AS
SELECT
  a.id,
  p.full_name as name,
  a.languages,
  a.specialties,
  a.logo_url,
  a.website_url,
  a.registration_country as country_code,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  (
    CASE
      WHEN a.license_verified THEN 50
      ELSE 0
    END
  )::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(p.full_name, ''))) as search_text
FROM agencies a
INNER JOIN profiles p ON a.profile_id = p.id
LEFT JOIN LATERAL (
  SELECT
    AVG(r.overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM profile_reviews r
  WHERE r.reviewee_id = p.id
) pr ON true
WHERE p.application_status = 'approved'
  AND p.role = 'dmc';

CREATE UNIQUE INDEX IF NOT EXISTS dmcs_browse_v_id_idx ON dmcs_browse_v(id);
CREATE INDEX IF NOT EXISTS dmcs_browse_v_country_idx ON dmcs_browse_v(country_code);
CREATE INDEX IF NOT EXISTS dmcs_browse_v_languages_idx ON dmcs_browse_v USING GIN(languages);
CREATE INDEX IF NOT EXISTS dmcs_browse_v_specialties_idx ON dmcs_browse_v USING GIN(specialties);
CREATE INDEX IF NOT EXISTS dmcs_browse_v_search_idx ON dmcs_browse_v USING GIN(search_text);
CREATE INDEX IF NOT EXISTS dmcs_browse_v_sort_idx ON dmcs_browse_v(sort_key DESC, id DESC);

-- DMC search RPC function
CREATE OR REPLACE FUNCTION api_dmcs_search(
  p_country text,
  p_region_id uuid DEFAULT NULL,
  p_city_id uuid DEFAULT NULL,
  p_languages text[] DEFAULT NULL,
  p_specializations text[] DEFAULT NULL,
  p_services text[] DEFAULT NULL,
  p_q text DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_license_only boolean DEFAULT false,
  p_sort text DEFAULT 'featured',
  p_after_cursor text DEFAULT NULL,
  p_limit int DEFAULT 24
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_q tsquery;
  v_location_filter uuid[];
  v_has_location_tables boolean := false;
  v_results json;
  v_cursor_sort_key bigint;
  v_cursor_id text;
BEGIN
  IF p_q IS NOT NULL AND p_q != '' THEN
    v_q := plainto_tsquery('simple', unaccent(p_q));
  END IF;

  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('dmc_regions', 'dmc_cities')
  ) INTO v_has_location_tables;

  IF v_has_location_tables THEN
    IF p_region_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(agency_id) FROM dmc_regions WHERE region_id = $1'
      INTO v_location_filter
      USING p_region_id;
    ELSIF p_city_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(agency_id) FROM dmc_cities WHERE city_id = $1'
      INTO v_location_filter
      USING p_city_id;
    END IF;
  END IF;

  IF p_after_cursor IS NOT NULL THEN
    v_cursor_sort_key := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 1)::bigint;
    v_cursor_id := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 2);
  END IF;

  WITH base AS (
    SELECT
      id, name, logo_url, website_url, country_code,
      languages, specialties,
      rating, review_count,
      CASE p_sort
        WHEN 'rating' THEN (1000 - COALESCE(rating * 100, 0))::bigint
        ELSE sort_key
      END as sort_key
    FROM dmcs_browse_v d
    WHERE country_code = UPPER(p_country)
      AND (v_location_filter IS NULL OR id = ANY(v_location_filter))
      AND (p_languages IS NULL OR languages @> p_languages)
      AND (p_specializations IS NULL OR specialties && p_specializations)
      AND (p_services IS NULL OR specialties && p_services)
      AND (p_min_rating IS NULL OR rating >= p_min_rating)
      AND (v_q IS NULL OR search_text @@ v_q)
  ),

  paged AS (
    SELECT *
    FROM base
    WHERE (
      p_after_cursor IS NULL
      OR (sort_key, id::text) < (v_cursor_sort_key, v_cursor_id)
    )
    ORDER BY sort_key DESC, id DESC
    LIMIT p_limit
  ),

  results_agg AS (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'logo_url', logo_url,
        'website_url', website_url,
        'country_code', country_code,
        'languages', languages,
        'specialties', specialties,
        'rating', rating,
        'review_count', review_count
      )
      ORDER BY sort_key DESC, id DESC
    ) as data
    FROM paged
  ),

  lang_facets AS (
    SELECT json_agg(
      json_build_object('value', lang, 'count', cnt)
      ORDER BY cnt DESC
    ) as data
    FROM (
      SELECT UNNEST(languages) as lang, COUNT(*) as cnt
      FROM base
      GROUP BY lang
      ORDER BY cnt DESC
      LIMIT 50
    ) f
  ),

  spec_facets AS (
    SELECT json_agg(
      json_build_object('value', spec, 'count', cnt)
      ORDER BY cnt DESC
    ) as data
    FROM (
      SELECT UNNEST(specialties) as spec, COUNT(*) as cnt
      FROM base
      WHERE specialties IS NOT NULL AND array_length(specialties, 1) > 0
      GROUP BY spec
      ORDER BY cnt DESC
      LIMIT 50
    ) f
  ),

  total_ct AS (
    SELECT COUNT(*) as total FROM base
  ),

  last_row AS (
    SELECT
      sort_key,
      id::text as id_text,
      COUNT(*) OVER () as page_count
    FROM paged
    ORDER BY sort_key ASC, id ASC
    LIMIT 1
  )

  SELECT json_build_object(
    'results', COALESCE((SELECT data FROM results_agg), '[]'::json),
    'facets', json_build_object(
      'languages', COALESCE((SELECT data FROM lang_facets), '[]'::json),
      'specializations', COALESCE((SELECT data FROM spec_facets), '[]'::json),
      'total', (SELECT total FROM total_ct)
    ),
    'nextCursor',
      CASE
        WHEN (SELECT page_count FROM last_row) = p_limit THEN
          encode(
            convert_to(
              (SELECT sort_key FROM last_row)::text || ':' || (SELECT id_text FROM last_row),
              'UTF8'
            ),
            'base64'
          )
        ELSE NULL
      END
  ) INTO v_results;

  RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION api_dmcs_search TO anon, authenticated;

-- ============================================================================
-- TRANSPORT BROWSE VIEW & SEARCH
-- ============================================================================

-- First, check if transport_providers table exists, if not assume it's in profiles with role='transport'
CREATE MATERIALIZED VIEW IF NOT EXISTS transport_browse_v AS
SELECT
  p.id,
  p.full_name as name,
  COALESCE(t.languages, '{}') as languages,
  COALESCE(t.service_types, '{}') as service_types,
  t.logo_url,
  t.website_url,
  t.registration_country as country_code,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  (
    CASE
      WHEN t.license_verified THEN 50
      ELSE 0
    END
  )::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(p.full_name, ''))) as search_text
FROM profiles p
LEFT JOIN transport_providers t ON t.profile_id = p.id
LEFT JOIN LATERAL (
  SELECT
    AVG(r.overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM profile_reviews r
  WHERE r.reviewee_id = p.id
) pr ON true
WHERE p.application_status = 'approved'
  AND p.role = 'transport';

CREATE UNIQUE INDEX IF NOT EXISTS transport_browse_v_id_idx ON transport_browse_v(id);
CREATE INDEX IF NOT EXISTS transport_browse_v_country_idx ON transport_browse_v(country_code);
CREATE INDEX IF NOT EXISTS transport_browse_v_languages_idx ON transport_browse_v USING GIN(languages);
CREATE INDEX IF NOT EXISTS transport_browse_v_service_types_idx ON transport_browse_v USING GIN(service_types);
CREATE INDEX IF NOT EXISTS transport_browse_v_search_idx ON transport_browse_v USING GIN(search_text);
CREATE INDEX IF NOT EXISTS transport_browse_v_sort_idx ON transport_browse_v(sort_key DESC, id DESC);

-- Conditional indexes for transport coverage tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transport_countries') THEN
    CREATE INDEX IF NOT EXISTS idx_transport_countries_provider_country ON transport_countries(provider_id, country_code);
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transport_regions') THEN
    CREATE INDEX IF NOT EXISTS idx_transport_regions_provider_region ON transport_regions(provider_id, region_id);
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transport_cities') THEN
    CREATE INDEX IF NOT EXISTS idx_transport_cities_provider_city ON transport_cities(provider_id, city_id);
  END IF;
END $$;

-- Transport search RPC function
CREATE OR REPLACE FUNCTION api_transport_search(
  p_country text,
  p_region_id uuid DEFAULT NULL,
  p_city_id uuid DEFAULT NULL,
  p_languages text[] DEFAULT NULL,
  p_service_types text[] DEFAULT NULL,
  p_q text DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_license_only boolean DEFAULT false,
  p_sort text DEFAULT 'featured',
  p_after_cursor text DEFAULT NULL,
  p_limit int DEFAULT 24
) RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_q tsquery;
  v_location_filter uuid[];
  v_has_location_tables boolean := false;
  v_results json;
  v_cursor_sort_key bigint;
  v_cursor_id text;
BEGIN
  IF p_q IS NOT NULL AND p_q != '' THEN
    v_q := plainto_tsquery('simple', unaccent(p_q));
  END IF;

  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('transport_regions', 'transport_cities')
  ) INTO v_has_location_tables;

  IF v_has_location_tables THEN
    IF p_region_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(provider_id) FROM transport_regions WHERE region_id = $1'
      INTO v_location_filter
      USING p_region_id;
    ELSIF p_city_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(provider_id) FROM transport_cities WHERE city_id = $1'
      INTO v_location_filter
      USING p_city_id;
    END IF;
  END IF;

  IF p_after_cursor IS NOT NULL THEN
    v_cursor_sort_key := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 1)::bigint;
    v_cursor_id := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 2);
  END IF;

  WITH base AS (
    SELECT
      id, name, logo_url, website_url, country_code,
      languages, service_types,
      rating, review_count,
      CASE p_sort
        WHEN 'rating' THEN (1000 - COALESCE(rating * 100, 0))::bigint
        ELSE sort_key
      END as sort_key
    FROM transport_browse_v t
    WHERE country_code = UPPER(p_country)
      AND (v_location_filter IS NULL OR id = ANY(v_location_filter))
      AND (p_languages IS NULL OR languages @> p_languages)
      AND (p_service_types IS NULL OR service_types && p_service_types)
      AND (p_min_rating IS NULL OR rating >= p_min_rating)
      AND (v_q IS NULL OR search_text @@ v_q)
  ),

  paged AS (
    SELECT *
    FROM base
    WHERE (
      p_after_cursor IS NULL
      OR (sort_key, id::text) < (v_cursor_sort_key, v_cursor_id)
    )
    ORDER BY sort_key DESC, id DESC
    LIMIT p_limit
  ),

  results_agg AS (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'logo_url', logo_url,
        'website_url', website_url,
        'country_code', country_code,
        'languages', languages,
        'service_types', service_types,
        'rating', rating,
        'review_count', review_count
      )
      ORDER BY sort_key DESC, id DESC
    ) as data
    FROM paged
  ),

  lang_facets AS (
    SELECT json_agg(
      json_build_object('value', lang, 'count', cnt)
      ORDER BY cnt DESC
    ) as data
    FROM (
      SELECT UNNEST(languages) as lang, COUNT(*) as cnt
      FROM base
      GROUP BY lang
      ORDER BY cnt DESC
      LIMIT 50
    ) f
  ),

  service_facets AS (
    SELECT json_agg(
      json_build_object('value', svc, 'count', cnt)
      ORDER BY cnt DESC
    ) as data
    FROM (
      SELECT UNNEST(service_types) as svc, COUNT(*) as cnt
      FROM base
      WHERE service_types IS NOT NULL AND array_length(service_types, 1) > 0
      GROUP BY svc
      ORDER BY cnt DESC
      LIMIT 50
    ) f
  ),

  total_ct AS (
    SELECT COUNT(*) as total FROM base
  ),

  last_row AS (
    SELECT
      sort_key,
      id::text as id_text,
      COUNT(*) OVER () as page_count
    FROM paged
    ORDER BY sort_key ASC, id ASC
    LIMIT 1
  )

  SELECT json_build_object(
    'results', COALESCE((SELECT data FROM results_agg), '[]'::json),
    'facets', json_build_object(
      'languages', COALESCE((SELECT data FROM lang_facets), '[]'::json),
      'serviceTypes', COALESCE((SELECT data FROM service_facets), '[]'::json),
      'total', (SELECT total FROM total_ct)
    ),
    'nextCursor',
      CASE
        WHEN (SELECT page_count FROM last_row) = p_limit THEN
          encode(
            convert_to(
              (SELECT sort_key FROM last_row)::text || ':' || (SELECT id_text FROM last_row),
              'UTF8'
            ),
            'base64'
          )
        ELSE NULL
      END
  ) INTO v_results;

  RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION api_transport_search TO anon, authenticated;

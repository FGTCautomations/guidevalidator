-- ============================================
-- Guide Search Optimization Migration (FIXED)
-- Performance-optimized faceted search with cursor pagination
-- Adapted for actual schema (no guide_regions/guide_cities tables)
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 2. MATERIALIZED VIEW FOR PUBLIC GUIDE BROWSING
-- ============================================

-- Drop existing view if it exists (safe to recreate)
DROP MATERIALIZED VIEW IF EXISTS guides_browse_v CASCADE;

-- Create optimized view combining guides + profiles data
-- This view exposes ONLY non-PII fields for public directory browsing
CREATE MATERIALIZED VIEW guides_browse_v AS
SELECT
  g.profile_id as id,
  p.full_name as name,
  g.headline,
  p.country_code,
  p.avatar_url,
  g.spoken_languages as languages,
  g.specialties,
  p.verified,
  p.license_verified,
  g.has_liability_insurance,
  g.gender,
  g.hourly_rate_cents as price_cents,
  g.currency,
  g.response_time_minutes,

  -- Computed fields
  CASE
    WHEN g.specialties @> ARRAY['family-friendly']::text[] THEN true
    ELSE false
  END as child_friendly,

  -- Rating data (joined from profile_ratings view)
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.total_reviews, 0) as review_count,

  -- Full-text search vector (combining name + headline)
  -- Note: bio field might not exist, so we'll omit it
  to_tsvector('simple',
    unaccent(COALESCE(p.full_name, '')) || ' ' ||
    unaccent(COALESCE(g.headline, ''))
  ) as search_text,

  -- Application status for filtering
  p.application_status,
  p.rejection_reason

FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
LEFT JOIN profile_ratings pr ON g.profile_id = pr.reviewee_id

-- Only include approved, non-frozen guides
WHERE p.application_status = 'approved'
  AND (p.rejection_reason IS NULL OR NOT p.rejection_reason LIKE 'FROZEN:%');

-- Create unique index for fast lookups and refreshes
CREATE UNIQUE INDEX idx_guides_browse_v_id ON guides_browse_v(id);

-- ============================================
-- 3. OPTIMIZED INDEXES
-- ============================================

-- Core filtering indexes
CREATE INDEX IF NOT EXISTS idx_guides_browse_country
  ON guides_browse_v(country_code)
  WHERE verified = true;

CREATE INDEX IF NOT EXISTS idx_guides_browse_verified_country
  ON guides_browse_v(verified, country_code, license_verified);

-- Array indexes for languages and specialties (GIN for contains operations)
CREATE INDEX IF NOT EXISTS idx_guides_browse_languages
  ON guides_browse_v USING GIN(languages);

CREATE INDEX IF NOT EXISTS idx_guides_browse_specialties
  ON guides_browse_v USING GIN(specialties);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_guides_browse_search
  ON guides_browse_v USING GIN(search_text);

-- Price range index
CREATE INDEX IF NOT EXISTS idx_guides_browse_price
  ON guides_browse_v(price_cents)
  WHERE price_cents IS NOT NULL;

-- Rating sorting index
CREATE INDEX IF NOT EXISTS idx_guides_browse_rating
  ON guides_browse_v(rating DESC, id)
  WHERE rating > 0;

-- Gender filter index
CREATE INDEX IF NOT EXISTS idx_guides_browse_gender
  ON guides_browse_v(gender)
  WHERE gender IS NOT NULL;

-- Hot-path partial index for Vietnam verified guides (your largest segment)
CREATE INDEX IF NOT EXISTS idx_guides_browse_vn_verified
  ON guides_browse_v(rating DESC, id)
  WHERE verified = true AND country_code = 'VN';

-- ============================================
-- 4. LOCATION INDEXES (only if tables exist)
-- ============================================

-- Check if guide_regions table exists and create index
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guide_regions') THEN
    CREATE INDEX IF NOT EXISTS idx_guide_regions_guide_region
      ON guide_regions(guide_id, region_id);
    RAISE NOTICE 'Created index on guide_regions table';
  ELSE
    RAISE NOTICE 'Skipping guide_regions index - table does not exist';
  END IF;
END $$;

-- Check if guide_cities table exists and create index
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guide_cities') THEN
    CREATE INDEX IF NOT EXISTS idx_guide_cities_guide_city
      ON guide_cities(guide_id, city_id);
    RAISE NOTICE 'Created index on guide_cities table';
  ELSE
    RAISE NOTICE 'Skipping guide_cities index - table does not exist';
  END IF;
END $$;

-- ============================================
-- 5. RPC FUNCTION FOR FACETED SEARCH
-- ============================================

CREATE OR REPLACE FUNCTION api_guides_search(
  p_country text,
  p_region_id uuid DEFAULT NULL,
  p_city_id uuid DEFAULT NULL,
  p_languages text[] DEFAULT NULL,
  p_specialties text[] DEFAULT NULL,
  p_genders text[] DEFAULT NULL,
  p_q text DEFAULT NULL,
  p_price_min int DEFAULT NULL,
  p_price_max int DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_verified_only boolean DEFAULT false,
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
  v_results json;
  v_facets json;
  v_next_cursor text;
  v_location_filter text[];
  v_has_location_tables boolean;
BEGIN
  -- Validate and cap limit
  p_limit := LEAST(p_limit, 48);

  -- Build text search query
  IF p_q IS NOT NULL AND LENGTH(TRIM(p_q)) > 0 THEN
    v_q := plainto_tsquery('simple', unaccent(p_q));
  ELSE
    v_q := NULL;
  END IF;

  -- Check if location tables exist
  SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('guide_regions', 'guide_cities')
  ) INTO v_has_location_tables;

  -- Get location-filtered guide IDs if region or city specified AND tables exist
  IF v_has_location_tables THEN
    IF p_region_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(guide_id) FROM guide_regions WHERE region_id = $1'
      INTO v_location_filter
      USING p_region_id;
    ELSIF p_city_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(guide_id) FROM guide_cities WHERE city_id = $1'
      INTO v_location_filter
      USING p_city_id;
    END IF;
  END IF;

  -- Build filtered result set with sorting
  WITH base AS (
    SELECT
      id, name, headline, country_code, avatar_url,
      languages, specialties, verified, license_verified,
      has_liability_insurance, child_friendly, gender,
      price_cents, currency, response_time_minutes,
      rating, review_count,

      -- Compute sort key based on requested sort
      CASE p_sort
        WHEN 'price' THEN price_cents::bigint
        WHEN 'rating' THEN (1000 - COALESCE(rating * 100, 0))::bigint
        WHEN 'experience' THEN 0::bigint -- Placeholder for future experience field
        ELSE (
          -- Featured score: license_verified (100) + verified (50) + insurance (25) + rating (0-50)
          (CASE WHEN license_verified THEN 100 ELSE 0 END +
           CASE WHEN verified THEN 50 ELSE 0 END +
           CASE WHEN has_liability_insurance THEN 25 ELSE 0 END +
           LEAST(COALESCE(rating * 10, 0)::int, 50))
        )::bigint
      END as sort_key

    FROM guides_browse_v g
    WHERE country_code = UPPER(p_country)
      -- Location filter (only applies if location tables exist and filter is set)
      AND (v_location_filter IS NULL OR id = ANY(v_location_filter))
      -- Language filter (contains all specified languages)
      AND (p_languages IS NULL OR languages @> p_languages)
      -- Specialty filter (overlaps with any specified specialty)
      AND (p_specialties IS NULL OR specialties && p_specialties)
      -- Gender filter
      AND (p_genders IS NULL OR gender = ANY(p_genders))
      -- Text search
      AND (v_q IS NULL OR search_text @@ v_q)
      -- Price range
      AND (p_price_min IS NULL OR price_cents >= p_price_min * 100)
      AND (p_price_max IS NULL OR price_cents <= p_price_max * 100)
      -- Rating minimum
      AND (p_min_rating IS NULL OR rating >= p_min_rating)
      -- Verification filters
      AND (NOT p_verified_only OR verified = true)
      AND (NOT p_license_only OR license_verified = true)
  ),

  -- Paginate with cursor (keyset pagination)
  paged AS (
    SELECT *
    FROM base
    WHERE (
      p_after_cursor IS NULL
      OR (
        -- Decode cursor: format is "sortkey:id"
        sort_key,
        id::text
      ) > (
        SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 1)::bigint,
        SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 2)
      )
    )
    ORDER BY
      CASE WHEN p_sort = 'rating' THEN sort_key END ASC,
      CASE WHEN p_sort = 'price' THEN sort_key END ASC,
      CASE WHEN p_sort IN ('featured', 'relevance') THEN sort_key END DESC,
      id ASC
    LIMIT p_limit
  ),

  -- Compute facet counts (languages)
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

  -- Compute facet counts (specialties)
  spec_facets AS (
    SELECT json_agg(
      json_build_object('value', spec, 'count', cnt)
      ORDER BY cnt DESC
    ) as data
    FROM (
      SELECT UNNEST(specialties) as spec, COUNT(*) as cnt
      FROM base
      GROUP BY spec
      ORDER BY cnt DESC
      LIMIT 50
    ) f
  )

  -- Aggregate results
  SELECT
    COALESCE(json_agg(to_jsonb(paged.*) ORDER BY sort_key, id), '[]'::json),
    json_build_object(
      'languages', COALESCE((SELECT data FROM lang_facets), '[]'::json),
      'specialties', COALESCE((SELECT data FROM spec_facets), '[]'::json),
      'total', (SELECT COUNT(*) FROM base)
    )
  INTO v_results, v_facets
  FROM paged;

  -- Build next cursor from last row
  SELECT CASE
    WHEN COUNT(*) = p_limit THEN
      encode(
        convert_to(
          MAX(sort_key)::text || ':' || MAX(id)::text,
          'UTF8'
        ),
        'base64'
      )
    ELSE NULL
  END
  INTO v_next_cursor
  FROM paged;

  -- Return combined result
  RETURN json_build_object(
    'results', v_results,
    'facets', v_facets,
    'nextCursor', v_next_cursor
  );
END;
$$;

-- Grant execute permission to anon users (safe because function is SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION api_guides_search TO anon, authenticated;

-- ============================================
-- 6. REFRESH MATERIALIZED VIEW
-- ============================================

-- Initial refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;

-- ============================================
-- 7. AUTO-REFRESH TRIGGER (optional but recommended)
-- ============================================

-- Create function to refresh view when guides or profiles change
CREATE OR REPLACE FUNCTION refresh_guides_browse_v()
RETURNS trigger AS $$
BEGIN
  -- Use CONCURRENTLY to avoid locking (requires unique index)
  REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger on guides table changes
DROP TRIGGER IF EXISTS trigger_refresh_guides_browse ON guides;
CREATE TRIGGER trigger_refresh_guides_browse
AFTER INSERT OR UPDATE OR DELETE ON guides
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_guides_browse_v();

-- Trigger on profiles table changes
DROP TRIGGER IF EXISTS trigger_refresh_guides_browse_profiles ON profiles;
CREATE TRIGGER trigger_refresh_guides_browse_profiles
AFTER UPDATE ON profiles
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_guides_browse_v();

-- ============================================
-- 8. STATISTICS & VERIFICATION
-- ============================================

ANALYZE guides_browse_v;
ANALYZE guides;
ANALYZE profiles;

-- Analyze location tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guide_regions') THEN
    EXECUTE 'ANALYZE guide_regions';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'guide_cities') THEN
    EXECUTE 'ANALYZE guide_cities';
  END IF;
END $$;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Guide search optimization migration completed successfully';
  RAISE NOTICE 'Materialized view guides_browse_v created with % rows',
    (SELECT COUNT(*) FROM guides_browse_v);
  RAISE NOTICE '========================================';
END $$;

-- Fix: Change p_region_id and p_city_id from text to uuid
-- This fixes the "operator does not exist: uuid = text" error

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
  v_location_filter uuid[];
  v_has_location_tables boolean := false;
  v_results json;
  v_total_matching int;
  v_facets json;
BEGIN
  -- Convert search query to tsquery if provided
  IF p_q IS NOT NULL AND p_q != '' THEN
    v_q := plainto_tsquery('simple', unaccent(p_q));
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
      -- Specialty filter (contains any specified specialty)
      AND (p_specialties IS NULL OR languages && p_specialties)
      -- Gender filter
      AND (p_genders IS NULL OR gender = ANY(p_genders))
      -- Price range
      AND (p_price_min IS NULL OR price_cents >= p_price_min)
      AND (p_price_max IS NULL OR price_cents <= p_price_max)
      -- Rating minimum
      AND (p_min_rating IS NULL OR rating >= p_min_rating)
      -- Verified filters
      AND (NOT p_verified_only OR verified = true)
      AND (NOT p_license_only OR license_verified = true)
      -- Search query (matches name or headline)
      AND (v_q IS NULL OR search_text @@ v_q)
  ),
  paginated AS (
    SELECT *
    FROM base
    WHERE (p_after_cursor IS NULL OR (sort_key, id::text) < (
      SELECT sort_key, id::text
      FROM base
      WHERE id::text = p_after_cursor
      LIMIT 1
    ))
    ORDER BY sort_key DESC, id DESC
    LIMIT p_limit
  ),
  results AS (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'headline', headline,
        'country', country_code,
        'avatarUrl', avatar_url,
        'languages', languages,
        'specialties', specialties,
        'verified', verified,
        'licenseVerified', license_verified,
        'hasLiabilityInsurance', has_liability_insurance,
        'childFriendly', child_friendly,
        'gender', gender,
        'priceCents', price_cents,
        'currency', currency,
        'responseTimeMinutes', response_time_minutes,
        'rating', rating,
        'reviewCount', review_count
      )
    ) as data
    FROM paginated
  ),
  counts AS (
    SELECT COUNT(*) as total
    FROM base
  ),
  facets AS (
    SELECT json_build_object(
      'languages', (
        SELECT json_agg(json_build_object('value', lang, 'count', cnt))
        FROM (
          SELECT UNNEST(languages) as lang, COUNT(*) as cnt
          FROM base
          GROUP BY lang
          ORDER BY cnt DESC
          LIMIT 50
        ) lang_facet
      ),
      'specialties', (
        SELECT json_agg(json_build_object('value', spec, 'count', cnt))
        FROM (
          SELECT UNNEST(specialties) as spec, COUNT(*) as cnt
          FROM base
          GROUP BY spec
          ORDER BY cnt DESC
          LIMIT 50
        ) spec_facet
      ),
      'genders', (
        SELECT json_agg(json_build_object('value', g, 'count', cnt))
        FROM (
          SELECT gender as g, COUNT(*) as cnt
          FROM base
          WHERE gender IS NOT NULL
          GROUP BY gender
          ORDER BY cnt DESC
        ) gender_facet
      )
    ) as data
  )
  SELECT json_build_object(
    'results', COALESCE((SELECT data FROM results), '[]'::json),
    'total', (SELECT total FROM counts),
    'facets', (SELECT data FROM facets),
    'nextCursor', (
      SELECT id::text
      FROM paginated
      ORDER BY sort_key DESC, id DESC
      LIMIT 1
    )
  ) INTO v_results;

  RETURN v_results;
END;
$$;

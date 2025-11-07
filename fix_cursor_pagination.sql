-- Fix cursor pagination duplicates issue
-- Problem: Using MAX(sort_key) and MAX(id) for cursor causes duplicates
-- Solution: Get the last row's actual values for proper keyset pagination

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
  v_facets json;
  v_next_cursor text;
  v_cursor_sort_key bigint;
  v_cursor_id uuid;
BEGIN
  -- Convert search query to tsquery if provided
  IF p_q IS NOT NULL AND p_q != '' THEN
    v_q := plainto_tsquery('simple', unaccent(p_q));
  END IF;

  -- Decode cursor if provided
  IF p_after_cursor IS NOT NULL THEN
    v_cursor_sort_key := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 1)::bigint;
    v_cursor_id := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 2)::uuid;
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
        WHEN 'experience' THEN 0::bigint
        ELSE (
          (CASE WHEN license_verified THEN 100 ELSE 0 END +
           CASE WHEN verified THEN 50 ELSE 0 END +
           CASE WHEN has_liability_insurance THEN 25 ELSE 0 END +
           LEAST(COALESCE(rating * 10, 0)::int, 50))
        )::bigint
      END as sort_key

    FROM guides_browse_v g
    WHERE country_code = UPPER(p_country)
      AND (v_location_filter IS NULL OR id = ANY(v_location_filter))
      AND (p_languages IS NULL OR languages @> p_languages)
      AND (p_specialties IS NULL OR specialties && p_specialties)
      AND (p_genders IS NULL OR gender = ANY(p_genders))
      AND (p_price_min IS NULL OR price_cents >= p_price_min)
      AND (p_price_max IS NULL OR price_cents <= p_price_max)
      AND (p_min_rating IS NULL OR rating >= p_min_rating)
      AND (NOT p_verified_only OR verified = true)
      AND (NOT p_license_only OR license_verified = true)
      AND (v_q IS NULL OR search_text @@ v_q)
  ),

  -- Paginate with cursor (keyset pagination) - FIXED
  paged AS (
    SELECT *
    FROM base
    WHERE (
      p_after_cursor IS NULL
      OR (
        -- For DESC sort (featured, relevance): use < for "less than" cursor
        p_sort IN ('featured', 'relevance') AND (sort_key, id) < (v_cursor_sort_key, v_cursor_id)
      )
      OR (
        -- For ASC sort (price, rating): use > for "greater than" cursor
        p_sort IN ('price', 'rating') AND (sort_key, id) > (v_cursor_sort_key, v_cursor_id)
      )
    )
    ORDER BY
      CASE WHEN p_sort IN ('featured', 'relevance') THEN sort_key END DESC,
      CASE WHEN p_sort IN ('price', 'rating') THEN sort_key END ASC,
      id ASC
    LIMIT p_limit
  ),

  -- Results as JSON
  results_json AS (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'headline', headline,
        'country_code', country_code,
        'avatar_url', avatar_url,
        'languages', languages,
        'specialties', specialties,
        'verified', verified,
        'license_verified', license_verified,
        'has_liability_insurance', has_liability_insurance,
        'child_friendly', child_friendly,
        'gender', gender,
        'price_cents', price_cents,
        'currency', currency,
        'response_time_minutes', response_time_minutes,
        'rating', rating,
        'review_count', review_count
      )
    ) as data
    FROM paged
  ),

  -- Facets
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
  gender_facets AS (
    SELECT json_agg(
      json_build_object('value', g, 'count', cnt)
      ORDER BY cnt DESC
    ) as data
    FROM (
      SELECT gender as g, COUNT(*) as cnt
      FROM base
      WHERE gender IS NOT NULL
      GROUP BY gender
      ORDER BY cnt DESC
    ) f
  ),
  total_count AS (
    SELECT COUNT(*) as total FROM base
  )

  -- Compute next cursor from last row - FIXED
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM paged) = p_limit THEN
      encode(
        convert_to(
          (SELECT sort_key FROM paged ORDER BY sort_key DESC, id DESC LIMIT 1)::text || ':' ||
          (SELECT id FROM paged ORDER BY sort_key DESC, id DESC LIMIT 1)::text,
          'UTF8'
        ),
        'base64'
      )
    ELSE NULL
  END INTO v_next_cursor;

  -- Build final response
  SELECT json_build_object(
    'results', COALESCE((SELECT data FROM results_json), '[]'::json),
    'facets', json_build_object(
      'languages', COALESCE((SELECT data FROM lang_facets), '[]'::json),
      'specialties', COALESCE((SELECT data FROM spec_facets), '[]'::json),
      'genders', COALESCE((SELECT data FROM gender_facets), '[]'::json),
      'total', (SELECT total FROM total_count)
    ),
    'nextCursor', v_next_cursor
  ) INTO v_results;

  RETURN v_results;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION api_guides_search TO anon, authenticated;

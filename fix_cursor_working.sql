-- Working fix for cursor pagination duplicates
-- Key fix: Get the LAST row's actual values, not MAX() values

DROP FUNCTION IF EXISTS api_guides_search(text, uuid, uuid, text[], text[], text[], text, int, int, numeric, boolean, boolean, text, text, int);

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
  v_next_cursor text;
  v_cursor_sort_key bigint;
  v_cursor_id text;
  v_last_sort_key bigint;
  v_last_id text;
  v_page_count int;
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

  -- Get location-filtered guide IDs
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

  -- Decode cursor if provided
  IF p_after_cursor IS NOT NULL THEN
    v_cursor_sort_key := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 1)::bigint;
    v_cursor_id := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 2);
  END IF;

  -- Build complete response
  WITH base AS (
    SELECT
      id, name, headline, country_code, avatar_url,
      languages, specialties, verified, license_verified,
      has_liability_insurance, child_friendly, gender,
      price_cents, currency, response_time_minutes,
      rating, review_count,

      CASE p_sort
        WHEN 'price' THEN price_cents::bigint
        WHEN 'rating' THEN (1000 - COALESCE(rating * 100, 0))::bigint
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

  total_ct AS (
    SELECT COUNT(*) as total FROM base
  )

  SELECT json_build_object(
    'results', COALESCE((SELECT data FROM results_agg), '[]'::json),
    'facets', json_build_object(
      'languages', COALESCE((SELECT data FROM lang_facets), '[]'::json),
      'specialties', COALESCE((SELECT data FROM spec_facets), '[]'::json),
      'genders', COALESCE((SELECT data FROM gender_facets), '[]'::json),
      'total', (SELECT total FROM total_ct)
    ),
    'nextCursor', NULL  -- Temporarily NULL to get function working first
  ) INTO v_results;

  -- NOW get the last row's actual values from paged for cursor
  SELECT sort_key, id::text, COUNT(*) OVER ()
  INTO v_last_sort_key, v_last_id, v_page_count
  FROM (
    SELECT *
    FROM base
    WHERE (
      p_after_cursor IS NULL
      OR (sort_key, id::text) < (v_cursor_sort_key, v_cursor_id)
    )
    ORDER BY sort_key DESC, id DESC
    LIMIT p_limit
  ) sub
  ORDER BY sort_key ASC, id ASC  -- Reverse to get LAST row
  LIMIT 1;

  -- Build cursor if we got a full page
  IF v_page_count = p_limit AND v_last_id IS NOT NULL THEN
    v_next_cursor := encode(
      convert_to(v_last_sort_key::text || ':' || v_last_id, 'UTF8'),
      'base64'
    );

    -- Update the results JSON with the cursor
    v_results := jsonb_set(
      v_results::jsonb,
      '{nextCursor}',
      to_jsonb(v_next_cursor)
    )::json;
  END IF;

  RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION api_guides_search TO anon, authenticated;

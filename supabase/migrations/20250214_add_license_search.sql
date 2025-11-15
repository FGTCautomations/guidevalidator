-- Add license number to guide search
-- Allows searching by license number in addition to name and headline

CREATE OR REPLACE FUNCTION api_guides_search(
  p_country text,
  p_region_id text DEFAULT NULL,
  p_city_id text DEFAULT NULL,
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
  v_q_unaccented text;
  v_results json;
  v_facets json;
  v_next_cursor text;
  v_location_filter uuid[];
  v_has_location_tables boolean;
  v_cursor_sort_key bigint;
  v_cursor_id text;
BEGIN
  -- Validate and cap limit
  p_limit := LEAST(p_limit, 48);

  -- Unaccent the search query for matching
  IF p_q IS NOT NULL AND LENGTH(TRIM(p_q)) > 0 THEN
    BEGIN
      v_q_unaccented := unaccent(LOWER(TRIM(p_q)));
    EXCEPTION WHEN OTHERS THEN
      v_q_unaccented := LOWER(TRIM(p_q));
    END;
  ELSE
    v_q_unaccented := NULL;
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
      EXECUTE 'SELECT ARRAY_AGG(guide_id) FROM guide_regions WHERE region_id = $1::uuid'
      INTO v_location_filter
      USING p_region_id;
    ELSIF p_city_id IS NOT NULL THEN
      EXECUTE 'SELECT ARRAY_AGG(guide_id) FROM guide_cities WHERE city_id = $1::uuid'
      INTO v_location_filter
      USING p_city_id;
    END IF;
  END IF;

  -- Decode cursor with error handling
  IF p_after_cursor IS NOT NULL THEN
    BEGIN
      v_cursor_sort_key := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 1)::bigint;
      v_cursor_id := SPLIT_PART(convert_from(decode(p_after_cursor, 'base64'), 'UTF8'), ':', 2);
    EXCEPTION WHEN OTHERS THEN
      -- If cursor decode fails, ignore it and start from beginning
      v_cursor_sort_key := NULL;
      v_cursor_id := NULL;
      p_after_cursor := NULL;
    END;
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
      -- Text search using unaccent on name, headline, AND license number
      AND (
        v_q_unaccented IS NULL
        OR unaccent(LOWER(COALESCE(name, ''))) LIKE '%' || v_q_unaccented || '%'
        OR unaccent(LOWER(COALESCE(headline, ''))) LIKE '%' || v_q_unaccented || '%'
        OR unaccent(LOWER(COALESCE((
          SELECT g2.license_number
          FROM guides g2
          WHERE g2.profile_id = g.id
          LIMIT 1
        ), ''))) LIKE '%' || v_q_unaccented || '%'
      )
      AND (p_price_min IS NULL OR price_cents >= p_price_min * 100)
      AND (p_price_max IS NULL OR price_cents <= p_price_max * 100)
      AND (p_min_rating IS NULL OR rating >= p_min_rating)
      AND (NOT p_verified_only OR verified = true)
      AND (NOT p_license_only OR license_verified = true)
  ),

  -- Paginate with cursor (keyset pagination)
  paged AS (
    SELECT *
    FROM base
    WHERE (
      p_after_cursor IS NULL
      OR (sort_key, id::text) > (v_cursor_sort_key, v_cursor_id)
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
  ),

  -- Compute facet counts (genders)
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
  )

  -- Aggregate results and build cursor in one query
  SELECT
    COALESCE(json_agg(to_jsonb(paged)), '[]'::json),
    json_build_object(
      'languages', COALESCE((SELECT data FROM lang_facets), '[]'::json),
      'specialties', COALESCE((SELECT data FROM spec_facets), '[]'::json),
      'genders', COALESCE((SELECT data FROM gender_facets), '[]'::json),
      'total', (SELECT COUNT(*) FROM base)
    ),
    CASE
      WHEN COUNT(*) = p_limit THEN
        encode(
          convert_to(
            MAX(sort_key)::text || ':' || MAX(id::text),
            'UTF8'
          ),
          'base64'
        )
      ELSE NULL
    END
  INTO v_results, v_facets, v_next_cursor
  FROM paged;

  -- Return combined result
  RETURN json_build_object(
    'results', v_results,
    'facets', v_facets,
    'nextCursor', v_next_cursor
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION api_guides_search TO anon, authenticated, service_role;

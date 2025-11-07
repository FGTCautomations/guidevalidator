-- Fix the select_ad RPC function with simplified weighted selection
-- The original function had a complex CROSS JOIN that was causing it to return empty results

-- Drop the old function
DROP FUNCTION IF EXISTS select_ad(text, text, text);

-- Create new simplified function
CREATE OR REPLACE FUNCTION select_ad(
  p_placement text,
  p_country text DEFAULT NULL,
  p_list_context text DEFAULT NULL
)
RETURNS TABLE(
  id bigint,
  advertiser_name text,
  ad_type text,
  placement text[],
  target_url text,
  image_url text,
  headline text,
  description text,
  cta_label text,
  weight int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_weight int;
  v_random_weight numeric;
  v_cumulative_weight int := 0;
BEGIN
  -- Get total weight of matching ads
  SELECT COALESCE(SUM(ads.weight), 0)
  INTO v_total_weight
  FROM ads
  WHERE ads.is_active = true
    AND now() BETWEEN ads.start_at AND ads.end_at
    AND ads.placement @> ARRAY[p_placement]
    AND (
      ads.country_filter IS NULL
      OR array_length(ads.country_filter, 1) IS NULL
      OR p_country = ANY(ads.country_filter)
    );

  -- If no ads match, return empty
  IF v_total_weight = 0 THEN
    RETURN;
  END IF;

  -- Generate random weight between 0 and total_weight
  v_random_weight := random() * v_total_weight;

  -- Use simplified weighted selection with cumulative sum
  RETURN QUERY
  WITH matching_ads AS (
    SELECT
      ads.id,
      ads.advertiser_name,
      ads.ad_type,
      ads.placement,
      ads.target_url,
      ads.image_url,
      ads.headline,
      ads.description,
      ads.cta_label,
      ads.weight,
      SUM(ads.weight) OVER (ORDER BY ads.id) AS cumulative_weight
    FROM ads
    WHERE ads.is_active = true
      AND now() BETWEEN ads.start_at AND ads.end_at
      AND ads.placement @> ARRAY[p_placement]
      AND (
        ads.country_filter IS NULL
        OR array_length(ads.country_filter, 1) IS NULL
        OR p_country = ANY(ads.country_filter)
      )
    ORDER BY ads.id
  )
  SELECT
    matching_ads.id,
    matching_ads.advertiser_name,
    matching_ads.ad_type,
    matching_ads.placement,
    matching_ads.target_url,
    matching_ads.image_url,
    matching_ads.headline,
    matching_ads.description,
    matching_ads.cta_label,
    matching_ads.weight
  FROM matching_ads
  WHERE cumulative_weight > v_random_weight
  ORDER BY cumulative_weight
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION select_ad IS 'Weighted random ad selection based on placement and targeting criteria';

-- Test the function
SELECT * FROM select_ad('homepage_mid', null, null);
SELECT * FROM select_ad('footer', null, null);
SELECT * FROM select_ad('listings', null, 'guides');

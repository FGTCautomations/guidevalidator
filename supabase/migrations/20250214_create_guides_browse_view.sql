-- Create guides_browse_v view
-- This view joins guides with profiles to get country_code and other info

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS guides_browse_v CASCADE;

-- Create as a regular view (not materialized)
CREATE OR REPLACE VIEW guides_browse_v AS
SELECT
  g.id,
  g.profile_id,
  g.name,
  g.headline,
  p.country_code,
  g.avatar_url,
  g.spoken_languages as languages,
  g.specialties,
  false as verified,
  CASE
    WHEN g.license_number IS NOT NULL AND g.license_number != '' THEN true
    ELSE false
  END as license_verified,
  g.has_liability_insurance,
  false as child_friendly,
  g.gender,
  g.hourly_rate_cents as price_cents,
  g.currency,
  g.response_time_minutes,
  0::numeric as rating,
  0::integer as review_count,
  -- Search text (for tsvector search)
  to_tsvector('simple', unaccent(
    COALESCE(g.name, '') || ' ' ||
    COALESCE(g.headline, '')
  )) as search_text
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
WHERE p.role = 'guide';

-- Grant permissions
GRANT SELECT ON guides_browse_v TO anon, authenticated, service_role;

-- Add comment
COMMENT ON VIEW guides_browse_v IS 'View for fast guide directory browsing and filtering';

-- Update guides_browse_v view to include is_featured and is_activated fields
-- This enables directory sorting by: Premium -> Activated -> Not Activated

DROP VIEW IF EXISTS guides_browse_v CASCADE;

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
  -- New fields for Featured and Activated status
  CASE
    WHEN EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.profile_id = g.profile_id
        AND s.plan_code IN ('guide_premium_monthly', 'guide_premium_yearly')
        AND s.status = 'active'
    ) THEN true
    ELSE false
  END as is_featured,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = g.profile_id
    ) THEN true
    ELSE false
  END as is_activated,
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
COMMENT ON VIEW guides_browse_v IS 'View for fast guide directory browsing and filtering. Includes is_featured (premium subscribers) and is_activated (has auth account) for proper sorting.';

-- Create index on subscriptions for faster Featured lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_plan_status
  ON subscriptions(profile_id, plan_code, status)
  WHERE status = 'active' AND plan_code IN ('guide_premium_monthly', 'guide_premium_yearly');

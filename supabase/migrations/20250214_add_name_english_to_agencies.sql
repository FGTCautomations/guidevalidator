-- Add English name column to agencies table
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS name_english TEXT;

-- Create index for searching by English name
CREATE INDEX IF NOT EXISTS idx_agencies_name_english ON agencies(name_english);

-- Update the agencies_browse_v view to include English name
CREATE OR REPLACE VIEW agencies_browse_v AS
SELECT
  id,
  type,
  name,
  name_english,
  slug,
  country_code,
  coverage_summary,
  logo_url,
  description,
  website,
  website_url,
  verified,
  featured,
  languages,
  specialties,
  location_data,
  contact_email,
  contact_phone,
  active,
  created_at
FROM agencies
WHERE deleted_at IS NULL
  AND (active = true OR active IS NULL);

-- Grant access
GRANT SELECT ON agencies_browse_v TO anon, authenticated;

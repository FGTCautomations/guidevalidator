-- Add 'active' field to agencies table
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_agencies_active ON agencies(active);

-- Copy website_url to website for all agencies where website is null
UPDATE agencies
SET website = website_url
WHERE website_url IS NOT NULL
  AND website_url != ''
  AND (website IS NULL OR website = '');

-- Set all Vietnamese agencies to active=true, but keep as pending/unverified
-- This allows them to show in directory without being "approved"
UPDATE agencies
SET
  active = true,
  application_status = 'pending',
  verified = false,
  updated_at = NOW()
WHERE country_code = 'VN';

-- Verify the changes
SELECT
  active,
  application_status,
  verified,
  COUNT(*) as count
FROM agencies
WHERE country_code = 'VN'
GROUP BY active, application_status, verified;

-- Sample of updated agencies
SELECT
  id,
  name,
  active,
  application_status,
  verified,
  website,
  website_url
FROM agencies
WHERE country_code = 'VN'
LIMIT 5;

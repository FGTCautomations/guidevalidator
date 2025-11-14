-- Add 'active' field to agencies table for directory visibility
-- This allows agencies to be visible in directory without being approved/verified

ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_agencies_active ON agencies(active);

-- Copy all data from website_url to website field for normalization
UPDATE agencies
SET website = website_url
WHERE website_url IS NOT NULL AND (website IS NULL OR website = '');

-- Create a trigger to keep website and website_url in sync
-- Whenever website_url is updated, copy to website
CREATE OR REPLACE FUNCTION sync_agency_website()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.website_url IS NOT NULL AND NEW.website_url != '' THEN
    NEW.website := NEW.website_url;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_agency_website ON agencies;
CREATE TRIGGER trigger_sync_agency_website
  BEFORE INSERT OR UPDATE OF website_url ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION sync_agency_website();

-- Comment on the active field
COMMENT ON COLUMN agencies.active IS 'Controls directory visibility. True = visible in directory, regardless of approval status';

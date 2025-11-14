-- Add columns from CSV to guides table
-- These columns will store the original data from the Vietnam CSV import

ALTER TABLE guides
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS card_number TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TEXT,
ADD COLUMN IF NOT EXISTS province_issue TEXT,
ADD COLUMN IF NOT EXISTS card_type TEXT,
ADD COLUMN IF NOT EXISTS language TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add index on card_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_guides_card_number ON guides(card_number);

-- Add comment explaining the columns
COMMENT ON COLUMN guides.name IS 'Guide full name from CSV import';
COMMENT ON COLUMN guides.card_number IS 'License/card number from CSV import';
COMMENT ON COLUMN guides.expiry_date IS 'License expiry date from CSV import';
COMMENT ON COLUMN guides.province_issue IS 'Province that issued the license';
COMMENT ON COLUMN guides.card_type IS 'Type of guide card/license';
COMMENT ON COLUMN guides.language IS 'Languages spoken by the guide';
COMMENT ON COLUMN guides.experience IS 'Years of experience';
COMMENT ON COLUMN guides.image_url IS 'URL to guide photo';
COMMENT ON COLUMN guides.source_url IS 'Source URL where the data was scraped from';

-- ============================================
-- GUIDES TABLE MIGRATIONS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Make profile_id nullable (allows importing guides without profiles)
ALTER TABLE guides
ALTER COLUMN profile_id DROP NOT NULL;

-- 2. Add CSV import columns
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

-- 3. Create index on card_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_guides_card_number ON guides(card_number);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guides'
ORDER BY ordinal_position;

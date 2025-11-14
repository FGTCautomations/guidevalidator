-- ============================================
-- GUIDES TABLE FIX - Complete Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop the primary key constraint with CASCADE (since table is empty)
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_pkey CASCADE;
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_profile_id_key CASCADE;

-- Step 2: Add a new UUID primary key column
ALTER TABLE guides ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Step 3: Make id the primary key
ALTER TABLE guides ADD PRIMARY KEY (id);

-- Step 4: Now profile_id can be nullable
ALTER TABLE guides ALTER COLUMN profile_id DROP NOT NULL;

-- Step 5: Add index on profile_id for performance
CREATE INDEX IF NOT EXISTS idx_guides_profile_id ON guides(profile_id);

-- Step 6: Add CSV import columns
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

-- Step 7: Create index on card_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_guides_card_number ON guides(card_number);

-- Step 8: Recreate foreign key constraints pointing to the new id column
-- (These will now reference guides.id instead of guides.profile_id)

-- guide_credentials
ALTER TABLE guide_credentials
DROP CONSTRAINT IF EXISTS guide_credentials_guide_id_fkey;

ALTER TABLE guide_credentials
ADD CONSTRAINT guide_credentials_guide_id_fkey
FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE;

-- job_applications
ALTER TABLE job_applications
DROP CONSTRAINT IF EXISTS job_applications_guide_id_fkey;

ALTER TABLE job_applications
ADD CONSTRAINT job_applications_guide_id_fkey
FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE;

-- availability_slots
ALTER TABLE availability_slots
DROP CONSTRAINT IF EXISTS availability_slots_guide_id_fkey;

ALTER TABLE availability_slots
ADD CONSTRAINT availability_slots_guide_id_fkey
FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE;

-- guide_countries
ALTER TABLE guide_countries
DROP CONSTRAINT IF EXISTS guide_countries_guide_id_fkey;

ALTER TABLE guide_countries
ADD CONSTRAINT guide_countries_guide_id_fkey
FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE;

-- guide_regions
ALTER TABLE guide_regions
DROP CONSTRAINT IF EXISTS guide_regions_guide_id_fkey;

ALTER TABLE guide_regions
ADD CONSTRAINT guide_regions_guide_id_fkey
FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE;

-- guide_cities
ALTER TABLE guide_cities
DROP CONSTRAINT IF EXISTS guide_cities_guide_id_fkey;

ALTER TABLE guide_cities
ADD CONSTRAINT guide_cities_guide_id_fkey
FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE;

-- guide_ratings_summary
ALTER TABLE guide_ratings_summary
DROP CONSTRAINT IF EXISTS guide_ratings_summary_guide_id_fkey;

ALTER TABLE guide_ratings_summary
ADD CONSTRAINT guide_ratings_summary_guide_id_fkey
FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE;

-- Step 9: Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'guides'
ORDER BY ordinal_position;

-- Success message
SELECT 'Migration completed successfully! You can now import your CSV.' as status;

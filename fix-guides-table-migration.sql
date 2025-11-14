-- ============================================
-- GUIDES TABLE FIX - Handle Primary Key Issue
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: First, let's check the current primary key
-- (Run this to see what we're working with)
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'guides'
    AND tc.constraint_type = 'PRIMARY KEY';

-- Step 2: Drop the primary key constraint that includes profile_id
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_pkey;
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_profile_id_key;

-- Step 3: Add a new UUID primary key column if it doesn't exist
ALTER TABLE guides ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Step 4: Make id the primary key
ALTER TABLE guides ADD PRIMARY KEY (id);

-- Step 5: Now profile_id can be nullable
ALTER TABLE guides ALTER COLUMN profile_id DROP NOT NULL;

-- Step 6: Add index on profile_id for performance
CREATE INDEX IF NOT EXISTS idx_guides_profile_id ON guides(profile_id);

-- Step 7: Add CSV import columns
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

-- Step 8: Create index on card_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_guides_card_number ON guides(card_number);

-- Step 9: Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'guides'
ORDER BY ordinal_position;

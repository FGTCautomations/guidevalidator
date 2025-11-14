-- Add missing columns to guides table for profile completion
-- These columns are being used by the profile completion API but don't exist yet

ALTER TABLE guides
ADD COLUMN IF NOT EXISTS professional_intro TEXT,
ADD COLUMN IF NOT EXISTS contact_methods JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location_data JSONB,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add comments
COMMENT ON COLUMN guides.professional_intro IS 'Professional introduction/bio for the guide';
COMMENT ON COLUMN guides.contact_methods IS 'Array of contact methods (channel, value)';
COMMENT ON COLUMN guides.location_data IS 'Location/region data for the guide';
COMMENT ON COLUMN guides.profile_photo_url IS 'URL to the guide profile photo';

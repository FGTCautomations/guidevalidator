-- Make profile_id nullable in guides table
-- This allows importing guides from CSV without requiring user profiles

ALTER TABLE guides
ALTER COLUMN profile_id DROP NOT NULL;

-- Add a comment explaining why this is nullable
COMMENT ON COLUMN guides.profile_id IS 'Profile ID - nullable to allow importing guides from CSV before profiles are created. Can be linked later when guides claim their profiles.';

-- Add profile access token fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_access_token TEXT,
ADD COLUMN IF NOT EXISTS profile_access_token_expires_at TIMESTAMPTZ;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_profiles_access_token
ON profiles(profile_access_token)
WHERE profile_access_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.profile_access_token IS 'Temporary access token for guides to claim their profile';
COMMENT ON COLUMN profiles.profile_access_token_expires_at IS 'Expiration timestamp for the access token';

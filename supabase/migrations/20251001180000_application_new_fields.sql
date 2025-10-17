-- Add new fields to all application tables for account creation during application

-- Guide applications
ALTER TABLE guide_applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Agency applications
ALTER TABLE agency_applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- DMC applications
ALTER TABLE dmc_applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Transport applications
ALTER TABLE transport_applications
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add indexes for user_id lookups
CREATE INDEX IF NOT EXISTS idx_guide_applications_user_id ON guide_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_applications_user_id ON agency_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_dmc_applications_user_id ON dmc_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_transport_applications_user_id ON transport_applications(user_id);

-- Also add timezone and working_hours to guides table if not exists
ALTER TABLE guides
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB;

-- Comment on new columns
COMMENT ON COLUMN guide_applications.user_id IS 'Link to auth.users - created during application submission';
COMMENT ON COLUMN guide_applications.timezone IS 'Primary timezone of the guide';
COMMENT ON COLUMN guide_applications.availability_timezone IS 'Timezone for availability/working hours';
COMMENT ON COLUMN guide_applications.working_hours IS 'JSONB object with working hours per day';
COMMENT ON COLUMN guide_applications.avatar_url IS 'Avatar URL (typically same as profile photo)';

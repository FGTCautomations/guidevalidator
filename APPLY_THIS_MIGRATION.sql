-- ============================================================================
-- COMPREHENSIVE APPLICATION FORM MIGRATION
-- Run this entire script in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new
-- ============================================================================

-- PART 1: Add credential fields (from 20251001174328_application_credentials.sql)
-- ============================================================================

ALTER TABLE public.guide_applications
  ADD COLUMN IF NOT EXISTS login_email TEXT,
  ADD COLUMN IF NOT EXISTS login_password_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS login_password_iv TEXT,
  ADD COLUMN IF NOT EXISTS login_password_tag TEXT;

ALTER TABLE public.agency_applications
  ADD COLUMN IF NOT EXISTS login_email TEXT,
  ADD COLUMN IF NOT EXISTS login_password_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS login_password_iv TEXT,
  ADD COLUMN IF NOT EXISTS login_password_tag TEXT;

ALTER TABLE public.dmc_applications
  ADD COLUMN IF NOT EXISTS login_email TEXT,
  ADD COLUMN IF NOT EXISTS login_password_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS login_password_iv TEXT,
  ADD COLUMN IF NOT EXISTS login_password_tag TEXT;

ALTER TABLE public.transport_applications
  ADD COLUMN IF NOT EXISTS login_email TEXT,
  ADD COLUMN IF NOT EXISTS login_password_ciphertext TEXT,
  ADD COLUMN IF NOT EXISTS login_password_iv TEXT,
  ADD COLUMN IF NOT EXISTS login_password_tag TEXT;


-- PART 2: Add new account creation fields (from 20251001180000_application_new_fields.sql)
-- ============================================================================

-- First, add columns without foreign keys
ALTER TABLE public.guide_applications
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.agency_applications
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.dmc_applications
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.transport_applications
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Now, drop existing foreign key constraints if they exist (without ON DELETE SET NULL)
ALTER TABLE public.guide_applications DROP CONSTRAINT IF EXISTS guide_applications_user_id_fkey;
ALTER TABLE public.agency_applications DROP CONSTRAINT IF EXISTS agency_applications_user_id_fkey;
ALTER TABLE public.dmc_applications DROP CONSTRAINT IF EXISTS dmc_applications_user_id_fkey;
ALTER TABLE public.transport_applications DROP CONSTRAINT IF EXISTS transport_applications_user_id_fkey;

-- Recreate foreign key constraints WITH ON DELETE SET NULL
ALTER TABLE public.guide_applications
  ADD CONSTRAINT guide_applications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.agency_applications
  ADD CONSTRAINT agency_applications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.dmc_applications
  ADD CONSTRAINT dmc_applications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.transport_applications
  ADD CONSTRAINT transport_applications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Guides table (for approved guides)
ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS availability_timezone TEXT,
  ADD COLUMN IF NOT EXISTS working_hours JSONB,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS business_name TEXT;


-- PART 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_guide_applications_user_id ON public.guide_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_applications_user_id ON public.agency_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_dmc_applications_user_id ON public.dmc_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_transport_applications_user_id ON public.transport_applications(user_id);


-- PART 4: Add helpful comments
-- ============================================================================

COMMENT ON COLUMN public.guide_applications.user_id IS 'Link to auth.users - created during application submission with pending_approval flag';
COMMENT ON COLUMN public.guide_applications.login_email IS 'Email address for login (may differ from contact_email)';
COMMENT ON COLUMN public.guide_applications.timezone IS 'Primary timezone of the applicant';
COMMENT ON COLUMN public.guide_applications.availability_timezone IS 'Timezone for availability/working hours display';
COMMENT ON COLUMN public.guide_applications.working_hours IS 'JSONB: {monday: {enabled: bool, startTime: string, endTime: string}, ...}';
COMMENT ON COLUMN public.guide_applications.avatar_url IS 'Avatar URL (typically same as profile_photo_url)';

-- ============================================================================
-- MIGRATION COMPLETE!
-- After running this, refresh your application and it should work.
-- ============================================================================

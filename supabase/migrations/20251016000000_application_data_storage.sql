-- Add application data storage and profile completion tracking
-- This migration adds fields to store complete form submissions and track profile completion

-- Add application_data JSONB column to profiles
-- This stores the complete form submission data for admin review
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS application_data jsonb DEFAULT '{}'::jsonb;

-- Add profile completion tracking fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  ADD COLUMN IF NOT EXISTS profile_completion_last_prompted_at timestamptz,
  ADD COLUMN IF NOT EXISTS required_fields_missing jsonb DEFAULT '[]'::jsonb;

-- Add index for faster querying of incomplete profiles
CREATE INDEX IF NOT EXISTS idx_profiles_completion ON public.profiles(profile_completed, profile_completion_percentage) WHERE profile_completed = false;

-- Add index for application_data JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_application_data ON public.profiles USING gin(application_data);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.application_data IS 'Complete application form submission data in JSON format';
COMMENT ON COLUMN public.profiles.profile_completed IS 'Whether the profile has all required fields filled';
COMMENT ON COLUMN public.profiles.profile_completion_percentage IS 'Percentage of required fields completed (0-100)';
COMMENT ON COLUMN public.profiles.profile_completion_last_prompted_at IS 'Last time user was prompted to complete their profile';
COMMENT ON COLUMN public.profiles.required_fields_missing IS 'Array of field names that are still required';

-- Create function to calculate profile completion
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile record;
  v_required_fields text[] := ARRAY[
    'full_name',
    'email',
    'country_code',
    'timezone'
  ];
  v_completed_count integer := 0;
  v_total_count integer;
  v_missing_fields text[] := ARRAY[]::text[];
  v_field text;
  v_percentage integer;
BEGIN
  -- Get profile data
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = profile_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'completed', false,
      'percentage', 0,
      'missing_fields', v_required_fields
    );
  END IF;

  -- Add role-specific required fields
  IF v_profile.role = 'guide' THEN
    v_required_fields := v_required_fields || ARRAY[
      'license_number',
      'license_authority'
    ];
  ELSIF v_profile.role IN ('agency', 'dmc', 'transport') THEN
    v_required_fields := v_required_fields || ARRAY[
      'organization_id'
    ];
  END IF;

  v_total_count := array_length(v_required_fields, 1);

  -- Check each required field
  FOREACH v_field IN ARRAY v_required_fields
  LOOP
    IF v_profile.application_data ? v_field AND
       v_profile.application_data->v_field IS NOT NULL AND
       v_profile.application_data->v_field::text != 'null' AND
       v_profile.application_data->v_field::text != '""' THEN
      v_completed_count := v_completed_count + 1;
    ELSE
      v_missing_fields := array_append(v_missing_fields, v_field);
    END IF;
  END LOOP;

  -- Calculate percentage
  v_percentage := CASE
    WHEN v_total_count > 0 THEN (v_completed_count * 100 / v_total_count)
    ELSE 100
  END;

  RETURN jsonb_build_object(
    'completed', v_percentage = 100,
    'percentage', v_percentage,
    'missing_fields', v_missing_fields
  );
END;
$$;

-- Create function to update profile completion status
CREATE OR REPLACE FUNCTION public.update_profile_completion(profile_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_completion jsonb;
BEGIN
  v_completion := public.calculate_profile_completion(profile_id);

  UPDATE public.profiles
  SET
    profile_completed = (v_completion->>'completed')::boolean,
    profile_completion_percentage = (v_completion->>'percentage')::integer,
    required_fields_missing = v_completion->'missing_fields'
  WHERE id = profile_id;
END;
$$;

-- Create trigger to automatically update completion when application_data changes
CREATE OR REPLACE FUNCTION public.trigger_update_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_profile_completion(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profile_completion_trigger ON public.profiles;
CREATE TRIGGER update_profile_completion_trigger
  AFTER INSERT OR UPDATE OF application_data
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_profile_completion();

-- Update existing profiles to calculate completion
DO $$
DECLARE
  v_profile record;
BEGIN
  FOR v_profile IN SELECT id FROM public.profiles LOOP
    PERFORM public.update_profile_completion(v_profile.id);
  END LOOP;
END;
$$;

-- Add RLS policies for application_data
-- Users can only see their own application_data, admins can see all
DROP POLICY IF EXISTS "profiles_application_data_select" ON public.profiles;
CREATE POLICY "profiles_application_data_select" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    public.is_admin()
  );

-- Add comment about usage
COMMENT ON FUNCTION public.calculate_profile_completion IS 'Calculates profile completion percentage and returns missing fields';
COMMENT ON FUNCTION public.update_profile_completion IS 'Updates profile completion status based on application_data';
COMMENT ON FUNCTION public.trigger_update_profile_completion IS 'Trigger function to automatically update completion when application_data changes';

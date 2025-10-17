-- Enhance existing contact_reveals table with anti-scraping features
-- The table already exists with: id, requester_id, target_profile_id, revealed_at, conversation_id

-- Add missing columns
ALTER TABLE public.contact_reveals
  ADD COLUMN IF NOT EXISTS reveal_type text CHECK (reveal_type IN ('email', 'phone', 'website', 'full_contact'));

ALTER TABLE public.contact_reveals
  ADD COLUMN IF NOT EXISTS ip_address inet;

ALTER TABLE public.contact_reveals
  ADD COLUMN IF NOT EXISTS user_agent text;

-- Set default reveal_type for existing rows
UPDATE public.contact_reveals
SET reveal_type = 'full_contact'
WHERE reveal_type IS NULL;

-- Alter the reveal_type to be NOT NULL after setting defaults
ALTER TABLE public.contact_reveals
  ALTER COLUMN reveal_type SET NOT NULL;

-- Add indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS contact_reveals_requester_idx ON public.contact_reveals(requester_id);
CREATE INDEX IF NOT EXISTS contact_reveals_target_idx ON public.contact_reveals(target_profile_id);
CREATE INDEX IF NOT EXISTS contact_reveals_revealed_at_idx ON public.contact_reveals(revealed_at);

-- Ensure RLS is enabled
ALTER TABLE public.contact_reveals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS contact_reveals_select_own ON public.contact_reveals;
DROP POLICY IF EXISTS contact_reveals_insert_own ON public.contact_reveals;
DROP POLICY IF EXISTS contact_reveals_admin_all ON public.contact_reveals;

-- Create new RLS policies
-- Users can see their own reveals
CREATE POLICY contact_reveals_select_own ON public.contact_reveals
  FOR SELECT
  USING (requester_id = auth.uid() OR target_profile_id = auth.uid());

-- Users can insert their own reveals
CREATE POLICY contact_reveals_insert_own ON public.contact_reveals
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Admins can see all reveals
CREATE POLICY contact_reveals_admin_all ON public.contact_reveals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Rate limiting settings table
CREATE TABLE IF NOT EXISTS public.contact_reveal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_reveals_per_day integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Insert default settings if not exists
INSERT INTO public.contact_reveal_settings (max_reveals_per_day)
SELECT 10
WHERE NOT EXISTS (SELECT 1 FROM public.contact_reveal_settings);

-- RLS for settings
ALTER TABLE public.contact_reveal_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_reveal_settings_select ON public.contact_reveal_settings;
DROP POLICY IF EXISTS contact_reveal_settings_update_admin ON public.contact_reveal_settings;

-- Anyone authenticated can read settings
CREATE POLICY contact_reveal_settings_select ON public.contact_reveal_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can update settings
CREATE POLICY contact_reveal_settings_update_admin ON public.contact_reveal_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_contact_reveal_rate_limit(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reveal_count integer;
  max_reveals integer;
  is_admin boolean;
BEGIN
  -- Check if user is admin (admins have no limit)
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles
  WHERE id = user_id;

  IF is_admin THEN
    RETURN true;
  END IF;

  -- Get max reveals from settings
  SELECT max_reveals_per_day INTO max_reveals
  FROM public.contact_reveal_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Default to 10 if no settings found
  IF max_reveals IS NULL THEN
    max_reveals := 10;
  END IF;

  -- Count reveals in last 24 hours
  SELECT COUNT(*) INTO reveal_count
  FROM public.contact_reveals
  WHERE requester_id = user_id
    AND revealed_at > now() - interval '24 hours';

  -- Return true if under limit
  RETURN reveal_count < max_reveals;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_contact_reveal_rate_limit(uuid) TO authenticated;

-- Function to get remaining reveals for a user
CREATE OR REPLACE FUNCTION public.get_remaining_contact_reveals(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reveal_count integer;
  max_reveals integer;
  is_admin boolean;
BEGIN
  -- Check if user is admin (admins have no limit)
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles
  WHERE id = user_id;

  IF is_admin THEN
    RETURN 999999; -- Return a large number for admins
  END IF;

  -- Get max reveals from settings
  SELECT max_reveals_per_day INTO max_reveals
  FROM public.contact_reveal_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Default to 10 if no settings found
  IF max_reveals IS NULL THEN
    max_reveals := 10;
  END IF;

  -- Count reveals in last 24 hours
  SELECT COUNT(*) INTO reveal_count
  FROM public.contact_reveals
  WHERE requester_id = user_id
    AND revealed_at > now() - interval '24 hours';

  -- Return remaining
  RETURN GREATEST(0, max_reveals - reveal_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_remaining_contact_reveals(uuid) TO authenticated;

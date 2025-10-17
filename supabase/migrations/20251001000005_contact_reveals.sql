-- Contact reveals tracking table for anti-scraping
CREATE TABLE IF NOT EXISTS public.contact_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revealer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reveal_type text NOT NULL CHECK (reveal_type IN ('email', 'phone', 'website', 'full_contact')),
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS contact_reveals_revealer_idx ON public.contact_reveals(revealer_id);
CREATE INDEX IF NOT EXISTS contact_reveals_target_idx ON public.contact_reveals(target_profile_id);
CREATE INDEX IF NOT EXISTS contact_reveals_created_at_idx ON public.contact_reveals(created_at);

-- RLS policies
ALTER TABLE public.contact_reveals ENABLE ROW LEVEL SECURITY;

-- Users can see their own reveals
CREATE POLICY contact_reveals_select_own ON public.contact_reveals
  FOR SELECT
  USING (revealer_id = auth.uid());

-- Users can insert their own reveals
CREATE POLICY contact_reveals_insert_own ON public.contact_reveals
  FOR INSERT
  WITH CHECK (revealer_id = auth.uid());

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

-- Insert default settings
INSERT INTO public.contact_reveal_settings (max_reveals_per_day)
VALUES (10)
ON CONFLICT DO NOTHING;

-- RLS for settings
ALTER TABLE public.contact_reveal_settings ENABLE ROW LEVEL SECURITY;

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
BEGIN
  -- Get max reveals from settings
  SELECT max_reveals_per_day INTO max_reveals
  FROM public.contact_reveal_settings
  LIMIT 1;

  -- Count reveals in last 24 hours
  SELECT COUNT(*) INTO reveal_count
  FROM public.contact_reveals
  WHERE revealer_id = user_id
    AND created_at > now() - interval '24 hours';

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
BEGIN
  -- Get max reveals from settings
  SELECT max_reveals_per_day INTO max_reveals
  FROM public.contact_reveal_settings
  LIMIT 1;

  -- Count reveals in last 24 hours
  SELECT COUNT(*) INTO reveal_count
  FROM public.contact_reveals
  WHERE revealer_id = user_id
    AND created_at > now() - interval '24 hours';

  -- Return remaining
  RETURN GREATEST(0, max_reveals - reveal_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_remaining_contact_reveals(uuid) TO authenticated;

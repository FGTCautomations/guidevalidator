-- Add subscription-based rate limits

-- Add columns for different subscription tiers
ALTER TABLE public.contact_reveal_settings
  ADD COLUMN IF NOT EXISTS max_reveals_free integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_reveals_pro integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS max_reveals_dmc integer NOT NULL DEFAULT 50;

-- Update existing row to have the new defaults
UPDATE public.contact_reveal_settings
SET
  max_reveals_free = 10,
  max_reveals_pro = 50,
  max_reveals_dmc = 50
WHERE max_reveals_free IS NULL OR max_reveals_pro IS NULL OR max_reveals_dmc IS NULL;

-- Update the rate limit check function to consider subscriptions
CREATE OR REPLACE FUNCTION public.check_contact_reveal_rate_limit(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reveal_count integer;
  max_reveals integer;
  user_role text;
  user_subscription text;
  is_admin boolean;
BEGIN
  -- Check if user is admin (admins have no limit)
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;

  IF user_role IN ('admin', 'super_admin') THEN
    RETURN true;
  END IF;

  -- Get user's subscription tier from billing_subscriptions
  SELECT tier INTO user_subscription
  FROM public.billing_subscriptions
  WHERE profile_id = user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get max reveals based on subscription tier
  SELECT
    CASE
      -- Pro subscription for guides or agencies
      WHEN user_subscription IN ('guide_premium', 'agency_pro', 'transport_growth') THEN max_reveals_pro
      -- DMC multi-market subscription
      WHEN user_subscription IN ('dmc_multimarket', 'dmc_enterprise') THEN max_reveals_dmc
      -- Free tier or no subscription
      ELSE max_reveals_free
    END INTO max_reveals
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

-- Update the remaining reveals function
CREATE OR REPLACE FUNCTION public.get_remaining_contact_reveals(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reveal_count integer;
  max_reveals integer;
  user_role text;
  user_subscription text;
BEGIN
  -- Check if user is admin (admins have no limit)
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;

  IF user_role IN ('admin', 'super_admin') THEN
    RETURN 999999; -- Return a large number for admins
  END IF;

  -- Get user's subscription tier from billing_subscriptions
  SELECT tier INTO user_subscription
  FROM public.billing_subscriptions
  WHERE profile_id = user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get max reveals based on subscription tier
  SELECT
    CASE
      -- Pro subscription for guides or agencies
      WHEN user_subscription IN ('guide_premium', 'agency_pro', 'transport_growth') THEN max_reveals_pro
      -- DMC multi-market subscription
      WHEN user_subscription IN ('dmc_multimarket', 'dmc_enterprise') THEN max_reveals_dmc
      -- Free tier or no subscription
      ELSE max_reveals_free
    END INTO max_reveals
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

-- Add comment to explain the subscription tiers
COMMENT ON COLUMN public.contact_reveal_settings.max_reveals_free IS 'Rate limit for free tier users (default 10/day)';
COMMENT ON COLUMN public.contact_reveal_settings.max_reveals_pro IS 'Rate limit for pro subscription users (default 50/day)';
COMMENT ON COLUMN public.contact_reveal_settings.max_reveals_dmc IS 'Rate limit for DMC multi-market subscription users (default 50/day)';

-- Create initial billing plans for the platform
-- This migration adds basic and premium plans for guides

-- Insert basic free plan for guides
INSERT INTO billing_plans (
  plan_code,
  amount_cents,
  currency,
  interval,
  interval_count,
  description,
  target_role,
  is_active
) VALUES (
  'guide_basic_free',
  0,
  'EUR',
  'year',
  1,
  'Basic guide profile - Free listing in directory',
  'guide',
  true
) ON CONFLICT (plan_code) DO NOTHING;

-- Insert premium plan for guides (Featured profiles)
INSERT INTO billing_plans (
  plan_code,
  amount_cents,
  currency,
  interval,
  interval_count,
  description,
  target_role,
  is_active
) VALUES (
  'guide_premium_monthly',
  2900,
  'EUR',
  'month',
  1,
  'Premium guide profile - Featured listing, priority placement, enhanced visibility',
  'guide',
  true
) ON CONFLICT (plan_code) DO NOTHING;

-- Insert premium annual plan for guides (Featured profiles, discounted)
INSERT INTO billing_plans (
  plan_code,
  amount_cents,
  currency,
  interval,
  interval_count,
  description,
  target_role,
  is_active
) VALUES (
  'guide_premium_yearly',
  29900,
  'EUR',
  'year',
  1,
  'Premium guide profile - Featured listing, priority placement, enhanced visibility (Annual)',
  'guide',
  true
) ON CONFLICT (plan_code) DO NOTHING;

COMMENT ON TABLE billing_plans IS 'Defines available subscription plans. Premium plans (guide_premium_*) grant Featured status.';

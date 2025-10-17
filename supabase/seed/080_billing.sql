-- Seed billing plans for Stripe integration (travel agents, DMCs, guides)
insert into public.billing_plans (plan_code, stripe_product_id, stripe_price_id, amount_cents, currency, interval, interval_count, description, target_role)
values
  ('agent_onboarding_fee', 'prod_agent_onboarding', 'price_agent_onboarding', 20000, 'EUR', 'one_time', 1, 'One-time onboarding fee for travel agencies accessing DMCs and guides', 'agency'),
  ('agent_monthly_subscription', 'prod_agent_subscription', 'price_agent_monthly', 5000, 'EUR', 'month', 1, 'Monthly access for travel agencies discovering DMCs and guides', 'agency'),
  ('dmc_onboarding_fee', 'prod_dmc_onboarding', 'price_dmc_onboarding', 10000, 'EUR', 'one_time', 1, 'One-time promotional setup fee for DMCs', 'dmc'),
  ('dmc_monthly_subscription', 'prod_dmc_subscription', 'price_dmc_monthly', 2500, 'EUR', 'month', 1, 'Monthly visibility subscription for DMCs', 'dmc'),
  ('guide_premium_monthly', 'prod_guide_premium', 'price_guide_premium_monthly', 1000, 'EUR', 'month', 1, 'Optional premium listing boost for guides', 'guide'),
  ('guide_verification_annual', 'prod_guide_verification', 'price_guide_verification', 2500, 'EUR', 'year', 1, 'Annual verified badge renewal for licensed guides', 'guide')
on conflict (plan_code) do update
set stripe_product_id = excluded.stripe_product_id,
    stripe_price_id = excluded.stripe_price_id,
    amount_cents = excluded.amount_cents,
    currency = excluded.currency,
    interval = excluded.interval,
    interval_count = excluded.interval_count,
    description = excluded.description,
    target_role = excluded.target_role,
    is_active = true,
    updated_at = now();

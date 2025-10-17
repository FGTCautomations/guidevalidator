# Billing Plans & Stripe Integration

## Plan Codes
| Plan | Code | Amount | Interval | Notes |
| --- | --- | --- | --- | --- |
| Travel agent onboarding | `agent_onboarding_fee` | €200 | one time | Required before monthly access |
| Travel agent subscription | `agent_monthly_subscription` | €50 | monthly | Access to DMC and guide directory |
| DMC onboarding | `dmc_onboarding_fee` | €100 | one time | Promotional setup for visibility |
| DMC subscription | `dmc_monthly_subscription` | €25 | monthly | Promotes DMC to agents and guides |
| Guide premium | `guide_premium_monthly` | €10 | monthly | Optional featured placement for guides |
| Guide verification | `guide_verification_annual` | €25 | yearly | Annual verified badge renewal |

These entries are seeded via `supabase/seed/080_billing.sql`. Update the `stripe_product_id` and `stripe_price_id` columns to match live Stripe objects.

## Checkout Actions
`app/_actions/billing.ts` exposes two server actions:

- `startGuidePremiumCheckout(locale)` – creates a subscription checkout session for the premium listing plan.
- `startGuideVerificationCheckout(locale)` – creates a single payment checkout session for the annual verification badge.

The actions:
1. Ensure an authenticated Supabase user.
2. Fetch the active billing plan from Supabase.
3. Create or reuse a `billing_customers` row with a Stripe customer id.
4. Generate a Stripe Checkout session via REST helpers in `lib/payments/stripe.ts`.

Both actions return `{ ok: true, url }` on success or `{ ok: false, message }` when configuration is missing (e.g., no `STRIPE_SECRET_KEY`).

## Webhooks & Event Storage
Stripe webhooks should be pointed to `/api/webhooks/stripe`. Events are logged into `billing_events` for later processing. Implement subscription synchronization under the `TODO` comment in that route once webhook payloads are known.

## Required Environment Variables
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

Checkout URLs default to `http://localhost:3000` when `NEXT_PUBLIC_APP_URL` is not provided.

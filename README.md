# Guide Validator Platform

Multilingual B2B marketplace connecting licensed tour guides, travel agencies, DMCs, and transport partners with compliance-first infrastructure.

## Project Structure
- `app/` - Next.js 14 App Router entrypoints, localized via `next-intl`.
- `i18n/` - locale registry and runtime helpers.
- `supabase/` - database migrations, seeds, and configuration.
- `docs/` - architecture notes (`database-foundation.md`, `ops-worker-runbook.md`, etc.).

## Local Development
1. Install dependencies: `npm install`.
2. Copy environment variables: `cp .env.example .env.local` (already provisioned during bootstrap) and update the values for your Supabase, Stripe, Resend, and Redis keys.
3. Run development server: `npm run dev` (defaults to http://localhost:3000).

### Environment Variables
- `.env.local` now contains sample Supabase credentials (anon key, service role, DB URL). **Rotate these secrets in Supabase and replace them locally before using the project.**
- Keep production credentials out of version control; rely on the template in `.env.example` when onboarding new environments.

### Linting & Type Safety
- `npm run lint` - ESLint (Next.js rules).
- CI placeholder: add `supabase db lint`, frontend build, and pgTAP tests once pipelines are set up.

## Authentication Overview
- Supabase client utilities live in `lib/supabase/` (browser, server, service).
- Public auth routes (localized under `/:locale/auth/...`):
  - `sign-in` — email/password form wired to Supabase server action (`signInAction`).
  - `sign-up` — account creation scaffold with verification redirect to `check-email`.
  - `check-email` — confirmation notice with planned resend button.
  - `reset-password` — placeholder for request/update flows (UI only for now).
- Signed-in headers display the current user email and execute the server action `signOutAction` via the `SignOutButton` component.

## Supabase Workflow
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
2. Link project: `supabase link --project-ref <PROJECT_ID>`
3. Push migrations: `supabase db push`
4. Lint migrations locally: `supabase db lint`
5. Run seeds as needed:
   ```bash
   # Countries & regions
   psql "$SUPABASE_DB_URL" -v SEED_DIR="$(pwd)/supabase/seed" \
     -f supabase/seed/000_countries.sql
   psql "$SUPABASE_DB_URL" -v SEED_DIR="$(pwd)/supabase/seed" \
     -f supabase/seed/010_regions.sql

   # Feature flags & demo accounts
   psql "$SUPABASE_DB_URL" -f supabase/seed/030_feature_flags.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/020_demo_accounts.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/040_transport.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/050_messaging.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/060_reviews.sql
   ```

Demo credentials (development only): see `supabase/seed/README.md`.

## Next Steps
- Hook up password reset server actions (Supabase `auth.resetPasswordForEmail` / `auth.updateUser`).
- Add session-aware navigation (profile menu, organization switcher) and restrict dashboard routes.
- Implement Stripe + Resend integrations following environment placeholders in `.env.example`.
- Add automated tests covering schema policies and navigation flows.

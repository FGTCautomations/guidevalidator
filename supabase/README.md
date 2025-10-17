# Supabase Project Structure

This directory stores the infrastructure-as-code assets for the Supabase backend.

- `config.toml` — Supabase CLI configuration stub; replace placeholders once the project is provisioned.
- `migrations/` — ordered SQL migrations (`YYYYMMDDHHMMSS_description.sql`).
- `seed/` — seed scripts for bootstrap data (countries, roles, demo accounts).

## Getting Started
1. Install the Supabase CLI: https://supabase.com/docs/guides/cli
2. Authenticate: `supabase login`
3. Link the project: `supabase link --project-ref <PROJECT_ID>`
4. Run migrations locally: `supabase db push`

Keep migrations atomic and idempotent; prefer view/materialized view + RLS helpers for complex policies.

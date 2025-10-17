# Supabase Seeds

## File Overview
- `000_countries.sql` - imports baseline countries from `data/countries.csv` (extend list as needed).
- `010_regions.sql` - loads sample regions per country from `data/regions.csv`.
- `020_demo_accounts.sql` - creates sample Super Admin, Admin + Agency, and Guide accounts with hashed passwords.
- `030_feature_flags.sql` - toggles default feature flags (directory filters, chat attachments, job matching).
- `040_transport.sql` - seeds sample transport fleet coverage for Atlas Travel.
- `050_messaging.sql` - creates a demo conversation and welcome message between admin and guide.
- `060_reviews.sql` - inserts mutual reviews for seeded guide and agency to populate rating summaries.
- `070_directory.sql` - seeds additional guides, DMCs, and transport fleet entries for demo listings.
- `080_billing.sql` - configures billing plans and sample Stripe metadata.
- `090_test_profiles.sql` - adds clearly labeled test guide, agency, DMC, and transport accounts (password "TestPass123!").
- `data/countries.csv` - starter dataset; replace with authoritative ISO dump before production.
- `data/regions.csv` - lightweight subset for local testing; swap with full ISO-3166-2 list in staging.

## Usage
1. Start local stack: `supabase start` (or connect with `supabase db remote commit`).
2. Run seeds as required:
   ```bash
   # Countries & regions
   psql "$SUPABASE_DB_URL" -v SEED_DIR='$(pwd)/supabase/seed' \
     -f supabase/seed/000_countries.sql
   psql "$SUPABASE_DB_URL" -v SEED_DIR='$(pwd)/supabase/seed' \
     -f supabase/seed/010_regions.sql

   # Feature flags & demo data
   psql "$SUPABASE_DB_URL" -f supabase/seed/030_feature_flags.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/020_demo_accounts.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/040_transport.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/050_messaging.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/060_reviews.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/070_directory.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/080_billing.sql
   psql "$SUPABASE_DB_URL" -f supabase/seed/090_test_profiles.sql
   ```

All demo accounts use password `SecurePass123!`. Newly added QA accounts use password `TestPass123!`. Rotate secrets before production launch.

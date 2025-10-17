# QA Fixtures

Seed file `supabase/seed/090_test_profiles.sql` provisions deterministic accounts representing each marketplace role. Run it after the standard demo seeds to guarantee these entries appear in the directory and profile views.

## Accounts

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin | `admin.qa@guidevalidator.test` | `TestAdmin123!` | Super admin with full dashboard access for QA. |
| Guide | `test.guide@guidevalidator.test` | `TestPass123!` | Verified guide covering Berlin; specialties include `qa-testing` tag so it is easy to spot in listings. |
| Travel agency | `test.agent@guidevalidator.test` | `TestPass123!` | Owner of **Test Travel Agency** (USA) seeded for agency workflows. |
| DMC | `test.dmc@guidevalidator.test` | `TestPass123!` | Featured Iberia-focused DMC for directory visibility tests. |
| Transport | `test.transport@guidevalidator.test` | `TestPass123!` | Transport operator with wheelchair/VIP fleet metadata. |

## Surfacing in the Web App

- Visit `/{locale}/admin` and log in with the QA admin credentials above to access the dashboard.
- Open `/{locale}/directory` - the "Guides" tab lists "Test Guide" near the top thanks to the created-at sort order. Tags show `qa-testing` for quick identification.
- Switch to the "DMCs" tab to see "Test Destination Management" (featured + verified). The "Transport" tab contains "Test Transport Co".
- Click each listing to land on the relevant profile page (e.g. `/{locale}/profiles/guide/{id}`) and validate layout data.

If you rerun seeds, Supabase upserts keep IDs stable, so deep links remain valid for automated regression scripts.

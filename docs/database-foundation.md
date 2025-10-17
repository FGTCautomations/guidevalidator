# Database Foundations

## Implemented in `20250925180000_initial_core.sql`
- **Enumerations**: `user_role`, `agency_type`, `org_member_role`, `credential_status` to enforce consistent categorical values.
- **Profiles**: Mirrors `auth.users` accounts with locale, verification flags, and optional link to an owning organization.
- **Organizations**: `agencies` table covers Agencies, DMCs, and Transport Companies with brand + compliance metadata.
- **Memberships**: `agency_members` ties people to organizations with role-based responsibilities and timestamps.
- **Guides**: Profile extension for guides with specialties, languages, and compliance metadata.
- **Credentials**: Tracks guide licensing artifacts with review metadata and storage pointers.
- **Geography**: Core `countries`, `regions`, `cities` hierarchy plus join tables for guide coverage.
- **Compliance**: `country_licensing_rules` table to inform onboarding enforcement and directory messaging.
- **Timestamps**: `touch_updated_at` trigger keeps `updated_at` accurate across mutable tables.

## Security & RLS (`20250925181500_core_rls.sql` & `20250925191500_rls_extended.sql`)
### Helper Functions
- `public.current_profile_id()` — wraps `auth.uid()` for readability in policies.
- `public.is_admin()`, `public.is_super_admin()` — gate elevated operations.
- `public.is_org_member(target_agency uuid)` — ensures only active members act on an organization.
- Conversation/job/subscription helpers enforce participant or member ownership.

### Policy Highlights
- **Profiles**: self-read/write with admin override; inserts constrained to authenticated user id.
- **Organizations**: public read, membership/admin controls for mutations.
- **Guides & Credentials**: public read, self-manage, admin override.
- **Messaging**: conversations/messages scoped to participants (admins override).
- **Jobs & Shortlists**: agency members manage their own records.
- **Payments**: restricted to organization members + admins.
- **Reviews & Availability**: owners and admins only; summaries exposed publicly.
- **Compliance Tables**: audit logs, strikes, feature flags etc. limited to admins (super-admin only for impersonation logs).

## Feature Domains
### Reviews & Availability (`20250925184500_reviews_availability.sql`)
- Multi-axis reviews for guides, agencies, transport with summary tables.
- Calendar sync accounts, availability slots, and holds enable scheduling + cooldown workflows.
- Summaries refreshed by triggers in `20250925193000_triggers_functions.sql`.

### Compliance & Trust (`20250925190000_compliance_audit.sql`)
- `audit_logs`, `impersonation_logs`, and `mfa_reset_tokens` support step-up tracking.
- `strikes`, `moderation_queue`, `banners`, `feature_flags` deliver admin tooling foundations.
- Consent + legal coverage: `terms_versions`, `consents`, `dsar_requests`.
- Engagement & safety: referrals, badges, honey tokens, referral events.

### Automation Helpers (`20250925193000_triggers_functions.sql`)
- Ratings summary refresh functions for guides/agencies/transport.
- Conflict guards preventing overlapping availability slots vs. holds.
- Utility checks for scheduling collisions exposed for future API usage.

### Transport & Media (`20250925194500_transport_media.sql`)
- Transport fleet tables plus coverage joins for directory filters.
- Centralized `file_uploads` & `file_moderation_events` to route storage + review lifecycle.
- `message_attachments` ties chat records to stored media with participant-aware RLS.

### Job Orchestration (`20250925195500_jobs_workers.sql`)
- Extended `jobs_queue` with locking, priority, retries, plus `job_runs` audit trails.
- `cron_tasks` registry + helper functions (`claim_next_job`, `resolve_job`, `enqueue_cron_tasks`) ready for worker rollout.

## Seed Tooling (`supabase/seed`)
- `000_countries.sql` & `010_regions.sql` load starter geography data (replace with authoritative ISO datasets before launch).
- `020_demo_accounts.sql` provisions Super Admin, Admin + Agency, Guide demo identities (password `SecurePass123!`).
- `030_feature_flags.sql` seeds default rollout toggles.
- `040_transport.sql` adds transport fleet + coverage data for Atlas Travel.
- `050_messaging.sql` seeds admin/guide conversation with welcome message.
- `060_reviews.sql` provides initial cross-role reviews to drive rating summaries.
- `070_directory.sql` seeds additional guides, DMCs, and transport listings for the directory demo.

See `supabase/seed/README.md` for execution commands with the Supabase CLI/psql.

## Outstanding Items
1. Implement `jobs_queue` workers (cron) for OCR, renewals, moderation notifications.
2. Expand seeds: city list, sample conversations/messages, review fixtures for QA.
3. Write automated tests for RLS (pgTAP or Supabase test harness) and schedule `supabase db lint` in CI.
4. Diagram data flow for DSAR exports + audit log retention.

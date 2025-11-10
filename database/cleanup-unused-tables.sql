-- ============================================================================
-- CLEANUP UNUSED SUPABASE TABLES
-- ============================================================================
-- This script removes tables that are not referenced anywhere in the codebase
--
-- ⚠️  IMPORTANT: Make a backup before running this script!
--     Run: pg_dump -h [host] -U postgres -d postgres > backup.sql
--
-- Total tables to drop: 40
-- Date: 2025-11-10
-- ============================================================================

-- Disable foreign key checks temporarily (if needed)
-- SET session_replication_role = 'replica';

-- ============================================================================
-- MEMBERSHIP & AGENCY FEATURES (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS agency_members CASCADE;          -- Team member management
DROP TABLE IF EXISTS archived_accounts CASCADE;       -- Account archiving

-- ============================================================================
-- GAMIFICATION & BADGES (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS badges CASCADE;                  -- Badge definitions
DROP TABLE IF EXISTS profile_badges CASCADE;          -- User badge assignments

-- ============================================================================
-- ALTERNATIVE ADVERTISING TABLES (using 'ads' instead)
-- ============================================================================
DROP TABLE IF EXISTS banners CASCADE;                 -- Old banner system
DROP TABLE IF EXISTS sponsored_listings CASCADE;      -- Old sponsorship system

-- ============================================================================
-- CALENDAR SYNC (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS calendar_accounts CASCADE;       -- Calendar integrations

-- ============================================================================
-- CONTACT REVEAL SYSTEM (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS contact_reveal_settings CASCADE; -- Contact reveal config
DROP TABLE IF EXISTS contact_reveals CASCADE;         -- Contact reveal logs

-- ============================================================================
-- CONSENT MANAGEMENT (using user_consents or other system)
-- ============================================================================
DROP TABLE IF EXISTS consents CASCADE;                -- Consent definitions

-- ============================================================================
-- UNUSED ADMIN/MONITORING TABLES
-- ============================================================================
DROP TABLE IF EXISTS cron_tasks CASCADE;              -- Cron job tracking
DROP TABLE IF EXISTS job_runs CASCADE;                -- Background job runs
DROP TABLE IF EXISTS jobs_queue CASCADE;              -- Job queue

-- ============================================================================
-- LOCATION DATA (not used)
-- ============================================================================
DROP TABLE IF EXISTS entity_locations CASCADE;        -- Generic location tracking
DROP TABLE IF EXISTS national_parks CASCADE;          -- Parks database
DROP TABLE IF EXISTS national_parks_stage CASCADE;    -- Parks staging
DROP TABLE IF EXISTS tourist_attractions CASCADE;     -- Attractions database

-- ============================================================================
-- FEATURE FLAGS (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS feature_flags CASCADE;           -- A/B testing flags

-- ============================================================================
-- FILE MANAGEMENT (not used)
-- ============================================================================
DROP TABLE IF EXISTS file_moderation_events CASCADE;  -- File moderation logs
DROP TABLE IF EXISTS file_uploads CASCADE;            -- File upload tracking

-- ============================================================================
-- GDPR ALTERNATIVE TABLES (using dsar_requests instead)
-- ============================================================================
DROP TABLE IF EXISTS gdpr_audit_log CASCADE;          -- Using audit_logs instead
DROP TABLE IF EXISTS user_consents CASCADE;           -- Using other consent system

-- ============================================================================
-- STAGING TABLES (old import system)
-- ============================================================================
DROP TABLE IF EXISTS guides_staging CASCADE;          -- Old staging table

-- ============================================================================
-- AVAILABILITY ALTERNATIVE (using availability_holds instead)
-- ============================================================================
DROP TABLE IF EXISTS holds CASCADE;                   -- Old holds system

-- ============================================================================
-- SECURITY FEATURES (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS honey_tokens CASCADE;            -- Honeypot tokens
DROP TABLE IF EXISTS impersonation_logs CASCADE;      -- Admin impersonation logs
DROP TABLE IF EXISTS mfa_reset_tokens CASCADE;        -- MFA reset tokens

-- ============================================================================
-- MESSAGING FEATURES (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS message_reactions CASCADE;       -- Emoji reactions

-- ============================================================================
-- CONTENT MODERATION (not fully implemented)
-- ============================================================================
DROP TABLE IF EXISTS moderation_queue CASCADE;        -- Content moderation queue
DROP TABLE IF EXISTS strikes CASCADE;                 -- User strikes
DROP TABLE IF EXISTS user_strikes CASCADE;            -- User strike tracking

-- ============================================================================
-- REFERRAL PROGRAM (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS referral_events CASCADE;         -- Referral event tracking
DROP TABLE IF EXISTS referrals CASCADE;               -- Referral program

-- ============================================================================
-- SUBSCRIPTION FEATURES (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS renewal_events CASCADE;          -- Renewal tracking

-- ============================================================================
-- SAVED SEARCHES (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS saved_search_runs CASCADE;       -- Saved search alerts
DROP TABLE IF EXISTS saved_searches CASCADE;          -- User saved searches

-- ============================================================================
-- SHORTLISTS/FAVORITES (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS shortlist_items CASCADE;         -- Shortlist items
DROP TABLE IF EXISTS shortlists CASCADE;              -- User shortlists

-- ============================================================================
-- LEGAL/COMPLIANCE (not implemented)
-- ============================================================================
DROP TABLE IF EXISTS terms_versions CASCADE;          -- Terms version history

-- ============================================================================
-- TRANSPORT FEATURES (not fully implemented)
-- ============================================================================
DROP TABLE IF EXISTS transport_fleet CASCADE;         -- Vehicle fleet management

-- Re-enable foreign key checks
-- SET session_replication_role = 'origin';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after cleanup to verify which tables remain:
--
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_type = 'BASE TABLE'
-- ORDER BY table_name;
--
-- Expected remaining tables (36):
-- - profiles, guides, agencies, guide_credentials
-- - countries, regions, cities, country_licensing_rules
-- - reviews, review_responses
-- - availability_slots, availability_holds
-- - conversations, messages, conversation_participants, message_attachments
-- - jobs, job_applications
-- - ads, ad_clicks
-- - billing_customers, billing_plans, subscriptions, payments, billing_events
-- - abuse_reports, audit_logs, dsar_requests
-- - profile_claim_tokens, staging_imports
-- ============================================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Cleanup completed! 40 unused tables have been dropped.';
  RAISE NOTICE 'Verify remaining tables with the query in the comments above.';
END $$;

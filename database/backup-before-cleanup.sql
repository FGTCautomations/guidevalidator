-- ============================================================================
-- BACKUP SCRIPT - Run BEFORE cleanup-unused-tables.sql
-- ============================================================================
-- This exports data from tables that will be deleted
-- Run this first to preserve any data you might need later
-- ============================================================================

-- Create a backup schema for archived tables
CREATE SCHEMA IF NOT EXISTS archived_tables;

-- ============================================================================
-- BACKUP UNUSED TABLES (with data)
-- ============================================================================

-- Membership & Agency
CREATE TABLE IF NOT EXISTS archived_tables.agency_members AS SELECT * FROM agency_members;
CREATE TABLE IF NOT EXISTS archived_tables.archived_accounts AS SELECT * FROM archived_accounts;

-- Gamification
CREATE TABLE IF NOT EXISTS archived_tables.badges AS SELECT * FROM badges;
CREATE TABLE IF NOT EXISTS archived_tables.profile_badges AS SELECT * FROM profile_badges;

-- Advertising
CREATE TABLE IF NOT EXISTS archived_tables.banners AS SELECT * FROM banners;
CREATE TABLE IF NOT EXISTS archived_tables.sponsored_listings AS SELECT * FROM sponsored_listings;

-- Calendar
CREATE TABLE IF NOT EXISTS archived_tables.calendar_accounts AS SELECT * FROM calendar_accounts;

-- Contact Reveal
CREATE TABLE IF NOT EXISTS archived_tables.contact_reveal_settings AS SELECT * FROM contact_reveal_settings;
CREATE TABLE IF NOT EXISTS archived_tables.contact_reveals AS SELECT * FROM contact_reveals;

-- Consent
CREATE TABLE IF NOT EXISTS archived_tables.consents AS SELECT * FROM consents;
CREATE TABLE IF NOT EXISTS archived_tables.user_consents AS SELECT * FROM user_consents;

-- Admin/Monitoring
CREATE TABLE IF NOT EXISTS archived_tables.cron_tasks AS SELECT * FROM cron_tasks;
CREATE TABLE IF NOT EXISTS archived_tables.job_runs AS SELECT * FROM job_runs;
CREATE TABLE IF NOT EXISTS archived_tables.jobs_queue AS SELECT * FROM jobs_queue;

-- Location Data
CREATE TABLE IF NOT EXISTS archived_tables.entity_locations AS SELECT * FROM entity_locations;
CREATE TABLE IF NOT EXISTS archived_tables.national_parks AS SELECT * FROM national_parks;
CREATE TABLE IF NOT EXISTS archived_tables.national_parks_stage AS SELECT * FROM national_parks_stage;
CREATE TABLE IF NOT EXISTS archived_tables.tourist_attractions AS SELECT * FROM tourist_attractions;

-- Feature Flags
CREATE TABLE IF NOT EXISTS archived_tables.feature_flags AS SELECT * FROM feature_flags;

-- File Management
CREATE TABLE IF NOT EXISTS archived_tables.file_moderation_events AS SELECT * FROM file_moderation_events;
CREATE TABLE IF NOT EXISTS archived_tables.file_uploads AS SELECT * FROM file_uploads;

-- GDPR
CREATE TABLE IF NOT EXISTS archived_tables.gdpr_audit_log AS SELECT * FROM gdpr_audit_log;

-- Staging
CREATE TABLE IF NOT EXISTS archived_tables.guides_staging AS SELECT * FROM guides_staging;

-- Availability
CREATE TABLE IF NOT EXISTS archived_tables.holds AS SELECT * FROM holds;

-- Security
CREATE TABLE IF NOT EXISTS archived_tables.honey_tokens AS SELECT * FROM honey_tokens;
CREATE TABLE IF NOT EXISTS archived_tables.impersonation_logs AS SELECT * FROM impersonation_logs;
CREATE TABLE IF NOT EXISTS archived_tables.mfa_reset_tokens AS SELECT * FROM mfa_reset_tokens;

-- Messaging
CREATE TABLE IF NOT EXISTS archived_tables.message_reactions AS SELECT * FROM message_reactions;

-- Moderation
CREATE TABLE IF NOT EXISTS archived_tables.moderation_queue AS SELECT * FROM moderation_queue;
CREATE TABLE IF NOT EXISTS archived_tables.strikes AS SELECT * FROM strikes;
CREATE TABLE IF NOT EXISTS archived_tables.user_strikes AS SELECT * FROM user_strikes;

-- Referrals
CREATE TABLE IF NOT EXISTS archived_tables.referral_events AS SELECT * FROM referral_events;
CREATE TABLE IF NOT EXISTS archived_tables.referrals AS SELECT * FROM referrals;

-- Renewals
CREATE TABLE IF NOT EXISTS archived_tables.renewal_events AS SELECT * FROM renewal_events;

-- Saved Searches
CREATE TABLE IF NOT EXISTS archived_tables.saved_search_runs AS SELECT * FROM saved_search_runs;
CREATE TABLE IF NOT EXISTS archived_tables.saved_searches AS SELECT * FROM saved_searches;

-- Shortlists
CREATE TABLE IF NOT EXISTS archived_tables.shortlist_items AS SELECT * FROM shortlist_items;
CREATE TABLE IF NOT EXISTS archived_tables.shortlists AS SELECT * FROM shortlists;

-- Terms
CREATE TABLE IF NOT EXISTS archived_tables.terms_versions AS SELECT * FROM terms_versions;

-- Transport
CREATE TABLE IF NOT EXISTS archived_tables.transport_fleet AS SELECT * FROM transport_fleet;

-- ============================================================================
-- VERIFICATION - Check row counts
-- ============================================================================

SELECT
  schemaname,
  relname as table_name,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'archived_tables'
ORDER BY relname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Backup completed! All unused tables have been archived to "archived_tables" schema.';
  RAISE NOTICE 'You can now safely run cleanup-unused-tables.sql';
  RAISE NOTICE 'To restore a table: CREATE TABLE public.table_name AS SELECT * FROM archived_tables.table_name;';
END $$;

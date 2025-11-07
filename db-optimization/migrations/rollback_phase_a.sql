-- ============================================================================
-- ROLLBACK PHASE A: Remove Additive Changes
-- Purpose: Revert all additive changes from Phase A
-- Use When: Phase A caused issues or needs to be reapplied
-- ============================================================================

\timing on
\echo '\n=== ROLLBACK PHASE A ===\n'

\echo '⚠️  This will remove all objects created in Phase A\n'
\echo 'Existing queries will continue to work (they don't use new objects yet)\n'
\echo 'Press Ctrl+C to abort, or wait 5 seconds to continue...\n'

SELECT pg_sleep(5);

-- ============================================================================
-- STEP R1: DROP TRIGGERS
-- ============================================================================

\echo 'R1: Dropping triggers\n'

DROP TRIGGER IF EXISTS trg_update_conversation_participants ON conversation_participants;
DROP TRIGGER IF EXISTS trg_update_profile_search_vector ON profiles;

\echo 'Triggers dropped\n'

-- ============================================================================
-- STEP R2: DROP FUNCTIONS
-- ============================================================================

\echo 'R2: Dropping functions\n'

DROP FUNCTION IF EXISTS update_conversation_participants() CASCADE;
DROP FUNCTION IF EXISTS update_profile_search_vector() CASCADE;
DROP FUNCTION IF EXISTS sync_profile_stats_cache() CASCADE;
DROP FUNCTION IF EXISTS refresh_matview_with_logging(TEXT) CASCADE;

\echo 'Functions dropped\n'

-- ============================================================================
-- STEP R3: DROP MATERIALIZED VIEWS
-- ============================================================================

\echo 'R3: Dropping materialized views\n'

DROP MATERIALIZED VIEW IF EXISTS mv_user_engagement CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_platform_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_location_popularity CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_job_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_conversation_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_availability_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_agency_stats CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_profile_stats CASCADE;

\echo 'Materialized views dropped\n'

-- ============================================================================
-- STEP R4: DROP REGULAR VIEWS
-- ============================================================================

\echo 'R4: Dropping regular views\n'

DROP VIEW IF EXISTS vw_unesco_sites CASCADE;
DROP VIEW IF EXISTS vw_major_cities CASCADE;
DROP VIEW IF EXISTS vw_subscription_status CASCADE;
DROP VIEW IF EXISTS vw_pending_applications CASCADE;
DROP VIEW IF EXISTS vw_active_jobs CASCADE;
DROP VIEW IF EXISTS vw_available_slots CASCADE;
DROP VIEW IF EXISTS vw_published_reviews CASCADE;
DROP VIEW IF EXISTS vw_user_conversations CASCADE;
DROP VIEW IF EXISTS vw_conversation_list CASCADE;
DROP VIEW IF EXISTS vw_agency_profile_detail CASCADE;
DROP VIEW IF EXISTS vw_guide_profile_detail CASCADE;
DROP VIEW IF EXISTS vw_transport_directory CASCADE;
DROP VIEW IF EXISTS vw_dmc_directory CASCADE;
DROP VIEW IF EXISTS vw_agency_directory CASCADE;
DROP VIEW IF EXISTS vw_guide_directory CASCADE;

\echo 'Regular views dropped\n'

-- ============================================================================
-- STEP R5: DROP INDEXES
-- ============================================================================

\echo 'R5: Dropping indexes created in Phase A\n'

-- Note: This list should match all indexes created in index_plan.sql
-- Using CONCURRENTLY to avoid table locks

-- Profiles indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_role;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_verified;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_featured;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_country;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_full_name_search;

-- Guides indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_guides_rate_currency;
DROP INDEX CONCURRENTLY IF EXISTS idx_guides_specialties_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_guides_languages_gin;

-- Agencies indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_agencies_verified_featured;
DROP INDEX CONCURRENTLY IF EXISTS idx_agencies_languages_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_agencies_specialties_gin;

-- Availability indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_availability_provider_date_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_availability_date_available;
DROP INDEX CONCURRENTLY IF EXISTS idx_availability_old_slots;
DROP INDEX CONCURRENTLY IF EXISTS idx_holds_provider_status_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_holds_requester_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_holds_expired;

-- Messaging indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_conversations_last_message;
DROP INDEX CONCURRENTLY IF EXISTS idx_participants_user_unread;
DROP INDEX CONCURRENTLY IF EXISTS idx_participants_unique;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_conversation_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_messages_sender;
DROP INDEX CONCURRENTLY IF EXISTS idx_attachments_message;

-- Reviews indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_reviewee_published;
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_reviewer;
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_type_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_rating_stats;
DROP INDEX CONCURRENTLY IF EXISTS idx_review_responses_review;

-- Jobs indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_employer;
DROP INDEX CONCURRENTLY IF EXISTS idx_jobs_location;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_apps_job_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_job_apps_applicant;

-- Location indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_regions_country;
DROP INDEX CONCURRENTLY IF EXISTS idx_regions_name;
DROP INDEX CONCURRENTLY IF EXISTS idx_cities_country;
DROP INDEX CONCURRENTLY IF EXISTS idx_cities_region;
DROP INDEX CONCURRENTLY IF EXISTS idx_cities_major;
DROP INDEX CONCURRENTLY IF EXISTS idx_cities_name_trgm;
DROP INDEX CONCURRENTLY IF EXISTS idx_parks_country;
DROP INDEX CONCURRENTLY IF EXISTS idx_parks_region;
DROP INDEX CONCURRENTLY IF EXISTS idx_parks_unesco;

-- Audit indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_audit_user_action_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_audit_action_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_audit_entity;
DROP INDEX CONCURRENTLY IF EXISTS idx_reveals_profile;
DROP INDEX CONCURRENTLY IF EXISTS idx_reveals_revealer;
DROP INDEX CONCURRENTLY IF EXISTS idx_reveals_unique;
DROP INDEX CONCURRENTLY IF EXISTS idx_abuse_status_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_abuse_entity;

-- Billing indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_subscriptions_user_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_subscriptions_renewal;
DROP INDEX CONCURRENTLY IF EXISTS idx_subscriptions_stripe;
DROP INDEX CONCURRENTLY IF EXISTS idx_billing_user_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_billing_event_type;

-- Application indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_guide_apps_status_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_agency_apps_status_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_dmc_apps_status_time;
DROP INDEX CONCURRENTLY IF EXISTS idx_transport_apps_status_time;

-- Credentials indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_credentials_guide_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_credentials_expiring;

\echo 'Indexes dropped\n'

-- ============================================================================
-- STEP R6: DROP HELPER COLUMNS
-- ============================================================================

\echo 'R6: Dropping helper columns\n'

ALTER TABLE conversations DROP COLUMN IF EXISTS participant_ids;
ALTER TABLE profiles DROP COLUMN IF EXISTS cached_review_count;
ALTER TABLE profiles DROP COLUMN IF EXISTS cached_avg_rating;
ALTER TABLE profiles DROP COLUMN IF EXISTS stats_updated_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS full_name_tsvector;

\echo 'Helper columns dropped\n'

-- ============================================================================
-- STEP R7: DROP MONITORING TABLE
-- ============================================================================

\echo 'R7: Dropping monitoring infrastructure\n'

DROP TABLE IF EXISTS matview_refresh_log CASCADE;

\echo 'Monitoring table dropped\n'

-- ============================================================================
-- STEP R8: VERIFY ROLLBACK
-- ============================================================================

\echo 'R8: Verifying rollback\n'

-- Check that objects are gone
SELECT
    'Materialized Views Remaining' AS check_name,
    COUNT(*)::text AS count
FROM pg_matviews
WHERE schemaname = 'public'

UNION ALL

SELECT
    'Views Remaining',
    COUNT(*)::text
FROM pg_views
WHERE schemaname = 'public' AND viewname LIKE 'vw_%'

UNION ALL

SELECT
    'Indexes Remaining (idx_*)',
    COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public' AND indexname LIKE 'idx_%'

UNION ALL

SELECT
    'Helper Columns Remaining',
    COUNT(*)::text
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name IN ('participant_ids', 'cached_review_count', 'full_name_tsvector');

\echo '\n=== PHASE A ROLLBACK COMPLETE ===\n'
\echo 'All Phase A objects removed\n'
\echo 'Database returned to pre-optimization state\n'
\echo '\nIf rollback counts show 0, rollback was successful\n'
\echo '\nYou can now:\n'
\echo '1. Fix issues that caused the need for rollback\n'
\echo '2. Re-run phase_a_additive.sql when ready\n'

\timing off

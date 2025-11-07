-- ============================================================================
-- INDEX OPTIMIZATION PLAN for Guide Validator
-- Purpose: Add missing indexes, remove unused ones
-- Impact: Improve query performance for directory, search, and messaging
-- ============================================================================

-- SAFETY: All index operations use CONCURRENTLY to avoid table locks
-- Run during low-traffic periods if possible

\timing on
\echo '\n=== INDEX OPTIMIZATION PLAN ===\n'

-- ============================================================================
-- PHASE 1: CRITICAL PERFORMANCE INDEXES (Apply First)
-- ============================================================================

\echo 'PHASE 1: Critical Performance Indexes\n'

-- profiles: Role-based filtering (directory queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role
    ON profiles(role)
    WHERE deleted_at IS NULL;
COMMENT ON INDEX idx_profiles_role IS 'Filter active users by role for directory';

-- profiles: Verified filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_verified
    ON profiles(verified)
    WHERE verified = true AND deleted_at IS NULL;
COMMENT ON INDEX idx_profiles_verified IS 'Quick lookup of verified profiles';

-- profiles: Featured listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_featured
    ON profiles(featured, verified)
    WHERE featured = true AND deleted_at IS NULL;
COMMENT ON INDEX idx_profiles_featured IS 'Featured profiles in directory';

-- profiles: Country-based search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_country
    ON profiles(country_code)
    WHERE deleted_at IS NULL;
COMMENT ON INDEX idx_profiles_country IS 'Location-based profile search';

-- guides: Composite for pricing queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guides_rate_currency
    ON guides(currency, hourly_rate_cents)
    WHERE hourly_rate_cents IS NOT NULL;
COMMENT ON INDEX idx_guides_rate_currency IS 'Filter guides by price range';

-- guides: Array search on specialties
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guides_specialties_gin
    ON guides USING GIN(specialties)
    WHERE specialties IS NOT NULL AND array_length(specialties, 1) > 0;
COMMENT ON INDEX idx_guides_specialties_gin IS 'Search guides by specialty';

-- guides: Array search on languages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guides_languages_gin
    ON guides USING GIN(spoken_languages)
    WHERE spoken_languages IS NOT NULL AND array_length(spoken_languages, 1) > 0;
COMMENT ON INDEX idx_guides_languages_gin IS 'Search guides by spoken language';

-- agencies: Verified + Featured composite
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_verified_featured
    ON agencies(verified, featured)
    WHERE verified = true;
COMMENT ON INDEX idx_agencies_verified_featured IS 'Directory listing for agencies';

-- agencies: Language array search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_languages_gin
    ON agencies USING GIN(languages)
    WHERE languages IS NOT NULL AND array_length(languages, 1) > 0;
COMMENT ON INDEX idx_agencies_languages_gin IS 'Search agencies by language';

-- agencies: Specialty array search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agencies_specialties_gin
    ON agencies USING GIN(specialties)
    WHERE specialties IS NOT NULL AND array_length(specialties, 1) > 0;
COMMENT ON INDEX idx_agencies_specialties_gin IS 'Search agencies by specialty';

-- ============================================================================
-- PHASE 2: AVAILABILITY & SCHEDULING INDEXES
-- ============================================================================

\echo 'PHASE 2: Availability & Scheduling Indexes\n'

-- availability_slots: Critical composite for availability queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_provider_date_time
    ON availability_slots(provider_id, date, start_time)
    WHERE is_available = true AND date >= CURRENT_DATE;
COMMENT ON INDEX idx_availability_provider_date_time IS 'Find available slots for provider';

-- availability_slots: Date range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_date_available
    ON availability_slots(date, is_available)
    WHERE date >= CURRENT_DATE;
COMMENT ON INDEX idx_availability_date_available IS 'Find providers available on date';

-- availability_slots: Cleanup old slots
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_availability_old_slots
    ON availability_slots(date)
    WHERE date < CURRENT_DATE AND is_available = false;
COMMENT ON INDEX idx_availability_old_slots IS 'Clean up old unavailable slots';

-- availability_holds: Active holds for provider
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_holds_provider_status_date
    ON availability_holds(provider_id, status, start_date)
    WHERE status IN ('pending', 'accepted');
COMMENT ON INDEX idx_holds_provider_status_date IS 'Find active holds for provider';

-- availability_holds: Requester's holds
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_holds_requester_status
    ON availability_holds(requester_id, status, created_at DESC)
    WHERE status IN ('pending', 'accepted');
COMMENT ON INDEX idx_holds_requester_status IS 'User''s hold requests';

-- availability_holds: Expired holds cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_holds_expired
    ON availability_holds(expires_at)
    WHERE status = 'pending' AND expires_at < NOW();
COMMENT ON INDEX idx_holds_expired IS 'Find expired holds for cleanup';

-- ============================================================================
-- PHASE 3: MESSAGING & COMMUNICATION INDEXES
-- ============================================================================

\echo 'PHASE 3: Messaging & Communication Indexes\n'

-- conversations: Recent conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_last_message
    ON conversations(last_message_at DESC NULLS LAST);
COMMENT ON INDEX idx_conversations_last_message IS 'Sort inbox by recent activity';

-- conversation_participants: User's conversations with unread count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_user_unread
    ON conversation_participants(user_id, last_read_at)
    INCLUDE (conversation_id);
COMMENT ON INDEX idx_participants_user_unread IS 'User inbox with unread messages';

-- conversation_participants: Unique participants
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_participants_unique
    ON conversation_participants(conversation_id, user_id);
COMMENT ON INDEX idx_participants_unique IS 'Prevent duplicate participants';

-- messages: Conversation messages (most critical for chat)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_time
    ON messages(conversation_id, created_at DESC)
    INCLUDE (sender_id, content);
COMMENT ON INDEX idx_messages_conversation_time IS 'Load conversation messages';

-- messages: Sender history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender
    ON messages(sender_id, created_at DESC);
COMMENT ON INDEX idx_messages_sender IS 'User message history';

-- message_attachments: Message attachments lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attachments_message
    ON message_attachments(message_id);
COMMENT ON INDEX idx_attachments_message IS 'Load message attachments';

-- ============================================================================
-- PHASE 4: REVIEWS & RATINGS INDEXES
-- ============================================================================

\echo 'PHASE 4: Reviews & Ratings Indexes\n'

-- reviews: Profile reviews (published only)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_reviewee_published
    ON reviews(reviewee_id, created_at DESC)
    WHERE status = 'published';
COMMENT ON INDEX idx_reviews_reviewee_published IS 'Load published reviews for profile';

-- reviews: Reviewer's reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_reviewer
    ON reviews(reviewer_id, created_at DESC);
COMMENT ON INDEX idx_reviews_reviewer IS 'Reviews written by user';

-- reviews: Reviewee type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_type_status
    ON reviews(reviewee_type, status, created_at DESC);
COMMENT ON INDEX idx_reviews_type_status IS 'Filter reviews by entity type';

-- reviews: Rating statistics (for aggregation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_rating_stats
    ON reviews(reviewee_id, overall_rating)
    WHERE status = 'published';
COMMENT ON INDEX idx_reviews_rating_stats IS 'Calculate average ratings';

-- review_responses: Load responses with review
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_review_responses_review
    ON review_responses(review_id);
COMMENT ON INDEX idx_review_responses_review IS 'Load review responses';

-- ============================================================================
-- PHASE 5: JOBS & APPLICATIONS INDEXES
-- ============================================================================

\echo 'PHASE 5: Jobs & Applications Indexes\n'

-- jobs: Active jobs listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active
    ON jobs(status, start_date, created_at DESC)
    WHERE status = 'active' AND end_date >= CURRENT_DATE;
COMMENT ON INDEX idx_jobs_active IS 'List active job postings';

-- jobs: Employer's jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_employer
    ON jobs(employer_id, employer_type, status);
COMMENT ON INDEX idx_jobs_employer IS 'Jobs posted by employer';

-- jobs: Location-based job search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_location
    ON jobs(location_country, status)
    WHERE status = 'active';
COMMENT ON INDEX idx_jobs_location IS 'Find jobs by location';

-- job_applications: Applications for job
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_apps_job_status
    ON job_applications(job_id, status, created_at DESC);
COMMENT ON INDEX idx_job_apps_job_status IS 'View applications for job';

-- job_applications: Applicant's applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_apps_applicant
    ON job_applications(applicant_id, status, created_at DESC);
COMMENT ON INDEX idx_job_apps_applicant IS 'User''s job applications';

-- ============================================================================
-- PHASE 6: LOCATION DATA INDEXES
-- ============================================================================

\echo 'PHASE 6: Location Data Indexes\n'

-- regions: Country regions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regions_country
    ON regions(country_code);
COMMENT ON INDEX idx_regions_country IS 'Load regions for country';

-- regions: Search by name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regions_name
    ON regions(country_code, name);
COMMENT ON INDEX idx_regions_name IS 'Search regions by name';

-- cities: Country cities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_country
    ON cities(country_code);
COMMENT ON INDEX idx_cities_country IS 'Load cities for country';

-- cities: Region cities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_region
    ON cities(region_id);
COMMENT ON INDEX idx_cities_region IS 'Load cities in region';

-- cities: Major cities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_major
    ON cities(country_code, is_major_city, population DESC)
    WHERE is_major_city = true;
COMMENT ON INDEX idx_cities_major IS 'Find major cities in country';

-- cities: Full-text search on name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cities_name_trgm
    ON cities USING GIN(name gin_trgm_ops);
COMMENT ON INDEX idx_cities_name_trgm IS 'Fuzzy search cities by name';
-- Note: Requires pg_trgm extension

-- national_parks: Country parks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parks_country
    ON national_parks(country_code);
COMMENT ON INDEX idx_parks_country IS 'Load parks for country';

-- national_parks: Region parks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parks_region
    ON national_parks(region_id)
    WHERE region_id IS NOT NULL;
COMMENT ON INDEX idx_parks_region IS 'Load parks in region';

-- national_parks: UNESCO sites
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parks_unesco
    ON national_parks(unesco_site, country_code)
    WHERE unesco_site = true;
COMMENT ON INDEX idx_parks_unesco IS 'Find UNESCO world heritage sites';

-- ============================================================================
-- PHASE 7: AUDIT & COMPLIANCE INDEXES
-- ============================================================================

\echo 'PHASE 7: Audit & Compliance Indexes\n'

-- audit_logs: User activity audit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_user_action_time
    ON audit_logs(user_id, action, timestamp DESC);
COMMENT ON INDEX idx_audit_user_action_time IS 'Audit trail for user';

-- audit_logs: Recent actions by type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_action_time
    ON audit_logs(action, timestamp DESC)
    WHERE timestamp >= CURRENT_DATE - INTERVAL '90 days';
COMMENT ON INDEX idx_audit_action_time IS 'Recent audit events by type';

-- audit_logs: Entity-specific audit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_entity
    ON audit_logs(entity_type, entity_id, timestamp DESC)
    WHERE entity_id IS NOT NULL;
COMMENT ON INDEX idx_audit_entity IS 'Audit trail for specific entity';

-- contact_reveals: Profile reveal tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reveals_profile
    ON contact_reveals(profile_id, revealed_at DESC);
COMMENT ON INDEX idx_reveals_profile IS 'Track who revealed profile contact';

-- contact_reveals: Revealer tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reveals_revealer
    ON contact_reveals(revealer_id, revealed_at DESC);
COMMENT ON INDEX idx_reveals_revealer IS 'Track what user revealed';

-- contact_reveals: Prevent duplicate reveals
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_reveals_unique
    ON contact_reveals(revealer_id, profile_id);
COMMENT ON INDEX idx_reveals_unique IS 'One reveal per user-profile pair';

-- abuse_reports: Pending reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_abuse_status_time
    ON abuse_reports(status, created_at DESC);
COMMENT ON INDEX idx_abuse_status_time IS 'Moderation queue';

-- abuse_reports: Entity reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_abuse_entity
    ON abuse_reports(reported_entity_type, reported_entity_id);
COMMENT ON INDEX idx_abuse_entity IS 'Reports for specific entity';

-- ============================================================================
-- PHASE 8: BILLING & SUBSCRIPTIONS INDEXES
-- ============================================================================

\echo 'PHASE 8: Billing & Subscriptions Indexes\n'

-- subscriptions: User subscriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_status
    ON subscriptions(user_id, status);
COMMENT ON INDEX idx_subscriptions_user_status IS 'User''s active subscriptions';

-- subscriptions: Renewal processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_renewal
    ON subscriptions(status, current_period_end)
    WHERE status = 'active';
COMMENT ON INDEX idx_subscriptions_renewal IS 'Process subscription renewals';

-- subscriptions: Stripe webhook lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_stripe
    ON subscriptions(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;
COMMENT ON INDEX idx_subscriptions_stripe IS 'Stripe webhook processing';

-- billing_events: User billing history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_user_time
    ON billing_events(user_id, created_at DESC);
COMMENT ON INDEX idx_billing_user_time IS 'User billing history';

-- billing_events: Event type reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_billing_event_type
    ON billing_events(event_type, created_at DESC);
COMMENT ON INDEX idx_billing_event_type IS 'Billing reports by event type';

-- ============================================================================
-- PHASE 9: APPLICATION PROCESSING INDEXES
-- ============================================================================

\echo 'PHASE 9: Application Processing Indexes\n'

-- guide_applications: Admin queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_guide_apps_status_time
    ON guide_applications(status, created_at DESC);
COMMENT ON INDEX idx_guide_apps_status_time IS 'Application review queue';

-- agency_applications: Admin queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agency_apps_status_time
    ON agency_applications(status, created_at DESC);
COMMENT ON INDEX idx_agency_apps_status_time IS 'Application review queue';

-- dmc_applications: Admin queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dmc_apps_status_time
    ON dmc_applications(status, created_at DESC);
COMMENT ON INDEX idx_dmc_apps_status_time IS 'Application review queue';

-- transport_applications: Admin queue
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transport_apps_status_time
    ON transport_applications(status, created_at DESC);
COMMENT ON INDEX idx_transport_apps_status_time IS 'Application review queue';

-- ============================================================================
-- PHASE 10: CREDENTIALS & VERIFICATION INDEXES
-- ============================================================================

\echo 'PHASE 10: Credentials & Verification Indexes\n'

-- guide_credentials: Guide credentials
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credentials_guide_status
    ON guide_credentials(guide_id, status);
COMMENT ON INDEX idx_credentials_guide_status IS 'Guide verification status';

-- guide_credentials: Expiring credentials
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credentials_expiring
    ON guide_credentials(expires_at)
    WHERE status = 'verified' AND expires_at IS NOT NULL
    AND expires_at <= CURRENT_DATE + INTERVAL '90 days';
COMMENT ON INDEX idx_credentials_expiring IS 'Find expiring credentials';

\echo '\n=== INDEX PLAN COMPLETE ===\n'
\echo 'Run ANALYZE after creating indexes:\n'
\echo 'ANALYZE;\n'

\timing off

-- ============================================================================
-- CLEANUP: Remove duplicate/unused indexes (Run after monitoring)
-- ============================================================================

-- Uncomment after verifying these are truly unused:

-- DROP INDEX CONCURRENTLY IF EXISTS old_unused_index_1;
-- DROP INDEX CONCURRENTLY IF EXISTS old_unused_index_2;

-- ============================================================================
-- PERFORMANCE VERIFICATION
-- ============================================================================

\echo 'To verify index usage after deployment:'
\echo 'SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read'
\echo 'FROM pg_stat_user_indexes'
\echo 'WHERE schemaname = ''public'''
\echo 'ORDER BY idx_scan DESC;'

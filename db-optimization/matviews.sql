-- ============================================================================
-- MATERIALIZED VIEWS for Guide Validator
-- Purpose: Pre-compute expensive aggregations for fast reads
-- Refresh Strategy: See refresh_plan.md for scheduling
-- ============================================================================

-- SAFETY: These create new objects, no data is modified
-- Materialized views need periodic REFRESH (see refresh_plan.md)

\timing on
\echo '\n=== CREATING MATERIALIZED VIEWS ===\n'

-- ============================================================================
-- 1. PROFILE STATISTICS (Review aggregates)
-- ============================================================================

\echo '1. Creating Profile Statistics Materialized View\n'

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_profile_stats AS
SELECT
    p.id AS profile_id,
    p.role,
    -- Review statistics
    COUNT(r.id) AS review_count,
    ROUND(AVG(r.overall_rating)::numeric, 2) AS avg_overall_rating,
    ROUND(AVG(r.communication_rating)::numeric, 2) AS avg_communication_rating,
    ROUND(AVG(r.professionalism_rating)::numeric, 2) AS avg_professionalism_rating,
    ROUND(AVG(r.value_rating)::numeric, 2) AS avg_value_rating,
    MIN(r.overall_rating) AS min_rating,
    MAX(r.overall_rating) AS max_rating,
    -- Recent reviews (last 30 days)
    COUNT(r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '30 days') AS recent_review_count,
    -- Response rate
    COUNT(rr.id)::float / NULLIF(COUNT(r.id), 0) AS response_rate,
    -- Last review date
    MAX(r.created_at) AS last_review_date,
    -- Updated timestamp
    NOW() AS refreshed_at
FROM profiles p
LEFT JOIN reviews r ON r.reviewee_id = p.id AND r.status = 'published'
LEFT JOIN review_responses rr ON rr.review_id = r.id
GROUP BY p.id, p.role;

-- Create indexes on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_profile_stats_profile_id
    ON mv_profile_stats(profile_id);

CREATE INDEX IF NOT EXISTS idx_mv_profile_stats_avg_rating
    ON mv_profile_stats(avg_overall_rating DESC)
    WHERE review_count > 0;

CREATE INDEX IF NOT EXISTS idx_mv_profile_stats_review_count
    ON mv_profile_stats(review_count DESC)
    WHERE review_count > 0;

COMMENT ON MATERIALIZED VIEW mv_profile_stats IS 'Pre-computed review statistics per profile. Refresh: hourly';

\echo 'Created: mv_profile_stats\n'

-- ============================================================================
-- 2. AGENCY STATISTICS (Extended stats for agencies/DMCs)
-- ============================================================================

\echo '2. Creating Agency Statistics Materialized View\n'

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_agency_stats AS
SELECT
    a.id AS agency_id,
    a.agency_type,
    -- Team size
    COUNT(DISTINCT am.profile_id) AS team_size,
    -- Review statistics
    COUNT(r.id) AS review_count,
    ROUND(AVG(r.overall_rating)::numeric, 2) AS avg_rating,
    -- Active jobs
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'active' AND j.end_date >= CURRENT_DATE) AS active_jobs_count,
    -- Total applications received
    COUNT(DISTINCT ja.id) AS total_applications_received,
    -- Pending applications
    COUNT(DISTINCT ja.id) FILTER (WHERE ja.status = 'pending') AS pending_applications,
    -- Member activity (members added in last 90 days)
    COUNT(DISTINCT am.profile_id) FILTER (WHERE am.joined_at >= NOW() - INTERVAL '90 days') AS recent_new_members,
    -- Updated timestamp
    NOW() AS refreshed_at
FROM agencies a
LEFT JOIN agency_members am ON am.agency_id = a.id
LEFT JOIN reviews r ON r.reviewee_id = a.id AND r.reviewee_type IN ('agency', 'dmc', 'transport') AND r.status = 'published'
LEFT JOIN jobs j ON j.employer_id = a.id AND j.employer_type = 'agency'
LEFT JOIN job_applications ja ON ja.job_id = j.id
GROUP BY a.id, a.agency_type;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_agency_stats_agency_id
    ON mv_agency_stats(agency_id);

CREATE INDEX IF NOT EXISTS idx_mv_agency_stats_type_rating
    ON mv_agency_stats(agency_type, avg_rating DESC)
    WHERE review_count > 0;

COMMENT ON MATERIALIZED VIEW mv_agency_stats IS 'Pre-computed agency statistics. Refresh: daily';

\echo 'Created: mv_agency_stats\n'

-- ============================================================================
-- 3. AVAILABILITY SUMMARY (Provider availability overview)
-- ============================================================================

\echo '3. Creating Availability Summary Materialized View\n'

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_availability_summary AS
SELECT
    a.provider_id,
    a.provider_role,
    -- Availability counts
    COUNT(*) FILTER (WHERE a.is_available = true AND a.date >= CURRENT_DATE) AS available_slots_count,
    COUNT(*) FILTER (WHERE a.is_available = false AND a.date >= CURRENT_DATE) AS unavailable_slots_count,
    -- Date ranges
    MIN(a.date) FILTER (WHERE a.is_available = true AND a.date >= CURRENT_DATE) AS next_available_date,
    MAX(a.date) FILTER (WHERE a.date >= CURRENT_DATE) AS last_slot_date,
    -- Holds summary
    COUNT(DISTINCT ah.id) FILTER (WHERE ah.status = 'pending') AS pending_holds_count,
    COUNT(DISTINCT ah.id) FILTER (WHERE ah.status = 'accepted') AS accepted_holds_count,
    -- Response metrics
    AVG(EXTRACT(EPOCH FROM (ah.updated_at - ah.created_at)) / 3600)
        FILTER (WHERE ah.status IN ('accepted', 'rejected')) AS avg_response_time_hours,
    -- Updated timestamp
    NOW() AS refreshed_at
FROM availability_slots a
LEFT JOIN availability_holds ah ON ah.provider_id = a.provider_id
WHERE a.date >= CURRENT_DATE - INTERVAL '7 days'  -- Include recent past for stats
GROUP BY a.provider_id, a.provider_role;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_availability_summary_provider
    ON mv_availability_summary(provider_id);

CREATE INDEX IF NOT EXISTS idx_mv_availability_summary_available
    ON mv_availability_summary(available_slots_count DESC)
    WHERE available_slots_count > 0;

COMMENT ON MATERIALIZED VIEW mv_availability_summary IS 'Provider availability overview. Refresh: every 15 minutes';

\echo 'Created: mv_availability_summary\n'

-- ============================================================================
-- 4. MESSAGE STATISTICS (Conversation activity)
-- ============================================================================

\echo '4. Creating Message Statistics Materialized View\n'

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_conversation_stats AS
SELECT
    c.id AS conversation_id,
    -- Message counts
    COUNT(m.id) AS total_messages,
    COUNT(DISTINCT m.sender_id) AS unique_senders,
    -- Timing
    MIN(m.created_at) AS first_message_at,
    MAX(m.created_at) AS last_message_at,
    -- Activity
    COUNT(m.id) FILTER (WHERE m.created_at >= NOW() - INTERVAL '24 hours') AS messages_last_24h,
    COUNT(m.id) FILTER (WHERE m.created_at >= NOW() - INTERVAL '7 days') AS messages_last_7d,
    -- Response times (simplified)
    AVG(EXTRACT(EPOCH FROM (m.created_at - LAG(m.created_at) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at))) / 60)
        FILTER (WHERE m.sender_id != LAG(m.sender_id) OVER (PARTITION BY m.conversation_id ORDER BY m.created_at))
        AS avg_response_time_minutes,
    -- Updated timestamp
    NOW() AS refreshed_at
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_conversation_stats_conversation_id
    ON mv_conversation_stats(conversation_id);

CREATE INDEX IF NOT EXISTS idx_mv_conversation_stats_last_message
    ON mv_conversation_stats(last_message_at DESC);

COMMENT ON MATERIALIZED VIEW mv_conversation_stats IS 'Conversation activity metrics. Refresh: hourly';

\echo 'Created: mv_conversation_stats\n'

-- ============================================================================
-- 5. JOB POSTING STATISTICS
-- ============================================================================

\echo '5. Creating Job Statistics Materialized View\n'

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_job_stats AS
SELECT
    j.id AS job_id,
    j.employer_id,
    j.employer_type,
    j.status,
    -- Application statistics
    COUNT(ja.id) AS total_applications,
    COUNT(ja.id) FILTER (WHERE ja.status = 'pending') AS pending_applications,
    COUNT(ja.id) FILTER (WHERE ja.status = 'accepted') AS accepted_applications,
    COUNT(ja.id) FILTER (WHERE ja.status = 'rejected') AS rejected_applications,
    -- Timing
    MIN(ja.created_at) AS first_application_at,
    MAX(ja.created_at) AS last_application_at,
    -- Response metrics
    AVG(EXTRACT(EPOCH FROM (ja.updated_at - ja.created_at)) / 86400)
        FILTER (WHERE ja.status != 'pending') AS avg_response_time_days,
    -- Recent activity
    COUNT(ja.id) FILTER (WHERE ja.created_at >= NOW() - INTERVAL '7 days') AS applications_last_7d,
    -- Updated timestamp
    NOW() AS refreshed_at
FROM jobs j
LEFT JOIN job_applications ja ON ja.job_id = j.id
GROUP BY j.id, j.employer_id, j.employer_type, j.status;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_job_stats_job_id
    ON mv_job_stats(job_id);

CREATE INDEX IF NOT EXISTS idx_mv_job_stats_employer
    ON mv_job_stats(employer_id, employer_type);

CREATE INDEX IF NOT EXISTS idx_mv_job_stats_status_applications
    ON mv_job_stats(status, total_applications DESC)
    WHERE status = 'active';

COMMENT ON MATERIALIZED VIEW mv_job_stats IS 'Job posting statistics. Refresh: hourly';

\echo 'Created: mv_job_stats\n'

-- ============================================================================
-- 6. LOCATION POPULARITY (Search and filter analytics)
-- ============================================================================

\echo '6. Creating Location Popularity Materialized View\n'

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_location_popularity AS
SELECT
    c.code AS country_code,
    c.name AS country_name,
    -- Provider counts
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'guide') AS guide_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.agency_type = 'agency') AS agency_count,
    COUNT(DISTINCT a2.id) FILTER (WHERE a2.agency_type = 'dmc') AS dmc_count,
    COUNT(DISTINCT a3.id) FILTER (WHERE a3.agency_type = 'transport') AS transport_count,
    -- Verified counts
    COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'guide' AND p.verified = true) AS verified_guide_count,
    COUNT(DISTINCT a.id) FILTER (WHERE a.agency_type = 'agency' AND a.verified = true) AS verified_agency_count,
    -- Review coverage
    COUNT(DISTINCT r.id) AS total_reviews,
    ROUND(AVG(r.overall_rating)::numeric, 2) AS country_avg_rating,
    -- Active jobs
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'active' AND j.end_date >= CURRENT_DATE) AS active_jobs,
    -- Updated timestamp
    NOW() AS refreshed_at
FROM countries c
LEFT JOIN profiles p ON p.country_code = c.code AND p.deleted_at IS NULL
LEFT JOIN agencies a ON a.country_code = c.code AND a.deleted_at IS NULL AND a.agency_type = 'agency'
LEFT JOIN agencies a2 ON a2.country_code = c.code AND a2.deleted_at IS NULL AND a2.agency_type = 'dmc'
LEFT JOIN agencies a3 ON a3.country_code = c.code AND a3.deleted_at IS NULL AND a3.agency_type = 'transport'
LEFT JOIN reviews r ON (r.reviewee_id = p.id OR r.reviewee_id = a.id OR r.reviewee_id = a2.id OR r.reviewee_id = a3.id)
    AND r.status = 'published'
LEFT JOIN jobs j ON j.location_country = c.code
GROUP BY c.code, c.name;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_location_popularity_country
    ON mv_location_popularity(country_code);

CREATE INDEX IF NOT EXISTS idx_mv_location_popularity_guide_count
    ON mv_location_popularity(guide_count DESC);

CREATE INDEX IF NOT EXISTS idx_mv_location_popularity_total_providers
    ON mv_location_popularity((guide_count + agency_count + dmc_count + transport_count) DESC);

COMMENT ON MATERIALIZED VIEW mv_location_popularity IS 'Provider density by country. Refresh: daily';

\echo 'Created: mv_location_popularity\n'

-- ============================================================================
-- 7. PLATFORM METRICS (Dashboard overview)
-- ============================================================================

\echo '7. Creating Platform Metrics Materialized View\n'

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_platform_metrics AS
SELECT
    -- User counts
    (SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL) AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE role = 'guide' AND deleted_at IS NULL) AS total_guides,
    (SELECT COUNT(*) FROM agencies WHERE agency_type = 'agency' AND deleted_at IS NULL) AS total_agencies,
    (SELECT COUNT(*) FROM agencies WHERE agency_type = 'dmc' AND deleted_at IS NULL) AS total_dmcs,
    (SELECT COUNT(*) FROM agencies WHERE agency_type = 'transport' AND deleted_at IS NULL) AS total_transport,
    -- Verified counts
    (SELECT COUNT(*) FROM profiles WHERE verified = true AND deleted_at IS NULL) AS verified_users,
    -- Activity (last 30 days)
    (SELECT COUNT(*) FROM profiles WHERE created_at >= NOW() - INTERVAL '30 days') AS new_users_30d,
    (SELECT COUNT(*) FROM reviews WHERE created_at >= NOW() - INTERVAL '30 days') AS new_reviews_30d,
    (SELECT COUNT(*) FROM messages WHERE created_at >= NOW() - INTERVAL '30 days') AS messages_30d,
    (SELECT COUNT(*) FROM jobs WHERE created_at >= NOW() - INTERVAL '30 days') AS new_jobs_30d,
    -- Pending admin tasks
    (SELECT COUNT(*) FROM guide_applications WHERE status = 'pending') AS pending_guide_apps,
    (SELECT COUNT(*) FROM agency_applications WHERE status = 'pending') AS pending_agency_apps,
    (SELECT COUNT(*) FROM dmc_applications WHERE status = 'pending') AS pending_dmc_apps,
    (SELECT COUNT(*) FROM transport_applications WHERE status = 'pending') AS pending_transport_apps,
    (SELECT COUNT(*) FROM abuse_reports WHERE status = 'pending') AS pending_abuse_reports,
    -- Subscription metrics
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') AS active_subscriptions,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND current_period_end < NOW() + INTERVAL '7 days') AS subscriptions_renewing_soon,
    -- Review metrics
    (SELECT COUNT(*) FROM reviews WHERE status = 'published') AS total_published_reviews,
    (SELECT ROUND(AVG(overall_rating)::numeric, 2) FROM reviews WHERE status = 'published') AS platform_avg_rating,
    -- Updated timestamp
    NOW() AS refreshed_at;

COMMENT ON MATERIALIZED VIEW mv_platform_metrics IS 'High-level platform statistics for admin dashboard. Refresh: every 5 minutes';

\echo 'Created: mv_platform_metrics\n'

-- ============================================================================
-- 8. USER ENGAGEMENT METRICS (Activity tracking)
-- ============================================================================

\echo '8. Creating User Engagement Metrics Materialized View\n'

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_engagement AS
SELECT
    p.id AS user_id,
    p.role,
    p.verified,
    -- Message activity
    COUNT(DISTINCT m.conversation_id) AS conversations_count,
    COUNT(m.id) AS messages_sent,
    MAX(m.created_at) AS last_message_at,
    -- Review activity
    COUNT(DISTINCT r_written.id) AS reviews_written,
    COUNT(DISTINCT r_received.id) AS reviews_received,
    ROUND(AVG(r_received.overall_rating)::numeric, 2) AS avg_rating_received,
    -- Job activity (as employer)
    COUNT(DISTINCT j.id) FILTER (WHERE j.employer_id = p.id) AS jobs_posted,
    -- Job activity (as applicant)
    COUNT(DISTINCT ja.id) FILTER (WHERE ja.applicant_id = p.id) AS jobs_applied,
    -- Availability (for providers)
    COUNT(DISTINCT avail.id) FILTER (WHERE avail.provider_id = p.id AND avail.is_available = true AND avail.date >= CURRENT_DATE) AS future_available_slots,
    -- Contact reveals (as revealer)
    COUNT(DISTINCT cr.id) FILTER (WHERE cr.revealer_id = p.id) AS contacts_revealed,
    -- Last activity
    GREATEST(
        COALESCE(MAX(m.created_at), '1970-01-01'::timestamptz),
        COALESCE(MAX(r_written.created_at), '1970-01-01'::timestamptz),
        COALESCE(MAX(ja.created_at), '1970-01-01'::timestamptz)
    ) AS last_activity_at,
    -- Engagement score (simple formula)
    (
        COUNT(m.id) * 1 +
        COUNT(DISTINCT r_written.id) * 5 +
        COUNT(DISTINCT j.id) * 3 +
        COUNT(DISTINCT ja.id) * 2
    ) AS engagement_score,
    -- Updated timestamp
    NOW() AS refreshed_at
FROM profiles p
LEFT JOIN messages m ON m.sender_id = p.id
LEFT JOIN reviews r_written ON r_written.reviewer_id = p.id
LEFT JOIN reviews r_received ON r_received.reviewee_id = p.id AND r_received.status = 'published'
LEFT JOIN jobs j ON j.employer_id = p.id
LEFT JOIN job_applications ja ON ja.applicant_id = p.id
LEFT JOIN availability_slots avail ON avail.provider_id = p.id
LEFT JOIN contact_reveals cr ON cr.revealer_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id, p.role, p.verified;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_engagement_user_id
    ON mv_user_engagement(user_id);

CREATE INDEX IF NOT EXISTS idx_mv_user_engagement_score
    ON mv_user_engagement(engagement_score DESC);

CREATE INDEX IF NOT EXISTS idx_mv_user_engagement_last_activity
    ON mv_user_engagement(last_activity_at DESC);

COMMENT ON MATERIALIZED VIEW mv_user_engagement IS 'User activity and engagement metrics. Refresh: daily';

\echo 'Created: mv_user_engagement\n'

-- ============================================================================
-- REFRESH ALL MATERIALIZED VIEWS (Manual trigger)
-- ============================================================================

\echo '\n=== MATERIALIZED VIEWS COMPLETE ===\n'
\echo 'Created 8 materialized views for performance optimization\n'
\echo '\nTo manually refresh all materialized views:\n'

\echo 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profile_stats;'
\echo 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agency_stats;'
\echo 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_availability_summary;'
\echo 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_stats;'
\echo 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_job_stats;'
\echo 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_location_popularity;'
\echo 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_platform_metrics;'
\echo 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement;'

\echo '\nNote: CONCURRENTLY requires UNIQUE indexes (created above)\n'
\echo 'See refresh_plan.md for automated refresh scheduling\n'

\timing off

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

\echo '\nUsage examples:\n'
\echo '-- Get profile with pre-computed stats'
\echo 'SELECT p.*, s.review_count, s.avg_overall_rating'
\echo 'FROM profiles p'
\echo 'JOIN mv_profile_stats s ON s.profile_id = p.id'
\echo 'WHERE p.id = ''<uuid>'';\n'

\echo '-- Directory with stats (much faster than subqueries)'
\echo 'SELECT p.full_name, p.country_code, s.review_count, s.avg_overall_rating'
\echo 'FROM vw_guide_directory p'
\echo 'JOIN mv_profile_stats s ON s.profile_id = p.id'
\echo 'WHERE s.review_count >= 5'
\echo 'ORDER BY s.avg_overall_rating DESC'
\echo 'LIMIT 50;\n'

\echo '-- Platform dashboard'
\echo 'SELECT * FROM mv_platform_metrics;\n'

\echo '-- Most engaged users'
\echo 'SELECT p.full_name, e.engagement_score, e.messages_sent, e.reviews_written'
\echo 'FROM mv_user_engagement e'
\echo 'JOIN profiles p ON p.id = e.user_id'
\echo 'ORDER BY e.engagement_score DESC'
\echo 'LIMIT 20;\n'

-- ============================================================================
-- STABLE VIEW LAYER for Guide Validator
-- Purpose: Create stable views for UI data access patterns
-- Benefits: Encapsulate joins, derived fields, RLS, and optimize queries
-- ============================================================================

-- SAFETY: These are additive changes (CREATE OR REPLACE VIEW)
-- No data is modified, only view definitions

\timing on
\echo '\n=== CREATING STABLE VIEW LAYER ===\n'

-- ============================================================================
-- DIRECTORY VIEWS: For public directory listings
-- ============================================================================

\echo '1. Creating Directory Views\n'

-- Guide directory view (optimized for directory page)
CREATE OR REPLACE VIEW vw_guide_directory AS
SELECT
    p.id,
    p.full_name,
    p.country_code,
    p.verified,
    p.featured,
    p.avatar_url,
    p.created_at,
    g.headline,
    g.specialties,
    g.spoken_languages,
    g.hourly_rate_cents,
    g.currency,
    g.years_experience,
    g.response_time_minutes,
    -- Computed fields
    CASE
        WHEN g.hourly_rate_cents IS NOT NULL AND g.currency IS NOT NULL
        THEN g.hourly_rate_cents::float / 100
        ELSE NULL
    END AS hourly_rate,
    -- Review aggregates (will be fast with materialized view later)
    (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = p.id AND r.status = 'published') AS review_count,
    (SELECT ROUND(AVG(r.overall_rating)::numeric, 2) FROM reviews r WHERE r.reviewee_id = p.id AND r.status = 'published') AS avg_rating
FROM profiles p
INNER JOIN guides g ON g.profile_id = p.id
WHERE p.role = 'guide'
    AND p.deleted_at IS NULL;

COMMENT ON VIEW vw_guide_directory IS 'Optimized guide directory listing with computed fields';

-- Agency directory view
CREATE OR REPLACE VIEW vw_agency_directory AS
SELECT
    a.id,
    a.name,
    a.description,
    a.coverage_summary,
    a.country_code,
    a.verified,
    a.featured,
    a.logo_url,
    a.website,
    a.languages,
    a.specialties,
    a.created_at,
    -- Review aggregates
    (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = a.id AND r.reviewee_type = 'agency' AND r.status = 'published') AS review_count,
    (SELECT ROUND(AVG(r.overall_rating)::numeric, 2) FROM reviews r WHERE r.reviewee_id = a.id AND r.reviewee_type = 'agency' AND r.status = 'published') AS avg_rating,
    -- Team size
    (SELECT COUNT(*) FROM agency_members am WHERE am.agency_id = a.id) AS team_size
FROM agencies a
WHERE a.deleted_at IS NULL;

COMMENT ON VIEW vw_agency_directory IS 'Optimized agency directory listing with computed fields';

-- DMC directory view (same structure as agencies but filtered by type)
CREATE OR REPLACE VIEW vw_dmc_directory AS
SELECT * FROM vw_agency_directory
WHERE id IN (
    SELECT id FROM agencies WHERE agency_type = 'dmc'
);

COMMENT ON VIEW vw_dmc_directory IS 'DMC-specific directory view';

-- Transport directory view
CREATE OR REPLACE VIEW vw_transport_directory AS
SELECT
    a.id,
    a.name,
    a.description,
    a.coverage_summary,
    a.country_code,
    a.verified,
    a.featured,
    a.logo_url,
    a.website,
    a.languages,
    a.created_at,
    -- Review aggregates
    (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = a.id AND r.reviewee_type = 'transport' AND r.status = 'published') AS review_count,
    (SELECT ROUND(AVG(r.overall_rating)::numeric, 2) FROM reviews r WHERE r.reviewee_id = a.id AND r.reviewee_type = 'transport' AND r.status = 'published') AS avg_rating
FROM agencies a
WHERE a.agency_type = 'transport'
    AND a.deleted_at IS NULL;

COMMENT ON VIEW vw_transport_directory IS 'Transport provider directory view';

-- ============================================================================
-- PROFILE DETAIL VIEWS: For individual profile pages
-- ============================================================================

\echo '2. Creating Profile Detail Views\n'

-- Guide profile detail (all public information)
CREATE OR REPLACE VIEW vw_guide_profile_detail AS
SELECT
    p.id,
    p.full_name,
    p.country_code,
    p.verified,
    p.featured,
    p.avatar_url,
    p.created_at,
    g.profile_id,
    g.headline,
    g.bio,
    g.specialties,
    g.spoken_languages,
    g.hourly_rate_cents,
    g.currency,
    g.years_experience,
    g.response_time_minutes,
    -- Computed fields
    CASE
        WHEN g.hourly_rate_cents IS NOT NULL AND g.currency IS NOT NULL
        THEN g.hourly_rate_cents::float / 100
        ELSE NULL
    END AS hourly_rate,
    -- Aggregated stats
    (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = p.id AND r.status = 'published') AS review_count,
    (SELECT ROUND(AVG(r.overall_rating)::numeric, 2) FROM reviews r WHERE r.reviewee_id = p.id AND r.status = 'published') AS avg_rating,
    (SELECT COUNT(*) FROM availability_slots a WHERE a.provider_id = p.id AND a.is_available = true AND a.date >= CURRENT_DATE) AS available_slots_count,
    -- Credentials status
    (SELECT COUNT(*) FROM guide_credentials gc WHERE gc.guide_id = p.id AND gc.status = 'verified') AS verified_credentials_count
FROM profiles p
INNER JOIN guides g ON g.profile_id = p.id
WHERE p.role = 'guide'
    AND p.deleted_at IS NULL;

COMMENT ON VIEW vw_guide_profile_detail IS 'Complete guide profile for detail pages';

-- Agency profile detail
CREATE OR REPLACE VIEW vw_agency_profile_detail AS
SELECT
    a.id,
    a.name,
    a.description,
    a.coverage_summary,
    a.country_code,
    a.verified,
    a.featured,
    a.logo_url,
    a.website,
    a.registration_number,
    a.languages,
    a.specialties,
    a.created_at,
    a.agency_type,
    -- Aggregated stats
    (SELECT COUNT(*) FROM reviews r WHERE r.reviewee_id = a.id AND r.status = 'published') AS review_count,
    (SELECT ROUND(AVG(r.overall_rating)::numeric, 2) FROM reviews r WHERE r.reviewee_id = a.id AND r.status = 'published') AS avg_rating,
    (SELECT COUNT(*) FROM agency_members am WHERE am.agency_id = a.id) AS team_size,
    (SELECT COUNT(*) FROM jobs j WHERE j.employer_id = a.id AND j.employer_type = 'agency' AND j.status = 'active') AS active_jobs_count
FROM agencies a
WHERE a.deleted_at IS NULL;

COMMENT ON VIEW vw_agency_profile_detail IS 'Complete agency profile for detail pages';

-- ============================================================================
-- MESSAGING VIEWS: For conversation inbox and chat
-- ============================================================================

\echo '3. Creating Messaging Views\n'

-- Conversation list with last message and participants
CREATE OR REPLACE VIEW vw_conversation_list AS
SELECT
    c.id AS conversation_id,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    -- Last message preview
    (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
    (SELECT sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_sender_id,
    (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time,
    -- Message count
    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
    -- Participant info (assumes 2-person conversations, adjust if group chat)
    (SELECT ARRAY_AGG(cp.user_id) FROM conversation_participants cp WHERE cp.conversation_id = c.id) AS participant_ids,
    (SELECT ARRAY_AGG(p.full_name) FROM conversation_participants cp JOIN profiles p ON p.id = cp.user_id WHERE cp.conversation_id = c.id) AS participant_names
FROM conversations c;

COMMENT ON VIEW vw_conversation_list IS 'Conversation inbox with last message preview';

-- User-specific conversation inbox (requires user_id parameter in query)
CREATE OR REPLACE VIEW vw_user_conversations AS
SELECT
    cp.user_id,
    cp.conversation_id,
    cp.last_read_at,
    cp.joined_at,
    c.last_message_at,
    -- Unread count
    (SELECT COUNT(*)
     FROM messages m
     WHERE m.conversation_id = cp.conversation_id
       AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
       AND m.sender_id != cp.user_id) AS unread_count,
    -- Other participant info (for 1-on-1 chats)
    (SELECT user_id
     FROM conversation_participants cp2
     WHERE cp2.conversation_id = cp.conversation_id
       AND cp2.user_id != cp.user_id
     LIMIT 1) AS other_user_id,
    (SELECT p.full_name
     FROM conversation_participants cp2
     JOIN profiles p ON p.id = cp2.user_id
     WHERE cp2.conversation_id = cp.conversation_id
       AND cp2.user_id != cp.user_id
     LIMIT 1) AS other_user_name,
    (SELECT p.avatar_url
     FROM conversation_participants cp2
     JOIN profiles p ON p.id = cp2.user_id
     WHERE cp2.conversation_id = cp.conversation_id
       AND cp2.user_id != cp.user_id
     LIMIT 1) AS other_user_avatar
FROM conversation_participants cp
JOIN conversations c ON c.id = cp.conversation_id;

COMMENT ON VIEW vw_user_conversations IS 'User inbox with unread counts and participant info';

-- ============================================================================
-- REVIEW VIEWS: For review listings and summaries
-- ============================================================================

\echo '4. Creating Review Views\n'

-- Published reviews with reviewer info
CREATE OR REPLACE VIEW vw_published_reviews AS
SELECT
    r.id,
    r.reviewee_id,
    r.reviewee_type,
    r.reviewer_id,
    r.overall_rating,
    r.communication_rating,
    r.professionalism_rating,
    r.value_rating,
    r.title,
    r.content,
    r.created_at,
    -- Reviewer info
    p.full_name AS reviewer_name,
    p.avatar_url AS reviewer_avatar,
    p.country_code AS reviewer_country,
    -- Response info
    (SELECT COUNT(*) FROM review_responses rr WHERE rr.review_id = r.id) AS response_count,
    (SELECT rr.content FROM review_responses rr WHERE rr.review_id = r.id ORDER BY rr.created_at DESC LIMIT 1) AS latest_response
FROM reviews r
INNER JOIN profiles p ON p.id = r.reviewer_id
WHERE r.status = 'published';

COMMENT ON VIEW vw_published_reviews IS 'Published reviews with reviewer information';

-- ============================================================================
-- AVAILABILITY VIEWS: For booking and scheduling
-- ============================================================================

\echo '5. Creating Availability Views\n'

-- Available slots (current and future only)
CREATE OR REPLACE VIEW vw_available_slots AS
SELECT
    a.id,
    a.provider_id,
    a.provider_role,
    a.date,
    a.start_time,
    a.end_time,
    a.timezone,
    a.is_available,
    -- Provider info
    p.full_name AS provider_name,
    p.avatar_url AS provider_avatar,
    -- Check for holds
    (SELECT COUNT(*)
     FROM availability_holds ah
     WHERE ah.provider_id = a.provider_id
       AND ah.status IN ('pending', 'accepted')
       AND a.date BETWEEN ah.start_date AND ah.end_date) AS holds_count
FROM availability_slots a
INNER JOIN profiles p ON p.id = a.provider_id
WHERE a.is_available = true
    AND a.date >= CURRENT_DATE;

COMMENT ON VIEW vw_available_slots IS 'Current and future available slots';

-- ============================================================================
-- JOB VIEWS: For job board
-- ============================================================================

\echo '6. Creating Job Views\n'

-- Active job postings with employer info
CREATE OR REPLACE VIEW vw_active_jobs AS
SELECT
    j.id,
    j.title,
    j.description,
    j.employer_id,
    j.employer_type,
    j.location_country,
    j.location_city,
    j.start_date,
    j.end_date,
    j.compensation_amount,
    j.compensation_currency,
    j.compensation_type,
    j.requirements,
    j.created_at,
    -- Employer info
    CASE
        WHEN j.employer_type = 'agency' THEN (SELECT name FROM agencies WHERE id = j.employer_id)
        WHEN j.employer_type = 'guide' THEN (SELECT full_name FROM profiles WHERE id = j.employer_id)
        ELSE NULL
    END AS employer_name,
    CASE
        WHEN j.employer_type = 'agency' THEN (SELECT logo_url FROM agencies WHERE id = j.employer_id)
        WHEN j.employer_type = 'guide' THEN (SELECT avatar_url FROM profiles WHERE id = j.employer_id)
        ELSE NULL
    END AS employer_logo,
    -- Application stats
    (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id) AS application_count,
    (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_id = j.id AND ja.status = 'pending') AS pending_applications
FROM jobs j
WHERE j.status = 'active'
    AND j.end_date >= CURRENT_DATE;

COMMENT ON VIEW vw_active_jobs IS 'Active job postings with employer information';

-- ============================================================================
-- ADMIN VIEWS: For admin dashboard
-- ============================================================================

\echo '7. Creating Admin Views\n'

-- Pending applications summary (all types)
CREATE OR REPLACE VIEW vw_pending_applications AS
SELECT
    'guide' AS application_type,
    id,
    full_name AS applicant_name,
    contact_email AS applicant_email,
    status,
    created_at,
    locale
FROM guide_applications
WHERE status = 'pending'

UNION ALL

SELECT
    'agency' AS application_type,
    id,
    company_name AS applicant_name,
    contact_email AS applicant_email,
    status,
    created_at,
    locale
FROM agency_applications
WHERE status = 'pending'

UNION ALL

SELECT
    'dmc' AS application_type,
    id,
    company_name AS applicant_name,
    contact_email AS applicant_email,
    status,
    created_at,
    locale
FROM dmc_applications
WHERE status = 'pending'

UNION ALL

SELECT
    'transport' AS application_type,
    id,
    company_name AS applicant_name,
    contact_email AS applicant_email,
    status,
    created_at,
    locale
FROM transport_applications
WHERE status = 'pending'

ORDER BY created_at DESC;

COMMENT ON VIEW vw_pending_applications IS 'All pending applications for admin review';

-- Subscription status overview
CREATE OR REPLACE VIEW vw_subscription_status AS
SELECT
    s.id,
    s.user_id,
    s.status,
    s.plan_name,
    s.current_period_start,
    s.current_period_end,
    s.stripe_subscription_id,
    -- User info
    p.full_name,
    p.email,
    p.role,
    -- Days until renewal
    EXTRACT(DAY FROM (s.current_period_end - NOW())) AS days_until_renewal,
    -- Renewal status
    CASE
        WHEN s.status = 'active' AND s.current_period_end < NOW() + INTERVAL '7 days' THEN 'RENEWING_SOON'
        WHEN s.status = 'active' AND s.current_period_end < NOW() THEN 'EXPIRED'
        WHEN s.status = 'active' THEN 'ACTIVE'
        WHEN s.status = 'canceled' THEN 'CANCELED'
        ELSE s.status
    END AS renewal_status
FROM subscriptions s
INNER JOIN profiles p ON p.id = s.user_id;

COMMENT ON VIEW vw_subscription_status IS 'Subscription overview with renewal tracking';

-- ============================================================================
-- LOCATION VIEWS: For search and filtering
-- ============================================================================

\echo '8. Creating Location Views\n'

-- Major cities with country info
CREATE OR REPLACE VIEW vw_major_cities AS
SELECT
    c.id,
    c.name AS city_name,
    c.country_code,
    co.name AS country_name,
    c.region_id,
    r.name AS region_name,
    c.population,
    c.is_capital,
    c.is_major_city,
    c.latitude,
    c.longitude
FROM cities c
INNER JOIN countries co ON co.code = c.country_code
LEFT JOIN regions r ON r.id = c.region_id
WHERE c.is_major_city = true
ORDER BY c.population DESC;

COMMENT ON VIEW vw_major_cities IS 'Major cities with complete location hierarchy';

-- UNESCO sites with location info
CREATE OR REPLACE VIEW vw_unesco_sites AS
SELECT
    np.id,
    np.name AS site_name,
    np.country_code,
    co.name AS country_name,
    np.region_id,
    r.name AS region_name,
    np.description,
    np.unesco_site,
    np.latitude,
    np.longitude
FROM national_parks np
INNER JOIN countries co ON co.code = np.country_code
LEFT JOIN regions r ON r.id = np.region_id
WHERE np.unesco_site = true
ORDER BY co.name, np.name;

COMMENT ON VIEW vw_unesco_sites IS 'UNESCO world heritage sites';

\echo '\n=== VIEW LAYER COMPLETE ===\n'
\echo 'Views created: 16 stable views for UI data access\n'
\echo '\nNext steps:\n'
\echo '1. Update application queries to use these views\n'
\echo '2. Test view performance with EXPLAIN ANALYZE\n'
\echo '3. Create materialized views for expensive aggregations (matviews.sql)\n'
\echo '4. Consider additional views based on common query patterns\n'

\timing off

-- ============================================================================
-- PERFORMANCE TESTING TEMPLATE
-- ============================================================================

\echo '\nPerformance testing template:\n'
\echo 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM vw_guide_directory LIMIT 50;\n'
\echo 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM vw_user_conversations WHERE user_id = ''<uuid>'';\n'
\echo 'EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM vw_active_jobs LIMIT 50;\n'

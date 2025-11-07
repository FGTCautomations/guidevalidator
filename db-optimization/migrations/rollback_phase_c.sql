-- ============================================================================
-- ROLLBACK PHASE C: Remove Constraints and Optimizations
-- Purpose: Revert destructive changes from Phase C
-- Use When: Constraints causing issues or need to be modified
-- ============================================================================

\timing on
\echo '\n=== ROLLBACK PHASE C ===\n'

\echo '⚠️  This will remove constraints and optimizations from Phase C\n'
\echo 'Views and indexes from Phase A will remain\n'
\echo 'Press Ctrl+C to abort, or wait 5 seconds to continue...\n'

SELECT pg_sleep(5);

-- ============================================================================
-- STEP R1: REVERT RLS POLICIES
-- ============================================================================

\echo 'R1: Reverting RLS policies to original state\n'

-- Drop optimized policies
DROP POLICY IF EXISTS "Users see own conversations" ON conversations;
DROP POLICY IF EXISTS "Users see messages in their conversations" ON messages;

-- Recreate original policies (if they were different)
-- Note: You'll need to restore the original policy definitions
-- Example placeholders:

CREATE POLICY "Users see own conversations"
ON conversations FOR SELECT
USING (
    id IN (
        SELECT conversation_id
        FROM conversation_participants
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users see messages in their conversations"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id
        FROM conversation_participants
        WHERE user_id = auth.uid()
    )
);

\echo 'RLS policies reverted\n'

-- ============================================================================
-- STEP R2: DROP REFRESH SCHEDULE FUNCTIONS
-- ============================================================================

\echo 'R2: Dropping materialized view refresh schedule functions\n'

DROP FUNCTION IF EXISTS refresh_frequent_matviews() CASCADE;
DROP FUNCTION IF EXISTS refresh_hourly_matviews() CASCADE;
DROP FUNCTION IF EXISTS refresh_daily_matviews() CASCADE;

\echo 'Refresh schedule functions dropped\n'

-- ============================================================================
-- STEP R3: DROP CHECK CONSTRAINTS
-- ============================================================================

\echo 'R3: Dropping check constraints\n'

-- Reviews constraints
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_range;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_communication_range;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_professionalism_range;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_value_range;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewee_type_check;

-- Jobs constraints
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_date_order;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_compensation_positive;

-- Availability constraints
ALTER TABLE availability_slots DROP CONSTRAINT IF EXISTS availability_time_order;
ALTER TABLE availability_slots DROP CONSTRAINT IF EXISTS availability_future_dates;

-- Holds constraints
ALTER TABLE availability_holds DROP CONSTRAINT IF EXISTS holds_status_check;
ALTER TABLE availability_holds DROP CONSTRAINT IF EXISTS holds_date_order;
ALTER TABLE availability_holds DROP CONSTRAINT IF EXISTS holds_expiry_future;

-- Job applications constraints
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_apps_status_check;

-- Subscriptions constraints
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_period_order;

-- Guide constraints
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_rate_positive;
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_experience_positive;
ALTER TABLE guides DROP CONSTRAINT IF EXISTS guides_response_time_positive;

-- Profiles constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_format_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_country_valid;

-- Agencies constraints
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_country_valid;

-- Cities constraints
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_population_positive;
ALTER TABLE cities DROP CONSTRAINT IF EXISTS cities_country_valid;

-- Regions constraints
ALTER TABLE regions DROP CONSTRAINT IF EXISTS regions_country_valid;

-- Parks constraints
ALTER TABLE national_parks DROP CONSTRAINT IF EXISTS parks_country_valid;

-- Credentials constraints
ALTER TABLE guide_credentials DROP CONSTRAINT IF EXISTS credentials_status_check;

-- Abuse reports constraints
ALTER TABLE abuse_reports DROP CONSTRAINT IF EXISTS abuse_status_check;
ALTER TABLE abuse_reports DROP CONSTRAINT IF EXISTS abuse_entity_type_check;

\echo 'Check constraints dropped\n'

-- ============================================================================
-- STEP R4: DROP FOREIGN KEY CONSTRAINTS
-- ============================================================================

\echo 'R4: Dropping foreign key constraints\n'

-- Profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_country;

-- Guides
ALTER TABLE guides DROP CONSTRAINT IF EXISTS fk_guides_profile;

-- Agencies
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS fk_agencies_country;

-- Agency members
ALTER TABLE agency_members DROP CONSTRAINT IF EXISTS fk_agency_members_agency;
ALTER TABLE agency_members DROP CONSTRAINT IF EXISTS fk_agency_members_profile;

-- Availability
ALTER TABLE availability_slots DROP CONSTRAINT IF EXISTS fk_availability_provider;
ALTER TABLE availability_holds DROP CONSTRAINT IF EXISTS fk_holds_requester;
ALTER TABLE availability_holds DROP CONSTRAINT IF EXISTS fk_holds_provider;

-- Conversations
ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS fk_participants_conversation;
ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS fk_participants_user;

-- Messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_conversation;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS fk_messages_sender;
ALTER TABLE message_attachments DROP CONSTRAINT IF EXISTS fk_attachments_message;

-- Reviews
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS fk_reviews_reviewer;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS fk_reviews_reviewee;
ALTER TABLE review_responses DROP CONSTRAINT IF EXISTS fk_responses_review;
ALTER TABLE review_responses DROP CONSTRAINT IF EXISTS fk_responses_responder;

-- Jobs
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS fk_job_apps_job;
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS fk_job_apps_applicant;

-- Location
ALTER TABLE regions DROP CONSTRAINT IF EXISTS fk_regions_country;
ALTER TABLE cities DROP CONSTRAINT IF EXISTS fk_cities_country;
ALTER TABLE cities DROP CONSTRAINT IF EXISTS fk_cities_region;
ALTER TABLE national_parks DROP CONSTRAINT IF EXISTS fk_parks_country;
ALTER TABLE national_parks DROP CONSTRAINT IF EXISTS fk_parks_region;

-- Subscriptions
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_user;
ALTER TABLE billing_events DROP CONSTRAINT IF EXISTS fk_billing_user;

-- Credentials
ALTER TABLE guide_credentials DROP CONSTRAINT IF EXISTS fk_credentials_guide;

-- Contact reveals
ALTER TABLE contact_reveals DROP CONSTRAINT IF EXISTS fk_reveals_profile;
ALTER TABLE contact_reveals DROP CONSTRAINT IF EXISTS fk_reveals_revealer;

-- Abuse reports
ALTER TABLE abuse_reports DROP CONSTRAINT IF EXISTS fk_abuse_reporter;

-- Audit logs
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_user;

\echo 'Foreign key constraints dropped\n'

-- ============================================================================
-- STEP R5: DROP UNIQUE CONSTRAINTS ADDED IN PHASE C
-- ============================================================================

\echo 'R5: Dropping unique constraints\n'

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_registration_number_unique;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stripe_unique;
ALTER TABLE conversation_participants DROP CONSTRAINT IF EXISTS participants_unique;
ALTER TABLE contact_reveals DROP CONSTRAINT IF EXISTS reveals_unique;

\echo 'Unique constraints dropped\n'

-- ============================================================================
-- STEP R6: DROP POLYMORPHIC RELATIONSHIP VALIDATION
-- ============================================================================

\echo 'R6: Dropping polymorphic relationship validation\n'

DROP TRIGGER IF EXISTS validate_job_employer_trigger ON jobs;
DROP FUNCTION IF EXISTS validate_job_employer() CASCADE;

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_employer_exists;

\echo 'Polymorphic validation dropped\n'

-- ============================================================================
-- STEP R7: REVERT NOT NULL CONSTRAINTS (if any were added)
-- ============================================================================

\echo 'R7: Reverting NOT NULL constraints (if needed)\n'

-- Only revert if Phase C added NOT NULL constraints
-- Example (uncomment if applicable):
-- ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
-- ALTER TABLE guides ALTER COLUMN profile_id DROP NOT NULL;

\echo 'NOT NULL constraints reverted (if applicable)\n'

-- ============================================================================
-- STEP R8: VERIFY ROLLBACK
-- ============================================================================

\echo 'R8: Verifying rollback\n'

-- Count remaining constraints
SELECT
    'Foreign Keys' AS constraint_type,
    COUNT(*)::text AS count
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE 'fk_%'

UNION ALL

SELECT
    'Check Constraints',
    COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
    AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%_check' OR constraint_name LIKE '%_range'

UNION ALL

SELECT
    'Unique Constraints (added)',
    COUNT(*)::text
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
    AND constraint_type = 'UNIQUE'
    AND constraint_name IN ('profiles_email_unique', 'participants_unique', 'reveals_unique');

\echo '\n=== PHASE C ROLLBACK COMPLETE ===\n'
\echo 'All Phase C constraints removed\n'
\echo 'Views and indexes from Phase A remain active\n'
\echo '\nIf constraint counts show 0 for added constraints, rollback was successful\n'
\echo '\nYou can now:\n'
\echo '1. Fix issues that caused the need for rollback\n'
\echo '2. Modify constraint definitions if needed\n'
\echo '3. Re-run phase_c_cutover.sql when ready\n'

\timing off

-- ============================================================================
-- NOTES
-- ============================================================================

\echo '\nNotes:\n'
\echo '- Phase A objects (views, indexes, MVs) are still in place\n'
\echo '- Application queries using those objects will continue to work\n'
\echo '- Data integrity is now enforced at application level only\n'
\echo '- Re-apply constraints when ready to ensure database-level validation\n'

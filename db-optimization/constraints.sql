-- ============================================================================
-- CONSTRAINTS PROPOSALS for Guide Validator
-- Purpose: Add missing foreign keys, check constraints, and explicit behaviors
-- Status: PROPOSALS ONLY - Review before applying
-- ============================================================================

-- SAFETY: These are additive constraints that may fail if data violates them
-- Run VALIDATE queries first to check for violations

\timing on
\echo '\n=== DATABASE CONSTRAINTS PROPOSALS ===\n'

-- ============================================================================
-- SECTION 1: MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

\echo '1. Adding Missing Foreign Keys\n'

-- profiles table
-- Assuming profiles.country_code should reference countries
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_country
FOREIGN KEY (country_code) REFERENCES countries(code)
ON DELETE RESTRICT
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_profiles_country ON profiles IS 'Ensure valid country codes';

-- guides table
ALTER TABLE guides
ADD CONSTRAINT fk_guides_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_guides_profile ON guides IS 'Cascade delete when profile deleted';

-- agencies table
ALTER TABLE agencies
ADD CONSTRAINT fk_agencies_country
FOREIGN KEY (country_code) REFERENCES countries(code)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- agency_members table
ALTER TABLE agency_members
ADD CONSTRAINT fk_agency_members_agency
FOREIGN KEY (agency_id) REFERENCES agencies(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE agency_members
ADD CONSTRAINT fk_agency_members_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_agency_members_agency ON agency_members IS 'Remove members when agency deleted';
COMMENT ON CONSTRAINT fk_agency_members_profile ON agency_members IS 'Remove membership when profile deleted';

-- availability_slots table
ALTER TABLE availability_slots
ADD CONSTRAINT fk_availability_provider
FOREIGN KEY (provider_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_availability_provider ON availability_slots IS 'Remove slots when provider deleted';

-- availability_holds table
ALTER TABLE availability_holds
ADD CONSTRAINT fk_holds_requester
FOREIGN KEY (requester_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE availability_holds
ADD CONSTRAINT fk_holds_provider
FOREIGN KEY (provider_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- conversations table (no FK needed, it's a junction hub)

-- conversation_participants table
ALTER TABLE conversation_participants
ADD CONSTRAINT fk_participants_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE conversation_participants
ADD CONSTRAINT fk_participants_user
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- messages table
ALTER TABLE messages
ADD CONSTRAINT fk_messages_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE messages
ADD CONSTRAINT fk_messages_sender
FOREIGN KEY (sender_id) REFERENCES profiles(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_messages_sender ON messages IS 'Keep messages even if sender deleted';

-- message_attachments table
ALTER TABLE message_attachments
ADD CONSTRAINT fk_attachments_message
FOREIGN KEY (message_id) REFERENCES messages(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- reviews table
ALTER TABLE reviews
ADD CONSTRAINT fk_reviews_reviewer
FOREIGN KEY (reviewer_id) REFERENCES profiles(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE reviews
ADD CONSTRAINT fk_reviews_reviewee
FOREIGN KEY (reviewee_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_reviews_reviewer ON reviews IS 'Keep review even if reviewer deleted';
COMMENT ON CONSTRAINT fk_reviews_reviewee ON reviews IS 'Remove reviews when subject deleted';

-- review_responses table
ALTER TABLE review_responses
ADD CONSTRAINT fk_responses_review
FOREIGN KEY (review_id) REFERENCES reviews(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE review_responses
ADD CONSTRAINT fk_responses_responder
FOREIGN KEY (responder_id) REFERENCES profiles(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- jobs table
-- Note: employer_id can reference profiles OR agencies depending on employer_type
-- This requires a custom CHECK constraint or trigger, not a simple FK

-- job_applications table
ALTER TABLE job_applications
ADD CONSTRAINT fk_job_apps_job
FOREIGN KEY (job_id) REFERENCES jobs(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE job_applications
ADD CONSTRAINT fk_job_apps_applicant
FOREIGN KEY (applicant_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- regions table
ALTER TABLE regions
ADD CONSTRAINT fk_regions_country
FOREIGN KEY (country_code) REFERENCES countries(code)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- cities table
ALTER TABLE cities
ADD CONSTRAINT fk_cities_country
FOREIGN KEY (country_code) REFERENCES countries(code)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE cities
ADD CONSTRAINT fk_cities_region
FOREIGN KEY (region_id) REFERENCES regions(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_cities_region ON cities IS 'Allow cities without region';

-- national_parks table
ALTER TABLE national_parks
ADD CONSTRAINT fk_parks_country
FOREIGN KEY (country_code) REFERENCES countries(code)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE national_parks
ADD CONSTRAINT fk_parks_region
FOREIGN KEY (region_id) REFERENCES regions(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- subscriptions table
ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscriptions_user
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- billing_events table
ALTER TABLE billing_events
ADD CONSTRAINT fk_billing_user
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- guide_credentials table
ALTER TABLE guide_credentials
ADD CONSTRAINT fk_credentials_guide
FOREIGN KEY (guide_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- contact_reveals table
ALTER TABLE contact_reveals
ADD CONSTRAINT fk_reveals_profile
FOREIGN KEY (profile_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE contact_reveals
ADD CONSTRAINT fk_reveals_revealer
FOREIGN KEY (revealer_id) REFERENCES profiles(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- abuse_reports table
ALTER TABLE abuse_reports
ADD CONSTRAINT fk_abuse_reporter
FOREIGN KEY (reporter_id) REFERENCES profiles(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_abuse_reporter ON abuse_reports IS 'Keep report even if reporter deleted';

-- audit_logs table
ALTER TABLE audit_logs
ADD CONSTRAINT fk_audit_user
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_audit_user ON audit_logs IS 'Keep audit log even if user deleted';

\echo 'Foreign keys proposed. Run VALIDATE queries before applying.\n'

-- ============================================================================
-- SECTION 2: UNIQUE CONSTRAINTS
-- ============================================================================

\echo '2. Adding Unique Constraints\n'

-- profiles table
ALTER TABLE profiles
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

COMMENT ON CONSTRAINT profiles_email_unique ON profiles IS 'Prevent duplicate email addresses';

-- agencies table (if not already unique)
ALTER TABLE agencies
ADD CONSTRAINT agencies_registration_number_unique UNIQUE (registration_number)
WHERE registration_number IS NOT NULL;

-- subscriptions table
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_stripe_unique UNIQUE (stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

-- conversation_participants table (prevent duplicate participants)
ALTER TABLE conversation_participants
ADD CONSTRAINT participants_unique UNIQUE (conversation_id, user_id);

COMMENT ON CONSTRAINT participants_unique ON conversation_participants IS 'One participation per user per conversation';

-- contact_reveals table (prevent duplicate reveals)
ALTER TABLE contact_reveals
ADD CONSTRAINT reveals_unique UNIQUE (revealer_id, profile_id);

COMMENT ON CONSTRAINT reveals_unique ON contact_reveals IS 'One reveal per user-profile pair';

\echo 'Unique constraints proposed.\n'

-- ============================================================================
-- SECTION 3: CHECK CONSTRAINTS
-- ============================================================================

\echo '3. Adding Check Constraints\n'

-- profiles table
ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('guide', 'agency', 'dmc', 'transport', 'admin', 'user'));

ALTER TABLE profiles
ADD CONSTRAINT profiles_email_format_check
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

COMMENT ON CONSTRAINT profiles_role_check ON profiles IS 'Valid roles only';

-- guides table
ALTER TABLE guides
ADD CONSTRAINT guides_rate_positive
CHECK (hourly_rate_cents IS NULL OR hourly_rate_cents >= 0);

ALTER TABLE guides
ADD CONSTRAINT guides_experience_positive
CHECK (years_experience IS NULL OR years_experience >= 0);

ALTER TABLE guides
ADD CONSTRAINT guides_response_time_positive
CHECK (response_time_minutes IS NULL OR response_time_minutes > 0);

-- availability_slots table
ALTER TABLE availability_slots
ADD CONSTRAINT availability_time_order
CHECK (start_time < end_time);

ALTER TABLE availability_slots
ADD CONSTRAINT availability_future_dates
CHECK (date >= '2020-01-01'::date);  -- Sanity check

-- availability_holds table
ALTER TABLE availability_holds
ADD CONSTRAINT holds_date_order
CHECK (start_date <= end_date);

ALTER TABLE availability_holds
ADD CONSTRAINT holds_status_check
CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'canceled'));

ALTER TABLE availability_holds
ADD CONSTRAINT holds_expiry_future
CHECK (expires_at > created_at);

-- reviews table
ALTER TABLE reviews
ADD CONSTRAINT reviews_rating_range
CHECK (overall_rating >= 1 AND overall_rating <= 5);

ALTER TABLE reviews
ADD CONSTRAINT reviews_communication_range
CHECK (communication_rating IS NULL OR (communication_rating >= 1 AND communication_rating <= 5));

ALTER TABLE reviews
ADD CONSTRAINT reviews_professionalism_range
CHECK (professionalism_rating IS NULL OR (professionalism_rating >= 1 AND professionalism_rating <= 5));

ALTER TABLE reviews
ADD CONSTRAINT reviews_value_range
CHECK (value_rating IS NULL OR (value_rating >= 1 AND value_rating <= 5));

ALTER TABLE reviews
ADD CONSTRAINT reviews_status_check
CHECK (status IN ('draft', 'published', 'flagged', 'hidden'));

ALTER TABLE reviews
ADD CONSTRAINT reviews_reviewee_type_check
CHECK (reviewee_type IN ('guide', 'agency', 'dmc', 'transport'));

-- jobs table
ALTER TABLE jobs
ADD CONSTRAINT jobs_date_order
CHECK (start_date <= end_date);

ALTER TABLE jobs
ADD CONSTRAINT jobs_status_check
CHECK (status IN ('draft', 'active', 'closed', 'filled', 'canceled'));

ALTER TABLE jobs
ADD CONSTRAINT jobs_compensation_positive
CHECK (compensation_amount IS NULL OR compensation_amount >= 0);

-- job_applications table
ALTER TABLE job_applications
ADD CONSTRAINT job_apps_status_check
CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'));

-- subscriptions table
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_status_check
CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'trialing'));

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_period_order
CHECK (current_period_start < current_period_end);

-- guide_credentials table
ALTER TABLE guide_credentials
ADD CONSTRAINT credentials_status_check
CHECK (status IN ('pending', 'verified', 'rejected', 'expired'));

-- cities table
ALTER TABLE cities
ADD CONSTRAINT cities_population_positive
CHECK (population IS NULL OR population >= 0);

-- abuse_reports table
ALTER TABLE abuse_reports
ADD CONSTRAINT abuse_status_check
CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed'));

ALTER TABLE abuse_reports
ADD CONSTRAINT abuse_entity_type_check
CHECK (reported_entity_type IN ('profile', 'review', 'message', 'job'));

\echo 'Check constraints proposed.\n'

-- ============================================================================
-- SECTION 4: NOT NULL CONSTRAINTS
-- ============================================================================

\echo '4. Adding NOT NULL Constraints (Validate data first!)\n'

-- Only add NOT NULL if data is clean
-- Run validation queries first:

-- Example validation query:
-- SELECT COUNT(*) FROM profiles WHERE id IS NULL;
-- SELECT COUNT(*) FROM profiles WHERE created_at IS NULL;

-- profiles table
ALTER TABLE profiles
ALTER COLUMN id SET NOT NULL;

ALTER TABLE profiles
ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE profiles
ALTER COLUMN role SET NOT NULL;

-- guides table
ALTER TABLE guides
ALTER COLUMN profile_id SET NOT NULL;

-- agencies table
ALTER TABLE agencies
ALTER COLUMN id SET NOT NULL;

ALTER TABLE agencies
ALTER COLUMN name SET NOT NULL;

-- availability_slots table
ALTER TABLE availability_slots
ALTER COLUMN provider_id SET NOT NULL;

ALTER TABLE availability_slots
ALTER COLUMN date SET NOT NULL;

ALTER TABLE availability_slots
ALTER COLUMN start_time SET NOT NULL;

ALTER TABLE availability_slots
ALTER COLUMN end_time SET NOT NULL;

-- messages table
ALTER TABLE messages
ALTER COLUMN conversation_id SET NOT NULL;

ALTER TABLE messages
ALTER COLUMN created_at SET NOT NULL;

-- reviews table
ALTER TABLE reviews
ALTER COLUMN reviewee_id SET NOT NULL;

ALTER TABLE reviews
ALTER COLUMN reviewer_id SET NOT NULL;

ALTER TABLE reviews
ALTER COLUMN overall_rating SET NOT NULL;

\echo 'NOT NULL constraints proposed.\n'

-- ============================================================================
-- SECTION 5: POLYMORPHIC RELATIONSHIP CONSTRAINTS
-- ============================================================================

\echo '5. Polymorphic Relationships (jobs.employer_id)\n'

-- Problem: jobs.employer_id can reference profiles OR agencies
-- Solution: Custom CHECK constraint + triggers

-- Check constraint to ensure employer exists
ALTER TABLE jobs
ADD CONSTRAINT jobs_employer_exists
CHECK (
    (employer_type = 'profile' AND EXISTS (SELECT 1 FROM profiles WHERE id = employer_id))
    OR (employer_type = 'agency' AND EXISTS (SELECT 1 FROM agencies WHERE id = employer_id))
);

-- Note: This check constraint won't catch deletes. Need a trigger:

CREATE OR REPLACE FUNCTION validate_job_employer()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employer_type = 'profile' THEN
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.employer_id) THEN
            RAISE EXCEPTION 'Invalid employer_id: profile does not exist';
        END IF;
    ELSIF NEW.employer_type = 'agency' THEN
        IF NOT EXISTS (SELECT 1 FROM agencies WHERE id = NEW.employer_id) THEN
            RAISE EXCEPTION 'Invalid employer_id: agency does not exist';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid employer_type: %', NEW.employer_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_job_employer_trigger
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION validate_job_employer();

COMMENT ON TRIGGER validate_job_employer_trigger ON jobs IS 'Validate polymorphic employer_id references';

\echo 'Polymorphic constraints proposed.\n'

-- ============================================================================
-- SECTION 6: VALIDATION QUERIES (Run before applying constraints)
-- ============================================================================

\echo '6. Validation Queries (Run these first!)\n'

\echo '\nCheck for NULL values in critical columns:'
\echo 'SELECT COUNT(*) FROM profiles WHERE id IS NULL OR created_at IS NULL OR role IS NULL;'

\echo '\nCheck for invalid email formats:'
\echo 'SELECT email FROM profiles WHERE email !~* ''^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'';'

\echo '\nCheck for invalid country codes:'
\echo 'SELECT country_code FROM profiles WHERE country_code NOT IN (SELECT code FROM countries);'

\echo '\nCheck for orphaned guides:'
\echo 'SELECT g.profile_id FROM guides g LEFT JOIN profiles p ON p.id = g.profile_id WHERE p.id IS NULL;'

\echo '\nCheck for invalid ratings:'
\echo 'SELECT * FROM reviews WHERE overall_rating < 1 OR overall_rating > 5;'

\echo '\nCheck for date order violations:'
\echo 'SELECT * FROM jobs WHERE start_date > end_date;'

\echo '\nCheck for duplicate emails:'
\echo 'SELECT email, COUNT(*) FROM profiles GROUP BY email HAVING COUNT(*) > 1;'

\echo '\nCheck for duplicate participants:'
\echo 'SELECT conversation_id, user_id, COUNT(*) FROM conversation_participants GROUP BY conversation_id, user_id HAVING COUNT(*) > 1;'

\timing off

-- ============================================================================
-- ROLLBACK SCRIPT
-- ============================================================================

\echo '\n=== ROLLBACK SCRIPT ===\n'
\echo 'If constraints cause issues, run:\n'

\echo '-- Drop all new constraints'
\echo 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS fk_profiles_country;'
\echo 'ALTER TABLE guides DROP CONSTRAINT IF EXISTS fk_guides_profile;'
\echo '-- ... (repeat for all constraints)'

\echo '\n-- Drop trigger'
\echo 'DROP TRIGGER IF EXISTS validate_job_employer_trigger ON jobs;'
\echo 'DROP FUNCTION IF EXISTS validate_job_employer();'

\echo '\n=== END OF CONSTRAINTS PROPOSALS ===\n'
\echo 'Review validation queries before applying!\n'

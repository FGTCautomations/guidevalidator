-- ============================================================================
-- PHASE A: ADDITIVE CHANGES
-- Purpose: Add new objects without disrupting existing queries
-- Safety: Can be rolled back without data loss
-- ============================================================================

-- This phase includes:
-- 1. Create materialized views
-- 2. Create regular views
-- 3. Add new indexes (CONCURRENTLY)
-- 4. Add new columns (with defaults)
-- 5. Create helper functions

\timing on
\echo '\n=== PHASE A: ADDITIVE CHANGES ===\n'

-- ============================================================================
-- STEP A1: CREATE INDEXES (from index_plan.sql)
-- ============================================================================

\echo 'A1: Creating performance indexes\n'

-- Execute index_plan.sql
\ir ../index_plan.sql

-- ============================================================================
-- STEP A2: CREATE VIEWS (from views.sql)
-- ============================================================================

\echo 'A2: Creating stable view layer\n'

-- Execute views.sql
\ir ../views.sql

-- ============================================================================
-- STEP A3: CREATE MATERIALIZED VIEWS (from matviews.sql)
-- ============================================================================

\echo 'A3: Creating materialized views\n'

-- Execute matviews.sql
\ir ../matviews.sql

-- ============================================================================
-- STEP A4: ADD HELPER COLUMNS (for performance)
-- ============================================================================

\echo 'A4: Adding helper columns\n'

-- Add participant_ids array to conversations (for faster policy checks)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS participant_ids UUID[];

COMMENT ON COLUMN conversations.participant_ids IS 'Denormalized participant list for RLS performance';

-- Add cached review stats to profiles (to avoid subqueries)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cached_review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cached_avg_rating NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS stats_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.cached_review_count IS 'Cached from mv_profile_stats';
COMMENT ON COLUMN profiles.cached_avg_rating IS 'Cached from mv_profile_stats';

-- Add full_name_tsvector for text search
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS full_name_tsvector tsvector;

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_search
ON profiles USING GIN(full_name_tsvector);

-- ============================================================================
-- STEP A5: CREATE UPDATE FUNCTIONS
-- ============================================================================

\echo 'A5: Creating helper functions\n'

-- Function to update conversation participant_ids
CREATE OR REPLACE FUNCTION update_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE conversations
        SET participant_ids = (
            SELECT ARRAY_AGG(user_id)
            FROM conversation_participants
            WHERE conversation_id = NEW.conversation_id
        )
        WHERE id = NEW.conversation_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations
        SET participant_ids = (
            SELECT ARRAY_AGG(user_id)
            FROM conversation_participants
            WHERE conversation_id = OLD.conversation_id
        )
        WHERE id = OLD.conversation_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_participants
AFTER INSERT OR UPDATE OR DELETE ON conversation_participants
FOR EACH ROW
EXECUTE FUNCTION update_conversation_participants();

COMMENT ON TRIGGER trg_update_conversation_participants ON conversation_participants IS 'Maintain participant_ids array';

-- Function to update profile search vector
CREATE OR REPLACE FUNCTION update_profile_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_name_tsvector := to_tsvector('english', COALESCE(NEW.full_name, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_profile_search_vector
BEFORE INSERT OR UPDATE OF full_name ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_search_vector();

-- Function to sync cached stats from materialized view
CREATE OR REPLACE FUNCTION sync_profile_stats_cache()
RETURNS void AS $$
BEGIN
    UPDATE profiles p
    SET
        cached_review_count = COALESCE(s.review_count, 0),
        cached_avg_rating = s.avg_overall_rating,
        stats_updated_at = NOW()
    FROM mv_profile_stats s
    WHERE p.id = s.profile_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_profile_stats_cache IS 'Copy stats from MV to profiles cache columns';

-- ============================================================================
-- STEP A6: BACKFILL HELPER COLUMNS
-- ============================================================================

\echo 'A6: Backfilling helper columns\n'

-- Backfill conversation participant_ids
UPDATE conversations c
SET participant_ids = (
    SELECT ARRAY_AGG(user_id)
    FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
)
WHERE participant_ids IS NULL;

-- Backfill profile search vectors
UPDATE profiles
SET full_name_tsvector = to_tsvector('english', COALESCE(full_name, ''))
WHERE full_name_tsvector IS NULL;

-- Backfill cached stats (after materialized views are created)
-- This will be called in Phase B after first MV refresh

-- ============================================================================
-- STEP A7: CREATE MONITORING TABLE
-- ============================================================================

\echo 'A7: Creating monitoring infrastructure\n'

CREATE TABLE IF NOT EXISTS matview_refresh_log (
    id SERIAL PRIMARY KEY,
    view_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_matview_refresh_log_view_time
    ON matview_refresh_log(view_name, started_at DESC);

COMMENT ON TABLE matview_refresh_log IS 'Track materialized view refresh performance';

-- Function for logged refresh
CREATE OR REPLACE FUNCTION refresh_matview_with_logging(view_name TEXT)
RETURNS void AS $$
DECLARE
    start_time TIMESTAMPTZ;
    log_id INTEGER;
BEGIN
    INSERT INTO matview_refresh_log (view_name, started_at)
    VALUES (view_name, NOW())
    RETURNING id INTO log_id;

    start_time := clock_timestamp();

    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || view_name;

    UPDATE matview_refresh_log
    SET completed_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000,
        success = true
    WHERE id = log_id;

EXCEPTION WHEN OTHERS THEN
    UPDATE matview_refresh_log
    SET completed_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000,
        success = false,
        error_message = SQLERRM
    WHERE id = log_id;
    RAISE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_matview_with_logging IS 'Refresh materialized view with performance tracking';

\echo '\n=== PHASE A COMPLETE ===\n'
\echo 'New objects created:\n'
\echo '- Indexes: ~70+ performance indexes\n'
\echo '- Views: 16 stable views\n'
\echo '- Materialized Views: 8 aggregation views\n'
\echo '- Helper columns: participant_ids, cached stats, search vectors\n'
\echo '- Functions: 4 helper functions + triggers\n'
\echo '\nExisting queries continue to work unchanged\n'
\echo '\nNext: Run Phase B to verify and backfill data\n'

\timing off

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

\echo '\nVerification:\n'
\echo 'SELECT COUNT(*) FROM pg_indexes WHERE schemaname = ''public'' AND indexname LIKE ''idx_%'';'
\echo 'SELECT COUNT(*) FROM pg_views WHERE schemaname = ''public'' AND viewname LIKE ''vw_%'';'
\echo 'SELECT COUNT(*) FROM pg_matviews WHERE schemaname = ''public'';'
\echo 'SELECT tablename, column_name FROM information_schema.columns WHERE table_schema = ''public'' AND column_name IN (''participant_ids'', ''cached_review_count'');'

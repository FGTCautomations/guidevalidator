-- ============================================================================
-- CREATE MISSING TABLES
-- ============================================================================
-- This script creates 6 tables that are referenced in the codebase but
-- don't exist in the database yet.
--
-- These tables enable:
-- - Guide location filtering (by country/region/city)
-- - Rating aggregation and statistics
-- - In-app notifications for holds/bookings
--
-- Date: 2025-11-10
-- ============================================================================

-- ============================================================================
-- DROP EXISTING VIEWS (if any exist as views instead of tables)
-- ============================================================================

DROP VIEW IF EXISTS profile_ratings CASCADE;
DROP VIEW IF EXISTS guide_ratings_summary CASCADE;
DROP VIEW IF EXISTS notifications CASCADE;
DROP VIEW IF EXISTS guide_countries CASCADE;
DROP VIEW IF EXISTS guide_regions CASCADE;
DROP VIEW IF EXISTS guide_cities CASCADE;

-- ============================================================================
-- GUIDE LOCATION JUNCTION TABLES
-- ============================================================================
-- These tables link guides to the locations they serve

-- Guide → Countries mapping
CREATE TABLE IF NOT EXISTS guide_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(profile_id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each guide-country pair is unique
  UNIQUE(guide_id, country_code)
);

CREATE INDEX idx_guide_countries_guide_id ON guide_countries(guide_id);
CREATE INDEX idx_guide_countries_country_code ON guide_countries(country_code);

COMMENT ON TABLE guide_countries IS 'Junction table: guides → countries they serve';

-- Guide → Regions mapping
CREATE TABLE IF NOT EXISTS guide_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(profile_id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each guide-region pair is unique
  UNIQUE(guide_id, region_id)
);

CREATE INDEX idx_guide_regions_guide_id ON guide_regions(guide_id);
CREATE INDEX idx_guide_regions_region_id ON guide_regions(region_id);

COMMENT ON TABLE guide_regions IS 'Junction table: guides → regions they serve';

-- Guide → Cities mapping
CREATE TABLE IF NOT EXISTS guide_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(profile_id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each guide-city pair is unique
  UNIQUE(guide_id, city_id)
);

CREATE INDEX idx_guide_cities_guide_id ON guide_cities(guide_id);
CREATE INDEX idx_guide_cities_city_id ON guide_cities(city_id);

COMMENT ON TABLE guide_cities IS 'Junction table: guides → cities they serve';

-- ============================================================================
-- RATING AGGREGATION TABLES
-- ============================================================================
-- These tables store aggregated rating data for performance

-- Profile ratings (aggregated from reviews)
CREATE TABLE IF NOT EXISTS profile_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Rating statistics
  average_rating DECIMAL(3,2) CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),

  -- Rating breakdown (1-5 stars)
  rating_1_count INTEGER DEFAULT 0 CHECK (rating_1_count >= 0),
  rating_2_count INTEGER DEFAULT 0 CHECK (rating_2_count >= 0),
  rating_3_count INTEGER DEFAULT 0 CHECK (rating_3_count >= 0),
  rating_4_count INTEGER DEFAULT 0 CHECK (rating_4_count >= 0),
  rating_5_count INTEGER DEFAULT 0 CHECK (rating_5_count >= 0),

  -- Timestamps
  last_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One rating record per profile
  UNIQUE(profile_id)
);

CREATE INDEX idx_profile_ratings_profile_id ON profile_ratings(profile_id);
CREATE INDEX idx_profile_ratings_avg_rating ON profile_ratings(average_rating DESC);
CREATE INDEX idx_profile_ratings_total_reviews ON profile_ratings(total_reviews DESC);

COMMENT ON TABLE profile_ratings IS 'Aggregated rating statistics for profiles';

-- Guide-specific rating summary (denormalized for performance)
CREATE TABLE IF NOT EXISTS guide_ratings_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(profile_id) ON DELETE CASCADE,

  -- Overall rating
  average_rating DECIMAL(3,2) CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews INTEGER DEFAULT 0 CHECK (total_reviews >= 0),

  -- Category-specific ratings (if used)
  communication_rating DECIMAL(3,2),
  professionalism_rating DECIMAL(3,2),
  knowledge_rating DECIMAL(3,2),
  value_rating DECIMAL(3,2),

  -- Response rate
  response_rate INTEGER CHECK (response_rate >= 0 AND response_rate <= 100),

  -- Timestamps
  last_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One summary per guide
  UNIQUE(guide_id)
);

CREATE INDEX idx_guide_ratings_summary_guide_id ON guide_ratings_summary(guide_id);
CREATE INDEX idx_guide_ratings_summary_avg_rating ON guide_ratings_summary(average_rating DESC);

COMMENT ON TABLE guide_ratings_summary IS 'Denormalized rating summary for guides (performance optimization)';

-- ============================================================================
-- NOTIFICATIONS SYSTEM
-- ============================================================================
-- In-app notification queue for holds, bookings, messages, etc.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Recipient
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(50) NOT NULL, -- 'hold_created', 'hold_expired', 'booking_confirmed', 'message_received', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Related entity (optional)
  related_type VARCHAR(50), -- 'hold', 'booking', 'message', 'review', etc.
  related_id UUID,

  -- Action URL (optional)
  action_url TEXT,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Optional expiration
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_related ON notifications(related_type, related_id);

COMMENT ON TABLE notifications IS 'In-app notification queue for users';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS for security

ALTER TABLE guide_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_ratings_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Public read access for location tables (used in directory search)
CREATE POLICY "Public read access" ON guide_countries FOR SELECT USING (true);
CREATE POLICY "Public read access" ON guide_regions FOR SELECT USING (true);
CREATE POLICY "Public read access" ON guide_cities FOR SELECT USING (true);

-- Guides can manage their own locations
CREATE POLICY "Guides can insert own locations" ON guide_countries
  FOR INSERT WITH CHECK (guide_id = auth.uid());
CREATE POLICY "Guides can delete own locations" ON guide_countries
  FOR DELETE USING (guide_id = auth.uid());

CREATE POLICY "Guides can insert own locations" ON guide_regions
  FOR INSERT WITH CHECK (guide_id = auth.uid());
CREATE POLICY "Guides can delete own locations" ON guide_regions
  FOR DELETE USING (guide_id = auth.uid());

CREATE POLICY "Guides can insert own locations" ON guide_cities
  FOR INSERT WITH CHECK (guide_id = auth.uid());
CREATE POLICY "Guides can delete own locations" ON guide_cities
  FOR DELETE USING (guide_id = auth.uid());

-- Public read access for ratings (used in directory listings)
CREATE POLICY "Public read access" ON profile_ratings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON guide_ratings_summary FOR SELECT USING (true);

-- Only system can update ratings (via triggers)
CREATE POLICY "System updates only" ON profile_ratings
  FOR ALL USING (false);
CREATE POLICY "System updates only" ON guide_ratings_summary
  FOR ALL USING (false);

-- Users can only see their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all 6 tables were created
SELECT
  table_name,
  CASE
    WHEN table_name IN ('guide_countries', 'guide_regions', 'guide_cities',
                        'profile_ratings', 'guide_ratings_summary', 'notifications')
    THEN '✓ Created'
    ELSE '✗ Missing'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('guide_countries', 'guide_regions', 'guide_cities',
                     'profile_ratings', 'guide_ratings_summary', 'notifications')
ORDER BY table_name;

-- Check row counts (should all be 0 initially)
SELECT
  schemaname,
  relname as table_name,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE relname IN ('guide_countries', 'guide_regions', 'guide_cities',
                  'profile_ratings', 'guide_ratings_summary', 'notifications')
ORDER BY relname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ Successfully created 6 missing tables:';
  RAISE NOTICE '  - guide_countries (guides → countries junction)';
  RAISE NOTICE '  - guide_regions (guides → regions junction)';
  RAISE NOTICE '  - guide_cities (guides → cities junction)';
  RAISE NOTICE '  - profile_ratings (aggregated rating data)';
  RAISE NOTICE '  - guide_ratings_summary (guide rating statistics)';
  RAISE NOTICE '  - notifications (in-app notification queue)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Populate guide location tables from existing guide data';
  RAISE NOTICE '  2. Calculate initial ratings from existing reviews';
  RAISE NOTICE '  3. Set up notification triggers for holds/bookings';
END $$;

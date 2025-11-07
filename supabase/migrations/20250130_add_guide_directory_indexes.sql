-- Migration: Add indexes for guide directory performance optimization
-- This migration adds indexes to improve query performance for the guide directory filters
-- Expected performance improvement: 10-50x faster queries

-- ============================================
-- ENABLE REQUIRED EXTENSIONS
-- ============================================

-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- GUIDES TABLE INDEXES
-- ============================================

-- Index for country filtering (most common filter)
-- B-tree index for exact matches on country_code via profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_country_code_application_status
ON profiles(country_code, application_status)
WHERE application_status = 'approved';

-- GIN index for spoken_languages array (language filter)
-- GIN (Generalized Inverted Index) is optimal for array contains operations
CREATE INDEX IF NOT EXISTS idx_guides_spoken_languages
ON guides USING GIN (spoken_languages);

-- GIN index for specialties array (specialty filter)
CREATE INDEX IF NOT EXISTS idx_guides_specialties
ON guides USING GIN (specialties);

-- Index for gender filter (male/female/other)
CREATE INDEX IF NOT EXISTS idx_guides_gender
ON guides(gender)
WHERE gender IS NOT NULL;

-- Index for hourly rate range filtering
CREATE INDEX IF NOT EXISTS idx_guides_hourly_rate_cents
ON guides(hourly_rate_cents)
WHERE hourly_rate_cents IS NOT NULL;

-- Index for insurance filter
CREATE INDEX IF NOT EXISTS idx_guides_has_liability_insurance
ON guides(has_liability_insurance)
WHERE has_liability_insurance = true;

-- Composite index for profile_id lookups with license_verified (for sorting)
CREATE INDEX IF NOT EXISTS idx_profiles_verified_license
ON profiles(id, verified, license_verified, application_status)
WHERE application_status = 'approved';

-- ============================================
-- AVAILABILITY SLOTS INDEXES
-- ============================================

-- Index for availability date range queries
-- Using B-tree composite index for efficient date range queries with guide_id
CREATE INDEX IF NOT EXISTS idx_availability_slots_guide_dates
ON availability_slots(guide_id, starts_at, ends_at);

-- Additional index for date range overlap queries (using btree_gist if available)
-- Note: GIST index requires btree_gist extension for UUID support
-- If you need GIST for range queries, run: CREATE EXTENSION IF NOT EXISTS btree_gist;
-- Then create: CREATE INDEX idx_availability_slots_date_range ON availability_slots USING GIST (guide_id, tstzrange(starts_at, ends_at));

-- ============================================
-- GUIDE CREDENTIALS INDEXES
-- ============================================

-- Index for license number search
CREATE INDEX IF NOT EXISTS idx_guide_credentials_license_number
ON guide_credentials(guide_id, license_number)
WHERE license_number IS NOT NULL;

-- Full-text search index for license numbers (optional, for fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_guide_credentials_license_number_trgm
ON guide_credentials USING GIN (license_number gin_trgm_ops);

-- ============================================
-- PROFILES TABLE TEXT SEARCH
-- ============================================

-- Full-text search index for name search (optional, for fuzzy matching)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
ON profiles USING GIN (full_name gin_trgm_ops);

-- ============================================
-- STATISTICS UPDATE
-- ============================================

-- Update table statistics for better query planning
ANALYZE guides;
ANALYZE profiles;
ANALYZE availability_slots;
ANALYZE guide_credentials;

-- ============================================
-- VERIFICATION
-- ============================================

-- Query to verify indexes were created
-- Run this after migration to confirm:
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('guides', 'profiles', 'availability_slots', 'guide_credentials')
-- ORDER BY tablename, indexname;

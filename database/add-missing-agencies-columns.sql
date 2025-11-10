-- ============================================================================
-- ADD ALL MISSING COLUMNS TO AGENCIES TABLE
-- ============================================================================
-- The sign-up form expects many columns that don't exist in the table.
-- This script adds all missing columns required for agency sign-ups to work.
--
-- Date: 2025-11-10
-- ============================================================================

DO $$
BEGIN
  -- Basic info columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='slug') THEN
    ALTER TABLE agencies ADD COLUMN slug TEXT;
    RAISE NOTICE 'Added slug column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='description') THEN
    ALTER TABLE agencies ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='website_url') THEN
    ALTER TABLE agencies ADD COLUMN website_url TEXT;
    RAISE NOTICE 'Added website_url column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='logo_url') THEN
    ALTER TABLE agencies ADD COLUMN logo_url TEXT;
    RAISE NOTICE 'Added logo_url column';
  END IF;

  -- Contact info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='contact_email') THEN
    ALTER TABLE agencies ADD COLUMN contact_email TEXT;
    RAISE NOTICE 'Added contact_email column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='contact_phone') THEN
    ALTER TABLE agencies ADD COLUMN contact_phone TEXT;
    RAISE NOTICE 'Added contact_phone column';
  END IF;

  -- Business registration
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='registration_country') THEN
    ALTER TABLE agencies ADD COLUMN registration_country VARCHAR(2);
    RAISE NOTICE 'Added registration_country column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='registration_number') THEN
    ALTER TABLE agencies ADD COLUMN registration_number TEXT;
    RAISE NOTICE 'Added registration_number column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='vat_id') THEN
    ALTER TABLE agencies ADD COLUMN vat_id TEXT;
    RAISE NOTICE 'Added vat_id column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='country_code') THEN
    ALTER TABLE agencies ADD COLUMN country_code VARCHAR(2);
    RAISE NOTICE 'Added country_code column';
  END IF;

  -- Services & capabilities
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='services_offered') THEN
    ALTER TABLE agencies ADD COLUMN services_offered TEXT[];
    RAISE NOTICE 'Added services_offered column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='languages_supported') THEN
    ALTER TABLE agencies ADD COLUMN languages_supported TEXT[];
    RAISE NOTICE 'Added languages_supported column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='certifications') THEN
    ALTER TABLE agencies ADD COLUMN certifications TEXT[];
    RAISE NOTICE 'Added certifications column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='coverage_summary') THEN
    ALTER TABLE agencies ADD COLUMN coverage_summary TEXT;
    RAISE NOTICE 'Added coverage_summary column';
  END IF;

  -- Availability & timezone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='timezone') THEN
    ALTER TABLE agencies ADD COLUMN timezone TEXT;
    RAISE NOTICE 'Added timezone column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='availability_timezone') THEN
    ALTER TABLE agencies ADD COLUMN availability_timezone TEXT;
    RAISE NOTICE 'Added availability_timezone column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='working_hours') THEN
    ALTER TABLE agencies ADD COLUMN working_hours JSONB;
    RAISE NOTICE 'Added working_hours column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='availability_notes') THEN
    ALTER TABLE agencies ADD COLUMN availability_notes TEXT;
    RAISE NOTICE 'Added availability_notes column';
  END IF;

  -- Location data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='location_data') THEN
    ALTER TABLE agencies ADD COLUMN location_data JSONB;
    RAISE NOTICE 'Added location_data column';
  END IF;

  -- Application workflow
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='application_status') THEN
    ALTER TABLE agencies ADD COLUMN application_status VARCHAR(50) DEFAULT 'pending';
    RAISE NOTICE 'Added application_status column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='application_submitted_at') THEN
    ALTER TABLE agencies ADD COLUMN application_submitted_at TIMESTAMPTZ;
    RAISE NOTICE 'Added application_submitted_at column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='application_reviewed_at') THEN
    ALTER TABLE agencies ADD COLUMN application_reviewed_at TIMESTAMPTZ;
    RAISE NOTICE 'Added application_reviewed_at column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='application_reviewed_by') THEN
    ALTER TABLE agencies ADD COLUMN application_reviewed_by UUID REFERENCES profiles(id);
    RAISE NOTICE 'Added application_reviewed_by column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agencies' AND column_name='application_data') THEN
    ALTER TABLE agencies ADD COLUMN application_data JSONB;
    RAISE NOTICE 'Added application_data column';
  END IF;
END $$;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_contact_email ON agencies(contact_email);
CREATE INDEX IF NOT EXISTS idx_agencies_application_status ON agencies(application_status) WHERE application_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_agencies_type_status ON agencies(type, application_status);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all columns now
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agencies'
ORDER BY ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ Added all missing columns to agencies table';
  RAISE NOTICE '  Agency sign-ups should now work correctly!';
  RAISE NOTICE '';
  RAISE NOTICE 'Columns added:';
  RAISE NOTICE '  - slug, description, website_url, logo_url';
  RAISE NOTICE '  - contact_email, contact_phone';
  RAISE NOTICE '  - registration_country, registration_number, vat_id, country_code';
  RAISE NOTICE '  - services_offered, languages_supported, certifications, coverage_summary';
  RAISE NOTICE '  - timezone, availability_timezone, working_hours, availability_notes';
  RAISE NOTICE '  - location_data';
  RAISE NOTICE '  - application_status, application_submitted_at, application_reviewed_at';
  RAISE NOTICE '  - application_reviewed_by, application_data';
END $$;

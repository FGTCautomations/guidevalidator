-- ============================================================================
-- FIX: Add application_status column to agencies table
-- ============================================================================
-- The admin panel expects agencies.application_status to exist,
-- but it might be missing from the schema.
--
-- Date: 2025-11-10
-- ============================================================================

-- Add application_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'agencies'
    AND column_name = 'application_status'
  ) THEN
    ALTER TABLE agencies
    ADD COLUMN application_status VARCHAR(50) DEFAULT 'pending';

    RAISE NOTICE 'Added application_status column to agencies table';
  ELSE
    RAISE NOTICE 'application_status column already exists';
  END IF;
END $$;

-- Add application_submitted_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'agencies'
    AND column_name = 'application_submitted_at'
  ) THEN
    ALTER TABLE agencies
    ADD COLUMN application_submitted_at TIMESTAMPTZ;

    RAISE NOTICE 'Added application_submitted_at column to agencies table';
  ELSE
    RAISE NOTICE 'application_submitted_at column already exists';
  END IF;
END $$;

-- Add application_reviewed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'agencies'
    AND column_name = 'application_reviewed_at'
  ) THEN
    ALTER TABLE agencies
    ADD COLUMN application_reviewed_at TIMESTAMPTZ;

    RAISE NOTICE 'Added application_reviewed_at column to agencies table';
  ELSE
    RAISE NOTICE 'application_reviewed_at column already exists';
  END IF;
END $$;

-- Add application_reviewed_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'agencies'
    AND column_name = 'application_reviewed_by'
  ) THEN
    ALTER TABLE agencies
    ADD COLUMN application_reviewed_by UUID REFERENCES profiles(id);

    RAISE NOTICE 'Added application_reviewed_by column to agencies table';
  ELSE
    RAISE NOTICE 'application_reviewed_by column already exists';
  END IF;
END $$;

-- Add application_data column if it doesn't exist (for storing original application)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'agencies'
    AND column_name = 'application_data'
  ) THEN
    ALTER TABLE agencies
    ADD COLUMN application_data JSONB;

    RAISE NOTICE 'Added application_data column to agencies table';
  ELSE
    RAISE NOTICE 'application_data column already exists';
  END IF;
END $$;

-- Create index on application_status for faster queries
CREATE INDEX IF NOT EXISTS idx_agencies_application_status
ON agencies(application_status)
WHERE application_status = 'pending';

-- Create index on type for faster filtering
CREATE INDEX IF NOT EXISTS idx_agencies_type
ON agencies(type);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that columns were added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agencies'
  AND column_name IN ('application_status', 'application_submitted_at',
                      'application_reviewed_at', 'application_reviewed_by',
                      'application_data')
ORDER BY column_name;

-- Check existing agencies without application_status
SELECT
  id,
  name,
  type,
  created_at,
  CASE
    WHEN application_status IS NULL THEN 'Missing application_status'
    ELSE application_status
  END as status
FROM agencies
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ Fixed agencies table schema';
  RAISE NOTICE '  - Added application_status column';
  RAISE NOTICE '  - Added application_submitted_at column';
  RAISE NOTICE '  - Added application_reviewed_at column';
  RAISE NOTICE '  - Added application_reviewed_by column';
  RAISE NOTICE '  - Added application_data column';
  RAISE NOTICE '';
  RAISE NOTICE 'Your agency applications should now appear in the admin panel!';
END $$;

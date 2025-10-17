-- ============================================================================
-- TARGETED FIX: Add missing columns to guides table
-- Run this AFTER running DIAGNOSTIC_CHECK.sql to see what's missing
-- ============================================================================

-- Add columns one at a time to see which one fails (if any)
DO $$
BEGIN
  -- Add avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'guides'
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.guides ADD COLUMN avatar_url TEXT;
    RAISE NOTICE 'Added avatar_url column';
  ELSE
    RAISE NOTICE 'avatar_url column already exists';
  END IF;

  -- Add business_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'guides'
    AND column_name = 'business_name'
  ) THEN
    ALTER TABLE public.guides ADD COLUMN business_name TEXT;
    RAISE NOTICE 'Added business_name column';
  ELSE
    RAISE NOTICE 'business_name column already exists';
  END IF;

  -- Add timezone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'guides'
    AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.guides ADD COLUMN timezone TEXT;
    RAISE NOTICE 'Added timezone column';
  ELSE
    RAISE NOTICE 'timezone column already exists';
  END IF;

  -- Add availability_timezone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'guides'
    AND column_name = 'availability_timezone'
  ) THEN
    ALTER TABLE public.guides ADD COLUMN availability_timezone TEXT;
    RAISE NOTICE 'Added availability_timezone column';
  ELSE
    RAISE NOTICE 'availability_timezone column already exists';
  END IF;

  -- Add working_hours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'guides'
    AND column_name = 'working_hours'
  ) THEN
    ALTER TABLE public.guides ADD COLUMN working_hours JSONB;
    RAISE NOTICE 'Added working_hours column';
  ELSE
    RAISE NOTICE 'working_hours column already exists';
  END IF;

END $$;

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'guides'
AND column_name IN ('avatar_url', 'business_name', 'timezone', 'availability_timezone', 'working_hours')
ORDER BY column_name;

-- ============================================================================
-- After running this, you should see NOTICE messages for each column added
-- The final SELECT will confirm all 5 columns exist
-- ============================================================================

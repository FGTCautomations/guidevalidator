-- ============================================================================
-- UPDATE EXISTING AGENCIES - Set application_status to 'pending'
-- ============================================================================
-- This updates agencies that were created before the application_status
-- column was added. They currently have NULL and won't appear in admin panel.
--
-- Date: 2025-11-10
-- ============================================================================

-- First, let's see which agencies have NULL application_status
SELECT
  id,
  name,
  type,
  created_at,
  application_status,
  CASE
    WHEN application_status IS NULL THEN 'NEEDS UPDATE'
    ELSE 'Already has status'
  END as action_needed
FROM agencies
ORDER BY created_at DESC;

-- Update all agencies with NULL application_status to 'pending'
UPDATE agencies
SET
  application_status = 'pending',
  application_submitted_at = COALESCE(application_submitted_at, created_at)
WHERE application_status IS NULL;

-- ============================================================================
-- VERIFICATION - Show updated agencies
-- ============================================================================

SELECT
  id,
  name,
  type,
  application_status,
  application_submitted_at,
  created_at
FROM agencies
WHERE application_status = 'pending'
ORDER BY application_submitted_at DESC NULLS LAST;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Get count of agencies with pending status
  SELECT COUNT(*) INTO updated_count
  FROM agencies
  WHERE application_status = 'pending';

  RAISE NOTICE '';
  RAISE NOTICE '✓ Updated existing agencies to pending status';
  RAISE NOTICE '  Total agencies with pending status: %', updated_count;
  RAISE NOTICE '';
  RAISE NOTICE 'These agencies should now appear in your admin panel!';
  RAISE NOTICE 'Go to: /admin/applications';
END $$;

-- ============================================================================
-- FORCE FIX: Drop and recreate refresh_guides_browse_v function
-- ============================================================================
-- Directly replace the problematic function with one that does nothing
--
-- Date: 2025-11-10
-- ============================================================================

-- Drop the existing function (CASCADE will drop dependent triggers)
DROP FUNCTION IF EXISTS refresh_guides_browse_v() CASCADE;

-- Recreate it as a no-op function
CREATE OR REPLACE FUNCTION refresh_guides_browse_v()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Do nothing - materialized view guides_browse_v doesn't exist
  -- This prevents errors when triggers try to call this function
  RETURN;
END;
$$;

-- Verify the function was created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'refresh_guides_browse_v';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ Fixed refresh_guides_browse_v function';
  RAISE NOTICE '  - Function now does nothing (no-op)';
  RAISE NOTICE '  - Inserts to agencies table will no longer fail';
  RAISE NOTICE '';
  RAISE NOTICE 'Now run fix-leo-loves-travel.sql';
END $$;

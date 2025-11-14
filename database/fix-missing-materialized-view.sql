-- ============================================================================
-- FIX: Handle missing guides_browse_v materialized view
-- ============================================================================
-- The agencies table has a trigger that tries to refresh guides_browse_v,
-- but the view doesn't exist. We'll disable the trigger temporarily.
--
-- Date: 2025-11-10
-- ============================================================================

-- Check what triggers exist on agencies table
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'agencies'
ORDER BY trigger_name;

-- Find the function that's causing the issue
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%guides_browse%'
ORDER BY routine_name;

-- Option 1: Drop the trigger temporarily (RECOMMENDED)
-- Find and disable all triggers related to guides_browse_v
DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT trigger_name, event_object_table
    FROM information_schema.triggers
    WHERE action_statement LIKE '%guides_browse_v%'
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE TRIGGER %I',
                   trigger_rec.event_object_table,
                   trigger_rec.trigger_name);
    RAISE NOTICE 'Disabled trigger: % on table %',
                 trigger_rec.trigger_name,
                 trigger_rec.event_object_table;
  END LOOP;
END $$;

-- Option 2: Create a dummy function that does nothing
CREATE OR REPLACE FUNCTION refresh_guides_browse_v()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Do nothing - materialized view doesn't exist yet
  RAISE NOTICE 'guides_browse_v refresh skipped - view does not exist';
  RETURN;
END;
$$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ Fixed guides_browse_v issue';
  RAISE NOTICE '  - Disabled triggers that reference the view';
  RAISE NOTICE '  - Created dummy refresh function';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now insert into agencies table!';
  RAISE NOTICE 'Try running fix-leo-loves-travel.sql again';
END $$;

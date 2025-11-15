-- Drop the trigger that tries to refresh guides_browse_v
-- This trigger is no longer needed since we changed from materialized view to regular view
-- Regular views are always up-to-date and don't need refreshing

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_refresh_guides_browse ON guides;

-- Then drop function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS refresh_guides_browse_v() CASCADE;

-- Comment
COMMENT ON VIEW guides_browse_v IS 'View for fast guide directory browsing and filtering (always up-to-date, no refresh needed)';

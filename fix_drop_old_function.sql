-- Drop the old function with text parameters first
-- This resolves the "Could not choose the best candidate function" error

DROP FUNCTION IF EXISTS api_guides_search(
  text, text, text, text[], text[], text[], text,
  integer, integer, numeric, boolean, boolean, text, text, integer
);

-- STEP 1: Create refresh functions (run this once)
-- ==============================================

-- Function to refresh agencies materialized view
CREATE OR REPLACE FUNCTION refresh_agencies_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
END;
$$;

-- Function to refresh DMCs materialized view
CREATE OR REPLACE FUNCTION refresh_dmcs_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
END;
$$;

-- Function to refresh transport materialized view
CREATE OR REPLACE FUNCTION refresh_transport_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;
END;
$$;

-- Function to refresh guides materialized view
CREATE OR REPLACE FUNCTION refresh_guides_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;
END;
$$;

-- STEP 2: Manually refresh the agencies view NOW
-- ================================================
-- This will make the approved agency visible in the directory

REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;

-- Success! The agencies directory should now show the approved agency.

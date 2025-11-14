-- Add refresh functions for materialized views
-- These are called after approving applications to update the directory

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

-- Function to refresh guides materialized view (if it doesn't exist)
CREATE OR REPLACE FUNCTION refresh_guides_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;
END;
$$;

-- Comments
COMMENT ON FUNCTION refresh_agencies_view IS 'Refreshes the agencies_browse_v materialized view. Called after approving agency applications.';
COMMENT ON FUNCTION refresh_dmcs_view IS 'Refreshes the dmcs_browse_v materialized view. Called after approving DMC applications.';
COMMENT ON FUNCTION refresh_transport_view IS 'Refreshes the transport_browse_v materialized view. Called after approving transport applications.';
COMMENT ON FUNCTION refresh_guides_view IS 'Refreshes the guides_browse_v materialized view. Called after approving guide applications.';

-- Refresh the materialized view to populate it with current guide data
REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;

-- Check the view structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'guides_browse_v'
ORDER BY ordinal_position;

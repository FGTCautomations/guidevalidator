-- Check the current format of spoken_languages in the guides table
SELECT
  profile_id,
  spoken_languages,
  pg_typeof(spoken_languages) as column_type
FROM guides
LIMIT 5;

-- Check a sample from the materialized view
SELECT
  id,
  languages,
  pg_typeof(languages) as column_type
FROM guides_browse_v
LIMIT 5;

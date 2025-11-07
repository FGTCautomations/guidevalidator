-- Check what language data is actually stored in the guides table

-- Sample 10 guides with their spoken languages
SELECT
  p.full_name,
  g.spoken_languages,
  array_length(g.spoken_languages, 1) as language_count,
  p.country_code
FROM guides g
JOIN profiles p ON p.id = g.profile_id
WHERE g.spoken_languages IS NOT NULL
  AND array_length(g.spoken_languages, 1) > 0
  AND p.country_code = 'VN'
LIMIT 10;

-- Check what values are in the spoken_languages array
SELECT DISTINCT
  unnest(spoken_languages) as language_value,
  COUNT(*) as count
FROM guides
WHERE spoken_languages IS NOT NULL
GROUP BY language_value
ORDER BY count DESC
LIMIT 20;

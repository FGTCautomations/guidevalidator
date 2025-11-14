-- Check the actual column names in guides table
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'guides'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also show a sample guide record to see the data
SELECT * FROM guides LIMIT 1;

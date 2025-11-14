-- Check if table exists and what columns it has
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profile_claim_tokens'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any records
SELECT COUNT(*) as existing_records
FROM profile_claim_tokens;

-- Sample existing data if any
SELECT * FROM profile_claim_tokens LIMIT 3;

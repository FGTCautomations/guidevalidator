-- Check agencies table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'agencies'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sample an existing agency
SELECT * FROM agencies LIMIT 1;

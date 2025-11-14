-- ============================================================================
-- CHECK AGENCIES TABLE SCHEMA
-- ============================================================================
-- Check what columns exist and which are required/nullable
--
-- Date: 2025-11-10
-- ============================================================================

-- Get full column details for agencies table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agencies'
ORDER BY ordinal_position;

-- Check constraints
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'agencies'
ORDER BY constraint_type, constraint_name;

-- Check NOT NULL columns (these are required for INSERT)
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agencies'
  AND is_nullable = 'NO'
ORDER BY column_name;

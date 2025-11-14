-- Find the exact enum name for agencies.type
SELECT
    c.column_name,
    c.data_type,
    c.udt_name
FROM information_schema.columns c
WHERE c.table_name = 'agencies'
  AND c.column_name = 'type';

-- Get all enum values for that type
SELECT
    t.typname as enum_name,
    e.enumlabel as allowed_value,
    e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN information_schema.columns c ON c.udt_name = t.typname
WHERE c.table_name = 'agencies'
  AND c.column_name = 'type'
ORDER BY e.enumsortorder;

-- Check what unique type values exist in the CSV
-- We'll need to manually check this

-- Check what values are allowed for agencies.type enum
SELECT
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%agency%' OR t.typname LIKE '%segment%'
ORDER BY t.typname, e.enumsortorder;

-- Also check existing agency types
SELECT DISTINCT type, COUNT(*)
FROM agencies
GROUP BY type;

-- Check what types exist in the CSV
-- (Run this manually after checking the enum values)

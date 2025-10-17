-- ============================================================================
-- FORCE SUPABASE TO RELOAD SCHEMA CACHE
-- Copy this entire script and run it in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new
-- ============================================================================

-- First, ensure the columns exist
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS availability_timezone TEXT;
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS working_hours JSONB;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Wait a moment and verify
SELECT 'Columns added successfully! Supabase schema cache has been reloaded.' as status;

-- Show all columns in guides table to verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'guides'
ORDER BY ordinal_position;

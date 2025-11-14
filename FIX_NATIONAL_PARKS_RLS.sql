-- ============================================================
-- FIX NATIONAL PARKS TABLE - Enable RLS and Add Policies
-- ============================================================
-- This fixes the 500 error when accessing /api/locations/parks
-- Run this in Supabase SQL Editor immediately
-- ============================================================

-- Enable RLS on national_parks table
ALTER TABLE public.national_parks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (needed for API routes)
CREATE POLICY "Allow public read access to national parks"
ON public.national_parks
FOR SELECT
USING (true);

-- Also allow authenticated users to read
CREATE POLICY "Allow authenticated read access to national parks"
ON public.national_parks
FOR SELECT
TO authenticated
USING (true);

-- Summary
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created for national_parks table!';
  RAISE NOTICE '';
  RAISE NOTICE 'The /api/locations/parks endpoint should now work';
  RAISE NOTICE 'Users can now select regions without 500 errors';
END $$;

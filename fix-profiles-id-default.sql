-- ============================================
-- FIX PROFILES TABLE ID COLUMN DEFAULT
-- Run this in Supabase SQL Editor
-- ============================================

-- Add default UUID generator to profiles.id column
ALTER TABLE profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the change
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'id';

SELECT 'Profiles table fixed! You can now run the setup script again.' as status;

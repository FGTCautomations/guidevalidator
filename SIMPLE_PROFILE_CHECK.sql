-- Simple check to see what's in your profile
SELECT
  id,
  role,
  organization_id
FROM public.profiles
WHERE id = auth.uid();

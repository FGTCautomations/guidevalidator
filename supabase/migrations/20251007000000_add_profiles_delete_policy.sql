-- Add missing DELETE policy for profiles table
-- This allows admins to delete user profiles from the admin panel

-- Create DELETE policy for profiles table
-- Only admins and super_admins can delete profiles
SELECT public.ensure_policy(
  'public','profiles','profiles_delete_admin_only',
  $SQL$ CREATE POLICY "profiles_delete_admin_only" ON public.profiles
        FOR DELETE
        USING ( public.is_admin() ) $SQL$
);

-- Add comment for documentation
COMMENT ON POLICY "profiles_delete_admin_only" ON public.profiles IS
  'Allows admins and super_admins to delete user profiles';

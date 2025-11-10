-- ============================================================================
-- FIX: Update handle_auth_user_created to set application_status correctly
-- ============================================================================
-- Currently the trigger doesn't set application_status, so profiles get
-- created with 'approved' status even when they should be 'pending'.
--
-- Date: 2025-11-10
-- ============================================================================

-- First check the current default on profiles.application_status
SELECT
  column_name,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'application_status';

-- Update the trigger function to set application_status based on pending_approval metadata
CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_role text := nullif(meta->>'role', '');
  chosen_role public.user_role := 'visitor';
  first_name text := nullif(meta->>'first_name', '');
  last_name text := nullif(meta->>'last_name', '');
  full_name text := nullif(meta->>'full_name', '');
  computed_name text;
  user_locale text := nullif(meta->>'locale', '');
  is_pending_approval boolean := (meta->>'pending_approval')::boolean;
  app_status text;
begin
  if meta_role is not null and meta_role = any(enum_range(null::public.user_role)::text[]) then
    chosen_role := meta_role::public.user_role;
  end if;

  if full_name is not null then
    computed_name := trim(full_name);
  else
    computed_name := trim(concat_ws(' ', first_name, last_name));
  end if;

  if computed_name is null or computed_name = '' then
    computed_name := new.email;
  end if;

  if user_locale is null or user_locale = '' then
    user_locale := 'en';
  end if;

  -- Set application_status based on pending_approval metadata
  if is_pending_approval = true then
    app_status := 'pending';
  else
    app_status := 'approved';
  end if;

  insert into public.profiles (id, role, full_name, locale, application_status)
  values (new.id, chosen_role, computed_name, user_locale, app_status)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Update existing profiles that are banned but marked as approved
-- (these are pending applications that got the wrong status)
UPDATE profiles p
SET application_status = 'pending'
FROM auth.users u
WHERE p.id = u.id
  AND u.banned_until IS NOT NULL
  AND u.banned_until > NOW()
  AND u.raw_user_meta_data->>'pending_approval' = 'true'
  AND p.application_status = 'approved';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check the updated profiles
SELECT
  u.id,
  u.email,
  u.banned_until IS NOT NULL AND u.banned_until > NOW() as is_banned,
  u.raw_user_meta_data->>'pending_approval' as pending_approval_meta,
  p.application_status as profile_status,
  a.application_status as agency_status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN agencies a ON a.id = u.id
WHERE u.raw_user_meta_data->>'role' = 'agency'
ORDER BY u.created_at DESC
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✓ Fixed handle_auth_user_created trigger';
  RAISE NOTICE '  - Now sets application_status based on pending_approval metadata';
  RAISE NOTICE '  - Updated existing profiles with wrong status';
  RAISE NOTICE '';
  RAISE NOTICE 'New agency applications will now show as pending correctly!';
END $$;

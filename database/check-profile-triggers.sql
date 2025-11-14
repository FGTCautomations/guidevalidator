-- ============================================================================
-- CHECK TRIGGERS ON AUTH.USERS AND PROFILES
-- ============================================================================

-- Find triggers on auth.users
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Find the handle_new_user function (common pattern)
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%user%'
  AND routine_name LIKE '%new%'
ORDER BY routine_name;

-- Show all functions that might create profiles
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_definition ILIKE '%INSERT INTO profiles%'
       OR routine_definition ILIKE '%INSERT INTO public.profiles%')
ORDER BY routine_name;

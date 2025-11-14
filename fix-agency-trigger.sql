-- Fix the handle_auth_user_created trigger to skip profile creation for agencies
-- since agencies are handled differently (they go into the agencies table, not profiles)

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  meta jsonb := COALESCE(new.raw_user_meta_data, '{}'::jsonb);
  meta_role text := nullif(meta->>'role', '');
  chosen_role public.user_role := 'visitor';
  first_name text := nullif(meta->>'first_name', '');
  last_name text := nullif(meta->>'last_name', '');
  full_name text := nullif(meta->>'full_name', '');
  computed_name text;
  user_locale text := nullif(meta->>'locale', '');
BEGIN
  -- Skip profile creation for agencies since they use the agencies table
  IF meta_role = 'agency' THEN
    RETURN new;
  END IF;

  IF meta_role IS NOT NULL AND meta_role = ANY(enum_range(NULL::public.user_role)::text[]) THEN
    chosen_role := meta_role::public.user_role;
  END IF;

  IF full_name IS NOT NULL THEN
    computed_name := trim(full_name);
  ELSE
    computed_name := trim(concat_ws(' ', first_name, last_name));
  END IF;

  IF computed_name IS NULL OR computed_name = '' THEN
    computed_name := new.email;
  END IF;

  IF user_locale IS NULL OR user_locale = '' THEN
    user_locale := 'en';
  END IF;

  INSERT INTO public.profiles (id, role, full_name, locale)
  VALUES (new.id, chosen_role, computed_name, user_locale)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

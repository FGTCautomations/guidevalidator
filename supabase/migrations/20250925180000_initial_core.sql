-- 2025-09-25: Core RLS & policies (idempotent, safe to re-run)

-- ======================================================
-- Helper function to create policies only if not present
-- ======================================================
CREATE OR REPLACE FUNCTION public.ensure_policy(
  p_schema    text,
  p_table     text,
  p_policy    text,
  p_policy_sql text
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = p_schema
      AND tablename  = p_table
      AND policyname = p_policy
  ) THEN
    EXECUTE p_policy_sql;
  END IF;
END
$$;

-- ======================================================
-- Minimal helper used by policies (idempotent)
-- ======================================================
-- Determines if current auth user is admin/super_admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql
AS $fn$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('admin','super_admin')
  );
$fn$;

-- ======================================================
-- Enable RLS on all relevant tables (idempotent)
-- ======================================================
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_cities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.country_licensing_rules ENABLE ROW LEVEL SECURITY;

-- You can FORCE RLS if you want to disallow BYPASSRLS roles:
-- ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
-- (Repeat FORCE on others if required by your security posture.)

-- ======================================================
-- Read model
-- ======================================================

-- Countries/regions/cities are world-readable (directory data)
SELECT public.ensure_policy(
  'public','countries','countries_select_all',
  $SQL$ CREATE POLICY "countries_select_all" ON public.countries
        FOR SELECT USING (true) $SQL$
);

SELECT public.ensure_policy(
  'public','regions','regions_select_all',
  $SQL$ CREATE POLICY "regions_select_all" ON public.regions
        FOR SELECT USING (true) $SQL$
);

SELECT public.ensure_policy(
  'public','cities','cities_select_all',
  $SQL$ CREATE POLICY "cities_select_all" ON public.cities
        FOR SELECT USING (true) $SQL$
);

-- Profiles
-- Read: user can see self; admins can see all (also enable directory-like read below if desired)
SELECT public.ensure_policy(
  'public','profiles','profiles_select_self_or_admin',
  $SQL$ CREATE POLICY "profiles_select_self_or_admin" ON public.profiles
        FOR SELECT
        USING (
          id = auth.uid()
          OR public.is_admin()
        ) $SQL$
);

-- Agencies & memberships: allow reading directory data to everyone
SELECT public.ensure_policy(
  'public','agencies','agencies_select_all',
  $SQL$ CREATE POLICY "agencies_select_all" ON public.agencies
        FOR SELECT USING (true) $SQL$
);

SELECT public.ensure_policy(
  'public','agency_members','agency_members_select_self_or_admin',
  $SQL$ CREATE POLICY "agency_members_select_self_or_admin" ON public.agency_members
        FOR SELECT
        USING (
          profile_id = auth.uid()
          OR public.is_admin()
        ) $SQL$
);

-- Guides & credentials: directory-like read to everyone (adjust if you want stricter privacy)
SELECT public.ensure_policy(
  'public','guides','guides_select_all',
  $SQL$ CREATE POLICY "guides_select_all" ON public.guides
        FOR SELECT USING (true) $SQL$
);

-- If credentials contain sensitive docs, restrict read to guide/self or admin.
-- Change to USING (true) if you want them public.
SELECT public.ensure_policy(
  'public','guide_credentials','guide_credentials_select_self_or_admin',
  $SQL$ CREATE POLICY "guide_credentials_select_self_or_admin" ON public.guide_credentials
        FOR SELECT
        USING (
          guide_id = auth.uid()
          OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_countries','guide_countries_select_all',
  $SQL$ CREATE POLICY "guide_countries_select_all" ON public.guide_countries
        FOR SELECT USING (true) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_regions','guide_regions_select_all',
  $SQL$ CREATE POLICY "guide_regions_select_all" ON public.guide_regions
        FOR SELECT USING (true) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_cities','guide_cities_select_all',
  $SQL$ CREATE POLICY "guide_cities_select_all" ON public.guide_cities
        FOR SELECT USING (true) $SQL$
);

-- Licensing rules are public information
SELECT public.ensure_policy(
  'public','country_licensing_rules','country_licensing_rules_select_all',
  $SQL$ CREATE POLICY "country_licensing_rules_select_all" ON public.country_licensing_rules
        FOR SELECT USING (true) $SQL$
);

-- ======================================================
-- Write model
-- ======================================================

-- Profiles: user can update ONLY their own row; admins can update all.
SELECT public.ensure_policy(
  'public','profiles','profiles_update_self_or_admin',
  $SQL$ CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
        FOR UPDATE
        USING (
          id = auth.uid() OR public.is_admin()
        )
        WITH CHECK (
          id = auth.uid() OR public.is_admin()
        ) $SQL$
);

-- Insert into profiles: typically handled by a trigger from auth.users.
-- If you let apps insert directly, restrict to self or admin:
SELECT public.ensure_policy(
  'public','profiles','profiles_insert_self_or_admin',
  $SQL$ CREATE POLICY "profiles_insert_self_or_admin" ON public.profiles
        FOR INSERT
        WITH CHECK (
          id = auth.uid() OR public.is_admin()
        ) $SQL$
);

-- Agencies: writes by admins only (simplest safe model)
SELECT public.ensure_policy(
  'public','agencies','agencies_insert_admin_only',
  $SQL$ CREATE POLICY "agencies_insert_admin_only" ON public.agencies
        FOR INSERT
        WITH CHECK ( public.is_admin() ) $SQL$
);

SELECT public.ensure_policy(
  'public','agencies','agencies_update_admin_only',
  $SQL$ CREATE POLICY "agencies_update_admin_only" ON public.agencies
        FOR UPDATE
        USING ( public.is_admin() )
        WITH CHECK ( public.is_admin() ) $SQL$
);

SELECT public.ensure_policy(
  'public','agencies','agencies_delete_admin_only',
  $SQL$ CREATE POLICY "agencies_delete_admin_only" ON public.agencies
        FOR DELETE
        USING ( public.is_admin() ) $SQL$
);

-- Agency members: member can read their own row; owners/admins of org or platform admins can write
-- (Simplified here to platform admins only; extend later if you store org roles you want enforced in RLS)
SELECT public.ensure_policy(
  'public','agency_members','agency_members_insert_admin_only',
  $SQL$ CREATE POLICY "agency_members_insert_admin_only" ON public.agency_members
        FOR INSERT
        WITH CHECK ( public.is_admin() ) $SQL$
);

SELECT public.ensure_policy(
  'public','agency_members','agency_members_update_admin_only',
  $SQL$ CREATE POLICY "agency_members_update_admin_only" ON public.agency_members
        FOR UPDATE
        USING ( public.is_admin() )
        WITH CHECK ( public.is_admin() ) $SQL$
);

SELECT public.ensure_policy(
  'public','agency_members','agency_members_delete_admin_only',
  $SQL$ CREATE POLICY "agency_members_delete_admin_only" ON public.agency_members
        FOR DELETE
        USING ( public.is_admin() ) $SQL$
);

-- Guides: guide (profile owner) can manage their own row; admins can manage all
SELECT public.ensure_policy(
  'public','guides','guides_insert_self_or_admin',
  $SQL$ CREATE POLICY "guides_insert_self_or_admin" ON public.guides
        FOR INSERT
        WITH CHECK ( profile_id = auth.uid() OR public.is_admin() ) $SQL$
);

SELECT public.ensure_policy(
  'public','guides','guides_update_self_or_admin',
  $SQL$ CREATE POLICY "guides_update_self_or_admin" ON public.guides
        FOR UPDATE
        USING ( profile_id = auth.uid() OR public.is_admin() )
        WITH CHECK ( profile_id = auth.uid() OR public.is_admin() ) $SQL$
);

SELECT public.ensure_policy(
  'public','guides','guides_delete_self_or_admin',
  $SQL$ CREATE POLICY "guides_delete_self_or_admin" ON public.guides
        FOR DELETE
        USING ( profile_id = auth.uid() OR public.is_admin() ) $SQL$
);

-- Guide credentials: guide can manage their own; admins can manage all
SELECT public.ensure_policy(
  'public','guide_credentials','guide_credentials_insert_self_or_admin',
  $SQL$ CREATE POLICY "guide_credentials_insert_self_or_admin" ON public.guide_credentials
        FOR INSERT
        WITH CHECK (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_credentials','guide_credentials_update_self_or_admin',
  $SQL$ CREATE POLICY "guide_credentials_update_self_or_admin" ON public.guide_credentials
        FOR UPDATE
        USING (
          guide_id = auth.uid() OR public.is_admin()
        )
        WITH CHECK (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_credentials','guide_credentials_delete_self_or_admin',
  $SQL$ CREATE POLICY "guide_credentials_delete_self_or_admin" ON public.guide_credentials
        FOR DELETE
        USING (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

-- Guide coverage tables: guide manages their own; admins manage all
SELECT public.ensure_policy(
  'public','guide_countries','guide_countries_insert_self_or_admin',
  $SQL$ CREATE POLICY "guide_countries_insert_self_or_admin" ON public.guide_countries
        FOR INSERT
        WITH CHECK (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_countries','guide_countries_update_self_or_admin',
  $SQL$ CREATE POLICY "guide_countries_update_self_or_admin" ON public.guide_countries
        FOR UPDATE
        USING (
          guide_id = auth.uid() OR public.is_admin()
        )
        WITH CHECK (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_countries','guide_countries_delete_self_or_admin',
  $SQL$ CREATE POLICY "guide_countries_delete_self_or_admin" ON public.guide_countries
        FOR DELETE
        USING (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_regions','guide_regions_insert_self_or_admin',
  $SQL$ CREATE POLICY "guide_regions_insert_self_or_admin" ON public.guide_regions
        FOR INSERT
        WITH CHECK (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_regions','guide_regions_update_self_or_admin',
  $SQL$ CREATE POLICY "guide_regions_update_self_or_admin" ON public.guide_regions
        FOR UPDATE
        USING (
          guide_id = auth.uid() OR public.is_admin()
        )
        WITH CHECK (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_regions','guide_regions_delete_self_or_admin',
  $SQL$ CREATE POLICY "guide_regions_delete_self_or_admin" ON public.guide_regions
        FOR DELETE
        USING (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_cities','guide_cities_insert_self_or_admin',
  $SQL$ CREATE POLICY "guide_cities_insert_self_or_admin" ON public.guide_cities
        FOR INSERT
        WITH CHECK (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_cities','guide_cities_update_self_or_admin',
  $SQL$ CREATE POLICY "guide_cities_update_self_or_admin" ON public.guide_cities
        FOR UPDATE
        USING (
          guide_id = auth.uid() OR public.is_admin()
        )
        WITH CHECK (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

SELECT public.ensure_policy(
  'public','guide_cities','guide_cities_delete_self_or_admin',
  $SQL$ CREATE POLICY "guide_cities_delete_self_or_admin" ON public.guide_cities
        FOR DELETE
        USING (
          guide_id = auth.uid() OR public.is_admin()
        ) $SQL$
);

-- Country licensing rules: admin-only writes
SELECT public.ensure_policy(
  'public','country_licensing_rules','country_licensing_rules_insert_admin_only',
  $SQL$ CREATE POLICY "country_licensing_rules_insert_admin_only" ON public.country_licensing_rules
        FOR INSERT
        WITH CHECK ( public.is_admin() ) $SQL$
);

SELECT public.ensure_policy(
  'public','country_licensing_rules','country_licensing_rules_update_admin_only',
  $SQL$ CREATE POLICY "country_licensing_rules_update_admin_only" ON public.country_licensing_rules
        FOR UPDATE
        USING ( public.is_admin() )
        WITH CHECK ( public.is_admin() ) $SQL$
);

SELECT public.ensure_policy(
  'public','country_licensing_rules','country_licensing_rules_delete_admin_only',
  $SQL$ CREATE POLICY "country_licensing_rules_delete_admin_only" ON public.country_licensing_rules
        FOR DELETE
        USING ( public.is_admin() ) $SQL$
);

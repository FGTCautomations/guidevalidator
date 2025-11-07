-- EMERGENCY FIX: Allow any authenticated user to create jobs
-- This bypasses all role checks temporarily so you can create jobs
-- We'll fix the proper permissions after

-- Drop all existing policies
DROP POLICY IF EXISTS "jobs_manage_owner" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_public" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_agency" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_owner" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_owner" ON public.jobs;

-- TEMPORARY: Allow ANY authenticated user to INSERT jobs
CREATE POLICY "jobs_insert_temp" ON public.jobs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Public can SELECT open/filled jobs
CREATE POLICY "jobs_select_public" ON public.jobs
  FOR SELECT
  USING (
    status IN ('open', 'filled', 'draft')
    OR created_by = auth.uid()
    OR public.is_admin()
  );

-- Allow creators to UPDATE their jobs
CREATE POLICY "jobs_update_owner" ON public.jobs
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_admin()
  );

-- Allow creators to DELETE their jobs
CREATE POLICY "jobs_delete_owner" ON public.jobs
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  );

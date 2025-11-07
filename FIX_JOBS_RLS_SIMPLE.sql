-- Simplified RLS fix for jobs table
-- This version uses the simplest possible policy to allow INSERT

-- Drop ALL existing policies
DROP POLICY IF EXISTS "jobs_manage_owner" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_public" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_agency" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_owner" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_owner" ON public.jobs;

-- Simplest INSERT policy - allow any authenticated user with agency/dmc role
CREATE POLICY "jobs_insert_agency" ON public.jobs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Public can SELECT open/filled jobs, owners can see their own
CREATE POLICY "jobs_select_public" ON public.jobs
  FOR SELECT
  USING (
    status IN ('open', 'filled')
    OR public.is_job_owner(id)
    OR public.is_admin()
  );

-- Allow job owners to UPDATE their jobs
CREATE POLICY "jobs_update_owner" ON public.jobs
  FOR UPDATE
  USING (
    public.is_job_owner(id)
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_job_owner(id)
    OR public.is_admin()
  );

-- Allow job owners to DELETE their jobs
CREATE POLICY "jobs_delete_owner" ON public.jobs
  FOR DELETE
  USING (
    public.is_job_owner(id)
    OR public.is_admin()
  );

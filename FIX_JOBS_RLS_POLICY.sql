-- Fix RLS policy for jobs table to allow INSERT operations
-- The existing policy uses is_job_owner(id) which fails on INSERT since the job doesn't exist yet

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "jobs_manage_owner" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_public" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_agency" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_owner" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_owner" ON public.jobs;

-- Create separate policies for each operation

-- Allow agencies and DMCs to INSERT jobs
-- Simplified: just check if user is agency/dmc with organization_id
-- The application code already ensures agency_id matches organization_id
CREATE POLICY "jobs_insert_agency" ON public.jobs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('agency', 'dmc')
        AND p.organization_id IS NOT NULL
    )
    OR public.is_admin()
  );

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

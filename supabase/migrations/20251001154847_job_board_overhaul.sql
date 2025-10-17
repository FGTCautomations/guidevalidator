-- 2025-10-01: Job board overhaul - ensure jobs and job applications support

-- Ensure jobs table and required columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'jobs'
  ) THEN
    CREATE TABLE public.jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
      created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      title text NOT NULL,
      description text NOT NULL,
      status text NOT NULL DEFAULT 'draft',
      country_code text,
      region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
      city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
      start_date date,
      end_date date,
      budget_min_cents integer,
      budget_max_cents integer,
      currency text NOT NULL DEFAULT 'EUR',
      specialties text[] NOT NULL DEFAULT '{}'::text[],
      languages text[] NOT NULL DEFAULT '{}'::text[],
      application_deadline date,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK (status IN ('draft','open','closed','filled','cancelled'))
    );
  END IF;
END $$;

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS budget_min_cents integer;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS budget_max_cents integer;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS application_deadline date;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS budget_currency text;

-- Normalise currency storage (legacy column)
UPDATE public.jobs SET currency = COALESCE(currency, budget_currency, 'EUR');
ALTER TABLE public.jobs DROP COLUMN IF EXISTS budget_currency;

-- Ensure status check constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'jobs_status_check'
  ) THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_status_check CHECK (status IN ('draft','open','closed','filled','cancelled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);
CREATE INDEX IF NOT EXISTS jobs_country_idx ON public.jobs(country_code);
CREATE INDEX IF NOT EXISTS jobs_region_idx ON public.jobs(region_id);
CREATE INDEX IF NOT EXISTS jobs_start_date_idx ON public.jobs(start_date);
CREATE INDEX IF NOT EXISTS jobs_budget_min_idx ON public.jobs(budget_min_cents);
CREATE INDEX IF NOT EXISTS jobs_budget_max_idx ON public.jobs(budget_max_cents);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

SELECT public.ensure_trigger(
  'public',
  'jobs',
  'jobs_touch_updated_at',
  $$
  CREATE TRIGGER jobs_touch_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $$
);

-- ---------------------------------------------------------------------------
-- Job applications (upgrade from legacy job_responses)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'job_responses'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'job_applications'
  ) THEN
    ALTER TABLE public.job_responses RENAME TO job_applications;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  guide_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter text,
  status text NOT NULL DEFAULT 'pending',
  budget_expectation_cents integer,
  available_start_date date,
  available_end_date date,
  languages text[] NOT NULL DEFAULT '{}'::text[],
  specialties text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('pending','accepted','rejected'))
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
      AND column_name = 'responder_id'
  ) THEN
    ALTER TABLE public.job_applications RENAME COLUMN responder_id TO guide_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
      AND column_name = 'message'
  ) THEN
    ALTER TABLE public.job_applications RENAME COLUMN message TO cover_letter;
  END IF;
END $$;

ALTER TABLE public.job_applications DROP COLUMN IF EXISTS responder_role;

ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS cover_letter text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS budget_expectation_cents integer;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS available_start_date date;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS available_end_date date;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'job_applications_status_check'
  ) THEN
    ALTER TABLE public.job_applications
      ADD CONSTRAINT job_applications_status_check CHECK (status IN ('pending','accepted','rejected'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS job_applications_unique_idx
  ON public.job_applications(job_id, guide_id);

CREATE INDEX IF NOT EXISTS job_applications_status_idx
  ON public.job_applications(status);

CREATE INDEX IF NOT EXISTS job_applications_created_idx
  ON public.job_applications(created_at DESC);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

SELECT public.ensure_trigger(
  'public',
  'job_applications',
  'job_applications_touch_updated_at',
  $$
  CREATE TRIGGER job_applications_touch_updated_at
    BEFORE UPDATE ON public.job_applications
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $$
);

-- Refresh policies for the upgraded table
DROP POLICY IF EXISTS "job_applications_insert" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_select" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_delete" ON public.job_applications;

CREATE POLICY "job_applications_insert" ON public.job_applications
  FOR INSERT
  WITH CHECK (guide_id = auth.uid() OR public.is_admin());

CREATE POLICY "job_applications_select" ON public.job_applications
  FOR SELECT
  USING (
    guide_id = auth.uid()
    OR public.is_job_owner(job_id)
    OR public.is_admin()
  );

CREATE POLICY "job_applications_update" ON public.job_applications
  FOR UPDATE
  USING (
    guide_id = auth.uid()
    OR public.is_job_owner(job_id)
    OR public.is_admin()
  )
  WITH CHECK (true);

CREATE POLICY "job_applications_delete" ON public.job_applications
  FOR DELETE
  USING (public.is_admin());

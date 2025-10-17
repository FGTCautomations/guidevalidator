-- 2025-09-25: Guide Reviews & Availability (idempotent, drift-safe)

-- =====================================================
-- Prereqs & helpers
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Updated-at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper: create trigger only if not already present
CREATE OR REPLACE FUNCTION public.ensure_trigger(
  p_schema      text,
  p_table       text,
  p_trigger     text,
  p_trigger_sql text
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger tg
    JOIN pg_class tbl ON tbl.oid = tg.tgrelid
    JOIN pg_namespace nsp ON nsp.oid = tbl.relnamespace
    WHERE nsp.nspname = p_schema
      AND tbl.relname  = p_table
      AND tg.tgname    = p_trigger
  ) THEN
    EXECUTE p_trigger_sql;
  END IF;
END
$$;

-- =====================================================
-- Guide reviews (create or reconcile)
-- =====================================================

-- Create table if missing (minimal shape)
CREATE TABLE IF NOT EXISTS public.guide_reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id     uuid NOT NULL REFERENCES public.guides(profile_id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Ensure expected columns exist (add if missing)
ALTER TABLE public.guide_reviews
  ADD COLUMN IF NOT EXISTS reviewer_id uuid,
  ADD COLUMN IF NOT EXISTS rating integer,
  ADD COLUMN IF NOT EXISTS title   text,
  ADD COLUMN IF NOT EXISTS comment text;

-- Ensure timestamps have defaults (safe to repeat)
ALTER TABLE public.guide_reviews
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Ensure FK for reviewer_id (nullable, SET NULL on delete)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='guide_reviews' AND column_name='reviewer_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname='public' AND t.relname='guide_reviews' AND c.conname='guide_reviews_reviewer_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE public.guide_reviews
               ADD CONSTRAINT guide_reviews_reviewer_id_fkey
               FOREIGN KEY (reviewer_id)
               REFERENCES public.profiles(id)
               ON DELETE SET NULL';
    END IF;
  END IF;
END
$$;

-- Ensure CHECK constraint on rating 1..5
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='guide_reviews' AND column_name='rating'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname='public' AND t.relname='guide_reviews' AND c.conname='guide_reviews_rating_check'
    ) THEN
      EXECUTE 'ALTER TABLE public.guide_reviews
               ADD CONSTRAINT guide_reviews_rating_check
               CHECK (rating BETWEEN 1 AND 5)';
    END IF;
  END IF;
END
$$;

-- Indexes (only if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='guide_reviews' AND column_name='guide_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS guide_reviews_guide_idx ON public.guide_reviews(guide_id)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='guide_reviews' AND column_name='reviewer_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS guide_reviews_reviewer_idx ON public.guide_reviews(reviewer_id)';

    -- Optional uniqueness: one review per (guide, reviewer) when reviewer present
    IF NOT EXISTS (
      SELECT 1 FROM pg_class WHERE relname = 'guide_reviews_unique_reviewer_per_guide'
    ) THEN
      EXECUTE 'CREATE UNIQUE INDEX guide_reviews_unique_reviewer_per_guide
               ON public.guide_reviews(guide_id, reviewer_id)
               WHERE reviewer_id IS NOT NULL';
    END IF;
  END IF;
END
$$;

-- Updated_at trigger (idempotent)
SELECT public.ensure_trigger(
  'public',
  'guide_reviews',
  'guide_reviews_touch_updated_at',
  $SQL$
  CREATE TRIGGER guide_reviews_touch_updated_at
    BEFORE UPDATE ON public.guide_reviews
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $SQL$
);

-- =====================================================
-- Guide availability (create or reconcile)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.guide_availability (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id     uuid NOT NULL REFERENCES public.guides(profile_id) ON DELETE CASCADE,
  starts_at    timestamptz NOT NULL,
  ends_at      timestamptz NOT NULL,
  status       text NOT NULL,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Ensure columns/defaults/constraints
ALTER TABLE public.guide_availability
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Status constraint (available/blocked/booked)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public' AND t.relname='guide_availability' AND c.conname='guide_availability_status_check'
  ) THEN
    EXECUTE 'ALTER TABLE public.guide_availability
             ADD CONSTRAINT guide_availability_status_check
             CHECK (status IN (''available'',''blocked'',''booked''))';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public' AND t.relname='guide_availability' AND c.conname='guide_availability_time_check'
  ) THEN
    EXECUTE 'ALTER TABLE public.guide_availability
             ADD CONSTRAINT guide_availability_time_check
             CHECK (ends_at > starts_at)';
  END IF;
END
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS guide_availability_guide_idx
  ON public.guide_availability(guide_id);

CREATE INDEX IF NOT EXISTS guide_availability_time_idx
  ON public.guide_availability(starts_at, ends_at);

-- Updated_at trigger (idempotent)
SELECT public.ensure_trigger(
  'public',
  'guide_availability',
  'guide_availability_touch_updated_at',
  $SQL$
  CREATE TRIGGER guide_availability_touch_updated_at
    BEFORE UPDATE ON public.guide_availability
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $SQL$
);

-- =====================================================
-- RLS enablement
-- =====================================================
ALTER TABLE public.guide_reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_availability ENABLE ROW LEVEL SECURITY;

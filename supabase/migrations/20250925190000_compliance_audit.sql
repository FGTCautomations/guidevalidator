-- 2025-09-25: Compliance & Audit (idempotent, drift-safe v4)

-- =====================================================
-- Prereqs & helpers
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Updated-at helper (used by triggers)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper: create trigger only if missing
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
-- Audit logs (create or reconcile)
-- =====================================================

-- Create table if missing (minimal baseline)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at  timestamptz NOT NULL DEFAULT now()
);

-- Ensure expected columns exist (add if missing)
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS actor_id    uuid,
  ADD COLUMN IF NOT EXISTS action      text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id   uuid,
  ADD COLUMN IF NOT EXISTS metadata    jsonb;

-- Ensure metadata default (safe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='audit_logs' AND column_name='metadata'
  ) THEN
    EXECUTE 'ALTER TABLE public.audit_logs ALTER COLUMN metadata SET DEFAULT ''{}''::jsonb';
  END IF;
END
$$;

-- Ensure FK for actor_id if profiles table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname='public' AND t.relname='audit_logs' AND c.conname='audit_logs_actor_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE public.audit_logs
               ADD CONSTRAINT audit_logs_actor_id_fkey
               FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL';
    END IF;
  END IF;
END
$$;

-- Indexes (only when columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='actor_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs(actor_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='entity_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='entity_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity_type, entity_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='occurred_at') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS audit_logs_occurred_idx ON public.audit_logs(occurred_at)';
  END IF;
END
$$;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Strikes (policy/compliance flags)
-- =====================================================

-- Create table if missing (very minimal; reconcile below)
CREATE TABLE IF NOT EXISTS public.strikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Add any missing columns BEFORE altering defaults/constraints
ALTER TABLE public.strikes
  ADD COLUMN IF NOT EXISTS profile_id   uuid,
  ADD COLUMN IF NOT EXISTS reason       text,
  ADD COLUMN IF NOT EXISTS severity     integer,     -- if DB has text already, we won't add check
  ADD COLUMN IF NOT EXISTS notes        text,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at  timestamptz;

-- Now set defaults for timestamps if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='strikes' AND column_name='created_at') THEN
    EXECUTE 'ALTER TABLE public.strikes ALTER COLUMN created_at SET DEFAULT now()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='strikes' AND column_name='updated_at') THEN
    EXECUTE 'ALTER TABLE public.strikes ALTER COLUMN updated_at SET DEFAULT now()';
  END IF;
END
$$;

-- Add FK if not present and profiles exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='strikes' AND column_name='profile_id') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname='public' AND t.relname='strikes' AND c.conname='strikes_profile_id_fkey'
    ) THEN
      EXECUTE 'ALTER TABLE public.strikes
               ADD CONSTRAINT strikes_profile_id_fkey
               FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE';
    END IF;
  END IF;
END
$$;

-- Only add severity check if column is numeric
DO $$
DECLARE
  v_type text;
BEGIN
  SELECT data_type INTO v_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='strikes' AND column_name='severity';

  IF v_type IN ('smallint','integer','bigint','numeric','real','double precision') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname='public' AND t.relname='strikes' AND c.conname='strikes_severity_check'
    ) THEN
      EXECUTE 'ALTER TABLE public.strikes
               ADD CONSTRAINT strikes_severity_check CHECK (severity BETWEEN 1 AND 5)';
    END IF;
  ELSE
    RAISE NOTICE 'Skipping strikes severity check because severity column type (%) is not numeric', v_type;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS strikes_profile_idx
  ON public.strikes(profile_id);

-- updated_at trigger (guarded)
SELECT public.ensure_trigger(
  'public',
  'strikes',
  'strikes_touch_updated_at',
  $SQL$
  CREATE TRIGGER strikes_touch_updated_at
    BEFORE UPDATE ON public.strikes
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $SQL$
);

ALTER TABLE public.strikes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Moderation queue (create or reconcile)
-- =====================================================

-- Create if missing (minimal)
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Ensure expected columns (add if missing)
ALTER TABLE public.moderation_queue
  ADD COLUMN IF NOT EXISTS submitted_by  uuid,
  ADD COLUMN IF NOT EXISTS item_type     text,
  ADD COLUMN IF NOT EXISTS item_id       uuid,
  ADD COLUMN IF NOT EXISTS status        text,
  ADD COLUMN IF NOT EXISTS reason        text,
  ADD COLUMN IF NOT EXISTS metadata      jsonb,
  ADD COLUMN IF NOT EXISTS created_at    timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by   uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at   timestamptz;

-- Set sane defaults (only if the column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='status') THEN
    EXECUTE 'ALTER TABLE public.moderation_queue ALTER COLUMN status SET DEFAULT ''pending''';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='metadata') THEN
    EXECUTE 'ALTER TABLE public.moderation_queue ALTER COLUMN metadata SET DEFAULT ''{}''::jsonb';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='created_at') THEN
    EXECUTE 'ALTER TABLE public.moderation_queue ALTER COLUMN created_at SET DEFAULT now()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='updated_at') THEN
    EXECUTE 'ALTER TABLE public.moderation_queue ALTER COLUMN updated_at SET DEFAULT now()';
  END IF;
END
$$;

-- Indexes (only when columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='item_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='item_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS moderation_queue_item_idx ON public.moderation_queue(item_type, item_id)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='status') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS moderation_queue_status_idx ON public.moderation_queue(status)';
  END IF;
END
$$;

-- FKs to profiles if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='submitted_by')
       AND NOT EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname='public' AND t.relname='moderation_queue' AND c.conname='moderation_queue_submitted_by_fkey'
       ) THEN
      EXECUTE 'ALTER TABLE public.moderation_queue
               ADD CONSTRAINT moderation_queue_submitted_by_fkey
               FOREIGN KEY (submitted_by) REFERENCES public.profiles(id) ON DELETE SET NULL';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='moderation_queue' AND column_name='reviewed_by')
       AND NOT EXISTS (
         SELECT 1 FROM pg_constraint c
         JOIN pg_class t ON t.oid = c.conrelid
         JOIN pg_namespace n ON n.oid = t.relnamespace
         WHERE n.nspname='public' AND t.relname='moderation_queue' AND c.conname='moderation_queue_reviewed_by_fkey'
       ) THEN
      EXECUTE 'ALTER TABLE public.moderation_queue
               ADD CONSTRAINT moderation_queue_reviewed_by_fkey
               FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL';
    END IF;
  END IF;
END
$$;

-- updated_at trigger
SELECT public.ensure_trigger(
  'public',
  'moderation_queue',
  'moderation_queue_touch_updated_at',
  $SQL$
  CREATE TRIGGER moderation_queue_touch_updated_at
    BEFORE UPDATE ON public.moderation_queue
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $SQL$
);

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Banners (site-wide notices / warnings)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Ensure columns (add if missing)
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS title        text,
  ADD COLUMN IF NOT EXISTS body         text,
  ADD COLUMN IF NOT EXISTS level        text,
  ADD COLUMN IF NOT EXISTS active_from  timestamptz,
  ADD COLUMN IF NOT EXISTS active_until timestamptz,
  ADD COLUMN IF NOT EXISTS created_by   uuid,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz,
  ADD COLUMN IF NOT EXISTS is_active    boolean;

-- Defaults & checks
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='banners' AND column_name='level') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname='public' AND t.relname='banners' AND c.conname='banners_level_check'
    ) THEN
      EXECUTE 'ALTER TABLE public.banners
               ADD CONSTRAINT banners_level_check
               CHECK (level IN (''info'',''warning'',''error'',''success''))';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='banners' AND column_name='active_from') THEN
    EXECUTE 'ALTER TABLE public.banners ALTER COLUMN active_from SET DEFAULT now()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='banners' AND column_name='created_at') THEN
    EXECUTE 'ALTER TABLE public.banners ALTER COLUMN created_at SET DEFAULT now()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='banners' AND column_name='updated_at') THEN
    EXECUTE 'ALTER TABLE public.banners ALTER COLUMN updated_at SET DEFAULT now()';
  END IF;

  -- Add generated column if missing (cannot use IF NOT EXISTS)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='banners' AND column_name='is_active') THEN
    NULL; -- leave as-is if already present
  ELSE
    EXECUTE 'ALTER TABLE public.banners
             ADD COLUMN is_active boolean GENERATED ALWAYS AS
             (active_from <= now() AND (active_until IS NULL OR active_until >= now())) STORED';
  END IF;
END
$$;

-- FK to profiles if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='banners' AND column_name='created_by')
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE n.nspname='public' AND t.relname='banners' AND c.conname='banners_created_by_fkey'
     ) THEN
    EXECUTE 'ALTER TABLE public.banners
             ADD CONSTRAINT banners_created_by_fkey
             FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL';
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS banners_level_active_idx
  ON public.banners(level, is_active);

-- updated_at trigger (idempotent)
SELECT public.ensure_trigger(
  'public',
  'banners',
  'banners_touch_updated_at',
  $SQL$
  CREATE TRIGGER banners_touch_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $SQL$
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Done
-- =====================================================
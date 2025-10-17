-- Fix audit_logs table to ensure all required columns exist
-- This handles cases where the table existed before our schema

-- Ensure occurred_at column exists (required by triggers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'occurred_at'
  ) THEN
    -- If occurred_at doesn't exist, add it
    ALTER TABLE public.audit_logs ADD COLUMN occurred_at timestamptz NOT NULL DEFAULT now();
    RAISE NOTICE 'Added occurred_at column to audit_logs';
  END IF;
END $$;

-- Ensure all other expected columns exist
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS actor_id uuid,
  ADD COLUMN IF NOT EXISTS action text,
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Ensure id is the primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'audit_logs_pkey'
    AND conrelid = 'public.audit_logs'::regclass
  ) THEN
    ALTER TABLE public.audit_logs ADD PRIMARY KEY (id);
    RAISE NOTICE 'Added primary key to audit_logs';
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Primary key already exists on audit_logs';
END $$;

-- Create index on occurred_at for performance
CREATE INDEX IF NOT EXISTS audit_logs_occurred_idx ON public.audit_logs(occurred_at);

-- Create index on actor_id for performance
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs(actor_id);

COMMENT ON TABLE public.audit_logs IS 'Audit log for tracking user actions and system events';
COMMENT ON COLUMN public.audit_logs.occurred_at IS 'When the audited action occurred';
COMMENT ON COLUMN public.audit_logs.actor_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Type of entity affected';
COMMENT ON COLUMN public.audit_logs.entity_id IS 'ID of the entity affected';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional context about the action';

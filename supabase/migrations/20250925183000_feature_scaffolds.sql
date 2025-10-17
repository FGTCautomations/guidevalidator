-- 2025-09-25: Feature scaffolds (idempotent)

-- =====================================================
-- Prereqs & helpers
-- =====================================================

-- pgcrypto (safe)
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Touch function (safe; used by triggers)
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
-- Conversations
-- =====================================================

-- Minimal shape; if your existing table has more columns, this won't alter them.
CREATE TABLE IF NOT EXISTS public.conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject     text,
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger (idempotent)
SELECT public.ensure_trigger(
  'public',
  'conversations',
  'conversations_touch_updated_at',
  $SQL$
  CREATE TRIGGER conversations_touch_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $SQL$
);

-- Optional index for creator lookups
CREATE INDEX IF NOT EXISTS conversations_created_by_idx
  ON public.conversations(created_by);

-- =====================================================
-- Conversation participants
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id      uuid NOT NULL REFERENCES public.profiles(id)      ON DELETE CASCADE,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE INDEX IF NOT EXISTS conv_participants_profile_idx
  ON public.conversation_participants(profile_id);

-- =====================================================
-- Messages
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES public.profiles(id)      ON DELETE SET NULL,
  body            text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON public.messages(conversation_id);

CREATE INDEX IF NOT EXISTS messages_sender_idx
  ON public.messages(sender_id);

-- Updated_at trigger (idempotent)
SELECT public.ensure_trigger(
  'public',
  'messages',
  'messages_touch_updated_at',
  $SQL$
  CREATE TRIGGER messages_touch_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()
  $SQL$
);

-- =====================================================
-- Message reactions (👍❤️ etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, profile_id, reaction)
);

CREATE INDEX IF NOT EXISTS msg_reactions_profile_idx
  ON public.message_reactions(profile_id);

-- =====================================================
-- Message attachments (stored via storage bucket)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.message_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  storage_path text,     -- e.g. 'attachments/{uuid}.ext'
  mime_type    text,
  bytes        bigint,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS msg_attachments_message_idx
  ON public.message_attachments(message_id);

-- =====================================================
-- RLS enablement (policies likely defined elsewhere)
-- =====================================================

ALTER TABLE public.conversations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments        ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Done
-- =====================================================

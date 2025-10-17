-- Ensure conversation_participants has joined_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversation_participants'
    AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE public.conversation_participants
    ADD COLUMN joined_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Ensure messages has metadata column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.messages
    ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Ensure message_attachments table exists with proper columns
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  storage_path text,
  mime_type    text,
  bytes        bigint,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS msg_attachments_message_idx
  ON public.message_attachments(message_id);

-- Fix RLS recursion issue in conversation_participants

-- Drop the recursive policy that causes stack depth exceeded error
DROP POLICY IF EXISTS "conversation_participants_insert_participant" ON public.conversation_participants;

-- The conversation_participants_insert_creator policy is sufficient:
-- It allows the creator to add ANY participants (including themselves and others)
-- For group chats, we can add a non-recursive policy later if needed

-- Note: conversation_participants_insert_creator already allows creators to add
-- multiple participants when creating a conversation, which covers the direct messaging use case.

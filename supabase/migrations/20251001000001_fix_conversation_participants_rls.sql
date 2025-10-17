-- Fix conversation_participants RLS to allow creators to add initial participants

-- Drop the restrictive policy
DROP POLICY IF EXISTS "conversation_participants_manage" ON public.conversation_participants;

-- Allow conversation creators to add participants
CREATE POLICY "conversation_participants_insert_creator"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND created_by = auth.uid()
  )
);

-- Allow existing participants to add other participants (for group chats)
CREATE POLICY "conversation_participants_insert_participant"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  public.is_conversation_participant(conversation_id)
);

-- Allow participants to update/delete their own participation
CREATE POLICY "conversation_participants_update_delete"
ON public.conversation_participants
FOR UPDATE
USING (profile_id = auth.uid() OR public.is_admin())
WITH CHECK (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY "conversation_participants_delete"
ON public.conversation_participants
FOR DELETE
USING (profile_id = auth.uid() OR public.is_admin());

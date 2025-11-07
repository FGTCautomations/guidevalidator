-- =====================================================
-- FIX: Conversation RLS Recursion - Stack Depth Exceeded
-- =====================================================
-- This fixes the infinite recursion caused by:
-- 1. conversation_participants SELECT policy calling is_conversation_participant()
-- 2. is_conversation_participant() querying conversation_participants
-- 3. Which triggers the SELECT policy again → infinite loop

-- =====================================================
-- STEP 1: Drop all existing policies (make this script idempotent)
-- =====================================================

-- conversation_participants policies
DROP POLICY IF EXISTS "conversation_participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_manage" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_creator" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert_participant" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update_delete" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_delete" ON public.conversation_participants;

-- conversations policies
DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_admin" ON public.conversations;

-- messages policies
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_admin_all" ON public.messages;

-- =====================================================
-- STEP 2: Recreate the helper function with SECURITY DEFINER
-- =====================================================
-- This is the KEY FIX: SECURITY DEFINER allows the function to bypass RLS
-- when it queries conversation_participants, breaking the recursion loop

CREATE OR REPLACE FUNCTION public.is_conversation_participant(target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER  -- This bypasses RLS, breaking the recursion
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = target
      AND cp.profile_id = auth.uid()
  );
$$;

-- =====================================================
-- STEP 3: Recreate conversation_participants policies
-- =====================================================

-- SELECT: Users can only see their own participation records
CREATE POLICY "conversation_participants_select"
ON public.conversation_participants
FOR SELECT
USING (
  profile_id = auth.uid()
  OR public.is_admin()
);

-- INSERT: Conversation creators can add initial participants
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

-- UPDATE: Users can update their own participation
CREATE POLICY "conversation_participants_update"
ON public.conversation_participants
FOR UPDATE
USING (profile_id = auth.uid() OR public.is_admin())
WITH CHECK (profile_id = auth.uid() OR public.is_admin());

-- DELETE: Users can delete their own participation
CREATE POLICY "conversation_participants_delete"
ON public.conversation_participants
FOR DELETE
USING (profile_id = auth.uid() OR public.is_admin());

-- =====================================================
-- STEP 4: Recreate conversations table policies
-- =====================================================

CREATE POLICY "conversations_select_participants"
ON public.conversations
FOR SELECT
USING (
  public.is_conversation_participant(id)
  OR public.is_admin()
);

CREATE POLICY "conversations_insert"
ON public.conversations
FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_update_admin"
ON public.conversations
FOR UPDATE
USING (public.is_admin())
WITH CHECK (true);

-- =====================================================
-- STEP 5: Recreate messages table policies
-- =====================================================

CREATE POLICY "messages_select"
ON public.messages
FOR SELECT
USING (
  public.is_conversation_participant(conversation_id)
  OR public.is_admin()
);

CREATE POLICY "messages_insert"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_conversation_participant(conversation_id)
);

CREATE POLICY "messages_update_sender"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_admin_all"
ON public.messages
FOR ALL
USING (public.is_admin())
WITH CHECK (true);

-- =====================================================
-- DONE! Verification Query (run this after applying)
-- =====================================================
-- SELECT
--   schemaname, tablename, policyname,
--   cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('conversation_participants', 'conversations', 'messages')
-- ORDER BY tablename, policyname;

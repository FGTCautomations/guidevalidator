-- Fix recursion by making helper functions bypass RLS with SECURITY DEFINER

-- Recreate is_conversation_participant with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.is_conversation_participant(target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = target
      AND cp.profile_id = auth.uid()
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated;

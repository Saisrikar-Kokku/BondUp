-- Fix infinite recursion in RLS policies

-- Create a security definer function to check participation
-- This bypasses RLS to avoid infinite recursion when querying conversation_participants
CREATE OR REPLACE FUNCTION is_conversation_participant(_conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;

-- Create new policy using the function
CREATE POLICY "Users can view participants of their conversations"
ON conversation_participants FOR SELECT
USING (
  user_id = auth.uid() -- Always see own rows
  OR
  is_conversation_participant(conversation_id) -- See others if in same convo
);

-- Update other policies to use the function for consistency and performance

-- Conversations policy
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;

CREATE POLICY "Participants can view conversations"
ON conversations FOR SELECT
USING (
  is_conversation_participant(id)
);

-- Messages policy
DROP POLICY IF EXISTS "Participants can view messages" ON messages;

CREATE POLICY "Participants can view messages"
ON messages FOR SELECT
USING (
  is_conversation_participant(conversation_id)
);

-- Messages insert policy
DROP POLICY IF EXISTS "Participants can insert messages" ON messages;

CREATE POLICY "Participants can insert messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  is_conversation_participant(conversation_id)
);

-- Messages update policy
DROP POLICY IF EXISTS "Participants can update messages" ON messages;

CREATE POLICY "Participants can update messages"
ON messages FOR UPDATE
USING (
  is_conversation_participant(conversation_id)
);

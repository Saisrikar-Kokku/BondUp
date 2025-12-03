-- Fix RLS policies for messaging

-- Allow authenticated users to create conversations
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to add participants
-- This is needed to add both yourself and the other user to the conversation
CREATE POLICY "Users can add participants"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also ensure update policy for conversations (to update updated_at)
CREATE POLICY "Participants can update conversations"
ON conversations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  )
);

-- Migration: Add message reactions table
-- This table stores emoji reactions to chat messages

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (emoji IN ('❤️', '😂', '😮', '😢', '🔥')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One reaction per user per message
    UNIQUE(message_id, user_id)
);

-- Index for fast lookups
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on messages in their conversations
CREATE POLICY "Users can view reactions in their conversations"
ON message_reactions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM messages m
        JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
        WHERE m.id = message_reactions.message_id
        AND cp.user_id = auth.uid()
    )
);

-- Policy: Users can add reactions to messages in their conversations
CREATE POLICY "Users can add reactions"
ON message_reactions FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM messages m
        JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
        WHERE m.id = message_reactions.message_id
        AND cp.user_id = auth.uid()
    )
);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON message_reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;

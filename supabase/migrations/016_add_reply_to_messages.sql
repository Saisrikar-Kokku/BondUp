-- Add reply_to_id column to messages table for reply functionality
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Create index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);

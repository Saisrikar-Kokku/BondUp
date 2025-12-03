-- Add read_at column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Update existing read messages to have read_at = updated_at (approximate) or created_at
UPDATE messages SET read_at = created_at WHERE is_read = true AND read_at IS NULL;

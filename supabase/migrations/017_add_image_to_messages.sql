-- Add image_url column to messages table for image attachments
ALTER TABLE messages ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for faster queries on messages with images
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON messages(image_url) WHERE image_url IS NOT NULL;

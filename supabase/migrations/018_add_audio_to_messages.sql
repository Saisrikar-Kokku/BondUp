-- Add audio support to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS audio_duration INTEGER;

-- Index for audio messages
CREATE INDEX IF NOT EXISTS idx_messages_audio_url ON messages(audio_url) WHERE audio_url IS NOT NULL;

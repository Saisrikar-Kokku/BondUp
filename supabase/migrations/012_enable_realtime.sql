-- Enable Realtime for messaging tables

-- Add tables to the supabase_realtime publication
-- This is required for the client to receive updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

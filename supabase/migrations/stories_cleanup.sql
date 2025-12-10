-- Stories Auto-Cleanup (Simplified)
-- Run this in Supabase SQL Editor

-- Note: Storage deletion is handled by the application code (deleteStory function)
-- This SQL only handles database cleanup for expired stories

-- Function to delete all expired stories from the database
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
    DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_stories() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_stories() TO service_role;

-- To auto-run cleanup, you have two options:

-- OPTION 1: Using pg_cron (if available on your Supabase plan)
-- Run this to schedule cleanup every hour:
-- SELECT cron.schedule('cleanup-stories', '0 * * * *', 'SELECT cleanup_expired_stories()');

-- OPTION 2: Create a Supabase Edge Function or use an external cron service
-- to call the cleanup_expired_stories() function periodically

-- NOTE: When stories expire, their media files will remain in storage.
-- For complete cleanup, create an Edge Function that:
-- 1. Queries expired stories to get their media_urls
-- 2. Deletes files from storage
-- 3. Then deletes the database rows

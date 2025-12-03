-- Migration: Create notifications table and triggers
-- Description: Adds real-time notifications for follows, likes, and comments

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'mention')),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Trigger function: Create notification when someone follows you
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_follower
  AFTER INSERT ON followers
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- Trigger function: Create notification when someone likes your post
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user likes their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (post_owner_id, NEW.user_id, 'like', NEW.post_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_like
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- Trigger function: Create notification when someone comments on your post
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM posts WHERE id = NEW.post_id;
  
  -- Don't notify if user comments on their own post
  IF post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id)
    VALUES (post_owner_id, NEW.user_id, 'comment', NEW.post_id, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

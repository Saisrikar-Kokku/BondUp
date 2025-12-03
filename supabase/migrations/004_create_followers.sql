-- Migration: Create followers table and RLS policies
-- Description: Implements the follow/following system for users

-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON followers(created_at DESC);

-- Enable Row Level Security
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view follow relationships (public information)
CREATE POLICY "Anyone can view follows"
  ON followers FOR SELECT
  USING (true);

-- Users can follow others (insert their own follow relationships)
CREATE POLICY "Users can follow others"
  ON followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow others (delete their own follow relationships)
CREATE POLICY "Users can unfollow others"
  ON followers FOR DELETE
  USING (auth.uid() = follower_id);

-- No updates allowed (follow relationships are immutable)
-- Users should delete and recreate if needed

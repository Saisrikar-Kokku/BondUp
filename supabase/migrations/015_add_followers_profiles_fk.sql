-- Migration: Add foreign keys to profiles for followers table
-- Description: Allows embedding profiles in followers queries

-- Add FK for follower_id to profiles
ALTER TABLE followers
ADD CONSTRAINT followers_follower_id_profiles_fkey
FOREIGN KEY (follower_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Add FK for following_id to profiles
ALTER TABLE followers
ADD CONSTRAINT followers_following_id_profiles_fkey
FOREIGN KEY (following_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

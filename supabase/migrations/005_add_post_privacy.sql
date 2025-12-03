-- Migration: Add post privacy setting
-- Description: Adds is_public column to posts table for privacy control

-- Add is_public column to posts table (default true = public)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true NOT NULL;

-- Create index for filtering public posts (improves query performance)
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON posts(is_public);

-- Create composite index for common query pattern (public posts ordered by date)
CREATE INDEX IF NOT EXISTS idx_posts_public_created ON posts(is_public, created_at DESC);

-- Enable pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for User Search
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_trgm ON profiles USING gin (full_name gin_trgm_ops);

-- Indexes for Post Search
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING gin (to_tsvector('english', content));

-- Search Users Function
CREATE OR REPLACE FUNCTION search_users(
  search_term TEXT,
  limit_val INT DEFAULT 10,
  offset_val INT DEFAULT 0
)
RETURNS SETOF profiles AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE 
    username ILIKE '%' || search_term || '%'
    OR full_name ILIKE '%' || search_term || '%'
  ORDER BY 
    CASE 
      WHEN username ILIKE search_term THEN 1  -- Exact match
      WHEN username ILIKE search_term || '%' THEN 2 -- Starts with
      ELSE 3
    END,
    username ASC
  LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

-- Search Posts Function
CREATE OR REPLACE FUNCTION search_posts(
  search_term TEXT,
  limit_val INT DEFAULT 10,
  offset_val INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_public BOOLEAN,
  user_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.created_at,
    p.updated_at,
    p.is_public,
    to_jsonb(pr.*) as user_data
  FROM posts p
  JOIN profiles pr ON p.user_id = pr.id
  WHERE 
    p.is_public = true 
    AND to_tsvector('english', p.content) @@ plainto_tsquery('english', search_term)
  ORDER BY p.created_at DESC
  LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;

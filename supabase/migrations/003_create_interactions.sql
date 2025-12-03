-- Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_post_like UNIQUE (post_id, user_id)
);

-- Create post_comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT comment_length CHECK (char_length(content) > 0 AND char_length(content) <= 500)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS post_likes_post_id_idx ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS post_likes_user_id_idx ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS post_likes_post_user_idx ON public.post_likes(post_id, user_id);

CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS post_comments_user_id_idx ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS post_comments_created_at_idx ON public.post_comments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes table

-- Policy: Anyone can view likes
CREATE POLICY "Likes are viewable by everyone"
  ON public.post_likes
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own likes
CREATE POLICY "Users can insert their own likes"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_comments table

-- Policy: Anyone can view comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.post_comments
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.post_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at for comments
CREATE TRIGGER set_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

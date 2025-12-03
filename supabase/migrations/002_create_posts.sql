-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT content_length CHECK (char_length(content) > 0 AND char_length(content) <= 2000)
);

-- Create post_attachments table
CREATE TABLE IF NOT EXISTS public.post_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS post_attachments_post_id_idx ON public.post_attachments(post_id);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts table

-- Policy: Anyone can view posts
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own posts
CREATE POLICY "Users can insert their own posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON public.posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_attachments table

-- Policy: Anyone can view attachments
CREATE POLICY "Attachments are viewable by everyone"
  ON public.post_attachments
  FOR SELECT
  USING (true);

-- Policy: Users can insert attachments for their own posts
CREATE POLICY "Users can insert attachments for their own posts"
  ON public.post_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

-- Policy: Users can delete attachments for their own posts
CREATE POLICY "Users can delete attachments for their own posts"
  ON public.post_attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_id AND posts.user_id = auth.uid()
    )
  );

-- Trigger to automatically update updated_at
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-images bucket

-- Policy: Anyone can view post images
CREATE POLICY "Post images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'post-images');

-- Policy: Authenticated users can upload post images to their own folder
CREATE POLICY "Users can upload their own post images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update their own post images
CREATE POLICY "Users can update their own post images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own post images
CREATE POLICY "Users can delete their own post images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

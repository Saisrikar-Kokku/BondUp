-- Storage RLS Policies for Stories Bucket
-- Run this in Supabase SQL Editor AFTER creating the 'stories' bucket

-- First, make sure the bucket exists and is public
-- Go to Storage > Create bucket > Name: "stories" > Public: ON

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload stories"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'stories' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anyone to view stories (public bucket)
CREATE POLICY "Anyone can view stories"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stories');

-- Allow users to delete their own stories
CREATE POLICY "Users can delete their own stories"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'stories' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

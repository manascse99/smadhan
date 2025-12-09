-- Create storage bucket for complaint media
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-media', 'complaint-media', true);

-- Allow anyone to view files in the bucket
CREATE POLICY "Anyone can view complaint media"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload complaint media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'complaint-media' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'complaint-media' AND auth.uid()::text = (storage.foldername(name))[1]);
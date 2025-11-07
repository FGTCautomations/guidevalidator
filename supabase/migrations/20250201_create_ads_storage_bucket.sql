-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ads',
  'ads',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read all files in the ads bucket
CREATE POLICY "Public Access to Ads"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

-- Allow only admins to upload files to the ads bucket
CREATE POLICY "Admin Upload to Ads"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ads'
  AND auth.jwt() ->> 'role' = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Allow only admins to update files in the ads bucket
CREATE POLICY "Admin Update Ads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'ads'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Allow only admins to delete files from the ads bucket
CREATE POLICY "Admin Delete Ads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ads'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);

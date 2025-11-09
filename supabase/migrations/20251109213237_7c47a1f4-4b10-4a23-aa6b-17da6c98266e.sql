-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for cover art
INSERT INTO storage.buckets (id, name, public)
VALUES ('cover-art', 'cover-art', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for audio-files bucket
CREATE POLICY "Admins can upload audio files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'audio-files' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update audio files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'audio-files' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete audio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'audio-files' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view audio files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-files');

-- RLS policies for cover-art bucket
CREATE POLICY "Admins can upload cover art"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cover-art' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update cover art"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cover-art' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete cover art"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cover-art' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view cover art"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cover-art');
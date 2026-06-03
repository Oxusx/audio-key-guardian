DROP POLICY IF EXISTS "Admins can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete audio files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload cover art" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update cover art" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete cover art" ON storage.objects;

CREATE POLICY "Users upload own audio files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own audio files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own audio files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'audio-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users upload own cover art" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cover-art' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own cover art" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cover-art' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own cover art" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cover-art' AND (storage.foldername(name))[1] = auth.uid()::text);
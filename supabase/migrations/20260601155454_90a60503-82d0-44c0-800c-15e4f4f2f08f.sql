
INSERT INTO storage.buckets (id, name, public) VALUES ('merch-images', 'merch-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read merch images" ON storage.objects FOR SELECT USING (bucket_id = 'merch-images');
CREATE POLICY "Auth users upload merch images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'merch-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete merch images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'merch-images' AND (storage.foldername(name))[1] = auth.uid()::text);

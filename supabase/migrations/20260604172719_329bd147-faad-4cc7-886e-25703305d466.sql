
ALTER TABLE public.access_keys ADD COLUMN IF NOT EXISTS key_name text;

DROP POLICY IF EXISTS "Admins can manage access keys" ON public.access_keys;

CREATE POLICY "Admins can manage all access keys"
ON public.access_keys FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Artists can view own access keys"
ON public.access_keys FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Artists can create access keys for their profile"
ON public.access_keys FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    artist_profile_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.artist_profiles ap
      WHERE ap.id = artist_profile_id AND ap.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Artists can update own access keys"
ON public.access_keys FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Artists can delete own access keys"
ON public.access_keys FOR DELETE
USING (auth.uid() = created_by);

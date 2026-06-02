
-- 1. Access keys: remove public SELECT and replace with a scoped validation RPC
DROP POLICY IF EXISTS "Anyone can validate keys" ON public.access_keys;

CREATE OR REPLACE FUNCTION public.validate_artist_key(
  key_code_param text,
  artist_profile_id_param uuid
)
RETURNS TABLE(
  is_valid boolean,
  access_type text,
  expires_at timestamp with time zone,
  includes_merch boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    CASE
      WHEN ak.is_active = false THEN false
      WHEN ak.expires_at IS NOT NULL AND ak.expires_at < now() THEN false
      ELSE true
    END AS is_valid,
    ak.access_type,
    ak.expires_at,
    ak.includes_merch
  FROM public.access_keys ak
  WHERE upper(ak.key_code) = upper(key_code_param)
    AND (
      ak.artist_profile_id = artist_profile_id_param
      OR ak.created_by = (
        SELECT user_id FROM public.artist_profiles WHERE id = artist_profile_id_param
      )
    )
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_artist_key(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_artist_key(text, uuid) TO anon, authenticated;

-- 2. Admin settings: drop the open SELECT policy and expose only public fields via RPC
DROP POLICY IF EXISTS "Users can view admin settings" ON public.admin_settings;

CREATE OR REPLACE FUNCTION public.get_public_admin_settings(
  admin_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  admin_id uuid,
  project_name text,
  cover_art_url text,
  accept_investments boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.admin_id, s.project_name, s.cover_art_url, s.accept_investments
  FROM public.admin_settings s
  WHERE admin_id_param IS NULL OR s.admin_id = admin_id_param
  ORDER BY s.created_at ASC
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_admin_settings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_admin_settings(uuid) TO anon, authenticated;

-- 3. Restrict investment totals function to admins only
REVOKE EXECUTE ON FUNCTION public.get_total_investments() FROM PUBLIC, anon, authenticated;

-- 4. Merch images: add explicit owner-only UPDATE policy
DROP POLICY IF EXISTS "Users can update own merch images" ON storage.objects;
CREATE POLICY "Users can update own merch images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'merch-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'merch-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

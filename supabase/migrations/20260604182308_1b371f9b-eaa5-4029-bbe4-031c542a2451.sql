CREATE OR REPLACE FUNCTION public.resolve_access_key(key_code_param text)
RETURNS TABLE(
  is_valid boolean,
  access_type text,
  expires_at timestamp with time zone,
  artist_profile_id uuid,
  username text,
  includes_merch boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN ak.is_active = false THEN false
      WHEN ak.expires_at IS NOT NULL AND ak.expires_at < now() THEN false
      ELSE true
    END AS is_valid,
    ak.access_type,
    ak.expires_at,
    ap.id AS artist_profile_id,
    ap.username,
    ak.includes_merch
  FROM public.access_keys ak
  JOIN public.artist_profiles ap
    ON (
      (ak.artist_profile_id IS NOT NULL AND ap.id = ak.artist_profile_id)
      OR (ak.artist_profile_id IS NULL AND ap.user_id = ak.created_by)
    )
  WHERE upper(ak.key_code) = upper(key_code_param)
    AND ap.is_public = true
  ORDER BY ak.created_at DESC
  LIMIT 1;
$$;
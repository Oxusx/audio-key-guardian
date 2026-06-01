
DROP INDEX IF EXISTS public.access_keys_active_code_unique;

CREATE UNIQUE INDEX IF NOT EXISTS access_keys_active_per_artist_unique
  ON public.access_keys (artist_profile_id, upper(key_code))
  WHERE is_active = true AND artist_profile_id IS NOT NULL;

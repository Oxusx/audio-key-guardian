
-- 1. Unique username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS artist_profiles_username_lower_unique
  ON public.artist_profiles (lower(username));

-- 2. One artist profile per auth user
CREATE UNIQUE INDEX IF NOT EXISTS artist_profiles_user_id_unique
  ON public.artist_profiles (user_id);

-- 3. Only one ACTIVE key per key_code at any time (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS access_keys_active_code_unique
  ON public.access_keys (upper(key_code))
  WHERE is_active = true;

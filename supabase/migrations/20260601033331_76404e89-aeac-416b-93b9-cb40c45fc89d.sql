
-- Reserved names table — backend-only, no API access
CREATE TABLE IF NOT EXISTS public.reserved_names (
  name TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('username', 'key_code')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No Data API grants on purpose — only service_role (backend) can touch it
GRANT ALL ON public.reserved_names TO service_role;
ALTER TABLE public.reserved_names ENABLE ROW LEVEL SECURITY;

-- Seed Godscircle reservations
INSERT INTO public.reserved_names (name, kind, note) VALUES
  ('godscircle', 'username', 'Master admin — backend managed'),
  ('GODSCIRCLE', 'key_code', 'Master access key — backend managed')
ON CONFLICT DO NOTHING;

-- Block anyone from claiming the godscircle username via the app
CREATE OR REPLACE FUNCTION public.block_reserved_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reserved_names
    WHERE kind = 'username' AND lower(name) = lower(NEW.username)
  ) THEN
    RAISE EXCEPTION 'This username is reserved and cannot be used.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_reserved_username ON public.artist_profiles;
CREATE TRIGGER enforce_reserved_username
BEFORE INSERT OR UPDATE ON public.artist_profiles
FOR EACH ROW EXECUTE FUNCTION public.block_reserved_username();

-- Block anyone from generating an access key that matches a reserved code
CREATE OR REPLACE FUNCTION public.block_reserved_key_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.reserved_names
    WHERE kind = 'key_code' AND upper(name) = upper(NEW.key_code)
  ) THEN
    RAISE EXCEPTION 'This key code is reserved and cannot be used.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_reserved_key_code ON public.access_keys;
CREATE TRIGGER enforce_reserved_key_code
BEFORE INSERT OR UPDATE ON public.access_keys
FOR EACH ROW EXECUTE FUNCTION public.block_reserved_key_code();

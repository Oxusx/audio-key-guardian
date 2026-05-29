
-- Artist profiles
CREATE TABLE public.artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  profile_image_url TEXT,
  banner_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  require_key BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.artist_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artist_profiles TO authenticated;
GRANT ALL ON public.artist_profiles TO service_role;

ALTER TABLE public.artist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles viewable by everyone"
  ON public.artist_profiles FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Owners can insert their profile"
  ON public.artist_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their profile"
  ON public.artist_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their profile"
  ON public.artist_profiles FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER artist_profiles_updated_at
  BEFORE UPDATE ON public.artist_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Merch items
CREATE TABLE public.merch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artist_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  external_link TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.merch_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.merch_items TO authenticated;
GRANT ALL ON public.merch_items TO service_role;

ALTER TABLE public.merch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Available merch viewable by everyone"
  ON public.merch_items FOR SELECT
  USING (
    is_available = true
    OR EXISTS (SELECT 1 FROM public.artist_profiles ap WHERE ap.id = artist_id AND ap.user_id = auth.uid())
  );

CREATE POLICY "Owners can insert merch"
  ON public.merch_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.artist_profiles ap WHERE ap.id = artist_id AND ap.user_id = auth.uid()));

CREATE POLICY "Owners can update merch"
  ON public.merch_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.artist_profiles ap WHERE ap.id = artist_id AND ap.user_id = auth.uid()));

CREATE POLICY "Owners can delete merch"
  ON public.merch_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.artist_profiles ap WHERE ap.id = artist_id AND ap.user_id = auth.uid()));

CREATE TRIGGER merch_items_updated_at
  BEFORE UPDATE ON public.merch_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend access_keys
ALTER TABLE public.access_keys
  ADD COLUMN IF NOT EXISTS includes_merch BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS artist_profile_id UUID REFERENCES public.artist_profiles(id) ON DELETE SET NULL;

-- Extend admin_settings
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS accept_investments BOOLEAN NOT NULL DEFAULT false;

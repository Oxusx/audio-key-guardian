-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create access_keys table for user access codes
CREATE TABLE public.access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code TEXT NOT NULL UNIQUE,
  access_type TEXT NOT NULL CHECK (access_type IN ('24h', '48h', 'indefinite')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true NOT NULL
);

ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for access_keys
CREATE POLICY "Admins can manage access keys"
ON public.access_keys
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can validate keys"
ON public.access_keys
FOR SELECT
USING (true);

-- Create admin_settings table
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  project_name TEXT DEFAULT 'Music Project',
  investment_budget NUMERIC DEFAULT 0,
  roi_percentage NUMERIC DEFAULT 20,
  cover_art_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_settings
CREATE POLICY "Admins can manage their settings"
ON public.admin_settings
FOR ALL
USING (auth.uid() = admin_id);

CREATE POLICY "Users can view admin settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Create audio_files table
CREATE TABLE public.audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration TEXT DEFAULT '0:00',
  file_size TEXT DEFAULT 'Unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for audio_files
CREATE POLICY "Admins can manage their audio files"
ON public.audio_files
FOR ALL
USING (auth.uid() = admin_id);

CREATE POLICY "Users can view audio files"
ON public.audio_files
FOR SELECT
USING (true);

-- Update investments RLS policies to require authentication
DROP POLICY IF EXISTS "Anyone can create investments" ON public.investments;
DROP POLICY IF EXISTS "Anyone can view investments" ON public.investments;

CREATE POLICY "Authenticated users can create investments"
ON public.investments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own investments"
ON public.investments
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all investments"
ON public.investments
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Update contracts RLS policies to require authentication
DROP POLICY IF EXISTS "Anyone can create contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Users can sign contracts" ON public.contracts;

CREATE POLICY "Authenticated users can create contracts"
ON public.contracts
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own contracts"
ON public.contracts
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  (investor_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR 
   public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Users and admins can sign contracts"
ON public.contracts
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  (investor_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR 
   admin_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Function to validate access key
CREATE OR REPLACE FUNCTION public.validate_access_key(key_code_param TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  access_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
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
    END as is_valid,
    ak.access_type,
    ak.expires_at
  FROM public.access_keys ak
  WHERE ak.key_code = key_code_param
  LIMIT 1;
$$;

-- Trigger for updated_at on admin_settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Admin already exists. New admins must be assigned by an existing admin.';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.admin_settings (admin_id) VALUES (uid)
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;

-- Update complete_onboarding to also handle missing profile (for users where trigger didn't fire)
CREATE OR REPLACE FUNCTION public.complete_onboarding(
  _role app_role,
  _department text DEFAULT NULL,
  _passkey text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email text;
  _user_name text;
BEGIN
  -- Validate officer passkey
  IF _role = 'officer' THEN
    IF _passkey IS NULL OR _passkey != '991949' THEN
      RAISE EXCEPTION 'Invalid officer passkey';
    END IF;
  END IF;

  -- Don't allow setting admin or government roles through this function
  IF _role NOT IN ('citizen', 'officer') THEN
    RAISE EXCEPTION 'Invalid role selection';
  END IF;

  -- Get user info from auth.users
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', 'User')
  INTO _user_email, _user_name
  FROM auth.users
  WHERE id = auth.uid();

  -- Ensure profile exists
  INSERT INTO public.profiles (id, full_name, email, department)
  VALUES (auth.uid(), _user_name, _user_email, _department)
  ON CONFLICT (id) DO UPDATE SET
    department = COALESCE(EXCLUDED.department, profiles.department);

  -- Upsert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;

  -- If they had a different role, update it
  UPDATE public.user_roles
  SET role = _role
  WHERE user_id = auth.uid();

  -- Update department in profiles if officer
  IF _role = 'officer' AND _department IS NOT NULL THEN
    UPDATE public.profiles
    SET department = _department
    WHERE id = auth.uid();
  END IF;
END;
$$;

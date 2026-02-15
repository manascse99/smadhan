
-- Create a security definer function that allows users to set their own role during onboarding
-- This validates the officer passkey server-side for security
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

  -- Update the existing role (created by handle_new_user trigger)
  UPDATE public.user_roles
  SET role = _role
  WHERE user_id = auth.uid();

  -- If no row was updated (edge case), insert one
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), _role);
  END IF;

  -- Update department in profiles if officer
  IF _role = 'officer' AND _department IS NOT NULL THEN
    UPDATE public.profiles
    SET department = _department
    WHERE id = auth.uid();
  END IF;
END;
$$;

-- Set up super_admin role for SUPER_ADMIN_EMAIL_HERE
-- super_admin sees everything admin sees + user emails + more analytics

-- First, ensure the profile exists and update roles
-- This runs after auth.users is set up, so we need to handle the case
-- where the user may or may not exist yet

-- Create a function to set up super admin that can be called after user signs up
CREATE OR REPLACE FUNCTION public.setup_super_admin()
RETURNS void AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'SUPER_ADMIN_EMAIL_HERE'
  LIMIT 1;

  IF target_user_id IS NOT NULL THEN
    -- Update profile to have super_admin + admin roles
    UPDATE public.profiles
    SET
      role = 'admin',
      roles = ARRAY['admin', 'super_admin', 'fan']
    WHERE id = target_user_id;

    RAISE NOTICE 'Super admin set up for user %', target_user_id;
  ELSE
    RAISE NOTICE 'User SUPER_ADMIN_EMAIL_HERE not found yet - run setup_super_admin() after signup';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Try to run it now (will succeed if user already exists)
SELECT public.setup_super_admin();

-- Also create a trigger to auto-assign super_admin when this email signs up
CREATE OR REPLACE FUNCTION public.auto_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'SUPER_ADMIN_EMAIL_HERE' THEN
    -- Wait a moment for profile to be created by the other trigger, then update
    PERFORM pg_sleep(0.5);
    UPDATE public.profiles
    SET
      role = 'admin',
      roles = ARRAY['admin', 'super_admin', 'fan']
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_super_admin ON auth.users;
CREATE TRIGGER on_auth_user_super_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_super_admin();

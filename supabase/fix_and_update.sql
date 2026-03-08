-- Fix the get_user_profile function (drop and recreate)
DROP FUNCTION IF EXISTS public.get_user_profile(UUID);
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  roles TEXT[],
  profile_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.roles,
    p.profile_image_url
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update your profile to have both admin and player roles
UPDATE public.profiles
SET roles = ARRAY['admin', 'player']::TEXT[]
WHERE email = 'berdefymarlon@gmail.com';

-- Check your profile
SELECT id, email, full_name, role, roles FROM public.profiles
WHERE email = 'berdefymarlon@gmail.com';

-- Check if you have a player record
SELECT id, user_id, name, position, is_alumni, is_retired FROM public.players
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'berdefymarlon@gmail.com');

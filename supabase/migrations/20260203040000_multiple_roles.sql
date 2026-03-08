-- ============================================
-- Enable multiple roles per user
-- ============================================

-- Add roles array column (keeping old role for backward compatibility)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['fan']::TEXT[];

-- Migrate existing role to roles array
UPDATE public.profiles
SET roles = ARRAY[role]::TEXT[]
WHERE roles IS NULL OR roles = ARRAY['fan']::TEXT[];

-- Add helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(user_uuid UUID, check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid
    AND (role = check_role OR check_role = ANY(roles))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid
    AND (role = 'admin' OR 'admin' = ANY(roles))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies to use roles array
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
CREATE POLICY "Admins can manage site content" ON public.site_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role IN ('admin', 'editor') OR 'admin' = ANY(roles) OR 'editor' = ANY(roles))
    )
  );

DROP POLICY IF EXISTS "Admins can manage league table" ON public.league_table;
CREATE POLICY "Admins can manage league table" ON public.league_table FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR 'admin' = ANY(roles))
    )
  );

DROP POLICY IF EXISTS "Admins can manage players" ON public.players;
CREATE POLICY "Admins can manage players" ON public.players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR 'admin' = ANY(roles))
    )
  );

-- Update the players_with_profiles view to include roles array
DROP VIEW IF EXISTS public.players_with_profiles;
CREATE OR REPLACE VIEW public.players_with_profiles AS
SELECT
  p.id,
  p.user_id,
  COALESCE(p.name, pr.full_name) as name,
  p.jersey_number as number,
  p.position,
  p.country,
  p.country_name,
  p.bio,
  COALESCE(p.image, pr.profile_image_url) as image,
  p.height,
  p.weight,
  p.age,
  p.preferred_foot as foot,
  p.skill_moves,
  p.weak_foot_rating as weak_foot,
  p.is_alumni,
  p.years_active,
  p.is_retired,
  CASE
    WHEN p.position = 'GK' THEN jsonb_build_object(
      'diving', p.diving,
      'handling', p.handling,
      'kicking', p.kicking,
      'reflexes', p.reflexes,
      'speed', p.gk_speed,
      'positioning', p.gk_positioning
    )
    ELSE jsonb_build_object(
      'pace', p.pace,
      'shooting', p.shooting,
      'passing', p.passing,
      'dribbling', p.dribbling,
      'defending', p.defending,
      'physical', p.physical
    )
  END as stats,
  pr.role as user_role,
  pr.roles as user_roles,
  pr.email,
  p.created_at,
  p.updated_at
FROM public.players p
LEFT JOIN public.profiles pr ON p.user_id = pr.id;

GRANT SELECT ON public.players_with_profiles TO authenticated, anon;

-- Update get_user_profile to include roles array
-- Must drop first because return type is changing
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

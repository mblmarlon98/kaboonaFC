-- ============================================
-- Add missing fields to players and profiles
-- ============================================

-- Add missing fields to players table
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'gb',
ADD COLUMN IF NOT EXISTS country_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS skill_moves INTEGER DEFAULT 3 CHECK (skill_moves BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS is_alumni BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS years_active TEXT;

-- Rename jersey_number to number for consistency (create alias view or just use both)
-- We'll keep jersey_number but also allow 'number' access

-- Add missing fields to profiles for admin role check
-- The role field already exists in profiles table

-- Create a view that combines players with profiles for easier querying
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
  -- Combine stats into JSONB for frontend compatibility
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
  pr.email,
  p.created_at,
  p.updated_at
FROM public.players p
LEFT JOIN public.profiles pr ON p.user_id = pr.id;

-- Create a view for team members (staff + coaches combined)
CREATE OR REPLACE VIEW public.team_members AS
SELECT
  s.id,
  s.user_id,
  COALESCE(pr.full_name, 'Unknown') as name,
  s.role,
  s.title,
  s.bio,
  COALESCE(s.profile_image_url, pr.profile_image_url) as image,
  s.created_at
FROM public.staff s
LEFT JOIN public.profiles pr ON s.user_id = pr.id
UNION ALL
SELECT
  c.id,
  c.user_id,
  COALESCE(pr.full_name, 'Unknown') as name,
  'coach' as role,
  c.title,
  c.bio,
  COALESCE(c.profile_image_url, pr.profile_image_url) as image,
  c.created_at
FROM public.coaches c
LEFT JOIN public.profiles pr ON c.user_id = pr.id;

-- Grant access to views
GRANT SELECT ON public.players_with_profiles TO authenticated, anon;
GRANT SELECT ON public.team_members TO authenticated, anon;

-- Function to get user profile with role
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  profile_image_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.profile_image_url
  FROM public.profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

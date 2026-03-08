-- ==========================================
-- Add alternate positions for players
-- ==========================================

-- Add alternate_positions array column to players
ALTER TABLE public.players
ADD COLUMN IF NOT EXISTS alternate_positions TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update the players_with_profiles view to include alternate_positions
DROP VIEW IF EXISTS public.players_with_profiles;
CREATE OR REPLACE VIEW public.players_with_profiles AS
SELECT
  p.id,
  p.user_id,
  COALESCE(p.name, pr.full_name) as name,
  p.jersey_number as number,
  p.position,
  p.alternate_positions,
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

-- Helper function to check if a player can play a position
CREATE OR REPLACE FUNCTION public.player_can_play_position(player_uuid UUID, check_position TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  player_main_position TEXT;
  player_alt_positions TEXT[];
BEGIN
  SELECT position, alternate_positions INTO player_main_position, player_alt_positions
  FROM public.players
  WHERE id = player_uuid;

  -- Check if it's their main position or one of their alternates
  RETURN player_main_position = check_position
         OR check_position = ANY(player_alt_positions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

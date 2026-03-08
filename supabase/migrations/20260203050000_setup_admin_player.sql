-- ==========================================
-- Setup admin profile and player record
-- ==========================================

-- Update profile to admin with multiple roles
UPDATE public.profiles
SET
  role = 'admin',
  roles = ARRAY['admin', 'player']::TEXT[],
  full_name = 'Marlon Berdefy'
WHERE email = 'berdefymarlon@gmail.com';

-- Create player record as GK (only if profile exists and player doesn't)
INSERT INTO public.players (
  user_id,
  name,
  jersey_number,
  position,
  country,
  country_name,
  is_alumni,
  is_retired,
  diving,
  handling,
  kicking,
  reflexes,
  gk_speed,
  gk_positioning
)
SELECT
  '79d95ebc-23d0-429f-a823-f8674dd15f50',
  'Marlon Berdefy',
  1,
  'GK',
  'my',
  'Malaysia',
  false,
  false,
  75,
  78,
  65,
  80,
  60,
  77
WHERE EXISTS (
  SELECT 1 FROM public.profiles WHERE id = '79d95ebc-23d0-429f-a823-f8674dd15f50'
)
AND NOT EXISTS (
  SELECT 1 FROM public.players WHERE user_id = '79d95ebc-23d0-429f-a823-f8674dd15f50'
);

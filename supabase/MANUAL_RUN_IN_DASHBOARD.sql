-- ==========================================
-- RUN THIS IN SUPABASE DASHBOARD SQL EDITOR
-- Go to: https://supabase.com/dashboard/project/fqxsnpcnhiwjbbmwqfdp/sql
-- ==========================================

-- Step 1: Update your profile to admin with multiple roles
UPDATE public.profiles
SET
  role = 'admin',
  roles = ARRAY['admin', 'player']::TEXT[],
  full_name = 'Marlon Berdefy'  -- Optional: update your name
WHERE email = 'berdefymarlon@gmail.com';

-- Step 2: Create your player record as GK (Goalkeeper)
INSERT INTO public.players (
  user_id,
  name,
  jersey_number,
  position,
  country,
  country_name,
  is_alumni,
  is_retired,
  -- GK stats (adjust these as you like, scale is typically 1-99)
  diving,
  handling,
  kicking,
  reflexes,
  gk_speed,
  gk_positioning
) VALUES (
  '79d95ebc-23d0-429f-a823-f8674dd15f50',  -- Your profile ID
  'Marlon Berdefy',
  1,  -- Jersey number for GK
  'GK',
  'my',  -- Malaysia country code
  'Malaysia',
  false,
  false,
  -- GK stats (example values - adjust as needed)
  75,  -- diving
  78,  -- handling
  65,  -- kicking
  80,  -- reflexes
  60,  -- speed
  77   -- positioning
);

-- Step 3: Verify the changes
SELECT id, email, full_name, role, roles FROM public.profiles WHERE email = 'berdefymarlon@gmail.com';
SELECT * FROM public.players WHERE user_id = '79d95ebc-23d0-429f-a823-f8674dd15f50';

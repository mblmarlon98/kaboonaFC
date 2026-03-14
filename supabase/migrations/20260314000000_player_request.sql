-- Add player_request_status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS player_request_status TEXT
  CHECK (player_request_status IN ('pending', 'approved', 'declined'))
  DEFAULT NULL;

-- Expand notifications type CHECK to include new types
-- Drop existing constraint and recreate with new values
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'training_invite',
    'match_invite',
    'formation_published',
    'match_reminder',
    'general',
    'player_approved',
    'player_request',
    'player_declined'
  ));

-- RLS: Users can set their own player_request_status to 'pending' only
CREATE POLICY "users_can_request_player_status"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND player_request_status = 'pending'
  );

-- RLS: Admins and coaches can update player_request_status and roles for any user
CREATE POLICY "admins_coaches_manage_player_requests"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role IN ('admin', 'coach') OR roles && ARRAY['admin', 'coach'])
    )
  );

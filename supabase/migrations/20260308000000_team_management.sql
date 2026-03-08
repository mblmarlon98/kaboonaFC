-- ============================================
-- Team Management Migration
-- Extends matches/training_sessions, adds
-- event_invitations, formations, notifications,
-- device_tokens tables and players_full view
-- ============================================

-- ============================================
-- 1. Extend matches table
-- ============================================

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'league'
    CHECK (match_type IN ('league', 'friendly')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS score_for INTEGER,
  ADD COLUMN IF NOT EXISTS score_against INTEGER;

-- ============================================
-- 2. Extend training_sessions table
-- ============================================

ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 3. Create event_invitations table
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('match', 'training')),
  event_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_type, event_id, player_id)
);

-- ============================================
-- 4. Create formations table
-- ============================================

CREATE TABLE IF NOT EXISTS public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  formation_type TEXT NOT NULL,
  positions JSONB NOT NULL DEFAULT '[]'::JSONB,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Create notifications table
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'training_invite',
    'match_invite',
    'formation_published',
    'match_reminder',
    'general',
    'player_approved'
  )),
  reference_type TEXT,
  reference_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Create device_tokens table
-- ============================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. Enable RLS on new tables
-- ============================================

ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_event_invitations_event
  ON public.event_invitations (event_type, event_id);

CREATE INDEX IF NOT EXISTS idx_event_invitations_player_status
  ON public.event_invitations (player_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON public.notifications (user_id, read, created_at DESC);

-- Partial index for unread notifications (fast count/fetch)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_device_tokens_user
  ON public.device_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_formations_match
  ON public.formations (match_id);

-- ============================================
-- 9. Update existing RLS policies for matches
--    Add 'coach' to the allowed roles
-- ============================================

DROP POLICY IF EXISTS "Admins can manage matches" ON public.matches;
CREATE POLICY "Admins can manage matches" ON public.matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'manager', 'coach')
        OR 'admin' = ANY(roles)
        OR 'manager' = ANY(roles)
        OR 'coach' = ANY(roles)
      )
    )
  );

-- ============================================
-- 10. Update existing RLS policies for training_sessions
--     Add 'coach' to the allowed roles
-- ============================================

DROP POLICY IF EXISTS "Admins can manage training sessions" ON public.training_sessions;
CREATE POLICY "Admins can manage training sessions" ON public.training_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'manager', 'coach')
        OR 'admin' = ANY(roles)
        OR 'manager' = ANY(roles)
        OR 'coach' = ANY(roles)
      )
    )
  );

-- ============================================
-- 11. RLS Policies — event_invitations
-- ============================================

-- Players see their own invitations; coaches/admins/managers see all
CREATE POLICY "Players see own invitations, coaches see all"
  ON public.event_invitations FOR SELECT
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'manager', 'coach')
        OR 'admin' = ANY(roles)
        OR 'manager' = ANY(roles)
        OR 'coach' = ANY(roles)
      )
    )
  );

-- Coaches/admins/managers can create invitations
CREATE POLICY "Coaches can create invitations"
  ON public.event_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'manager', 'coach')
        OR 'admin' = ANY(roles)
        OR 'manager' = ANY(roles)
        OR 'coach' = ANY(roles)
      )
    )
  );

-- Players can update their own invitation status
CREATE POLICY "Players can update own invitation status"
  ON public.event_invitations FOR UPDATE
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- Coaches/admins/managers can manage all invitations (update/delete)
CREATE POLICY "Coaches can manage all invitations"
  ON public.event_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'manager', 'coach')
        OR 'admin' = ANY(roles)
        OR 'manager' = ANY(roles)
        OR 'coach' = ANY(roles)
      )
    )
  );

-- ============================================
-- 12. RLS Policies — formations
-- ============================================

-- Published formations visible to all authenticated users
CREATE POLICY "Published formations visible to authenticated"
  ON public.formations FOR SELECT
  USING (
    published = TRUE
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'manager', 'coach')
        OR 'admin' = ANY(roles)
        OR 'manager' = ANY(roles)
        OR 'coach' = ANY(roles)
      )
    )
  );

-- Coaches/admins/managers can manage all formations
CREATE POLICY "Coaches can manage formations"
  ON public.formations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'manager', 'coach')
        OR 'admin' = ANY(roles)
        OR 'manager' = ANY(roles)
        OR 'coach' = ANY(roles)
      )
    )
  );

-- ============================================
-- 13. RLS Policies — notifications
-- ============================================

-- Users can see their own notifications
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coaches/admins/managers and system can create notifications
CREATE POLICY "Coaches and system can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'manager', 'coach')
        OR 'admin' = ANY(roles)
        OR 'manager' = ANY(roles)
        OR 'coach' = ANY(roles)
      )
    )
  );

-- Admins can manage all notifications (for cleanup)
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR 'admin' = ANY(roles))
    )
  );

-- ============================================
-- 14. RLS Policies — device_tokens
-- ============================================

-- Users can see their own device tokens
CREATE POLICY "Users see own device tokens"
  ON public.device_tokens FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own device tokens
CREATE POLICY "Users can insert own device tokens"
  ON public.device_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own device tokens
CREATE POLICY "Users can update own device tokens"
  ON public.device_tokens FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own device tokens
CREATE POLICY "Users can delete own device tokens"
  ON public.device_tokens FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 15. Triggers — updated_at
-- ============================================

CREATE TRIGGER update_formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 16. Create players_full view
--     JOIN players + profiles + aggregated player_stats
-- ============================================

DROP VIEW IF EXISTS public.players_full;
CREATE OR REPLACE VIEW public.players_full AS
SELECT
  p.id,
  p.user_id,
  COALESCE(p.name, pr.full_name) AS name,
  pr.email,
  pr.full_name,
  pr.profile_image_url,
  pr.role AS user_role,
  pr.roles AS user_roles,
  p.jersey_number,
  p.position,
  p.alternate_positions,
  p.country,
  p.country_name,
  p.bio,
  p.image,
  p.height,
  p.weight,
  p.age,
  p.preferred_foot,
  p.weak_foot_rating,
  p.skill_moves,
  p.is_alumni,
  p.years_active,
  p.is_retired,
  p.retired_at,
  -- Outfield stats
  p.pace,
  p.shooting,
  p.passing,
  p.dribbling,
  p.defending,
  p.physical,
  -- GK stats
  p.diving,
  p.handling,
  p.kicking,
  p.reflexes,
  p.gk_speed,
  p.gk_positioning,
  -- Aggregated season stats from player_stats
  COALESCE(agg.season_goals, 0) AS season_goals,
  COALESCE(agg.season_assists, 0) AS season_assists,
  COALESCE(agg.season_yellows, 0) AS season_yellows,
  COALESCE(agg.season_reds, 0) AS season_reds,
  COALESCE(agg.matches_played, 0) AS matches_played,
  p.created_at,
  p.updated_at
FROM public.players p
LEFT JOIN public.profiles pr ON p.user_id = pr.id
LEFT JOIN (
  SELECT
    ps.player_id,
    SUM(ps.goals) AS season_goals,
    SUM(ps.assists) AS season_assists,
    SUM(ps.yellow_cards) AS season_yellows,
    SUM(ps.red_cards) AS season_reds,
    COUNT(ps.id) AS matches_played
  FROM public.player_stats ps
  GROUP BY ps.player_id
) agg ON agg.player_id = p.id;

GRANT SELECT ON public.players_full TO authenticated, anon;

-- ============================================================
-- Squad & Injury System Migration (idempotent)
-- ============================================================

-- 1. injuries table
CREATE TABLE IF NOT EXISTS public.injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES profiles(id),
  injury_note TEXT,
  expected_return DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recovered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  recovered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_injuries_player_status ON injuries(player_id, status);
CREATE INDEX IF NOT EXISTS idx_injuries_active ON injuries(status) WHERE status = 'active';

DROP TRIGGER IF EXISTS set_injuries_updated_at ON injuries;
CREATE TRIGGER set_injuries_updated_at
  BEFORE UPDATE ON injuries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'injuries_select' AND tablename = 'injuries') THEN
    CREATE POLICY injuries_select ON injuries FOR SELECT USING (
      player_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
        AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'injuries_insert' AND tablename = 'injuries') THEN
    CREATE POLICY injuries_insert ON injuries FOR INSERT WITH CHECK (
      reported_by = auth.uid()
      AND (
        player_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles WHERE id = auth.uid()
          AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
        )
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'injuries_update' AND tablename = 'injuries') THEN
    CREATE POLICY injuries_update ON injuries FOR UPDATE USING (
      player_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
        AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'injuries_delete' AND tablename = 'injuries') THEN
    CREATE POLICY injuries_delete ON injuries FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
        AND (role IN ('admin','super_admin') OR roles && ARRAY['admin','super_admin']::TEXT[])
      )
    );
  END IF;
END $$;

-- 2. squad_presets table
CREATE TABLE IF NOT EXISTS public.squad_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_squad_presets_updated_at ON squad_presets;
CREATE TRIGGER set_squad_presets_updated_at
  BEFORE UPDATE ON squad_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE squad_presets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'squad_presets_all' AND tablename = 'squad_presets') THEN
    CREATE POLICY squad_presets_all ON squad_presets FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
        AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
      )
    );
  END IF;
END $$;

-- 3. squad_preset_players table
CREATE TABLE IF NOT EXISTS public.squad_preset_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES squad_presets(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(preset_id, player_id)
);

ALTER TABLE squad_preset_players ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'squad_preset_players_all' AND tablename = 'squad_preset_players') THEN
    CREATE POLICY squad_preset_players_all ON squad_preset_players FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
        AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
      )
    );
  END IF;
END $$;

-- 4. custom_formations table
CREATE TABLE IF NOT EXISTS public.custom_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  positions JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_custom_formations_updated_at ON custom_formations;
CREATE TRIGGER set_custom_formations_updated_at
  BEFORE UPDATE ON custom_formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE custom_formations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'custom_formations_all' AND tablename = 'custom_formations') THEN
    CREATE POLICY custom_formations_all ON custom_formations FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid()
        AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
      )
    );
  END IF;
END $$;

-- 5. Alter formations table — add is_draft column
ALTER TABLE public.formations ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT TRUE;
UPDATE formations SET is_draft = FALSE WHERE published = TRUE;

-- Public read for published formations (fan portal)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'formations_public_read' AND tablename = 'formations'
  ) THEN
    CREATE POLICY formations_public_read ON formations FOR SELECT USING (published = TRUE);
  END IF;
END
$$;

-- 6. Update notifications type constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'training_invite', 'match_invite', 'formation_published', 'match_reminder',
    'general', 'player_approved', 'player_request', 'player_declined',
    'event_invitation', 'event_cancellation',
    'note_created', 'injury_reported', 'starting_11'
  )
);

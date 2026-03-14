-- Events table for marketing/community events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  type TEXT NOT NULL DEFAULT 'fan_event',
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at (idempotent - function may already exist from initial schema)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for published events"
  ON events FOR SELECT
  USING (is_public = true);

CREATE POLICY "Staff read all events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('marketing', 'editor', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['marketing', 'editor', 'admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Marketing/admin manage events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('marketing', 'editor', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['marketing', 'editor', 'admin', 'super_admin']
      )
    )
  );

-- Player notes table
CREATE TABLE IF NOT EXISTS player_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaching staff read player notes"
  ON player_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('coach', 'owner', 'manager', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['coach', 'owner', 'manager', 'admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Coaching staff write player notes"
  ON player_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('coach', 'owner', 'manager', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['coach', 'owner', 'manager', 'admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Coaching staff update player notes"
  ON player_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('coach', 'owner', 'manager', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['coach', 'owner', 'manager', 'admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Author or admin delete player notes"
  ON player_notes FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'super_admin')
        OR profiles.roles && ARRAY['admin', 'super_admin']
      )
    )
  );

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read activity log"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'super_admin')
        OR profiles.roles && ARRAY['admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Authenticated insert activity log"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Photo tags: Instagram-style player tagging on gallery photos
-- Players can be tagged at x,y positions on photos
-- Tagged photos appear on player profiles

CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  x_position NUMERIC(5,2) NOT NULL CHECK (x_position BETWEEN 0 AND 100),
  y_position NUMERIC(5,2) NOT NULL CHECK (y_position BETWEEN 0 AND 100),
  tagged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (photo_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_player_id ON photo_tags(player_id);

ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'photo_tags_select' AND tablename = 'photo_tags') THEN
    CREATE POLICY "photo_tags_select" ON photo_tags FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'photo_tags_insert' AND tablename = 'photo_tags') THEN
    CREATE POLICY "photo_tags_insert" ON photo_tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'photo_tags_delete' AND tablename = 'photo_tags') THEN
    CREATE POLICY "photo_tags_delete" ON photo_tags FOR DELETE USING (
      auth.uid() = tagged_by OR
      auth.uid() = player_id OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );
  END IF;
END $$;

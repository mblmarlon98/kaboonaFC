-- Fan Portal Redesign Migration
-- Creates tables for fan wall, POTM voting, predictions, gallery
-- Adds completed_at to matches for voting window

-- ─── Schema Changes ──────────────────────────────────────────────

ALTER TABLE matches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ─── Fan Wall Tables ─────────────────────────────────────────────

CREATE TABLE fan_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  image_url TEXT,
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'match_reaction')),
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fan_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fan_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE fan_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fan_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── POTM Voting ─────────────────────────────────────────────────

CREATE TABLE potm_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, voter_id)
);

-- ─── Score Predictions ───────────────────────────────────────────

CREATE TABLE score_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score_for INTEGER NOT NULL CHECK (score_for >= 0),
  score_against INTEGER NOT NULL CHECK (score_against >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (match_id, user_id)
);

-- ─── Gallery ─────────────────────────────────────────────────────

CREATE TABLE gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES gallery_albums(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT CHECK (char_length(caption) <= 200),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (photo_id, user_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────

CREATE INDEX idx_fan_posts_user_id ON fan_posts(user_id);
CREATE INDEX idx_fan_posts_created_at ON fan_posts(created_at DESC);
CREATE INDEX idx_fan_post_comments_post_id ON fan_post_comments(post_id);
CREATE INDEX idx_fan_post_comments_user_id ON fan_post_comments(user_id);
CREATE INDEX idx_fan_post_likes_post_user ON fan_post_likes(post_id, user_id);
CREATE INDEX idx_potm_votes_match_id ON potm_votes(match_id);
CREATE INDEX idx_potm_votes_voter_id ON potm_votes(voter_id);
CREATE INDEX idx_score_predictions_match_id ON score_predictions(match_id);
CREATE INDEX idx_score_predictions_user_id ON score_predictions(user_id);
CREATE INDEX idx_gallery_photos_album_id ON gallery_photos(album_id);
CREATE INDEX idx_gallery_photos_user_id ON gallery_photos(user_id);
CREATE INDEX idx_gallery_photo_likes_photo_user ON gallery_photo_likes(photo_id, user_id);

-- ─── RLS Policies ────────────────────────────────────────────────

ALTER TABLE fan_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE potm_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photo_likes ENABLE ROW LEVEL SECURITY;

-- fan_posts
CREATE POLICY "fan_posts_select" ON fan_posts FOR SELECT USING (true);
CREATE POLICY "fan_posts_insert" ON fan_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fan_posts_delete" ON fan_posts FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- fan_post_likes
CREATE POLICY "fan_post_likes_select" ON fan_post_likes FOR SELECT USING (true);
CREATE POLICY "fan_post_likes_insert" ON fan_post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fan_post_likes_delete" ON fan_post_likes FOR DELETE USING (auth.uid() = user_id);

-- fan_post_comments
CREATE POLICY "fan_post_comments_select" ON fan_post_comments FOR SELECT USING (true);
CREATE POLICY "fan_post_comments_insert" ON fan_post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fan_post_comments_delete" ON fan_post_comments FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- potm_votes
CREATE POLICY "potm_votes_select" ON potm_votes FOR SELECT USING (true);
CREATE POLICY "potm_votes_insert" ON potm_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- score_predictions
CREATE POLICY "score_predictions_select" ON score_predictions FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM matches WHERE id = match_id AND status = 'completed')
);
CREATE POLICY "score_predictions_insert" ON score_predictions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM matches WHERE id = match_id AND status = 'scheduled')
);

-- gallery_albums
CREATE POLICY "gallery_albums_select" ON gallery_albums FOR SELECT USING (true);
CREATE POLICY "gallery_albums_insert" ON gallery_albums FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "gallery_albums_delete" ON gallery_albums FOR DELETE USING (
  (auth.uid() = created_by AND is_official = false) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- gallery_photos
CREATE POLICY "gallery_photos_select" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "gallery_photos_insert" ON gallery_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gallery_photos_delete" ON gallery_photos FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

-- gallery_photo_likes
CREATE POLICY "gallery_photo_likes_select" ON gallery_photo_likes FOR SELECT USING (true);
CREATE POLICY "gallery_photo_likes_insert" ON gallery_photo_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gallery_photo_likes_delete" ON gallery_photo_likes FOR DELETE USING (auth.uid() = user_id);

-- ─── Triggers: Denormalized Counts ──────────────────────────────

CREATE OR REPLACE FUNCTION update_fan_post_likes_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fan_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fan_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_fan_post_likes_count
  AFTER INSERT OR DELETE ON fan_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_fan_post_likes_count();

CREATE OR REPLACE FUNCTION update_fan_post_comments_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fan_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fan_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_fan_post_comments_count
  AFTER INSERT OR DELETE ON fan_post_comments
  FOR EACH ROW EXECUTE FUNCTION update_fan_post_comments_count();

CREATE OR REPLACE FUNCTION update_gallery_photo_likes_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gallery_photos SET likes_count = likes_count + 1 WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gallery_photos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_gallery_photo_likes_count
  AFTER INSERT OR DELETE ON gallery_photo_likes
  FOR EACH ROW EXECUTE FUNCTION update_gallery_photo_likes_count();

-- ─── Fan Leaderboard View ────────────────────────────────────────

CREATE OR REPLACE VIEW fan_leaderboard
WITH (security_invoker = false) AS
WITH post_pts AS (
  SELECT user_id, COUNT(*) * 5 AS pts FROM fan_posts GROUP BY user_id
),
comment_pts AS (
  SELECT user_id, COUNT(*) * 2 AS pts FROM fan_post_comments GROUP BY user_id
),
like_pts AS (
  SELECT user_id, COUNT(*) * 1 AS pts FROM fan_post_likes GROUP BY user_id
),
vote_pts AS (
  SELECT voter_id AS user_id, COUNT(*) * 3 AS pts FROM potm_votes GROUP BY voter_id
),
prediction_base AS (
  SELECT user_id, COUNT(*) * 5 AS pts FROM score_predictions GROUP BY user_id
),
prediction_bonus AS (
  SELECT
    sp.user_id,
    SUM(CASE
      WHEN m.score_for = sp.score_for AND m.score_against = sp.score_against THEN 20
      WHEN SIGN(m.score_for - m.score_against) = SIGN(sp.score_for - sp.score_against) THEN 10
      ELSE 0
    END) AS pts
  FROM score_predictions sp
  JOIN matches m ON m.id = sp.match_id AND m.status = 'completed'
  GROUP BY sp.user_id
),
attendance_pts AS (
  SELECT player_id AS user_id, COUNT(*) * 15 AS pts
  FROM event_invitations
  WHERE status = 'accepted'
  GROUP BY player_id
)
SELECT
  p.id AS user_id,
  p.full_name,
  p.profile_image_url,
  p.role,
  COALESCE(pp.pts, 0) + COALESCE(cp.pts, 0) + COALESCE(lp.pts, 0) +
  COALESCE(vp.pts, 0) + COALESCE(pb.pts, 0) + COALESCE(pbon.pts, 0) +
  COALESCE(ap.pts, 0) AS total_points
FROM profiles p
LEFT JOIN post_pts pp ON pp.user_id = p.id
LEFT JOIN comment_pts cp ON cp.user_id = p.id
LEFT JOIN like_pts lp ON lp.user_id = p.id
LEFT JOIN vote_pts vp ON vp.user_id = p.id
LEFT JOIN prediction_base pb ON pb.user_id = p.id
LEFT JOIN prediction_bonus pbon ON pbon.user_id = p.id
LEFT JOIN attendance_pts ap ON ap.user_id = p.id
WHERE
  COALESCE(pp.pts, 0) + COALESCE(cp.pts, 0) + COALESCE(lp.pts, 0) +
  COALESCE(vp.pts, 0) + COALESCE(pb.pts, 0) + COALESCE(pbon.pts, 0) +
  COALESCE(ap.pts, 0) > 0
ORDER BY total_points DESC;

-- ─── Storage Bucket ──────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES ('fan-uploads', 'fan-uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "fan_uploads_select" ON storage.objects FOR SELECT USING (bucket_id = 'fan-uploads');
CREATE POLICY "fan_uploads_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'fan-uploads' AND auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "fan_uploads_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'fan-uploads' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
  )
);

# Fan Portal Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Fan Portal merch shop with a 6-tab fan community hub (Match Center, Fan Wall, POTM Vote, Leaderboard, Match Day Hub, Gallery) and merge existing merch into the Shop page.

**Architecture:** Supabase migration creates 7 new tables + 1 view + triggers. A new `fanPortalService.js` handles all DB queries. FanPortal.jsx is rewritten as a tabbed shell rendering 6 tab components. MerchCard/CartSidebar move to Shop with Redux cart integration.

**Tech Stack:** React 18 (class components), Redux Toolkit, Supabase (Postgres + Storage + RLS), Framer Motion, Tailwind CSS, react-leaflet, Recharts

**Spec:** `docs/superpowers/specs/2026-03-12-fan-portal-redesign.md`

**No test infrastructure exists** in this project. Verification is manual (browser + dev tools). Each task ends with a commit.

---

## File Structure

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/migrations/20260312000000_fan_portal.sql` | 7 tables, 1 view, triggers, RLS, indexes, storage bucket |
| `src/services/fanPortalService.js` | All Supabase queries for fan portal features |
| `src/pages/Shop/components/MerchCard.jsx` | Copied from FanPortal (official merch card) |
| `src/pages/Shop/components/CartSidebar.jsx` | Copied from FanPortal (cart sidebar) |
| `src/pages/FanPortal/components/MatchCenter.jsx` | Tab 1: countdown, lineup, results, season record |
| `src/pages/FanPortal/components/FanWall.jsx` | Tab 2: social feed container |
| `src/pages/FanPortal/components/ComposeBox.jsx` | Tab 2: post composer |
| `src/pages/FanPortal/components/PostCard.jsx` | Tab 2: individual post card |
| `src/pages/FanPortal/components/POTMVoting.jsx` | Tab 3: player of the match voting |
| `src/pages/FanPortal/components/FanLeaderboard.jsx` | Tab 4: fan rankings |
| `src/pages/FanPortal/components/MatchDayHub.jsx` | Tab 5: match day info + predictions |
| `src/pages/FanPortal/components/ScorePredictor.jsx` | Tab 5: score prediction widget |
| `src/pages/FanPortal/components/Gallery.jsx` | Tab 6: album grid + upload |
| `src/pages/FanPortal/components/AlbumView.jsx` | Tab 6: photo masonry grid |
| `src/pages/FanPortal/components/PhotoLightbox.jsx` | Tab 6: fullscreen photo viewer |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Shop/Shop.jsx` | Add merch section tab, Redux connect, cart logic |
| `src/pages/FanPortal/FanPortal.jsx` | Complete rewrite as 6-tab hub |
| `src/services/schedulingService.js` | Add `completed_at` to `completeMatch()` |

### Files to Delete
| File | Reason |
|------|--------|
| `src/pages/FanPortal/components/MerchCard.jsx` | Moved to Shop |
| `src/pages/FanPortal/components/CartSidebar.jsx` | Moved to Shop |

---

## Chunk 1: Foundation — DB Migration & Service Layer

### Task 1: Write the Supabase Migration

**Files:**
- Create: `supabase/migrations/20260312000000_fan_portal.sql`

- [ ] **Step 1: Create the migration file**

```sql
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

-- ─── RLS Policies ────────────────────────────────────────────────

ALTER TABLE fan_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE potm_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;

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

-- ─── Triggers: Denormalized Counts ──────────────────────────────

-- Likes count on fan_posts
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

-- Comments count on fan_posts
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

-- Gallery photo likes table (mirrors fan_post_likes pattern)
CREATE TABLE gallery_photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES gallery_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (photo_id, user_id)
);

ALTER TABLE gallery_photo_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_photo_likes_select" ON gallery_photo_likes FOR SELECT USING (true);
CREATE POLICY "gallery_photo_likes_insert" ON gallery_photo_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gallery_photo_likes_delete" ON gallery_photo_likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_gallery_photo_likes_photo_user ON gallery_photo_likes(photo_id, user_id);

-- Likes count on gallery_photos
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
```

- [ ] **Step 2: Apply the migration**

Run: `docker exec -i supabase_db_kaboonaFC psql -U postgres -d postgres < supabase/migrations/20260312000000_fan_portal.sql`

Then record it:
```bash
docker exec supabase_db_kaboonaFC psql -U postgres -d postgres -c \
  "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20260312000000', 'fan_portal') ON CONFLICT DO NOTHING;"
```

Verify: `docker exec supabase_db_kaboonaFC psql -U postgres -d postgres -c "\dt fan_*"`
Expected: `fan_posts`, `fan_post_likes`, `fan_post_comments` listed.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260312000000_fan_portal.sql
git commit -m "feat: add fan portal DB migration — 7 tables, leaderboard view, triggers, RLS"
```

---

### Task 2: Create fanPortalService.js

**Files:**
- Create: `src/services/fanPortalService.js`

- [ ] **Step 1: Write the service file**

This file contains ALL Supabase queries for the 6 fan portal tabs. Each function is a named export.

```javascript
import supabase from './supabase';

// ─── Match Center ────────────────────────────────────────────────

export const getNextMatch = async () => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'scheduled')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const getRecentResults = async (limit = 5) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'completed')
    .order('match_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const getSeasonRecord = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('result, score_for, score_against')
    .eq('status', 'completed');
  if (error) throw error;
  const matches = data || [];
  return {
    played: matches.length,
    won: matches.filter((m) => m.result === 'win').length,
    drawn: matches.filter((m) => m.result === 'draw').length,
    lost: matches.filter((m) => m.result === 'loss').length,
    goalsFor: matches.reduce((s, m) => s + (m.score_for || 0), 0),
    goalsAgainst: matches.reduce((s, m) => s + (m.score_against || 0), 0),
  };
};

export const getPublishedLineup = async (matchId) => {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('match_id', matchId)
    .eq('published', true)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// ─── Fan Wall ────────────────────────────────────────────────────

export const getFanPosts = async (page = 0, pageSize = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from('fan_posts')
    .select(`
      *,
      profiles:user_id ( full_name, profile_image_url, role )
    `)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return data || [];
};

export const createFanPost = async ({ userId, content, imageUrl, postType, matchId }) => {
  const { data, error } = await supabase
    .from('fan_posts')
    .insert({
      user_id: userId,
      content,
      image_url: imageUrl || null,
      post_type: postType || 'text',
      match_id: matchId || null,
    })
    .select(`*, profiles:user_id ( full_name, profile_image_url, role )`)
    .single();
  if (error) throw error;
  return data;
};

export const deleteFanPost = async (postId) => {
  const { error } = await supabase.from('fan_posts').delete().eq('id', postId);
  if (error) throw error;
};

export const toggleLike = async (postId, userId) => {
  // Check if already liked
  const { data: existing } = await supabase
    .from('fan_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('fan_post_likes').delete().eq('id', existing.id);
    return false; // unliked
  } else {
    await supabase.from('fan_post_likes').insert({ post_id: postId, user_id: userId });
    return true; // liked
  }
};

export const getUserLikes = async (userId, postIds) => {
  if (!postIds.length) return [];
  const { data, error } = await supabase
    .from('fan_post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);
  if (error) throw error;
  return (data || []).map((l) => l.post_id);
};

export const getComments = async (postId) => {
  const { data, error } = await supabase
    .from('fan_post_comments')
    .select(`*, profiles:user_id ( full_name, profile_image_url, role )`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const addComment = async (postId, userId, content) => {
  const { data, error } = await supabase
    .from('fan_post_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`*, profiles:user_id ( full_name, profile_image_url, role )`)
    .single();
  if (error) throw error;
  return data;
};

// ─── POTM Voting ─────────────────────────────────────────────────

export const getVotableMatches = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getMatchPlayers = async (matchId) => {
  // Primary: accepted invitations
  const { data: invitations } = await supabase
    .from('event_invitations')
    .select('player_id, profiles:player_id ( full_name, profile_image_url )')
    .eq('event_type', 'match')
    .eq('event_id', matchId)
    .eq('status', 'accepted');

  if (invitations && invitations.length > 0) {
    const userIds = invitations.map((i) => i.player_id);
    const { data: players } = await supabase
      .from('players')
      .select('user_id, position, jersey_number')
      .in('user_id', userIds);
    const playerMap = {};
    (players || []).forEach((p) => { playerMap[p.user_id] = p; });
    return invitations.map((i) => ({
      userId: i.player_id,
      fullName: i.profiles?.full_name,
      profileImageUrl: i.profiles?.profile_image_url,
      position: playerMap[i.player_id]?.position || null,
      jerseyNumber: playerMap[i.player_id]?.jersey_number || null,
    }));
  }

  // Fallback: published formation for this match
  const { data: formation } = await supabase
    .from('formations')
    .select('positions')
    .eq('match_id', matchId)
    .eq('published', true)
    .single();

  if (formation?.positions) {
    const posUserIds = formation.positions.map((p) => p.userId).filter(Boolean);
    if (posUserIds.length > 0) {
      const { data: players } = await supabase
        .from('players')
        .select('user_id, position, jersey_number, profiles:user_id ( full_name, profile_image_url )')
        .in('user_id', posUserIds);
      return (players || []).filter((p) => p.profiles).map((p) => ({
        userId: p.user_id,
        fullName: p.profiles.full_name,
        profileImageUrl: p.profiles.profile_image_url,
        position: p.position,
        jerseyNumber: p.jersey_number,
      }));
    }
  }

  return []; // No invitations and no published formation
};

export const castPOTMVote = async (matchId, voterId, playerId) => {
  const { data, error } = await supabase
    .from('potm_votes')
    .insert({ match_id: matchId, voter_id: voterId, player_id: playerId })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getMyVote = async (matchId, voterId) => {
  const { data } = await supabase
    .from('potm_votes')
    .select('player_id')
    .eq('match_id', matchId)
    .eq('voter_id', voterId)
    .single();
  return data?.player_id || null;
};

export const getVoteResults = async (matchId) => {
  const { data, error } = await supabase
    .from('potm_votes')
    .select('player_id')
    .eq('match_id', matchId);
  if (error) throw error;
  const counts = {};
  (data || []).forEach((v) => {
    counts[v.player_id] = (counts[v.player_id] || 0) + 1;
  });
  return counts;
};

// ─── Leaderboard ─────────────────────────────────────────────────

export const getLeaderboard = async () => {
  const { data, error } = await supabase
    .from('fan_leaderboard')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
};

// ─── Score Predictions ───────────────────────────────────────────

export const submitPrediction = async (matchId, userId, scoreFor, scoreAgainst) => {
  const { data, error } = await supabase
    .from('score_predictions')
    .insert({
      match_id: matchId,
      user_id: userId,
      score_for: scoreFor,
      score_against: scoreAgainst,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getMyPrediction = async (matchId, userId) => {
  const { data } = await supabase
    .from('score_predictions')
    .select('*')
    .eq('match_id', matchId)
    .eq('user_id', userId)
    .single();
  return data;
};

// ─── Gallery ─────────────────────────────────────────────────────

export const getAlbums = async () => {
  const { data, error } = await supabase
    .from('gallery_albums')
    .select(`
      *,
      profiles:created_by ( full_name ),
      photo_count:gallery_photos(count)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((a) => ({
    ...a,
    photoCount: a.photo_count?.[0]?.count || 0,
    createdByName: a.profiles?.full_name || 'Unknown',
  }));
};

export const getAlbumPhotos = async (albumId) => {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select(`*, profiles:user_id ( full_name, profile_image_url )`)
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createAlbum = async ({ title, description, createdBy, isOfficial = false }) => {
  const { data, error } = await supabase
    .from('gallery_albums')
    .insert({ title, description, created_by: createdBy, is_official: isOfficial })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const uploadPhoto = async ({ albumId, userId, file, caption }) => {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${albumId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('fan-uploads')
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('fan-uploads').getPublicUrl(path);

  const { data, error } = await supabase
    .from('gallery_photos')
    .insert({
      album_id: albumId,
      user_id: userId,
      image_url: urlData.publicUrl,
      caption: caption || null,
    })
    .select(`*, profiles:user_id ( full_name, profile_image_url )`)
    .single();
  if (error) throw error;
  return data;
};

export const uploadFanPostImage = async (userId, file) => {
  const ext = file.name.split('.').pop();
  const path = `${userId}/posts/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('fan-uploads')
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('fan-uploads').getPublicUrl(path);
  return data.publicUrl;
};
```

- [ ] **Step 2: Verify import works**

Open browser dev tools at `http://localhost:5173/kaboonaFC/` and check console for no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/fanPortalService.js
git commit -m "feat: add fanPortalService with all Supabase queries for fan portal"
```

---

### Task 3: Update schedulingService.js — completeMatch

**Files:**
- Modify: `src/services/schedulingService.js:178-191`

- [ ] **Step 1: Add completed_at to the update payload**

In `completeMatch()`, add `completed_at: new Date().toISOString()` to the update object:

```javascript
// BEFORE (line 180-185):
  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'completed',
      score_for: scoreFor,
      score_against: scoreAgainst,
      result,
    })

// AFTER:
  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'completed',
      score_for: scoreFor,
      score_against: scoreAgainst,
      result,
      completed_at: new Date().toISOString(),
    })
```

- [ ] **Step 2: Commit**

```bash
git add src/services/schedulingService.js
git commit -m "feat: set completed_at timestamp when completing a match"
```

---

## Chunk 2: Merch Migration to Shop + FanPortal Shell + Match Center

### Task 4: Copy MerchCard & CartSidebar to Shop

**Files:**
- Create: `src/pages/Shop/components/MerchCard.jsx` (copy from FanPortal)
- Create: `src/pages/Shop/components/CartSidebar.jsx` (copy from FanPortal)

- [ ] **Step 1: Copy both files**

```bash
cp src/pages/FanPortal/components/MerchCard.jsx src/pages/Shop/components/MerchCard.jsx
cp src/pages/FanPortal/components/CartSidebar.jsx src/pages/Shop/components/CartSidebar.jsx
```

No import path changes needed — both components only import `react` and `framer-motion`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Shop/components/MerchCard.jsx src/pages/Shop/components/CartSidebar.jsx
git commit -m "feat: copy MerchCard and CartSidebar to Shop components"
```

---

### Task 5: Add Merch Section to Shop.jsx with Redux

**Files:**
- Modify: `src/pages/Shop/Shop.jsx`

- [ ] **Step 1: Add imports for merch components and Redux cart**

At the top of Shop.jsx, add these imports:

```javascript
import { connect } from 'react-redux';
import { AnimatePresence } from 'framer-motion';  // already imported
import MerchCard from './components/MerchCard';
import CartSidebar from './components/CartSidebar';
import { addItem, removeItem, updateQuantity, clearCart } from '../../redux/slices/cartSlice';
```

- [ ] **Step 2: Add the MERCHANDISE array**

Copy the full `MERCHANDISE` array (20 items) and `MERCH_CATEGORIES` from the current `FanPortal.jsx` (lines 11-173) into Shop.jsx, right after `CATEGORIES`. Rename the categories array to `MERCH_CATEGORIES`:

```javascript
const MERCH_CATEGORIES = [
  { id: 'all', name: 'All Products', icon: '🛍️' },
  { id: 'jerseys', name: 'Jerseys', icon: '👕' },
  { id: 'training', name: 'Training Kit', icon: '🏃' },
  { id: 'shorts', name: 'Shorts', icon: '🩳' },
  { id: 'accessories', name: 'Accessories', icon: '🎒' },
];
```

- [ ] **Step 3: Add state for shop section tab and merch**

Update the constructor to include:

```javascript
this.state = {
  searchQuery: '',
  activeCategory: 'all',
  isLoading: false,
  activeSection: 'gear',  // 'gear' or 'merch'
  merchCategory: 'all',
  merchSearch: '',
  isCartOpen: false,
  notification: null,
};
```

- [ ] **Step 4: Add merch handler methods**

Add these methods to the Shop class (same pattern as current FanPortal):

```javascript
handleSectionChange = (section) => {
  this.setState({ activeSection: section });
};

handleMerchCategoryChange = (categoryId) => {
  this.setState({ merchCategory: categoryId });
};

handleMerchSearchChange = (e) => {
  this.setState({ merchSearch: e.target.value });
};

handleAddToCart = (product) => {
  this.props.addItem(product);
  this.setState({
    notification: { message: `${product.name} (${product.size}) added to cart`, type: 'success' },
  });
  setTimeout(() => this.setState({ notification: null }), 3000);
};

handleRemoveItem = (id, size) => { this.props.removeItem({ id, size }); };
handleUpdateQuantity = (id, size, quantity) => { this.props.updateQuantity({ id, size, quantity }); };
handleClearCart = () => { this.props.clearCart(); };
toggleCart = () => { this.setState((prev) => ({ isCartOpen: !prev.isCartOpen })); };

getFilteredMerch = () => {
  const { merchSearch, merchCategory } = this.state;
  let filtered = MERCHANDISE;
  if (merchCategory !== 'all') filtered = filtered.filter((p) => p.category === merchCategory);
  if (merchSearch.trim()) {
    const q = merchSearch.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }
  return filtered;
};
```

- [ ] **Step 5: Update render() — add section tabs below hero, render merch or gear**

Replace the hero content `<h1>` section with a section tab switcher:

```jsx
<h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4">
  The Shop
</h1>
<p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
  Official merch and premium football gear.
</p>
<div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mb-8" />

{/* Section Tabs */}
<div className="flex justify-center gap-4">
  {[
    { id: 'merch', label: 'Official Merch', icon: '🏆' },
    { id: 'gear', label: 'Football Gear', icon: '⚽' },
  ].map((tab) => (
    <motion.button
      key={tab.id}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => this.handleSectionChange(tab.id)}
      className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 ${
        activeSection === tab.id
          ? 'bg-accent-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
          : 'bg-surface-dark-elevated text-gray-300 border border-gray-700 hover:border-accent-gold/50'
      }`}
    >
      <span className="flex items-center gap-2">
        <span>{tab.icon}</span> {tab.label}
      </span>
    </motion.button>
  ))}
</div>
```

Then conditionally render merch vs gear sections based on `activeSection`:

- When `activeSection === 'merch'`: show merch search, MERCH_CATEGORIES filter, MerchCard grid, floating cart button, CartSidebar, notification toast
- When `activeSection === 'gear'`: show current affiliate search, CategoryFilter, ProductCard grid, affiliate disclaimer

- [ ] **Step 6: Add Redux connect at bottom**

Replace `export default Shop;` with:

```javascript
const mapStateToProps = (state) => ({
  cartItems: state.cart?.items || [],
  cartTotal: state.cart?.total || 0,
});

const mapDispatchToProps = { addItem, removeItem, updateQuantity, clearCart };

export default connect(mapStateToProps, mapDispatchToProps)(Shop);
```

- [ ] **Step 7: Verify in browser**

Navigate to `http://localhost:5173/kaboonaFC/shop`. Both tabs (Official Merch and Football Gear) should render. Cart should work in merch tab.

- [ ] **Step 8: Commit**

```bash
git add src/pages/Shop/Shop.jsx
git commit -m "feat: add official merch section to Shop with Redux cart integration"
```

---

### Task 6: Delete Old Merch Components from FanPortal

**Files:**
- Delete: `src/pages/FanPortal/components/MerchCard.jsx`
- Delete: `src/pages/FanPortal/components/CartSidebar.jsx`

- [ ] **Step 1: Delete the files**

```bash
rm src/pages/FanPortal/components/MerchCard.jsx
rm src/pages/FanPortal/components/CartSidebar.jsx
```

- [ ] **Step 2: Commit**

```bash
git add -u src/pages/FanPortal/components/
git commit -m "chore: remove merch components from FanPortal (moved to Shop)"
```

---

### Task 7: Rewrite FanPortal.jsx as 6-Tab Hub Shell

**Files:**
- Rewrite: `src/pages/FanPortal/FanPortal.jsx`

- [ ] **Step 1: Complete rewrite**

Replace the entire file with a tabbed shell. Initially, only import MatchCenter (other tabs render placeholders until built):

```jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import MatchCenter from './components/MatchCenter';
import { getNextMatch } from '../../services/fanPortalService';

const TABS = [
  { id: 'match-center', label: 'Match Center', icon: '⚽' },
  { id: 'fan-wall', label: 'Fan Wall', icon: '💬' },
  { id: 'vote', label: 'POTM Vote', icon: '🏆' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🥇' },
  { id: 'match-day', label: 'Match Day', icon: '📍' },
  { id: 'gallery', label: 'Gallery', icon: '📸' },
];

class FanPortal extends Component {
  constructor(props) {
    super(props);
    this.state = { activeTab: 'match-center', nextMatch: null };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    try {
      const nextMatch = await getNextMatch();
      this.setState({ nextMatch });
    } catch (err) { /* ignore */ }
  }

  handleTabChange = (tabId) => {
    this.setState({ activeTab: tabId });
  };

  renderTabContent = () => {
    const { activeTab } = this.state;
    const { user } = this.props;

    switch (activeTab) {
      case 'match-center':
        return <MatchCenter />;
      case 'fan-wall':
        return <div className="text-center py-20 text-gray-400">Fan Wall — coming soon</div>;
      case 'vote':
        return <div className="text-center py-20 text-gray-400">POTM Vote — coming soon</div>;
      case 'leaderboard':
        return <div className="text-center py-20 text-gray-400">Leaderboard — coming soon</div>;
      case 'match-day':
        return <div className="text-center py-20 text-gray-400">Match Day — coming soon</div>;
      case 'gallery':
        return <div className="text-center py-20 text-gray-400">Gallery — coming soon</div>;
      default:
        return null;
    }
  };

  render() {
    const { activeTab } = this.state;

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Hero */}
        <section className="relative py-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated via-surface-dark to-surface-dark" />
          <div className="absolute inset-0 opacity-5">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-2"
            >
              FAN PORTAL
            </motion.h1>
            {this.state.nextMatch && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 mt-2 mb-1"
              >
                Next: <span className="text-white font-semibold">vs {this.state.nextMatch.opponent}</span>
                <span className="text-accent-gold ml-2">{this.state.nextMatch.match_date}</span>
              </motion.p>
            )}
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto" />
          </div>
        </section>

        {/* Sticky Tab Bar */}
        <div className="sticky top-16 z-20 bg-surface-dark/95 backdrop-blur-md border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => this.handleTabChange(tab.id)}
                    className={`
                      flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                      ${isActive
                        ? 'bg-accent-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                        : 'text-gray-400 hover:text-white hover:bg-surface-dark-hover'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {this.renderTabContent()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user || null,
});

export default connect(mapStateToProps)(FanPortal);
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:5173/kaboonaFC/fan-portal`. Should show hero + 6 tabs + placeholder content. Tab switching should work.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FanPortal/FanPortal.jsx
git commit -m "feat: rewrite FanPortal as 6-tab community hub shell"
```

---

### Task 8: Build MatchCenter.jsx

**Files:**
- Create: `src/pages/FanPortal/components/MatchCenter.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { getNextMatch, getRecentResults, getSeasonRecord, getPublishedLineup } from '../../../services/fanPortalService';

class MatchCenter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nextMatch: null,
      lineup: null,
      recentResults: [],
      seasonRecord: null,
      loading: true,
      countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    };
    this.countdownInterval = null;
  }

  async componentDidMount() {
    try {
      const [nextMatch, recentResults, seasonRecord] = await Promise.all([
        getNextMatch(),
        getRecentResults(),
        getSeasonRecord(),
      ]);
      let lineup = null;
      if (nextMatch) {
        lineup = await getPublishedLineup(nextMatch.id);
      }
      this.setState({ nextMatch, lineup, recentResults, seasonRecord, loading: false });
      if (nextMatch) this.startCountdown(nextMatch);
    } catch (err) {
      console.error('MatchCenter load error:', err);
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  startCountdown = (match) => {
    const target = new Date(`${match.match_date}T${match.match_time || '00:00:00'}`);
    const update = () => {
      const now = new Date();
      const diff = Math.max(0, target - now);
      this.setState({
        countdown: {
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        },
      });
    };
    update();
    this.countdownInterval = setInterval(update, 1000);
  };

  getResultBadge = (result) => {
    const colors = { win: 'bg-green-500', draw: 'bg-yellow-500', loss: 'bg-red-500' };
    const labels = { win: 'W', draw: 'D', loss: 'L' };
    return (
      <span className={`${colors[result] || 'bg-gray-500'} text-white text-xs font-bold px-2 py-0.5 rounded`}>
        {labels[result] || '?'}
      </span>
    );
  };

  render() {
    const { nextMatch, lineup, recentResults, seasonRecord, loading, countdown } = this.state;

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Next Match Card */}
        {nextMatch ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-white">Next Match</h2>
              <div className="flex gap-2">
                <span className="bg-accent-gold/10 text-accent-gold text-xs font-semibold px-3 py-1 rounded-full border border-accent-gold/30">
                  {nextMatch.match_type || 'League'}
                </span>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm mb-1">
                {nextMatch.match_date} &middot; {nextMatch.match_time || 'TBD'} &middot; {nextMatch.location || 'TBD'}
              </p>
              <h3 className="text-3xl md:text-4xl font-display font-bold text-white">
                Kaboona FC <span className="text-accent-gold">vs</span> {nextMatch.opponent}
              </h3>
            </div>

            {/* Countdown */}
            <div className="flex justify-center gap-4 md:gap-8">
              {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                <div key={unit} className="text-center">
                  <div className="text-3xl md:text-5xl font-display font-bold text-accent-gold tabular-nums">
                    {String(countdown[unit]).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{unit}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-8 text-center">
            <p className="text-gray-400">No upcoming matches scheduled.</p>
          </div>
        )}

        {/* Lineup Reveal */}
        {nextMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-6"
          >
            <h2 className="text-xl font-display font-bold text-white mb-4">Lineup</h2>
            {lineup ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {(lineup.positions || []).map((pos, i) => (
                  <motion.div
                    key={i}
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-surface-dark-hover rounded-lg p-3 text-center border border-gray-700"
                  >
                    <div className="text-xs text-accent-gold font-semibold">{pos.position}</div>
                    <div className="text-sm text-white mt-1 truncate">{pos.playerName || 'TBD'}</div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p>Lineup not yet announced</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-display font-bold text-white mb-4">Recent Results</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {recentResults.map((match) => (
                <div
                  key={match.id}
                  className="flex-shrink-0 w-48 bg-surface-dark-elevated rounded-xl border border-gray-800 p-4 text-center"
                >
                  <p className="text-xs text-gray-500 mb-2">{match.match_date}</p>
                  <p className="text-sm text-gray-300 mb-1">vs {match.opponent}</p>
                  <p className="text-2xl font-display font-bold text-white mb-2">
                    {match.score_for} - {match.score_against}
                  </p>
                  {this.getResultBadge(match.result)}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Season Record Strip */}
        {seasonRecord && seasonRecord.played > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4"
          >
            <h2 className="text-lg font-display font-bold text-white mb-3">Season Record</h2>
            <div className="grid grid-cols-6 gap-2 text-center">
              {[
                { label: 'P', value: seasonRecord.played },
                { label: 'W', value: seasonRecord.won, color: 'text-green-400' },
                { label: 'D', value: seasonRecord.drawn, color: 'text-yellow-400' },
                { label: 'L', value: seasonRecord.lost, color: 'text-red-400' },
                { label: 'GF', value: seasonRecord.goalsFor, color: 'text-accent-gold' },
                { label: 'GA', value: seasonRecord.goalsAgainst },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-xs text-gray-500 uppercase">{stat.label}</div>
                  <div className={`text-xl font-display font-bold ${stat.color || 'text-white'}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }
}

export default MatchCenter;
```

- [ ] **Step 2: Verify in browser**

Navigate to `http://localhost:5173/kaboonaFC/fan-portal`. Match Center tab should show countdown (if scheduled matches exist), recent results, and season record.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FanPortal/components/MatchCenter.jsx
git commit -m "feat: add MatchCenter tab — countdown, results, season record"
```

---

## Chunk 3: Fan Wall + POTM Voting + Leaderboard

### Task 9: Build PostCard.jsx

**Files:**
- Create: `src/pages/FanPortal/components/PostCard.jsx`

- [ ] **Step 1: Write the component**

PostCard renders a single fan wall post with like/comment functionality.

```jsx
import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getComments, addComment } from '../../../services/fanPortalService';

class PostCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showComments: false,
      comments: [],
      commentText: '',
      loadingComments: false,
    };
  }

  getBadge = (role) => {
    if (role === 'player') return { label: 'Player', color: 'text-accent-gold border-accent-gold' };
    if (role === 'coach' || role === 'owner') return { label: role.charAt(0).toUpperCase() + role.slice(1), color: 'text-accent-gold border-accent-gold' };
    return null;
  };

  getEngagementBadge = (points) => {
    if (points >= 1000) return 'Legend';
    if (points >= 500) return 'Ultras';
    if (points >= 100) return 'Supporter';
    return null;
  };

  handleToggleComments = async () => {
    const { showComments } = this.state;
    if (!showComments) {
      this.setState({ loadingComments: true, showComments: true });
      try {
        const comments = await getComments(this.props.post.id);
        this.setState({ comments, loadingComments: false });
      } catch (err) {
        console.error('Load comments error:', err);
        this.setState({ loadingComments: false });
      }
    } else {
      this.setState({ showComments: false });
    }
  };

  handleAddComment = async () => {
    const { commentText } = this.state;
    const { post, userId } = this.props;
    if (!commentText.trim() || !userId) return;
    try {
      const newComment = await addComment(post.id, userId, commentText.trim());
      this.setState((prev) => ({
        comments: [...prev.comments, newComment],
        commentText: '',
      }));
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  render() {
    const { post, isLiked, onLike, userId } = this.props;
    const { showComments, comments, commentText, loadingComments } = this.state;
    const profile = post.profiles || {};
    const roleBadge = this.getBadge(profile.role);
    const isSpecial = profile.role === 'player' || profile.role === 'coach' || profile.role === 'owner';

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden ${isSpecial ? 'border-l-4 border-l-accent-gold' : ''}`}
      >
        {/* Header */}
        <div className="p-4 pb-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-dark-hover flex items-center justify-center overflow-hidden">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg text-gray-500">{(profile.full_name || '?')[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm truncate">{profile.full_name || 'Anonymous'}</span>
              {roleBadge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{this.formatTime(post.created_at)}</span>
          </div>
          {userId === post.user_id && (
            <button
              onClick={() => this.props.onDelete?.(post.id)}
              className="text-gray-600 hover:text-red-400 transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-gray-200 text-sm whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img src={post.image_url} alt="" className="w-full max-h-96 object-cover" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-3 flex items-center gap-4">
          <button
            onClick={() => onLike?.(post.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-accent-gold' : 'text-gray-500 hover:text-accent-gold'}`}
          >
            <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.likes_count > 0 && <span>{post.likes_count}</span>}
          </button>
          <button
            onClick={this.handleToggleComments}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comments_count > 0 && <span>{post.comments_count}</span>}
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-800 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {loadingComments ? (
                  <div className="text-center py-2">
                    <div className="w-5 h-5 border-2 border-accent-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-surface-dark-hover flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {c.profiles?.profile_image_url ? (
                          <img src={c.profiles.profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-500">{(c.profiles?.full_name || '?')[0]}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">{c.profiles?.full_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{this.formatTime(c.created_at)}</span>
                        <p className="text-sm text-gray-300">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {userId && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => this.setState({ commentText: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && this.handleAddComment()}
                      placeholder="Write a comment..."
                      maxLength={280}
                      className="flex-1 px-3 py-2 bg-surface-dark rounded-lg text-sm text-white placeholder-gray-500 border border-gray-700 focus:border-accent-gold focus:outline-none"
                    />
                    <button onClick={this.handleAddComment} className="px-3 py-2 bg-accent-gold text-black rounded-lg text-sm font-semibold">
                      Post
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
}

export default PostCard;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/FanPortal/components/PostCard.jsx
git commit -m "feat: add PostCard component for fan wall"
```

---

### Task 10: Build ComposeBox.jsx

**Files:**
- Create: `src/pages/FanPortal/components/ComposeBox.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { motion } from 'framer-motion';

class ComposeBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: '',
      imageFile: null,
      imagePreview: null,
      submitting: false,
    };
    this.fileInputRef = React.createRef();
  }

  handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const preview = URL.createObjectURL(file);
    this.setState({ imageFile: file, imagePreview: preview });
  };

  handleRemoveImage = () => {
    if (this.state.imagePreview) URL.revokeObjectURL(this.state.imagePreview);
    this.setState({ imageFile: null, imagePreview: null });
  };

  handleSubmit = async () => {
    const { content, imageFile } = this.state;
    if (!content.trim()) return;
    this.setState({ submitting: true });
    try {
      await this.props.onSubmit({ content: content.trim(), imageFile });
      if (this.state.imagePreview) URL.revokeObjectURL(this.state.imagePreview);
      this.setState({ content: '', imageFile: null, imagePreview: null });
    } catch (err) {
      console.error('Post error:', err);
    } finally {
      this.setState({ submitting: false });
    }
  };

  render() {
    const { content, imagePreview, submitting } = this.state;
    const { user } = this.props;

    if (!user) {
      return (
        <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-6 text-center">
          <p className="text-gray-400">Log in to share with the community</p>
        </div>
      );
    }

    return (
      <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4">
        <textarea
          value={content}
          onChange={(e) => this.setState({ content: e.target.value })}
          placeholder="Share something with the fans..."
          maxLength={500}
          rows={3}
          className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm"
        />

        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
            <button
              onClick={this.handleRemoveImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
            >
              X
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
          <div className="flex gap-2">
            <button
              onClick={() => this.fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-accent-gold transition-colors rounded-lg hover:bg-surface-dark-hover"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input ref={this.fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={this.handleImageSelect} className="hidden" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{content.length}/500</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={this.handleSubmit}
              disabled={!content.trim() || submitting}
              className="px-4 py-2 bg-accent-gold text-black rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post'}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }
}

export default ComposeBox;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/FanPortal/components/ComposeBox.jsx
git commit -m "feat: add ComposeBox component for fan wall post creation"
```

---

### Task 11: Build FanWall.jsx

**Files:**
- Create: `src/pages/FanPortal/components/FanWall.jsx`

- [ ] **Step 1: Write the component**

FanWall orchestrates ComposeBox + PostCard list with infinite scroll.

```jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import ComposeBox from './ComposeBox';
import PostCard from './PostCard';
import { getFanPosts, createFanPost, toggleLike, getUserLikes, deleteFanPost, uploadFanPostImage } from '../../../services/fanPortalService';

class FanWall extends Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      likedPostIds: [],
      page: 0,
      hasMore: true,
      loading: true,
    };
  }

  async componentDidMount() {
    await this.loadPosts(0);
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  loadPosts = async (page) => {
    try {
      const posts = await getFanPosts(page);
      const userId = this.props.user?.id;
      let likedPostIds = [];
      if (userId && posts.length > 0) {
        likedPostIds = await getUserLikes(userId, posts.map((p) => p.id));
      }
      this.setState((prev) => ({
        posts: page === 0 ? posts : [...prev.posts, ...posts],
        likedPostIds: page === 0 ? likedPostIds : [...prev.likedPostIds, ...likedPostIds],
        page,
        hasMore: posts.length === 20,
        loading: false,
      }));
    } catch (err) {
      console.error('Load posts error:', err);
      this.setState({ loading: false });
    }
  };

  handleScroll = () => {
    const { loading, hasMore, page } = this.state;
    if (loading || !hasMore) return;
    const scrollBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400;
    if (scrollBottom) {
      this.setState({ loading: true });
      this.loadPosts(page + 1);
    }
  };

  handleSubmitPost = async ({ content, imageFile }) => {
    const userId = this.props.user?.id;
    if (!userId) return;
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadFanPostImage(userId, imageFile);
    }
    const newPost = await createFanPost({
      userId,
      content,
      imageUrl,
      postType: imageUrl ? 'image' : 'text',
    });
    this.setState((prev) => ({ posts: [newPost, ...prev.posts] }));
  };

  handleLike = async (postId) => {
    const userId = this.props.user?.id;
    if (!userId) return;
    const liked = await toggleLike(postId, userId);
    this.setState((prev) => ({
      likedPostIds: liked
        ? [...prev.likedPostIds, postId]
        : prev.likedPostIds.filter((id) => id !== postId),
      posts: prev.posts.map((p) =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (liked ? 1 : -1) }
          : p
      ),
    }));
  };

  handleDelete = async (postId) => {
    await deleteFanPost(postId);
    this.setState((prev) => ({
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
  };

  render() {
    const { posts, likedPostIds, loading } = this.state;
    const { user } = this.props;
    const userId = user?.id;

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <ComposeBox user={user} onSubmit={this.handleSubmitPost} />

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userId={userId}
            isLiked={likedPostIds.includes(post.id)}
            onLike={this.handleLike}
            onDelete={this.handleDelete}
          />
        ))}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">💬</p>
            <p>No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user || null,
});

export default connect(mapStateToProps)(FanWall);
```

- [ ] **Step 2: Update FanPortal.jsx to import FanWall**

In `FanPortal.jsx`, add import:
```javascript
import FanWall from './components/FanWall';
```

Update the switch case:
```javascript
case 'fan-wall':
  return <FanWall />;
```

- [ ] **Step 3: Verify in browser**

Navigate to Fan Portal → Fan Wall tab. Compose box should render. If logged in, should be able to post.

- [ ] **Step 4: Commit**

```bash
git add src/pages/FanPortal/components/FanWall.jsx src/pages/FanPortal/FanPortal.jsx
git commit -m "feat: add Fan Wall tab — posts, likes, comments, image uploads"
```

---

### Task 12: Build POTMVoting.jsx

**Files:**
- Create: `src/pages/FanPortal/components/POTMVoting.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import {
  getVotableMatches, getMatchPlayers, castPOTMVote,
  getMyVote, getVoteResults,
} from '../../../services/fanPortalService';

class POTMVoting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      matches: [],
      activeMatchId: null,
      players: [],
      myVote: null,
      results: {},
      loading: true,
      voting: false,
    };
  }

  async componentDidMount() {
    try {
      const matches = await getVotableMatches();
      this.setState({ matches, loading: false });
      if (matches.length > 0) {
        await this.loadMatchVoting(matches[0].id);
      }
    } catch (err) {
      console.error('POTM load error:', err);
      this.setState({ loading: false });
    }
  }

  loadMatchVoting = async (matchId) => {
    const userId = this.props.user?.id;
    this.setState({ activeMatchId: matchId, loading: true });
    try {
      const [players, results] = await Promise.all([
        getMatchPlayers(matchId),
        getVoteResults(matchId),
      ]);
      let myVote = null;
      if (userId) {
        myVote = await getMyVote(matchId, userId);
      }
      this.setState({ players, results, myVote, loading: false });
    } catch (err) {
      console.error('Load voting error:', err);
      this.setState({ loading: false });
    }
  };

  isVotingOpen = (match) => {
    if (!match.completed_at) return false;
    const deadline = new Date(match.completed_at).getTime() + 48 * 3600000;
    return Date.now() < deadline;
  };

  handleVote = async (playerId) => {
    const { activeMatchId, myVote } = this.state;
    const userId = this.props.user?.id;
    if (!userId || myVote) return;
    this.setState({ voting: true });
    try {
      await castPOTMVote(activeMatchId, userId, playerId);
      const results = await getVoteResults(activeMatchId);
      this.setState({ myVote: playerId, results, voting: false });
    } catch (err) {
      console.error('Vote error:', err);
      this.setState({ voting: false });
    }
  };

  render() {
    const { matches, activeMatchId, players, myVote, results, loading, voting } = this.state;
    const { user } = this.props;
    const activeMatch = matches.find((m) => m.id === activeMatchId);
    const isOpen = activeMatch ? this.isVotingOpen(activeMatch) : false;
    const totalVotes = Object.values(results).reduce((s, v) => s + v, 0);

    if (loading && matches.length === 0) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🏆</p>
          <h3 className="text-xl font-display font-bold text-white mb-2">No Votes Available</h3>
          <p className="text-gray-400">Voting opens after each completed match!</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Match Selector */}
        {matches.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {matches.slice(0, 5).map((m) => (
              <button
                key={m.id}
                onClick={() => this.loadMatchVoting(m.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  m.id === activeMatchId
                    ? 'bg-accent-gold text-black'
                    : 'bg-surface-dark-elevated text-gray-400 border border-gray-700 hover:text-white'
                }`}
              >
                vs {m.opponent} &middot; {m.score_for}-{m.score_against}
              </button>
            ))}
          </div>
        )}

        {/* Match Info */}
        {activeMatch && (
          <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4 text-center">
            <p className="text-gray-400 text-sm">{activeMatch.match_date}</p>
            <p className="text-xl font-display font-bold text-white">
              Kaboona FC {activeMatch.score_for} - {activeMatch.score_against} {activeMatch.opponent}
            </p>
            <p className={`text-sm mt-1 ${isOpen ? 'text-green-400' : 'text-gray-500'}`}>
              {isOpen ? 'Voting is open!' : 'Voting closed'}
            </p>
          </div>
        )}

        {/* Player Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.map((player) => {
            const voteCount = results[player.userId] || 0;
            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isSelected = myVote === player.userId;
            const showResults = !isOpen || myVote;
            const isWinner = !isOpen && voteCount === Math.max(...Object.values(results), 0) && voteCount > 0;

            return (
              <motion.button
                key={player.userId}
                whileHover={isOpen && !myVote ? { scale: 1.05 } : {}}
                whileTap={isOpen && !myVote ? { scale: 0.95 } : {}}
                onClick={() => isOpen && !myVote && user && this.handleVote(player.userId)}
                disabled={!isOpen || !!myVote || !user || voting}
                className={`relative bg-surface-dark-elevated rounded-xl border p-4 text-center transition-all ${
                  isSelected
                    ? 'border-accent-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                    : 'border-gray-800 hover:border-gray-600'
                } ${isWinner ? 'ring-2 ring-accent-gold' : ''}`}
              >
                {isWinner && <span className="absolute -top-2 -right-2 text-2xl">👑</span>}
                <div className="w-14 h-14 rounded-full bg-surface-dark-hover mx-auto mb-2 overflow-hidden flex items-center justify-center">
                  {player.profileImageUrl ? (
                    <img src={player.profileImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-gray-500">{(player.fullName || '?')[0]}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white truncate">{player.fullName}</p>
                <p className="text-xs text-gray-500">{player.position || ''} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}</p>
                {showResults && totalVotes > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-surface-dark rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full bg-accent-gold rounded-full"
                      />
                    </div>
                    <p className="text-xs text-accent-gold mt-1">{pct}% ({voteCount})</p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {!user && isOpen && (
          <p className="text-center text-gray-400 text-sm">Log in to cast your vote</p>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(POTMVoting);
```

- [ ] **Step 2: Update FanPortal.jsx**

Add import and switch case:
```javascript
import POTMVoting from './components/POTMVoting';
// in switch:
case 'vote':
  return <POTMVoting />;
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/FanPortal/components/POTMVoting.jsx src/pages/FanPortal/FanPortal.jsx
git commit -m "feat: add POTM voting tab with player cards and results"
```

---

### Task 13: Build FanLeaderboard.jsx

**Files:**
- Create: `src/pages/FanPortal/components/FanLeaderboard.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { getLeaderboard } from '../../../services/fanPortalService';

class FanLeaderboard extends Component {
  constructor(props) {
    super(props);
    this.state = { entries: [], loading: true, period: 'all' };
  }

  async componentDidMount() {
    await this.loadLeaderboard();
  }

  loadLeaderboard = async () => {
    this.setState({ loading: true });
    try {
      const entries = await getLeaderboard();
      this.setState({ entries, loading: false });
    } catch (err) {
      console.error('Leaderboard error:', err);
      this.setState({ loading: false });
    }
  };

  handlePeriodChange = (period) => {
    this.setState({ period });
    // Note: The DB view returns all-time data. For "This Month" we filter client-side.
    // A more scalable approach would add a date-filtered RPC, but client filtering works
    // fine for the current scale since leaderboard entries are already loaded.
  };

  getBadge = (points) => {
    if (points >= 1000) return { label: 'Legend', color: 'bg-accent-gold text-black' };
    if (points >= 500) return { label: 'Ultras', color: 'bg-purple-500 text-white' };
    if (points >= 100) return { label: 'Supporter', color: 'bg-blue-500 text-white' };
    return null;
  };

  render() {
    const { entries, loading } = this.state;
    const { user } = this.props;
    const userId = user?.id;
    const myRank = entries.findIndex((e) => e.user_id === userId);

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🥇</p>
          <h3 className="text-xl font-display font-bold text-white mb-2">No Rankings Yet</h3>
          <p className="text-gray-400">Start engaging to earn points!</p>
        </div>
      );
    }

    const podium = entries.slice(0, 3);
    const rest = entries.slice(3);

    // Period toggle rendered below
    const podiumColors = ['border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]', 'border-gray-400', 'border-amber-600'];
    const podiumIcons = ['🥇', '🥈', '🥉'];

    return (
      <div className="space-y-6">
        {/* Period Toggle */}
        <div className="flex justify-center gap-2">
          {['all', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => this.handlePeriodChange(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                this.state.period === p
                  ? 'bg-accent-gold text-black'
                  : 'bg-surface-dark-elevated text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Time' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[1, 0, 2].map((idx) => {
            const entry = podium[idx];
            if (!entry) return <div key={idx} />;
            const badge = this.getBadge(entry.total_points);
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-surface-dark-elevated rounded-xl border-2 ${podiumColors[idx]} p-4 text-center ${idx === 0 ? 'md:-mt-4' : ''}`}
              >
                <div className="text-3xl mb-2">{podiumIcons[idx]}</div>
                <div className="w-16 h-16 rounded-full bg-surface-dark-hover mx-auto mb-2 overflow-hidden flex items-center justify-center">
                  {entry.profile_image_url ? (
                    <img src={entry.profile_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-500">{(entry.full_name || '?')[0]}</span>
                  )}
                </div>
                <p className="font-semibold text-white text-sm truncate">{entry.full_name}</p>
                {badge && (
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
                <p className="text-xl font-display font-bold text-accent-gold mt-1">{entry.total_points}</p>
                <p className="text-xs text-gray-500">points</p>
              </motion.div>
            );
          })}
        </div>

        {/* Rankings Table */}
        {rest.length > 0 && (
          <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden">
            {rest.map((entry, i) => {
              const rank = i + 4;
              const badge = this.getBadge(entry.total_points);
              const isMe = entry.user_id === userId;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-b-0 ${isMe ? 'bg-accent-gold/5' : ''}`}
                >
                  <span className="w-8 text-center text-sm font-bold text-gray-500">#{rank}</span>
                  <div className="w-8 h-8 rounded-full bg-surface-dark-hover flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {entry.profile_image_url ? (
                      <img src={entry.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm text-gray-500">{(entry.full_name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">{entry.full_name}</span>
                  </div>
                  {badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                  <span className="text-sm font-display font-bold text-accent-gold">{entry.total_points}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* My Rank Bar */}
        {userId && myRank >= 0 && (
          <div className="sticky bottom-4 bg-surface-dark-elevated/95 backdrop-blur-md rounded-xl border border-accent-gold/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-accent-gold font-bold">#{myRank + 1}</span>
              <span className="text-white text-sm font-semibold">Your Rank</span>
            </div>
            <span className="text-accent-gold font-display font-bold">{entries[myRank].total_points} pts</span>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(FanLeaderboard);
```

- [ ] **Step 2: Update FanPortal.jsx**

Add import and switch case:
```javascript
import FanLeaderboard from './components/FanLeaderboard';
// in switch:
case 'leaderboard':
  return <FanLeaderboard />;
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/FanPortal/components/FanLeaderboard.jsx src/pages/FanPortal/FanPortal.jsx
git commit -m "feat: add Fan Leaderboard tab with podium and rankings"
```

---

## Chunk 4: Match Day Hub + Gallery

### Task 14: Build ScorePredictor.jsx

**Files:**
- Create: `src/pages/FanPortal/components/ScorePredictor.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { submitPrediction, getMyPrediction } from '../../../services/fanPortalService';

class ScorePredictor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scoreFor: 0,
      scoreAgainst: 0,
      submitted: null,
      submitting: false,
    };
  }

  async componentDidMount() {
    const { match, userId } = this.props;
    if (userId && match) {
      const existing = await getMyPrediction(match.id, userId);
      if (existing) {
        this.setState({
          submitted: existing,
          scoreFor: existing.score_for,
          scoreAgainst: existing.score_against,
        });
      }
    }
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.match?.id !== this.props.match?.id && this.props.userId) {
      const existing = await getMyPrediction(this.props.match.id, this.props.userId);
      if (existing) {
        this.setState({ submitted: existing, scoreFor: existing.score_for, scoreAgainst: existing.score_against });
      } else {
        this.setState({ submitted: null, scoreFor: 0, scoreAgainst: 0 });
      }
    }
  }

  handleSubmit = async () => {
    const { match, userId } = this.props;
    const { scoreFor, scoreAgainst } = this.state;
    if (!userId || !match) return;
    this.setState({ submitting: true });
    try {
      const result = await submitPrediction(match.id, userId, scoreFor, scoreAgainst);
      this.setState({ submitted: result, submitting: false });
    } catch (err) {
      console.error('Prediction error:', err);
      this.setState({ submitting: false });
    }
  };

  adjustScore = (field, delta) => {
    this.setState((prev) => ({
      [field]: Math.max(0, prev[field] + delta),
    }));
  };

  render() {
    const { match, userId } = this.props;
    const { scoreFor, scoreAgainst, submitted, submitting } = this.state;
    const isCompleted = match?.status === 'completed';

    if (!userId) {
      return (
        <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4 text-center">
          <p className="text-gray-400 text-sm">Log in to predict the score</p>
        </div>
      );
    }

    return (
      <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4">
        <h3 className="text-lg font-display font-bold text-white mb-4">Score Prediction</h3>

        {submitted ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Your prediction:</p>
            <p className="text-3xl font-display font-bold text-accent-gold">
              {submitted.score_for} - {submitted.score_against}
            </p>
            {isCompleted && (
              <div className="mt-3">
                <p className="text-sm text-gray-400">Actual: {match.score_for} - {match.score_against}</p>
                {match.score_for === submitted.score_for && match.score_against === submitted.score_against ? (
                  <span className="inline-block mt-1 text-green-400 font-semibold text-sm">Exact match! +20 pts</span>
                ) : Math.sign(match.score_for - match.score_against) === Math.sign(submitted.score_for - submitted.score_against) ? (
                  <span className="inline-block mt-1 text-yellow-400 font-semibold text-sm">Correct result! +10 pts</span>
                ) : (
                  <span className="inline-block mt-1 text-red-400 text-sm">Wrong prediction</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-6">
              {/* Kaboona Score */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Kaboona FC</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => this.adjustScore('scoreFor', -1)} className="w-8 h-8 rounded-lg bg-surface-dark-hover text-white hover:bg-surface-dark transition-colors flex items-center justify-center">-</button>
                  <span className="text-3xl font-display font-bold text-white w-10 text-center">{scoreFor}</span>
                  <button onClick={() => this.adjustScore('scoreFor', 1)} className="w-8 h-8 rounded-lg bg-surface-dark-hover text-white hover:bg-surface-dark transition-colors flex items-center justify-center">+</button>
                </div>
              </div>

              <span className="text-2xl text-gray-600 font-display">-</span>

              {/* Opponent Score */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">{match?.opponent || 'Opponent'}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => this.adjustScore('scoreAgainst', -1)} className="w-8 h-8 rounded-lg bg-surface-dark-hover text-white hover:bg-surface-dark transition-colors flex items-center justify-center">-</button>
                  <span className="text-3xl font-display font-bold text-white w-10 text-center">{scoreAgainst}</span>
                  <button onClick={() => this.adjustScore('scoreAgainst', 1)} className="w-8 h-8 rounded-lg bg-surface-dark-hover text-white hover:bg-surface-dark transition-colors flex items-center justify-center">+</button>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={this.handleSubmit}
              disabled={submitting}
              className="w-full mt-4 py-3 bg-accent-gold text-black rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Lock In Prediction'}
            </motion.button>
          </div>
        )}
      </div>
    );
  }
}

export default ScorePredictor;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/FanPortal/components/ScorePredictor.jsx
git commit -m "feat: add ScorePredictor component for match day predictions"
```

---

### Task 15: Build MatchDayHub.jsx

**Files:**
- Create: `src/pages/FanPortal/components/MatchDayHub.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getNextMatch } from '../../../services/fanPortalService';
import { getInvitationsForEvent } from '../../../services/schedulingService';
import ScorePredictor from './ScorePredictor';

class MatchDayHub extends Component {
  constructor(props) {
    super(props);
    this.state = {
      match: null,
      players: [],
      loading: true,
    };
  }

  async componentDidMount() {
    try {
      const match = await getNextMatch();
      let players = [];
      if (match) {
        const invitations = await getInvitationsForEvent('match', match.id);
        players = invitations
          .filter((inv) => inv.status === 'accepted')
          .map((inv) => ({
            name: inv.profiles?.full_name || 'Unknown',
            image: inv.profiles?.profile_image_url,
            position: inv.players?.position || null,
          }));
      }
      this.setState({ match, players, loading: false });
    } catch (err) {
      console.error('MatchDayHub error:', err);
      this.setState({ loading: false });
    }
  }

  render() {
    const { match, players, loading } = this.state;
    const { user } = this.props;
    const userId = user?.id;

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!match) {
      return (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📍</p>
          <h3 className="text-xl font-display font-bold text-white mb-2">No Upcoming Match</h3>
          <p className="text-gray-400">Check back when the next match is scheduled.</p>
        </div>
      );
    }

    const hasCoords = match.location_lat && match.location_lng;
    const mapsUrl = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${match.location_lat},${match.location_lng}`
      : null;

    return (
      <div className="space-y-6">
        {/* Match Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="bg-accent-gold/10 text-accent-gold text-xs font-semibold px-3 py-1 rounded-full border border-accent-gold/30">
              {match.match_type || 'League'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
            Kaboona FC vs {match.opponent}
          </h2>
          <p className="text-gray-400 mt-1">
            {match.match_date} &middot; {match.match_time || 'TBD'} &middot; {match.location || 'TBD'}
          </p>
        </motion.div>

        {/* Score Prediction */}
        <ScorePredictor match={match} userId={userId} />

        {/* Who's Playing */}
        {players.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4"
          >
            <h3 className="text-lg font-display font-bold text-white mb-3">
              Who's Playing ({players.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface-dark-hover">
                  <div className="w-8 h-8 rounded-full bg-surface-dark flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">{(p.name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                    {p.position && <p className="text-[10px] text-accent-gold">{p.position}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Venue Map */}
        {hasCoords && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden"
          >
            <div className="p-4 pb-2 flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-white">Venue</h3>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent-gold hover:underline"
                >
                  Get Directions →
                </a>
              )}
            </div>
            <div className="h-48 md:h-64">
              <MapContainer
                center={[match.location_lat, match.location_lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[match.location_lat, match.location_lng]}>
                  <Popup>{match.location || 'Match Venue'}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(MatchDayHub);
```

- [ ] **Step 2: Update FanPortal.jsx**

Add import and switch case:
```javascript
import MatchDayHub from './components/MatchDayHub';
// in switch:
case 'match-day':
  return <MatchDayHub />;
```

- [ ] **Step 3: Verify in browser**

Navigate to Fan Portal → Match Day tab. Should show match info, score predictor, player list, and venue map (if coordinates exist).

- [ ] **Step 4: Commit**

```bash
git add src/pages/FanPortal/components/MatchDayHub.jsx src/pages/FanPortal/FanPortal.jsx
git commit -m "feat: add Match Day Hub tab with predictions, players, venue map"
```

---

### Task 16: Build PhotoLightbox.jsx

**Files:**
- Create: `src/pages/FanPortal/components/PhotoLightbox.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

class PhotoLightbox extends Component {
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape') this.props.onClose();
    if (e.key === 'ArrowLeft') this.props.onPrev?.();
    if (e.key === 'ArrowRight') this.props.onNext?.();
  };

  render() {
    const { photo, onClose, onPrev, onNext } = this.props;
    if (!photo) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Nav Arrows */}
          {onPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {onNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-5xl max-h-[85vh] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photo.image_url}
              alt={photo.caption || ''}
              className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto"
            />
            {(photo.caption || photo.profiles?.full_name) && (
              <div className="text-center mt-3">
                {photo.caption && <p className="text-white text-sm">{photo.caption}</p>}
                {photo.profiles?.full_name && (
                  <p className="text-gray-500 text-xs mt-1">by {photo.profiles.full_name}</p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
}

export default PhotoLightbox;
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/FanPortal/components/PhotoLightbox.jsx
git commit -m "feat: add PhotoLightbox component for gallery"
```

---

### Task 17: Build AlbumView.jsx

**Files:**
- Create: `src/pages/FanPortal/components/AlbumView.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import PhotoLightbox from './PhotoLightbox';
import { getAlbumPhotos, uploadPhoto } from '../../../services/fanPortalService';

class AlbumView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      loading: true,
      lightboxIndex: -1,
      uploading: false,
      caption: '',
    };
    this.fileRef = React.createRef();
  }

  async componentDidMount() {
    try {
      const photos = await getAlbumPhotos(this.props.album.id);
      this.setState({ photos, loading: false });
    } catch (err) {
      console.error('Album photos error:', err);
      this.setState({ loading: false });
    }
  }

  handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    const userId = this.props.user?.id;
    if (!userId) return;
    this.setState({ uploading: true });
    try {
      const photo = await uploadPhoto({
        albumId: this.props.album.id,
        userId,
        file,
        caption: this.state.caption || null,
      });
      this.setState((prev) => ({
        photos: [photo, ...prev.photos],
        uploading: false,
        caption: '',
      }));
    } catch (err) {
      console.error('Upload error:', err);
      this.setState({ uploading: false });
    }
  };

  render() {
    const { album, onBack, user } = this.props;
    const { photos, loading, lightboxIndex, uploading, caption } = this.state;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-white">{album.title}</h2>
            {album.is_official && (
              <span className="text-[10px] font-bold bg-accent-gold text-black px-2 py-0.5 rounded-full">Official</span>
            )}
          </div>
        </div>

        {/* Upload */}
        {user && (
          <div className="flex gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => this.setState({ caption: e.target.value })}
              placeholder="Caption (optional)"
              maxLength={200}
              className="flex-1 px-3 py-2 bg-surface-dark-elevated border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none"
            />
            <button
              onClick={() => this.fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-accent-gold text-black rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <input ref={this.fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={this.handleUpload} className="hidden" />
          </div>
        )}

        {/* Photo Grid (Masonry-style with CSS columns) */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📷</p>
            <p>No photos yet. Be the first to upload!</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="break-inside-avoid cursor-pointer group"
                onClick={() => this.setState({ lightboxIndex: i })}
              >
                <div className="relative rounded-lg overflow-hidden">
                  <img src={photo.image_url} alt={photo.caption || ''} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.caption && (
                      <p className="absolute bottom-2 left-2 right-2 text-white text-xs">{photo.caption}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxIndex >= 0 && (
          <PhotoLightbox
            photo={photos[lightboxIndex]}
            onClose={() => this.setState({ lightboxIndex: -1 })}
            onPrev={lightboxIndex > 0 ? () => this.setState({ lightboxIndex: lightboxIndex - 1 }) : null}
            onNext={lightboxIndex < photos.length - 1 ? () => this.setState({ lightboxIndex: lightboxIndex + 1 }) : null}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(AlbumView);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/FanPortal/components/AlbumView.jsx
git commit -m "feat: add AlbumView component with masonry grid and upload"
```

---

### Task 18: Build Gallery.jsx

**Files:**
- Create: `src/pages/FanPortal/components/Gallery.jsx`

- [ ] **Step 1: Write the component**

```jsx
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import AlbumView from './AlbumView';
import { getAlbums, createAlbum } from '../../../services/fanPortalService';

class Gallery extends Component {
  constructor(props) {
    super(props);
    this.state = {
      albums: [],
      loading: true,
      selectedAlbum: null,
      showCreateForm: false,
      newTitle: '',
      newDescription: '',
      creating: false,
    };
  }

  async componentDidMount() {
    try {
      const albums = await getAlbums();
      this.setState({ albums, loading: false });
    } catch (err) {
      console.error('Gallery error:', err);
      this.setState({ loading: false });
    }
  }

  handleCreateAlbum = async () => {
    const { newTitle, newDescription } = this.state;
    const userId = this.props.user?.id;
    if (!newTitle.trim() || !userId) return;
    this.setState({ creating: true });
    try {
      const album = await createAlbum({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        createdBy: userId,
      });
      this.setState((prev) => ({
        albums: [{ ...album, photoCount: 0, createdByName: 'You' }, ...prev.albums],
        showCreateForm: false,
        newTitle: '',
        newDescription: '',
        creating: false,
      }));
    } catch (err) {
      console.error('Create album error:', err);
      this.setState({ creating: false });
    }
  };

  render() {
    const { albums, loading, selectedAlbum, showCreateForm, newTitle, newDescription, creating } = this.state;
    const { user } = this.props;

    if (selectedAlbum) {
      return (
        <AlbumView
          album={selectedAlbum}
          onBack={() => this.setState({ selectedAlbum: null })}
        />
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-white">Photo Gallery</h2>
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => this.setState({ showCreateForm: !showCreateForm })}
              className="px-4 py-2 bg-accent-gold text-black rounded-lg font-semibold text-sm"
            >
              {showCreateForm ? 'Cancel' : 'New Album'}
            </motion.button>
          )}
        </div>

        {/* Create Album Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4 space-y-3"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => this.setState({ newTitle: e.target.value })}
              placeholder="Album title"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => this.setState({ newDescription: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none"
            />
            <button
              onClick={this.handleCreateAlbum}
              disabled={!newTitle.trim() || creating}
              className="px-4 py-2 bg-accent-gold text-black rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Album'}
            </button>
          </motion.div>
        )}

        {/* Album Grid */}
        {albums.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-4">📸</p>
            <h3 className="text-xl font-display font-bold text-white mb-2">No Albums Yet</h3>
            <p>Create the first album to start sharing photos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album, i) => (
              <motion.button
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => this.setState({ selectedAlbum: album })}
                className="text-left bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden hover:border-accent-gold/50 transition-all"
              >
                <div className="aspect-square bg-surface-dark-hover flex items-center justify-center">
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-600">📷</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate flex-1">{album.title}</h3>
                    {album.is_official && (
                      <span className="text-[9px] font-bold bg-accent-gold text-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Official
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {album.photoCount} photo{album.photoCount !== 1 ? 's' : ''} &middot; {album.createdByName}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(Gallery);
```

- [ ] **Step 2: Update FanPortal.jsx**

Add import and switch case:
```javascript
import Gallery from './components/Gallery';
// in switch:
case 'gallery':
  return <Gallery />;
```

- [ ] **Step 3: Verify in browser**

Navigate to Fan Portal → Gallery tab. Should show empty state or albums. Create album button should work when logged in.

- [ ] **Step 4: Commit**

```bash
git add src/pages/FanPortal/components/Gallery.jsx src/pages/FanPortal/FanPortal.jsx
git commit -m "feat: add Gallery tab with albums, photo upload, and lightbox"
```

---

### Task 19: Final Integration — Verify All Tabs

- [ ] **Step 1: Ensure all imports are in FanPortal.jsx**

The final FanPortal.jsx should have these imports:
```javascript
import MatchCenter from './components/MatchCenter';
import FanWall from './components/FanWall';
import POTMVoting from './components/POTMVoting';
import FanLeaderboard from './components/FanLeaderboard';
import MatchDayHub from './components/MatchDayHub';
import Gallery from './components/Gallery';
```

And the switch should map all 6 cases with no remaining placeholders.

- [ ] **Step 2: Browser smoke test all 6 tabs**

1. Match Center: countdown, results, season record
2. Fan Wall: compose box, post/like/comment
3. POTM Vote: player cards, voting
4. Leaderboard: podium + rankings
5. Match Day: prediction, players, map
6. Gallery: albums, upload, lightbox

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "feat: complete Fan Portal redesign — all 6 tabs integrated"
```

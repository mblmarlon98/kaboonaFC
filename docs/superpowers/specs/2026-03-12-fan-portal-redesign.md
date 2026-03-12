# Fan Portal Redesign — Design Spec

## Overview

Replace the current Fan Portal (merch shop clone) with a 6-tab fan community hub. Move existing merch items into the Shop page.

## Prerequisite: Merge Merch into Shop

Move the 16 official merchandise items from FanPortal into Shop.jsx as a second section/tab alongside the existing affiliate products. Shop gets two sections: "Official Merch" (with cart) and "Football Gear" (affiliate links). Then the FanPortal page is completely rewritten.

## Page Structure

Dark theme, gold accents — consistent with existing design language (Oswald headings, Inter body, #D4AF37 gold, #0A0A0A surfaces).

**Hero**: Minimal — "FAN PORTAL" headline, next match teaser (opponent + countdown), then straight into tabs.

**Auth gating**: All tabs viewable by anyone. Posting, voting, uploading, predicting require login. Subtle "Log in to participate" prompt replaces action buttons for anon users.

**6 Tabs** with sticky tab bar:

| # | Tab | Description |
|---|-----|-------------|
| 1 | Match Center | Next match countdown, lineup reveal, recent results |
| 2 | Fan Wall | Social feed — posts, images, likes, comments |
| 3 | Vote | POTM voting after matches |
| 4 | Leaderboard | Fan rankings by engagement points |
| 5 | Match Day | Predictions, confirmed players, venue map |
| 6 | Gallery | Photo albums — official and fan-submitted |

---

## Tab 1: Match Center

**Components (top to bottom):**

1. **Next Match Card**
   - Opponent name, countdown timer (d/h/m/s with gold animated digits), date, time, venue
   - Home/Away badge, match type badge (League/Friendly)
   - Source: `matches` table, status = 'scheduled', ordered by date ASC, LIMIT 1

2. **Lineup Reveal**
   - Locked state: "Lineup not yet announced" with lock icon
   - Published state: animated card-flip reveal of starting XI as mini FIFA cards
   - Source: `formations` table where match_id = next match AND published = true

3. **Recent Results** (last 5 completed matches)
   - Horizontal scroll of compact result cards
   - Score, opponent, W/D/L color-coded badge
   - Source: `matches` where status = 'completed', ORDER BY match_date DESC LIMIT 5

4. **Season Record Strip**
   - Compact stat bar: P | W | D | L | GF | GA
   - Source: Supabase `matches` table (completed matches). Note: `src/data/matches.js` has historical static data — Season Record uses live DB only.

**New DB tables**: None. But requires adding `completed_at TIMESTAMPTZ` column to `matches` (used by POTM voting window).

---

## Tab 2: Fan Wall

Vertical social feed, card-based.

### New DB Tables

**`fan_posts`**
```sql
id UUID PK DEFAULT gen_random_uuid()
user_id UUID NOT NULL FK profiles(id) ON DELETE CASCADE
content TEXT NOT NULL CHECK (char_length(content) <= 500)
image_url TEXT
post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'match_reaction'))
match_id UUID FK matches(id) ON DELETE SET NULL
likes_count INTEGER DEFAULT 0
comments_count INTEGER DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()
```

**`fan_post_likes`**
```sql
id UUID PK DEFAULT gen_random_uuid()
post_id UUID NOT NULL FK fan_posts(id) ON DELETE CASCADE
user_id UUID NOT NULL FK profiles(id) ON DELETE CASCADE
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE (post_id, user_id)
```

**`fan_post_comments`**
```sql
id UUID PK DEFAULT gen_random_uuid()
post_id UUID NOT NULL FK fan_posts(id) ON DELETE CASCADE
user_id UUID NOT NULL FK profiles(id) ON DELETE CASCADE
content TEXT NOT NULL CHECK (char_length(content) <= 280)
created_at TIMESTAMPTZ DEFAULT NOW()
```

### RLS
- SELECT on all three: public (anyone can read)
- INSERT fan_posts/comments: authenticated users (user_id = auth.uid())
- INSERT fan_post_likes: authenticated (user_id = auth.uid())
- DELETE fan_posts/comments: own posts (user_id = auth.uid()) OR admin role
- DELETE fan_post_likes: own likes (user_id = auth.uid())

### Denormalization
- Likes/comments counts on fan_posts updated via DB triggers on insert/delete of likes/comments

### UI
- **Compose box** at top: text input, image upload button, optional match tag dropdown
- **Post card**: avatar, name, role badge (Player gold / Coach gold / Fan white), timestamp, content, image, like button + count, comment button + count
- **Player/Coach posts get a gold left border** to stand out
- **Comments**: expandable section, 3 shown initially, "View all X comments" to expand
- **Infinite scroll**: 20 posts per page, load more on scroll

### Image Uploads
- Supabase Storage bucket: `fan-uploads`
- Max 5MB, image types only (jpg, png, webp)
- Client-side resize to max 1200px width before upload

---

## Tab 3: POTM Vote

### Flow
1. Match completes (status = 'completed') → voting round auto-available
2. Show match card + all players from that match's formation/invitations
3. Fan taps a player card to vote (one vote per match per user)
4. Voting open for 48 hours after match completion
5. Results: animated bar chart, winner gets gold crown

### New DB Table

**`potm_votes`**
```sql
id UUID PK DEFAULT gen_random_uuid()
match_id UUID NOT NULL FK matches(id) ON DELETE CASCADE
voter_id UUID NOT NULL FK profiles(id) ON DELETE CASCADE
player_id UUID NOT NULL FK players(id) ON DELETE CASCADE
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE (match_id, voter_id)
```

### RLS
- SELECT: public
- INSERT: authenticated (voter_id = auth.uid()), enforce unique via constraint

### UI
- **Active Vote** (if any): prominent at top. Player cards in grid, tap to select, gold glow on selection. Vote counts hidden until closed.
- **Past Results**: list of completed votes. Winner card with crown + vote %, runners-up. Expandable full breakdown.
- **No Active Vote**: "Voting opens after each match!" + next match countdown.

### Voting Window Logic (client-side)
- `match.status === 'completed'` AND `match.completed_at + 48h > now()`
- **Requires new column**: `ALTER TABLE matches ADD COLUMN completed_at TIMESTAMPTZ;`
- `completeMatch()` in `schedulingService.js` must set `completed_at: new Date().toISOString()` when marking a match completed

### Player Source for Voting
- Primary: accepted `event_invitations` for the match (full squad who participated)
- Fallback: if no invitations exist, use published `formations` positions
- This ensures subs and non-starters can receive votes too

---

## Tab 4: Fan Leaderboard

### Points System

| Action | Points |
|--------|--------|
| Create a post | +5 |
| Comment on a post | +2 |
| Like a post | +1 |
| Vote for POTM | +3 |
| Submit score prediction | +5 |
| Correct score prediction | +20 |
| Correct result (wrong score) | +10 |
| Attend match (check-in) | +15 |

### Implementation
**DB View: `fan_leaderboard`** (SECURITY DEFINER — needs to read matches for prediction scoring):

Aggregates points from:
- `fan_posts` (count * 5)
- `fan_post_comments` (count * 2)
- `fan_post_likes` (count * 1)
- `potm_votes` (count * 3)
- `score_predictions` (count * 5, plus bonus: JOIN matches to compare predicted vs actual scores — +20 for exact match, +10 for correct W/D/L result)
- `attendance` (count * 15)

Grouped by user_id, joined with profiles for name/avatar.

### Required Indexes
- `fan_posts(user_id)`, `fan_posts(created_at DESC)`
- `fan_post_comments(post_id)`, `fan_post_comments(user_id)`
- `fan_post_likes(post_id, user_id)`
- `potm_votes(match_id)`, `potm_votes(voter_id)`
- `score_predictions(match_id)`, `score_predictions(user_id)`
- `gallery_photos(album_id)`, `gallery_photos(user_id)`

### UI
- **Top 3 podium**: gold/silver/bronze cards, avatar, name, points. #1 card larger with glow.
- **Full rankings table**: rank, avatar, name, points. Hover tooltip shows point breakdown.
- **"Your Rank" sticky bar** at bottom (logged-in users): position, points, gap to next rank.
- **Toggle**: "All Time" / "This Month"

### Badges (derived from points, no table)
- 100+ pts: "Supporter"
- 500+ pts: "Ultras"
- 1000+ pts: "Legend"

Badge displayed next to name on fan wall, comments, and leaderboard.

---

## Tab 5: Match Day Hub

### Components

1. **Match Info Header**: opponent, date, time, home/away, countdown if today

2. **Score Prediction**
   - Two number steppers (Kaboona score / Opponent score)
   - Submit → locked, shows "Your prediction: 3-1"
   - Locked at kickoff time
   - After match: shows result + whether prediction was correct

3. **Who's Playing**: accepted invitations for this match from `event_invitations`. Note: `event_invitations.player_id` FK references `profiles(id)`, not `players(id)`. Use the same two-query pattern from `schedulingService.getInvitationsForEvent()` — fetch invitations with profile data, then fetch player positions/jersey via `players.user_id`. Or use the `players_with_profiles` view joined by `user_id`.

4. **Venue & Directions**: Leaflet mini map with venue pin (react-leaflet already installed), "Get Directions" → Google Maps link

5. **Between matches**: shows next scheduled match. No matches → season stats summary.

### New DB Table

**`score_predictions`**
```sql
id UUID PK DEFAULT gen_random_uuid()
match_id UUID NOT NULL FK matches(id) ON DELETE CASCADE
user_id UUID NOT NULL FK profiles(id) ON DELETE CASCADE
score_for INTEGER NOT NULL CHECK (score_for >= 0)
score_against INTEGER NOT NULL CHECK (score_against >= 0)
created_at TIMESTAMPTZ DEFAULT NOW()
UNIQUE (match_id, user_id)
```

### RLS
- SELECT: `(user_id = auth.uid()) OR EXISTS (SELECT 1 FROM matches WHERE id = match_id AND status = 'completed')` — own predictions always visible, all predictions visible once match is completed (for the reveal)
- INSERT: authenticated (user_id = auth.uid()), only when match status = 'scheduled'

---

## Tab 6: Gallery

### New DB Tables

**`gallery_albums`**
```sql
id UUID PK DEFAULT gen_random_uuid()
title TEXT NOT NULL
description TEXT
cover_image_url TEXT
match_id UUID FK matches(id) ON DELETE SET NULL
created_by UUID FK profiles(id) ON DELETE SET NULL
is_official BOOLEAN DEFAULT false
created_at TIMESTAMPTZ DEFAULT NOW()
```

**`gallery_photos`**
```sql
id UUID PK DEFAULT gen_random_uuid()
album_id UUID NOT NULL FK gallery_albums(id) ON DELETE CASCADE
user_id UUID FK profiles(id) ON DELETE SET NULL
image_url TEXT NOT NULL
caption TEXT CHECK (char_length(caption) <= 200)
likes_count INTEGER DEFAULT 0
created_at TIMESTAMPTZ DEFAULT NOW()
```

Note: `ON DELETE SET NULL` on user FKs preserves community content if a user is deleted.

### RLS
- SELECT: public
- INSERT gallery_albums: authenticated (non-official), admin/coach (official)
- INSERT gallery_photos: authenticated (user_id = auth.uid())
- DELETE gallery_photos: own photos OR admin
- DELETE gallery_albums: own non-official albums OR admin

### UI
- **Album grid**: cover image cards, title, photo count, date. Official albums get gold "Official" badge.
- **Album view**: masonry grid, lightbox on click (prev/next, caption, like, uploader name)
- **Upload**: logged-in users upload to existing albums or create fan albums
- **Community Highlights**: most-liked photos across all albums (auto-curated)

### Storage
Supabase bucket `fan-uploads`, path: `gallery/{album_id}/{filename}`

---

## New DB Tables Summary

| Table | Purpose |
|-------|---------|
| `fan_posts` | Social feed posts |
| `fan_post_likes` | Post likes (unique per user) |
| `fan_post_comments` | Post comments |
| `potm_votes` | Player of the Match votes |
| `score_predictions` | Match score predictions |
| `gallery_albums` | Photo album metadata |
| `gallery_photos` | Individual photos in albums |

**New DB View**: `fan_leaderboard` (aggregated points)

**New Storage Bucket**: `fan-uploads` (images for wall + gallery)

**Triggers**: Increment/decrement `likes_count` and `comments_count` on `fan_posts` when likes/comments are inserted/deleted. Same pattern for `gallery_photos.likes_count`.

**Storage Bucket RLS** (`fan-uploads`):
- SELECT (read/download): public (anyone can view uploaded images)
- INSERT (upload): authenticated users, path must start with `{auth.uid()}/`
- DELETE: own files only (path starts with `{auth.uid()}/`) OR admin role

**Migration also adds**: `ALTER TABLE matches ADD COLUMN completed_at TIMESTAMPTZ;` and updates `completeMatch()` in schedulingService.js to set it.

---

## Prerequisite Change: Shop Page

Move 16 merch items + cart functionality from FanPortal.jsx into Shop.jsx. Shop gets two sections:
- **Tab 1: Official Merch** — Kaboona FC branded items with cart (current FanPortal content)
- **Tab 2: Football Gear** — affiliate products with external links (current Shop content)

Cart sidebar, Redux cart state, MerchCard, CartSidebar components all move to Shop. Shop.jsx must be wrapped with `connect(mapStateToProps, mapDispatchToProps)` to access the Redux cart slice (it currently has no Redux connection).

---

## File Changes Summary

**Delete**: None (FanPortal.jsx gets rewritten, not deleted)

**Rewrite**:
- `src/pages/FanPortal/FanPortal.jsx` — complete rewrite as 6-tab hub
- `src/pages/FanPortal/components/` — delete MerchCard.jsx and CartSidebar.jsx, add new tab components

**Modify**:
- `src/pages/Shop/Shop.jsx` — add official merch section with cart
- `src/pages/Shop/components/` — add MerchCard.jsx and CartSidebar.jsx (moved from FanPortal)

**New files**:
- `src/pages/FanPortal/components/MatchCenter.jsx`
- `src/pages/FanPortal/components/FanWall.jsx`
- `src/pages/FanPortal/components/ComposeBox.jsx`
- `src/pages/FanPortal/components/PostCard.jsx`
- `src/pages/FanPortal/components/POTMVoting.jsx`
- `src/pages/FanPortal/components/FanLeaderboard.jsx`
- `src/pages/FanPortal/components/MatchDayHub.jsx`
- `src/pages/FanPortal/components/ScorePredictor.jsx`
- `src/pages/FanPortal/components/Gallery.jsx`
- `src/pages/FanPortal/components/AlbumView.jsx`
- `src/pages/FanPortal/components/PhotoLightbox.jsx`
- `src/services/fanPortalService.js` — all Supabase queries for fan portal
- `supabase/migrations/YYYYMMDD_fan_portal.sql` — new tables, views, RLS, triggers

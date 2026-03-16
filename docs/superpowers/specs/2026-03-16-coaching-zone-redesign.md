# Coaching Zone Redesign — Design Spec

## Goal
Reorganize the dashboard coaching zone into a logical workflow (roster → plan → execute → evaluate), enhance player management with injury indicators and coach-editable stats, add real-time notification subscriptions for live accept/decline tracking, and wire the match scheduler to squad presets with position gap detection.

## Architecture
React class components (project convention), Supabase backend with existing tables (training_sessions, matches, formations, event_invitations, squad_presets, injuries, notifications). Real-time via Supabase Realtime channels. No new tables, no new columns — coach edits player stats directly.

## Tech Stack
React (class components, no hooks), Redux, Supabase JS Client v2, Supabase Realtime, Tailwind CSS, Framer Motion.

---

## 1. Sidebar Reorganization

**File:** `src/pages/Dashboard/DashboardSidebar.jsx`

Reorder the "Coaching" group to follow the coach's natural workflow:

| # | Label | Route | Description |
|---|-------|-------|-------------|
| 1 | Player Management | `/dashboard/players` | Roster, stats, injuries, approve requests |
| 2 | Squad Builder | `/dashboard/squad-presets` | Named team collections (League Squad, U21, etc.) |
| 3 | Training Scheduler | `/dashboard/training` | Create trainings, track responses |
| 4 | Match Scheduler | `/dashboard/matches` | Create matches, invite from presets |
| 5 | Starting 11 | `/dashboard/formation` | Formation builder + bench + publish |
| 6 | Match Evaluation | `/dashboard/match-evaluation` | Post-match stats & ratings |
| 7 | Player Notes | `/dashboard/player-notes` | Coaching notes per player |
| 8 | Attendance | `/dashboard/attendance` | GPS check-in records |

**Changes:**
- Move "Players" from the "People" group into "Coaching" as first item
- Rename "Squad Presets" → "Squad Builder"
- Rename "Formation Builder" → "Starting 11"
- Remove "Squad Selection" as standalone item (merged into Match Scheduler)
- Keep Calendar in "Overview" group (shared component)

---

## 2. Player Management Enhancement

**File:** `src/pages/Dashboard/components/PlayersManagement.jsx`

### 2a. Injury Indicator
- Fetch active injuries via `injuryService.getAllActiveInjuries()`
- Build a `Map<user_id, injury>` lookup
- Render a red cross icon next to injured players with tooltip: injury note + expected return date
- Injured players also get a red-tinted row background

### 2b. Player Edit Panel
Click a player row → opens a modal with:
- **Jersey Number** (number input)
- **Position** (dropdown: GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST)
- **Alternate Positions** (multi-select)
- **Photo Upload** — upload to Supabase storage `avatars` bucket, path: `avatars/{user_id}-{timestamp}.{ext}`, accepted formats: JPEG/PNG, max 5MB. Shows current avatar with a replace button. Updates `profiles.profile_image_url` and `players.image`.
- **Stats** (6 sliders 1-99 for outfield: pace, shooting, passing, dribbling, defending, physical / 6 for GK: diving, handling, kicking, reflexes, speed, positioning) — coach edits the existing stat columns directly on the `players` table. No separate override column.

### 2c. Existing Features (unchanged)
- Approve/decline player requests (via `approve_player_request` RPC)
- Retire/unretire players
- Search and filter

---

## 3. Squad Builder (Presets)

**File:** `src/pages/Dashboard/components/SquadPresets.jsx`

Already built. Enhancements:
- Show injury status on each player (greyed out card + injury icon if injured)
- Show position and jersey number on player cards
- Preset names are freeform text (coach decides: "League Squad", "U21", "Training Group A")
- Used as quick-select in Match Scheduler

**No DB changes.** Uses existing `squad_presets` + `squad_preset_players`.

---

## 4. Training Scheduler — Real-time Responses

**File:** `src/pages/Dashboard/components/TrainingScheduler.jsx`

### 4a. Create Training Flow
Already implemented via `schedulingService.createTrainingSession()` + `sendInvitations()`. Enhancement:
1. After creating session, call `sendInvitations()` for ALL active non-injured players
2. Bulk-create `notifications` with type `training_invite`, body includes: title, date, time, location
3. Existing `sendInvitations` already creates `event_invitations` rows

### 4b. Real-time Response Tracker
- Subscribe to Supabase Realtime on `event_invitations` filtered by `event_id`
- Display live counters on each training card: `✓ 8 accepted | ✗ 2 declined | ⏳ 5 pending`
- Unsubscribe in `componentWillUnmount` via `supabase.removeChannel(channel)`

### 4c. Player Response (Notifications Page)
**File:** `src/pages/Notifications/` — requires enhancement:
- For notifications with type `training_invite` or `match_invite`, render Accept/Decline action buttons
- On Accept → update `event_invitations` row: `status = 'accepted'`, `responded_at = now()`
- On Decline → update `event_invitations` row: `status = 'declined'`, `responded_at = now()`
- Mark notification as read after responding
- Needs `reference_type` + `reference_id` on the notification to find the matching `event_invitations` row

---

## 5. Match Scheduler — Preset Integration + Position Gap Detection

**File:** `src/pages/Dashboard/components/MatchScheduler.jsx`

### 5a. Create Match Flow
1. Coach fills: opponent, date, time, venue, match type (league/friendly)
2. **Player Selection Step** — 3 modes via a selector bar above the player grid:
   - **From Preset**: dropdown of squad presets → auto-checks all players in preset. Coach can then manually add/remove individuals.
   - **All Players**: checks all active, non-injured players
   - **Manual**: pick individual players from the grid
3. Injured players shown greyed out with injury icon — not selectable in any mode
4. On save → create `matches` row + bulk-create `event_invitations` + bulk-create `notifications`

Note: `matches` table already has `is_home` boolean column. Use this for home/away instead of adding a new column.

### 5b. Position Gap Indicator
After player selection, analyze selected players' primary positions:
- Check coverage for key position groups: GK, DEF (CB/LB/RB), MID (CDM/CM/CAM), ATK (LW/RW/ST)
- Show amber warnings: "⚠ No GK selected", "⚠ No attackers selected"
- Keep it simple — check position groups, not exact formation slots (formation-specific gaps are handled in Starting 11)

### 5c. Notification Content
```
Title: "Match Invitation: vs [Opponent]"
Body: "[Date] at [Time] | [Venue] | [Home/Away]"
Type: "match_invite"
reference_type: "match"
reference_id: match.id
```

### 5d. Real-time Response Tracker
Same pattern as Training: subscribe to `event_invitations` changes for this match, show live counters. Unsubscribe on unmount.

---

## 6. Starting 11 Builder

**File:** `src/pages/Dashboard/components/FormationBuilder.jsx`

### 6a. Match Selection
- Coach selects a match from dropdown (upcoming matches only)
- Only players who **accepted** the match invitation are available for placement

### 6b. Formation Editor
- Formation dropdown: 4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 3-4-3, 5-3-2, 5-4-1
- Add `5-4-1` to existing `COMMON_FORMATIONS` array
- Visual football pitch with position slots
- Drag available players onto slots
- Unplaced accepted players go to "Bench" list below pitch

### 6c. Publish & Notify
On "Publish Formation":
1. Set `formations.published = true`, `published_at = now()`
2. **Starting 11 notification** (type: `starting_11`):
   ```
   "You're in the starting 11 for vs [Opponent] on [Date].
    Please arrive by [match_time - 1 hour] at [Venue]."
   ```
   Time calculation: parse `match_time`, subtract 1 hour, format as HH:MM.
3. **Bench notification** (type: `formation_published`):
   ```
   "You're on the bench for vs [Opponent] on [Date]."
   ```
4. Published formation becomes visible on Fan Portal

---

## 7. Real-time Notification Infrastructure

### 7a. DB: Enable Realtime on event_invitations
The `event_invitations` table is NOT currently in the Supabase Realtime publication. Must add it.

### 7b. Supabase Realtime Subscription (Player Notifications)
**File:** Added to notification service or Navbar component.

```js
// Subscribe to new notifications for current user
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Update Redux notification count
    // Show toast notification
  })
  .subscribe();

// Cleanup in componentWillUnmount:
// supabase.removeChannel(channel);
```

### 7c. Coach Dashboard Realtime (Response Tracking)
For training/match response tracking in scheduler components:
```js
const channel = supabase
  .channel(`event-responses-${eventId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'event_invitations',
    filter: `event_id=eq.${eventId}`
  }, (payload) => {
    // Update accepted/declined/pending counters
  })
  .subscribe();
```

### 7d. Navbar Badge
- Navbar already shows notification icon
- Add realtime subscription to update unread count badge without page refresh

### 7e. Notification Actions (Player Side)
**File:** `src/pages/Notifications/` — enhanced notification cards:
- For `training_invite` / `match_invite` types: show Accept / Decline buttons
- On click → update `event_invitations` row (find via `reference_type` + `reference_id` + current user)
- Auto-mark notification as read
- Coach sees the update in real-time via 7c subscription

---

## 8. DB Migration

```sql
-- Enable Realtime on event_invitations for live response tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'event_invitations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_invitations;
  END IF;
END $$;
```

No other schema changes needed — coach edits stats directly on existing `players` columns.

---

## 9. Fan Portal — Published Formations

**File:** `src/pages/FanPortal/` (existing)

- Show published formations for upcoming matches
- Display the pitch visual with player names/numbers
- Only show after coach publishes (check `formations.published = true`)
- Already partially implemented via formation RLS policy (published = visible to all)

---

## 10. Phase 2 (Future)

- **Drill Suggestions**: Wire `DrillSuggestions.jsx` into Training Scheduler
- **Performance Analytics**: Visual charts of player stats over time
- **Push Notifications**: External push via FCM/APNs (service exists, needs wiring)
- **Player Self-Report**: Players can report injuries from their profile
- **Match Reports**: Structured post-match narrative beyond stats

---

## Component Dependency Map

```
Player Management
  └── injuryService (injury indicators)
  └── players table (direct stat editing)
  └── Supabase storage (photo upload)

Squad Builder
  └── squad_presets + squad_preset_players
  └── injuryService (greyed out injured)

Training Scheduler
  └── training_sessions table
  └── schedulingService (create + sendInvitations)
  └── notifications (bulk create)
  └── Realtime subscription on event_invitations (response tracking)

Match Scheduler
  └── matches table
  └── squad_presets (quick select via 3-mode selector)
  └── event_invitations (bulk create)
  └── notifications (bulk create, with match details)
  └── injuryService (exclude injured)
  └── Position gap detection (client-side, by position group)
  └── Realtime subscription on event_invitations (response tracking)

Starting 11 Builder
  └── formations table
  └── event_invitations (filter accepted only)
  └── notifications (starting_11 type + formation_published type)
  └── Fan Portal visibility (published flag)
  └── Time calculation (match_time - 1hr for arrival)

Notifications (Player Side)
  └── Realtime subscription on notifications table (live updates)
  └── event_invitations (accept/decline actions)
  └── Navbar badge (unread count via realtime)
```

# Squad Management, Injury Tracking & Formation System

**Date:** 2026-03-15
**Status:** Approved

## Overview

Add squad presets, injury tracking, draft/publish formation workflow, fan portal starting 11 display, and note notifications to Kaboona FC. Migrations must be applied to both local and production Supabase (`fqxsnpcnhiwjbbmwqfdp`).

## Database Schema

### New Table: `injuries`

```sql
CREATE TABLE public.injuries (
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

CREATE INDEX idx_injuries_player_status ON injuries(player_id, status);
CREATE INDEX idx_injuries_active ON injuries(status) WHERE status = 'active';

CREATE TRIGGER set_injuries_updated_at
  BEFORE UPDATE ON injuries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS policies (full SQL pattern):**
- All policies use the dual-role pattern: `profiles.role IN (...) OR profiles.roles && ARRAY[...]::TEXT[]`
- Coach roles = `('coach', 'manager', 'owner', 'admin', 'super_admin')`

```sql
-- SELECT: coaches see all, players see own
CREATE POLICY injuries_select ON injuries FOR SELECT USING (
  player_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
  )
);

-- INSERT: coaches can insert for any player; players only for themselves
-- reported_by must always be auth.uid()
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

-- UPDATE: coaches can update any, players can update their own
CREATE POLICY injuries_update ON injuries FOR UPDATE USING (
  player_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
  )
);

-- DELETE: admins only (for erroneous records)
CREATE POLICY injuries_delete ON injuries FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('admin','super_admin') OR roles && ARRAY['admin','super_admin']::TEXT[])
  )
);
```

### New Table: `squad_presets`

```sql
CREATE TABLE public.squad_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_squad_presets_updated_at
  BEFORE UPDATE ON squad_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**RLS:** coaches/managers/owners/admins/super_admins full CRUD. Squad presets are match-agnostic — they are reusable named player collections. The link between a preset and a match invitation is handled in the frontend only.

### New Table: `squad_preset_players`

```sql
CREATE TABLE public.squad_preset_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES squad_presets(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(preset_id, player_id)
);
```

**RLS:** same as `squad_presets`.

### New Table: `custom_formations`

```sql
CREATE TABLE public.custom_formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  positions JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_custom_formations_updated_at
  BEFORE UPDATE ON custom_formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

`positions` format: `[{label: "GK", x: 50, y: 95}, {label: "CB", x: 30, y: 80}, ...]`
These are templates — position slots on the pitch without assigned players.

**RLS:** coaches/managers/owners/admins/super_admins full CRUD.

### Alter: `formations` table

```sql
ALTER TABLE public.formations ADD COLUMN is_draft BOOLEAN DEFAULT TRUE;
-- Fix existing published formations
UPDATE formations SET is_draft = FALSE WHERE published = TRUE;
```

- `is_draft = true`: coach is still building the starting 11
- `is_draft = false` + `published = true`: starting 11 is live and visible to fans
- Publishing requires all 11 formation players to have `accepted` status on the match invitation

**Fan portal visibility:** Add a public SELECT policy for published formations so unauthenticated visitors can see the starting 11:
```sql
CREATE POLICY formations_public_read ON formations FOR SELECT
  USING (published = TRUE);
```

### Alter: `notifications` type check

Drop and recreate the CHECK constraint to include all types (existing + new):
```sql
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type IN (
    'training_invite', 'match_invite', 'formation_published', 'match_reminder',
    'general', 'player_approved', 'player_request', 'player_declined',
    'event_invitation', 'event_cancellation',
    'note_created', 'injury_reported', 'starting_11'
  )
);
```

Note: `event_invitation` and `event_cancellation` are already used by `schedulingService.js` but may be missing from the current constraint. This migration ensures they are all present.

### Edge case: player injured after being placed in draft formation

If a player is placed in a draft formation and later reports an injury, the player is **flagged** in the formation UI (shown with injury badge) but NOT auto-removed. The coach decides whether to replace them or keep them if recovery is expected before match day.

## Feature 1: Injury System

### Coach marks player injured
- From squad selection view or PlayerNotes component
- Creates `injuries` row with `status: 'active'`, `reported_by: auth.uid()`
- Player immediately excluded from squad selection (greyed out, unclickable)
- Player stops receiving match/training invitation notifications
- If player is in a squad preset, they stay listed but shown as injured when preset is used

### Player self-reports injury
- Profile page gets "Report Injury" section (visible only when player has no active injury)
- Fields: injury description (text), estimated recovery date (date picker)
- Creates `injuries` row with `reported_by = auth.uid()`, `player_id = auth.uid()`
- Notification sent to all users with coach/manager/owner roles: "Player XX has just filed an injury"
- Player immediately shown as injured across the system

### Recovery
- Coach clears injury manually → sets `status: 'recovered'`, `recovered_at: now()`
- Player can also mark themselves recovered from profile page
- `expected_return` is informational only — no auto-recovery (coach must explicitly clear)
- Full injury history preserved (old rows remain with `status: 'recovered'`)

### Where injuries surface
- **Squad selection:** injured players greyed out with injury icon, unclickable
- **Squad presets:** injured players marked with badge, still in preset list
- **Formation builder:** injured players cannot be dragged onto pitch; if already in draft, flagged with injury badge
- **PlayerNotes:** injury status visible at top of player's notes panel
- **Invitation sending:** injured players auto-excluded from bulk notifications

## Feature 2: Squad Presets

### Management UI
- New "Squad Presets" section in dashboard sidebar (coaching tools area)
- Coach names a preset → selects players from full roster
- Injured players shown but greyed out
- Edit/delete presets at any time

### Usage during match invitation
- After creating a match, coach sees "Invite Players" step with three options:
  1. **From preset** — pick a preset, non-injured players auto-selected
  2. **All players** — entire active roster minus injured
  3. **Manual** — handpick one by one
- Coach can add/remove individuals regardless of method
- Sends invitations → notifications created for each non-injured player

## Feature 3: Match Invitation Flow

### Coach view (match detail)
- All invited players grouped by status: Accepted, Pending, Declined
- Count badges: "14 Accepted / 3 Pending / 1 Declined"
- Injured players from preset shown separately as "Unavailable"
- Coach can send additional invitations or cancel existing ones

### Player view
- Receives notification with match details
- Accepts or declines from notifications page or upcoming events view
- Injured players do not receive invitation notifications

## Feature 4: Formation Builder & Starting 11

### Draft mode
- Coach opens formation builder for a match
- Picks formation template: standard presets (4-3-3, 4-4-2, etc.) + coach's custom formations
- Drags only **accepted** players onto position slots
- Injured/pending/declined players not draggable
- **Bug fix:** position validation checks `position` AND `alternate_positions` — "wrong position" warning only if neither matches
- Formation saved as draft (`is_draft: true`)
- Banner: "X of 11 players haven't accepted yet — starting 11 cannot be published"

### Publishing
- All 11 formation players must have `accepted` invitation status
- Coach clicks "Publish Starting 11"
- Sets `is_draft: false`, `published: true`, `published_at: now()`
- Notifications sent to all accepted players:
  - In starting 11: "You're in the starting 11 for [opponent] on [date]!"
  - Not in starting 11 but accepted: "You've been selected for the squad against [opponent]"

### Custom formations
- "Manage Formations" button in formation builder
- Coach defines position slots on a pitch (drag to place, label each)
- Saves to `custom_formations` table
- Available alongside standard presets

## Feature 5: Fan Portal — Starting 11 Display

- New "Next Match" section on Fan Portal
- Visible when a starting 11 is published for an upcoming match
- Content: "Our Starting 11 against [opponent] on [date] at [location]"
- Countdown timer to kickoff
- Pitch visualization with published formation (player names + positions)
- If no starting 11 published: "Lineup TBA" with match details only
- After match date passes: auto-switches to next upcoming match
- Accessible to unauthenticated visitors (public SELECT on published formations)

## Feature 6: Note Notifications

- When coach creates a note for a player → notification sent to that player
- Type: `note_created`
- Title: "New note from Coach [author name]"
- Body: first 100 characters of note text
- Exception: notes with category `injury` skip notification if an injury was also filed (avoids double-notify)

## Deployment

- Write single migration file wrapped in a transaction (Supabase migrations are transactional by default)
- Apply to local Supabase via `supabase migration up`
- Apply to production Supabase (`fqxsnpcnhiwjbbmwqfdp`) via direct SQL execution on the Supabase SQL editor or `supabase db push --linked`

## Files to Create/Modify

### New files:
- `supabase/migrations/20260315300000_squad_injury_system.sql`
- `src/services/injuryService.js`
- `src/services/squadPresetService.js`
- `src/pages/Dashboard/components/SquadPresets.jsx`
- `src/pages/Dashboard/components/MatchDetail.jsx` (invitation status view)
- `src/pages/FanPortal/components/NextMatch.jsx`

### Modified files:
- `src/services/schedulingService.js` — skip injured players in sendInvitations
- `src/services/notificationService.js` — new notification types
- `src/pages/Dashboard/components/PlayerNotes.jsx` — send notification on note create, show injury status
- `src/pages/Dashboard/components/SquadSelection.jsx` — grey out injured, respect presets (consider splitting into subcomponents if file grows too large)
- `src/pages/Dashboard/components/CalendarEventModal.jsx` — preset selection in invitation step
- `src/pages/Dashboard/DashboardSidebar.jsx` — add Squad Presets nav item
- `src/pages/Dashboard/DashboardHome.jsx` — route for new components
- `src/pages/Profile/Profile.jsx` — injury self-report section
- `src/pages/FanPortal/FanPortal.jsx` — add NextMatch component
- `src/pages/Dashboard/components/FormationBuilder.jsx` — draft/publish workflow, custom formation support, position bug fix

### Optional optimization:
- Update `players_full` or `players_with_profiles` views to include an `is_injured` computed column (LEFT JOIN on `injuries WHERE status = 'active'`) to simplify consumers

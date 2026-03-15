# Squad Management, Injury Tracking & Formation System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add squad presets, injury tracking with self-reporting, draft/publish starting 11 workflow, fan portal match display, and note notifications.

**Architecture:** New Supabase tables (injuries, squad_presets, squad_preset_players, custom_formations) with RLS. New service files for injuries and presets. Extend existing formation builder with draft/publish. New fan portal section. All React class components, no hooks.

**Tech Stack:** React class components, Supabase (PostgREST + RLS + Realtime), Redux, Framer Motion, GSAP

**Spec:** `docs/superpowers/specs/2026-03-15-squad-injury-system-design.md`

---

## Chunk 1: Database Migration & Services

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260316000000_squad_injury_system.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ============================================================
-- Squad & Injury System Migration
-- ============================================================

-- 1. injuries table
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

ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY injuries_select ON injuries FOR SELECT USING (
  player_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
  )
);

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

CREATE POLICY injuries_update ON injuries FOR UPDATE USING (
  player_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
  )
);

CREATE POLICY injuries_delete ON injuries FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('admin','super_admin') OR roles && ARRAY['admin','super_admin']::TEXT[])
  )
);

-- 2. squad_presets table
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

ALTER TABLE squad_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY squad_presets_all ON squad_presets FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
  )
);

-- 3. squad_preset_players table
CREATE TABLE public.squad_preset_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES squad_presets(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(preset_id, player_id)
);

ALTER TABLE squad_preset_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY squad_preset_players_all ON squad_preset_players FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
  )
);

-- 4. custom_formations table
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

ALTER TABLE custom_formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_formations_all ON custom_formations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND (role IN ('coach','manager','admin','super_admin') OR roles && ARRAY['coach','manager','owner','admin','super_admin']::TEXT[])
  )
);

-- 5. Alter formations table — add is_draft column
ALTER TABLE public.formations ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT TRUE;
UPDATE formations SET is_draft = FALSE WHERE published = TRUE;

-- Public read for published formations (fan portal)
CREATE POLICY formations_public_read ON formations FOR SELECT USING (published = TRUE);

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
```

- [ ] **Step 2: Apply migration locally**

Run: `cd supabase && npx supabase migration up` or restart local Supabase.
If using local dev: `npx supabase db reset` (will re-run all migrations).

- [ ] **Step 3: Apply migration to production**

Run the SQL directly in the Supabase SQL editor at `https://supabase.com/dashboard/project/fqxsnpcnhiwjbbmwqfdp/sql`. Copy the entire migration contents and execute.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260316000000_squad_injury_system.sql
git commit -m "feat: add injuries, squad_presets, custom_formations tables and RLS"
```

---

### Task 2: Injury Service

**Files:**
- Create: `src/services/injuryService.js`

- [ ] **Step 1: Create injury service**

```javascript
import { supabase } from './supabase';
import { createBulkNotifications } from './notificationService';

/**
 * Get active injury for a specific player (null if healthy)
 */
export const getActiveInjury = async (playerId) => {
  const { data, error } = await supabase
    .from('injuries')
    .select('*')
    .eq('player_id', playerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Get all active injuries (for squad selection views)
 */
export const getAllActiveInjuries = async () => {
  const { data, error } = await supabase
    .from('injuries')
    .select('*, profiles!injuries_player_id_fkey(full_name, profile_image_url)')
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
};

/**
 * Get injury history for a player
 */
export const getInjuryHistory = async (playerId) => {
  const { data, error } = await supabase
    .from('injuries')
    .select('*, reporter:profiles!injuries_reported_by_fkey(full_name)')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Report an injury (coach or player self-report)
 */
export const reportInjury = async ({ playerId, reportedBy, injuryNote, expectedReturn }) => {
  const { data, error } = await supabase
    .from('injuries')
    .insert({
      player_id: playerId,
      reported_by: reportedBy,
      injury_note: injuryNote,
      expected_return: expectedReturn,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Notify coaches when a player self-reports an injury
 */
export const notifyCoachesOfInjury = async (playerName) => {
  const { data: coaches } = await supabase
    .from('profiles')
    .select('id')
    .or('roles.cs.{coach},roles.cs.{manager},roles.cs.{owner}');

  if (coaches && coaches.length > 0) {
    const coachIds = coaches.map((c) => c.id);
    await createBulkNotifications(coachIds, {
      title: 'Player Injury Reported',
      body: `${playerName} has just filed an injury`,
      type: 'injury_reported',
      referenceType: 'injury',
      referenceId: null,
    });
  }
};

/**
 * Mark an injury as recovered
 */
export const recoverInjury = async (injuryId) => {
  const { data, error } = await supabase
    .from('injuries')
    .update({ status: 'recovered', recovered_at: new Date().toISOString() })
    .eq('id', injuryId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get set of injured player IDs (for filtering)
 */
export const getInjuredPlayerIds = async () => {
  const { data, error } = await supabase
    .from('injuries')
    .select('player_id')
    .eq('status', 'active');

  if (error) throw error;
  return new Set((data || []).map((r) => r.player_id));
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/injuryService.js
git commit -m "feat: add injury service with CRUD and coach notification"
```

---

### Task 3: Squad Preset Service

**Files:**
- Create: `src/services/squadPresetService.js`

- [ ] **Step 1: Create squad preset service**

```javascript
import { supabase } from './supabase';

/**
 * Get all squad presets with player counts
 */
export const getPresets = async () => {
  const { data, error } = await supabase
    .from('squad_presets')
    .select('*, squad_preset_players(player_id)')
    .order('name');

  if (error) throw error;
  return (data || []).map((p) => ({
    ...p,
    playerCount: (p.squad_preset_players || []).length,
    playerIds: (p.squad_preset_players || []).map((sp) => sp.player_id),
  }));
};

/**
 * Get a single preset with full player details
 */
export const getPresetWithPlayers = async (presetId) => {
  const { data, error } = await supabase
    .from('squad_presets')
    .select('*, squad_preset_players(player_id, profiles(id, full_name, profile_image_url, roles))')
    .eq('id', presetId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new squad preset
 */
export const createPreset = async (name, createdBy) => {
  const { data, error } = await supabase
    .from('squad_presets')
    .insert({ name, created_by: createdBy })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update preset name
 */
export const updatePreset = async (presetId, name) => {
  const { data, error } = await supabase
    .from('squad_presets')
    .update({ name })
    .eq('id', presetId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a preset
 */
export const deletePreset = async (presetId) => {
  const { error } = await supabase
    .from('squad_presets')
    .delete()
    .eq('id', presetId);

  if (error) throw error;
};

/**
 * Set players for a preset (replaces all existing)
 */
export const setPresetPlayers = async (presetId, playerIds) => {
  // Delete existing
  await supabase
    .from('squad_preset_players')
    .delete()
    .eq('preset_id', presetId);

  if (playerIds.length === 0) return [];

  // Insert new
  const rows = playerIds.map((playerId) => ({
    preset_id: presetId,
    player_id: playerId,
  }));

  const { data, error } = await supabase
    .from('squad_preset_players')
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/squadPresetService.js
git commit -m "feat: add squad preset service with CRUD"
```

---

### Task 4: Update schedulingService — skip injured players

**Files:**
- Modify: `src/services/schedulingService.js:204-256`

- [ ] **Step 1: Add injury filtering to sendInvitations**

At the top of `schedulingService.js`, add the import:
```javascript
import { getInjuredPlayerIds } from './injuryService';
```

Then modify `sendInvitations` to filter out injured players before creating invitations:

```javascript
export const sendInvitations = async (eventType, eventId, playerIds) => {
  // Filter out injured players
  const injuredIds = await getInjuredPlayerIds();
  const healthyPlayerIds = playerIds.filter((id) => !injuredIds.has(id));

  if (healthyPlayerIds.length === 0) return [];

  const rows = healthyPlayerIds.map((playerId) => ({
    // ... rest unchanged, but use healthyPlayerIds
```

Replace only the first 3 lines of the function body. The `rows` mapping and everything after uses `healthyPlayerIds` instead of `playerIds`. The notification bulk call at line 247 also uses `healthyPlayerIds`.

- [ ] **Step 2: Commit**

```bash
git add src/services/schedulingService.js
git commit -m "feat: filter injured players from match/training invitations"
```

---

### Task 5: Update PlayerNotes — send notification on note create

**Files:**
- Modify: `src/pages/Dashboard/components/PlayerNotes.jsx:113-136`

- [ ] **Step 1: Add notification import and trigger**

At the top of `PlayerNotes.jsx`, add:
```javascript
import { createNotification } from '../../../services/notificationService';
```

In the `handleAddNote` method, after the successful insert (after the note is saved and before `this.fetchNotes()`), add:

```javascript
// Send notification to the player (skip injury-category notes if injury was also filed)
if (this.state.noteCategory !== 'injury') {
  const authorName = this.props.user?.full_name || 'Coach';
  await createNotification({
    userId: this.state.selectedPlayerId,
    title: `New note from ${authorName}`,
    body: this.state.noteText.substring(0, 100),
    type: 'note_created',
    referenceType: 'note',
    referenceId: result.id,
  });
}
```

The `result` is the returned data from the insert. Make sure `handleAddNote` captures the insert result: change `.select()` to `.select().single()` and capture to `const { data: result, error }`.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard/components/PlayerNotes.jsx
git commit -m "feat: send notification to player when coach creates a note"
```

---

## Chunk 2: Squad Presets UI & Injury Self-Report

### Task 6: Squad Presets Dashboard Component

**Files:**
- Create: `src/pages/Dashboard/components/SquadPresets.jsx`

- [ ] **Step 1: Create the SquadPresets component**

Build a class component with:
- State: `presets[]`, `players[]`, `activeInjuries` (Set), `selectedPreset` (null or preset object), `selectedPlayerIds` (Set), `presetName`, `isCreating`, `isEditing`, `loading`, `saving`
- Left panel: list of presets with player count badge, create/edit/delete buttons
- Right panel: player roster grid (when a preset is selected)
  - Show all active players with checkboxes
  - Injured players shown greyed out with injury icon, checkbox disabled
  - Selected players highlighted
  - Save button to persist `squad_preset_players`
- Fetch data from: `squadPresetService.getPresets()`, `schedulingService.getAllActivePlayers()`, `injuryService.getAllActiveInjuries()`
- On save: call `squadPresetService.setPresetPlayers(presetId, [...selectedPlayerIds])`
- Follow existing component patterns: class component, motion animations, surface-dark-elevated styling

Full component ~250 lines. Key sections:
1. `fetchData()` — loads presets, players, injuries in parallel
2. `handleCreatePreset()` — creates new preset via service
3. `handleDeletePreset()` — deletes with confirmation
4. `handleSavePreset()` — calls `setPresetPlayers`
5. `renderPresetList()` — left sidebar with preset cards
6. `renderPlayerGrid()` — right panel with selectable player cards
7. `render()` — two-panel layout

- [ ] **Step 2: Register route and sidebar nav**

In `src/pages/Dashboard/Dashboard.jsx`:
- Add import: `import SquadPresets from './components/SquadPresets';`
- Add route at line ~257 (after player-notes): `<Route path="squad-presets" element={<SquadPresets />} />`

In `src/pages/Dashboard/DashboardSidebar.jsx`:
- Add new nav item in the Coaching group (after Player Notes, before line 151):
```javascript
{
  path: '/dashboard/squad-presets',
  label: 'Squad Presets',
  icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
},
```

- [ ] **Step 3: Build and verify**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard/components/SquadPresets.jsx src/pages/Dashboard/Dashboard.jsx src/pages/Dashboard/DashboardSidebar.jsx
git commit -m "feat: add Squad Presets management component with dashboard routing"
```

---

### Task 7: Injury Self-Report on Profile Page

**Files:**
- Modify: `src/pages/Profile/Profile.jsx:443-561`

- [ ] **Step 1: Add injury section to player dashboard**

Add imports at the top of Profile.jsx:
```javascript
import { getActiveInjury, reportInjury, recoverInjury, notifyCoachesOfInjury } from '../../services/injuryService';
```

Add to state in constructor:
```javascript
activeInjury: null,
injuryNote: '',
injuryReturnDate: '',
reportingInjury: false,
```

Add `fetchInjury` method:
```javascript
fetchInjury = async () => {
  if (!this.state.user) return;
  try {
    const injury = await getActiveInjury(this.state.user.id);
    this.setState({ activeInjury: injury });
  } catch (err) {
    console.warn('Could not fetch injury status:', err);
  }
};
```

Call `this.fetchInjury()` after player data loads in `loadPlayerData`.

Add `handleReportInjury` method:
```javascript
handleReportInjury = async () => {
  const { user, injuryNote, injuryReturnDate } = this.state;
  this.setState({ reportingInjury: true });
  try {
    const injury = await reportInjury({
      playerId: user.id,
      reportedBy: user.id,
      injuryNote,
      expectedReturn: injuryReturnDate || null,
    });
    await notifyCoachesOfInjury(user.full_name || 'A player');
    this.setState({ activeInjury: injury, injuryNote: '', injuryReturnDate: '', reportingInjury: false });
  } catch (err) {
    console.error('Error reporting injury:', err);
    this.setState({ reportingInjury: false });
  }
};
```

Add `handleRecoverInjury` method:
```javascript
handleRecoverInjury = async () => {
  try {
    await recoverInjury(this.state.activeInjury.id);
    this.setState({ activeInjury: null });
  } catch (err) {
    console.error('Error recovering:', err);
  }
};
```

In `renderPlayerDashboard()`, add the injury section before the UpcomingEvents component. Show either:
- **If injured:** injury status card with note, expected return, "Mark as Recovered" button
- **If healthy:** "Report Injury" form with note text input, date picker, submit button

Style: `bg-surface-dark-elevated rounded-2xl border border-white/5 p-6` consistent with other profile sections. Use red/orange accent for injury state.

- [ ] **Step 2: Build and verify**

Run: `npx vite build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Profile/Profile.jsx
git commit -m "feat: add injury self-report section to player profile page"
```

---

## Chunk 3: Match Detail View & Invitation Flow

### Task 8: Match Detail Component

**Files:**
- Create: `src/pages/Dashboard/components/MatchDetail.jsx`

- [ ] **Step 1: Create MatchDetail component**

Class component that shows:
1. Match info header (opponent, date, time, location, status)
2. "Invite Players" section with 3 options: From Preset, All Players, Manual
3. Invited players list grouped by status (Accepted / Pending / Declined)
4. Count badges for each status group
5. Unavailable (injured) players shown separately
6. "Open Formation Builder" button to go to `/dashboard/formation?match=<id>`

State:
```javascript
state = {
  match: null,
  invitations: [],
  players: [],
  presets: [],
  injuredIds: new Set(),
  selectedPlayerIds: new Set(),
  inviteMode: null, // 'preset' | 'all' | 'manual'
  selectedPresetId: null,
  loading: true,
  sending: false,
}
```

Key methods:
- `fetchMatchData()` — fetch match + invitations + players + presets + injuries
- `handleInviteFromPreset(presetId)` — load preset players, filter injured
- `handleInviteAll()` — select all non-injured players
- `handleSendInvitations()` — call `schedulingService.sendInvitations()`
- `renderInvitationGroups()` — group invitations by status with count badges
- `renderInviteOptions()` — three selection modes

Props: receives match ID from route params. Use `window.location` or wrap with a function component for route params access (since class components can't use hooks).

- [ ] **Step 2: Register route**

In `src/pages/Dashboard/Dashboard.jsx`:
- Add import: `import MatchDetail from './components/MatchDetail';`
- Add route: `<Route path="match/:matchId" element={<MatchDetail />} />`

- [ ] **Step 3: Build and verify**

Run: `npx vite build`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard/components/MatchDetail.jsx src/pages/Dashboard/Dashboard.jsx
git commit -m "feat: add MatchDetail view with invitation flow and preset support"
```

---

## Chunk 4: Formation Builder Updates

### Task 9: Fix Position Validation Bug

**Files:**
- Modify: `src/pages/Dashboard/components/FormationBuilder.jsx:190-209`

- [ ] **Step 1: Fix isPlayerCompatible to check alternate_positions**

Read the current `isPlayerCompatible` and `getActivePosition` methods. Update to check both `position` and `alternate_positions`:

```javascript
isPlayerCompatible = (player, slotLabel) => {
  const validPositions = SLOT_POSITIONS[slotLabel] || [slotLabel];
  // Check primary position
  if (validPositions.includes(player.position)) return true;
  // Check alternate positions
  if (Array.isArray(player.alternate_positions)) {
    return player.alternate_positions.some((pos) => validPositions.includes(pos));
  }
  return false;
};
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard/components/FormationBuilder.jsx
git commit -m "fix: check alternate_positions in formation position validation"
```

---

### Task 10: Add Draft/Publish Workflow to Formation Builder

**Files:**
- Modify: `src/pages/Dashboard/components/FormationBuilder.jsx`

- [ ] **Step 1: Add draft/publish state and logic**

Add to state:
```javascript
isDraft: true,
matchInvitations: [],
injuredIds: new Set(),
publishError: null,
```

Add method to check if publishing is allowed:
```javascript
canPublish = () => {
  const { positions, matchInvitations } = this.state;
  const filledPositions = positions.filter((p) => p.player_id);
  if (filledPositions.length < 11) return { allowed: false, reason: 'Need 11 players in formation' };

  const acceptedIds = new Set(
    matchInvitations.filter((inv) => inv.status === 'accepted').map((inv) => inv.player_id)
  );

  const pendingPlayers = filledPositions.filter((p) => !acceptedIds.has(p.player_id));
  if (pendingPlayers.length > 0) {
    return { allowed: false, reason: `${pendingPlayers.length} player(s) haven't accepted the invitation yet` };
  }

  return { allowed: true };
};
```

Add publish method:
```javascript
handlePublish = async () => {
  const check = this.canPublish();
  if (!check.allowed) {
    this.setState({ publishError: check.reason });
    return;
  }

  // Update formation: is_draft=false, published=true, published_at=now
  const { error } = await supabase
    .from('formations')
    .update({ is_draft: false, published: true, published_at: new Date().toISOString() })
    .eq('id', this.state.formationId);

  if (error) { console.error(error); return; }

  // Notify starting 11 players
  const startingIds = this.state.positions
    .filter((p) => p.player_id)
    .map((p) => p.player_id);

  await createBulkNotifications(startingIds, {
    title: 'Starting 11 Announced',
    body: `You're in the starting 11 for ${this.state.matchOpponent}!`,
    type: 'starting_11',
    referenceType: 'match',
    referenceId: this.state.matchId,
  });

  // Notify accepted but NOT in starting 11
  const benchIds = this.state.matchInvitations
    .filter((inv) => inv.status === 'accepted' && !startingIds.includes(inv.player_id))
    .map((inv) => inv.player_id);

  if (benchIds.length > 0) {
    await createBulkNotifications(benchIds, {
      title: 'Squad Selection',
      body: `You've been selected for the squad against ${this.state.matchOpponent}`,
      type: 'starting_11',
      referenceType: 'match',
      referenceId: this.state.matchId,
    });
  }

  this.setState({ isDraft: false, publishError: null });
};
```

Modify the save method to always save as draft first.

Add draft/publish banner in render:
```jsx
{this.state.isDraft && (
  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
    <p className="text-yellow-400 text-sm font-medium">
      Draft — {this.canPublish().allowed
        ? 'All players accepted. Ready to publish!'
        : this.canPublish().reason}
    </p>
    <button
      onClick={this.handlePublish}
      disabled={!this.canPublish().allowed}
      className="mt-2 px-4 py-2 bg-accent-gold text-black font-semibold rounded-lg disabled:opacity-40"
    >
      Publish Starting 11
    </button>
  </div>
)}
```

Filter out injured players from the available player list in the formation builder sidebar.

- [ ] **Step 2: Build and verify**

Run: `npx vite build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard/components/FormationBuilder.jsx
git commit -m "feat: add draft/publish workflow and injury filtering to formation builder"
```

---

### Task 11: Custom Formations Support

**Files:**
- Modify: `src/pages/Dashboard/components/FormationBuilder.jsx`

- [ ] **Step 1: Add custom formation CRUD**

Add import at top:
```javascript
// No new service file needed — use supabase directly for simplicity
```

Add methods:
```javascript
fetchCustomFormations = async () => {
  const { data } = await supabase
    .from('custom_formations')
    .select('*')
    .order('name');
  this.setState({ customFormations: data || [] });
};

handleSaveCustomFormation = async () => {
  const { customFormationName, positions } = this.state;
  const positionSlots = positions.map((p) => ({ label: p.label || p.position, x: p.x, y: p.y }));

  const { error } = await supabase
    .from('custom_formations')
    .insert({
      name: customFormationName,
      positions: positionSlots,
      created_by: this.props.user?.id,
    });

  if (!error) {
    this.fetchCustomFormations();
    this.setState({ showCustomFormationModal: false, customFormationName: '' });
  }
};
```

Add custom formations to the formation template selector dropdown, alongside COMMON_FORMATIONS. When selected, load positions from the custom formation.

Add a "Save as Template" button that opens a small modal to name and save the current formation layout.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard/components/FormationBuilder.jsx
git commit -m "feat: add custom formation template creation and selection"
```

---

## Chunk 5: Fan Portal & Final Integration

### Task 12: Fan Portal — Next Match with Starting 11

**Files:**
- Create: `src/pages/FanPortal/components/NextMatch.jsx`
- Modify: `src/pages/FanPortal/FanPortal.jsx`

- [ ] **Step 1: Create NextMatch component**

Class component that:
1. Fetches the next upcoming match from `matches` where `status = 'scheduled'` and `match_date >= today`
2. Checks if a published formation exists for that match (`formations` where `match_id = X, published = true`)
3. If published: shows pitch visualization with player names at positions + countdown timer
4. If not published: shows "Lineup TBA" with match details
5. Countdown timer: `componentDidMount` sets an interval updating days/hours/minutes/seconds

State:
```javascript
state = {
  match: null,
  formation: null,
  players: [],
  countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
  loading: true,
}
```

Render layout:
- Section wrapper with `bg-surface-dark-elevated rounded-2xl border border-white/5 p-6`
- Header: "Next Match" with match type badge
- Match info: opponent, date, time, location
- Countdown bar: 4 boxes showing days/hours/minutes/seconds
- Pitch visualization: green pitch div with player dots at x/y positions (reuse pitch SVG pattern from FormationBuilder)
- If no upcoming match: show "No upcoming matches scheduled"

- [ ] **Step 2: Add to FanPortal**

In `src/pages/FanPortal/FanPortal.jsx`:
- Import: `import NextMatch from './components/NextMatch';`
- Add to SECTIONS array (first position): `{ id: 'next-match', label: 'Next Match', component: NextMatch }`
- Or render it as a hero section above the section navigation

- [ ] **Step 3: Build and verify**

Run: `npx vite build`

- [ ] **Step 4: Commit**

```bash
git add src/pages/FanPortal/components/NextMatch.jsx src/pages/FanPortal/FanPortal.jsx
git commit -m "feat: add Next Match section with published starting 11 to Fan Portal"
```

---

### Task 13: Final Build, Commit, Push & Deploy

- [ ] **Step 1: Full build verification**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 2: Test locally**

Run: `npx vite dev`
Verify on localhost:
- Dashboard → Squad Presets: create/edit/delete presets, injured players greyed out
- Dashboard → Match Detail: invite from preset/all/manual, see invitation statuses
- Dashboard → Formation Builder: draft/publish flow, position bug fixed, custom formations
- Profile page (as player): report injury, mark recovered
- Fan Portal: Next Match section with countdown
- Player Notes: creating a note sends notification

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 4: Trigger deploy on Render**

Since auto-deploy may not trigger, manually deploy on Render dashboard:
Navigate to Render → kaboonaFC service → Manual Deploy → Deploy latest commit.

- [ ] **Step 5: Verify production**

Navigate to kaboona.com and verify:
- Fan portal next match section
- Dashboard features (login as coach)
- Profile injury report (login as player)

# Coaching Zone Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the coaching zone sidebar into a logical workflow, enhance player management with injury indicators and coach-editable stats, add real-time notification tracking for training/match invitations, and wire squad presets into match scheduling with position gap detection.

**Architecture:** Modify existing React class components (project convention). One DB migration to enable Realtime on `event_invitations`. Real-time subscriptions via Supabase Realtime channels. Notification accept/decline already partially built in Navbar — extend to Notifications page. Coach edits player stats directly on existing columns.

**Tech Stack:** React (class components, no hooks), Redux, Supabase JS Client v2, Supabase Realtime, Tailwind CSS, Framer Motion.

**Spec:** `docs/superpowers/specs/2026-03-16-coaching-zone-redesign.md`

---

## Chunk 1: Foundation (Sidebar + DB Migration)

### Task 1: DB Migration — Enable Realtime on event_invitations

**Files:**
- Create: `supabase/migrations/20260317500000_realtime_event_invitations.sql`

- [ ] **Step 1: Create the migration file**

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

- [ ] **Step 2: Apply locally**

Run: `npx supabase db push --local`
Expected: Migration applied successfully

- [ ] **Step 3: Push to production**

Run: `echo "Y" | npx supabase db push`
Expected: Migration applied successfully

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260317500000_realtime_event_invitations.sql
git commit -m "feat: enable Realtime on event_invitations for live response tracking"
```

---

### Task 2: Sidebar Reorganization

**Files:**
- Modify: `src/pages/Dashboard/DashboardSidebar.jsx` (lines 59-161)

- [ ] **Step 1: Move Player Management from People group to Coaching group**

In `getNavGroups()` method, remove the Players Management item from the People group (lines 72-80) and add it as the FIRST item in the Coaching group (line 88).

The new Coaching group items array should be ordered:
```jsx
items: [
  {
    label: 'Player Management',
    icon: (/* users icon SVG */),
    path: '/dashboard/players',
  },
  {
    label: 'Squad Builder',
    icon: (/* collection icon SVG */),
    path: '/dashboard/squad-presets',
  },
  {
    label: 'Training Scheduler',
    icon: (/* whistle/calendar icon SVG */),
    path: '/dashboard/training',
  },
  {
    label: 'Match Scheduler',
    icon: (/* trophy icon SVG */),
    path: '/dashboard/matches',
  },
  {
    label: 'Starting 11',
    icon: (/* pitch/formation icon SVG */),
    path: '/dashboard/formation',
  },
  {
    label: 'Match Evaluation',
    icon: (/* clipboard icon SVG */),
    path: '/dashboard/match-evaluation',
  },
  {
    label: 'Player Notes',
    icon: (/* notes icon SVG */),
    path: '/dashboard/player-notes',
  },
  {
    label: 'Attendance',
    icon: (/* check icon SVG */),
    path: '/dashboard/attendance',
  },
],
```

Key changes:
- Remove "Players" from People group (People keeps only "Staff Management")
- Rename "Squad Presets" → "Squad Builder"
- Rename "Formation Builder" → "Starting 11"
- Remove "Squad Selection" item entirely (merged into Match Scheduler)
- Reorder items as listed above

- [ ] **Step 2: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard/DashboardSidebar.jsx
git commit -m "feat: reorganize coaching zone sidebar into logical workflow order"
```

---

## Chunk 2: Player Management Enhancement

### Task 3: Add Injury Indicators to Player Management

**Files:**
- Modify: `src/pages/Dashboard/components/PlayersManagement.jsx`

- [ ] **Step 1: Import injuryService**

At top of file (after line 3), add:
```jsx
import { getAllActiveInjuries } from '../../../services/injuryService';
```

- [ ] **Step 2: Fetch injuries in fetchPlayers**

In the `fetchPlayers` method (after line 54, after fetching player records), add:
```jsx
// Fetch active injuries
let injuryMap = {};
try {
  const injuries = await getAllActiveInjuries();
  (injuries || []).forEach(inj => {
    injuryMap[inj.player_id] = inj;
  });
} catch (err) {
  console.warn('Could not fetch injuries:', err);
}
```

Store `injuryMap` in state alongside players:
```jsx
this.setState({
  players: combinedPlayers,
  filteredPlayers: combinedPlayers,
  injuryMap,
  isLoading: false,
}, this.filterPlayers);
```

Add `injuryMap: {}` to constructor state (line 14).

- [ ] **Step 3: Render injury indicator in table rows**

In the render method, inside the player name cell (around line 547-558), after the player name `<p>` tag, add:
```jsx
{this.state.injuryMap[player.id] && (
  <span className="ml-2 inline-flex items-center gap-1 text-red-400 text-xs" title={`${this.state.injuryMap[player.id].injury_note || 'Injured'}${this.state.injuryMap[player.id].expected_return ? ` — Expected return: ${new Date(this.state.injuryMap[player.id].expected_return).toLocaleDateString()}` : ''}`}>
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
    Injured
  </span>
)}
```

Also add a red-tinted background to injured player rows. In the `<tr>` tag (around line 545), change:
```jsx
<tr key={player.id} className={`hover:bg-white/5 transition-colors ${this.state.injuryMap[player.id] ? 'bg-red-500/5' : ''}`}>
```

- [ ] **Step 4: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard/components/PlayersManagement.jsx
git commit -m "feat: add injury indicators to player management table"
```

---

### Task 4: Player Edit Modal with Stats

**Files:**
- Modify: `src/pages/Dashboard/components/PlayersManagement.jsx`

- [ ] **Step 1: Enhance the existing edit modal**

The current edit modal (modalType === 'edit', around line 687) has fields for name, email, jersey number, position, status. Enhance it to include:

1. **Photo upload** — add a file input above the name field:
```jsx
<div>
  <label className="block text-white/60 text-sm mb-1">Profile Photo</label>
  {this.state.editForm?.photo && (
    <img src={this.state.editForm.photo} alt="Current" className="w-16 h-16 rounded-full object-cover mb-2" />
  )}
  <input
    type="file"
    accept="image/jpeg,image/png"
    onChange={this.handlePhotoSelect}
    className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-gold/20 file:text-accent-gold hover:file:bg-accent-gold/30"
  />
</div>
```

2. **Stats sliders** — after the position dropdown, add 6 stat sliders:
```jsx
{this.state.editForm?.position !== 'GK' ? (
  <div className="space-y-3">
    <label className="block text-white/60 text-sm">Player Stats (1-99)</label>
    {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(stat => (
      <div key={stat} className="flex items-center gap-3">
        <span className="text-white/50 text-xs w-20 capitalize">{stat}</span>
        <input type="range" min="1" max="99" name={`stat_${stat}`} value={this.state.editForm?.[`stat_${stat}`] || 50} onChange={this.handleEditFormChange} className="flex-1 accent-accent-gold" />
        <span className="text-white text-xs w-8 text-right">{this.state.editForm?.[`stat_${stat}`] || 50}</span>
      </div>
    ))}
  </div>
) : (
  <div className="space-y-3">
    <label className="block text-white/60 text-sm">GK Stats (1-99)</label>
    {['diving', 'handling', 'kicking', 'reflexes', 'gk_speed', 'gk_positioning'].map(stat => (
      <div key={stat} className="flex items-center gap-3">
        <span className="text-white/50 text-xs w-20 capitalize">{stat.replace('gk_', '')}</span>
        <input type="range" min="1" max="99" name={`stat_${stat}`} value={this.state.editForm?.[`stat_${stat}`] || 50} onChange={this.handleEditFormChange} className="flex-1 accent-accent-gold" />
        <span className="text-white text-xs w-8 text-right">{this.state.editForm?.[`stat_${stat}`] || 50}</span>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 2: Populate edit form with current stats**

In `openModal` (around line 170), when `type === 'edit'`, populate stat fields from the player record:
```jsx
const playerRecord = this.state.players.find(p => p.id === player.id);
const playerData = playerRecord || {};

editForm: player ? {
  name: player.name || '',
  email: player.email || '',
  position: player.position || '-',
  status: player.status || 'active',
  number: player.number || '',
  photo: player.image || null,
  stat_pace: playerData.pace || 50,
  stat_shooting: playerData.shooting || 50,
  stat_passing: playerData.passing || 50,
  stat_dribbling: playerData.dribbling || 50,
  stat_defending: playerData.defending || 50,
  stat_physical: playerData.physical || 50,
  stat_diving: playerData.diving || 50,
  stat_handling: playerData.handling || 50,
  stat_kicking: playerData.kicking || 50,
  stat_reflexes: playerData.reflexes || 50,
  stat_gk_speed: playerData.gk_speed || 50,
  stat_gk_positioning: playerData.gk_positioning || 50,
} : {},
```

To have access to the raw player stats, include them in `combinedPlayers` in `fetchPlayers`. Add these fields to the return object around line 99:
```jsx
pace: player?.pace,
shooting: player?.shooting,
passing: player?.passing,
dribbling: player?.dribbling,
defending: player?.defending,
physical: player?.physical,
diving: player?.diving,
handling: player?.handling,
kicking: player?.kicking,
reflexes: player?.reflexes,
gk_speed: player?.gk_speed,
gk_positioning: player?.gk_positioning,
image: player?.image,
```

- [ ] **Step 3: Save stats in handleSaveEdit**

In `handleSaveEdit` (around line 196), when updating the player record, include stats:
```jsx
if (selectedPlayer.playerId) {
  const playerUpdate = {
    name: editForm.name,
    position: editForm.position,
    pace: parseInt(editForm.stat_pace) || 50,
    shooting: parseInt(editForm.stat_shooting) || 50,
    passing: parseInt(editForm.stat_passing) || 50,
    dribbling: parseInt(editForm.stat_dribbling) || 50,
    defending: parseInt(editForm.stat_defending) || 50,
    physical: parseInt(editForm.stat_physical) || 50,
    diving: parseInt(editForm.stat_diving) || 50,
    handling: parseInt(editForm.stat_handling) || 50,
    kicking: parseInt(editForm.stat_kicking) || 50,
    reflexes: parseInt(editForm.stat_reflexes) || 50,
    gk_speed: parseInt(editForm.stat_gk_speed) || 50,
    gk_positioning: parseInt(editForm.stat_gk_positioning) || 50,
  };
  if (editForm.email) playerUpdate.email = editForm.email;
  if (editForm.number) playerUpdate.number = parseInt(editForm.number, 10);

  const { error: playerError } = await supabase
    .from('players')
    .update(playerUpdate)
    .eq('id', selectedPlayer.playerId);

  if (playerError) console.error('Error updating player:', playerError);
}
```

- [ ] **Step 4: Add photo upload handler**

Add `handlePhotoSelect` method and update `handleSaveEdit` to upload the photo:

```jsx
handlePhotoSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert('File must be under 5MB');
    return;
  }
  this.setState((prev) => ({
    editForm: { ...prev.editForm, photoFile: file, photo: URL.createObjectURL(file) },
  }));
};
```

In `handleSaveEdit`, before the player update, handle photo upload:
```jsx
// Upload photo if selected
if (editForm.photoFile) {
  const ext = editForm.photoFile.name.split('.').pop();
  const path = `${selectedPlayer.id}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, editForm.photoFile, { upsert: true });

  if (!uploadError) {
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const imageUrl = urlData.publicUrl;

    // Update both profiles and players tables
    await supabase.from('profiles').update({ profile_image_url: imageUrl }).eq('id', selectedPlayer.id);
    if (selectedPlayer.playerId) {
      await supabase.from('players').update({ image: imageUrl }).eq('id', selectedPlayer.playerId);
    }
  }
}
```

- [ ] **Step 5: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/pages/Dashboard/components/PlayersManagement.jsx
git commit -m "feat: add stat editing, photo upload, and injury indicators to player management"
```

---

## Chunk 3: Training & Match Scheduler Enhancements

### Task 5: Training Scheduler — Real-time Response Counters

**Files:**
- Modify: `src/pages/Dashboard/components/TrainingScheduler.jsx`

- [ ] **Step 1: Add Realtime subscription state and lifecycle**

In constructor state (line 62), add:
```jsx
realtimeChannels: {},
invitationCounts: {}, // { [sessionId]: { accepted: 0, declined: 0, pending: 0 } }
```

Add `componentWillUnmount` to clean up channels:
```jsx
componentWillUnmount() {
  Object.values(this.state.realtimeChannels).forEach(ch => {
    supabase.removeChannel(ch);
  });
}
```

- [ ] **Step 2: Subscribe to invitation changes after loading sessions**

After `loadSessions` fetches sessions (around line 106), for each session subscribe to real-time changes:

```jsx
loadInvitationCounts = async (sessions) => {
  const counts = {};
  const channels = {};

  for (const session of sessions) {
    // Initial count
    const { data: invites } = await supabase
      .from('event_invitations')
      .select('status')
      .eq('event_type', 'training')
      .eq('event_id', session.id);

    counts[session.id] = {
      accepted: (invites || []).filter(i => i.status === 'accepted').length,
      declined: (invites || []).filter(i => i.status === 'declined').length,
      pending: (invites || []).filter(i => i.status === 'pending').length,
    };

    // Real-time subscription
    const channel = supabase
      .channel(`training-invites-${session.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'event_invitations',
        filter: `event_id=eq.${session.id}`,
      }, () => {
        // Re-fetch counts on any change
        this.refreshInvitationCount(session.id);
      })
      .subscribe();

    channels[session.id] = channel;
  }

  this.setState({ invitationCounts: counts, realtimeChannels: channels });
};

refreshInvitationCount = async (sessionId) => {
  const { data: invites } = await supabase
    .from('event_invitations')
    .select('status')
    .eq('event_type', 'training')
    .eq('event_id', sessionId);

  this.setState(prev => ({
    invitationCounts: {
      ...prev.invitationCounts,
      [sessionId]: {
        accepted: (invites || []).filter(i => i.status === 'accepted').length,
        declined: (invites || []).filter(i => i.status === 'declined').length,
        pending: (invites || []).filter(i => i.status === 'pending').length,
      },
    },
  }));
};
```

Call `this.loadInvitationCounts(sessions)` at the end of `loadSessions`.

- [ ] **Step 3: Render response counters on each session card**

In the render method where sessions are listed, add response counters below each session:
```jsx
{this.state.invitationCounts[session.id] && (
  <div className="flex items-center gap-3 mt-2 text-xs">
    <span className="text-green-400">✓ {this.state.invitationCounts[session.id].accepted} accepted</span>
    <span className="text-red-400">✗ {this.state.invitationCounts[session.id].declined} declined</span>
    <span className="text-white/40">⏳ {this.state.invitationCounts[session.id].pending} pending</span>
  </div>
)}
```

- [ ] **Step 4: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard/components/TrainingScheduler.jsx
git commit -m "feat: add real-time invitation response counters to training scheduler"
```

---

### Task 6: Match Scheduler — Preset Integration + Position Gap Detection

**Files:**
- Modify: `src/pages/Dashboard/components/MatchScheduler.jsx`

- [ ] **Step 1: Import squad preset service and add state**

Add import at top:
```jsx
import { getPresets, getPresetWithPlayers } from '../../../services/squadPresetService';
```

In constructor state (line 111), add:
```jsx
presets: [],
selectionMode: 'manual', // 'manual' | 'preset' | 'all'
selectedPresetId: null,
positionWarnings: [],
realtimeChannels: {},
invitationCounts: {},
```

- [ ] **Step 2: Fetch presets on mount**

In `componentDidMount` (or wherever players are loaded), add:
```jsx
loadPresets = async () => {
  const presets = await getPresets();
  this.setState({ presets: presets || [] });
};
```

Call `this.loadPresets()` in `componentDidMount`.

- [ ] **Step 3: Add selection mode UI**

In the render method, above the player grid, add a mode selector:
```jsx
<div className="flex items-center gap-2 mb-4">
  <button
    onClick={() => this.handleSelectionMode('manual')}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${this.state.selectionMode === 'manual' ? 'bg-accent-gold text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
  >
    Manual
  </button>
  <button
    onClick={() => this.handleSelectionMode('all')}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${this.state.selectionMode === 'all' ? 'bg-accent-gold text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
  >
    All Players
  </button>
  {this.state.presets.length > 0 && (
    <select
      value={this.state.selectedPresetId || ''}
      onChange={(e) => this.handlePresetSelect(e.target.value)}
      className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-accent-gold"
    >
      <option value="">Select Preset...</option>
      {this.state.presets.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  )}
</div>
```

- [ ] **Step 4: Implement selection mode handlers**

```jsx
handleSelectionMode = (mode) => {
  if (mode === 'all') {
    // Select all non-injured players
    const injuredIds = this.state.injuredPlayerIds || new Set();
    const allIds = this.state.allPlayers
      .filter(p => !injuredIds.has(p.user_id))
      .map(p => p.user_id);
    this.setState({ selectionMode: 'all', selectedPlayerIds: new Set(allIds), selectedPresetId: null }, this.checkPositionGaps);
  } else if (mode === 'manual') {
    this.setState({ selectionMode: 'manual', selectedPlayerIds: new Set(), selectedPresetId: null, positionWarnings: [] });
  }
};

handlePresetSelect = async (presetId) => {
  if (!presetId) return;
  const preset = await getPresetWithPlayers(presetId);
  if (!preset) return;

  const injuredIds = this.state.injuredPlayerIds || new Set();
  const presetPlayerIds = (preset.players || [])
    .map(p => p.player_id)
    .filter(id => !injuredIds.has(id));

  this.setState({
    selectionMode: 'preset',
    selectedPresetId: presetId,
    selectedPlayerIds: new Set(presetPlayerIds),
  }, this.checkPositionGaps);
};
```

- [ ] **Step 5: Add position gap detection**

```jsx
checkPositionGaps = () => {
  const { selectedPlayerIds, allPlayers } = this.state;
  const selected = allPlayers.filter(p => selectedPlayerIds.has(p.user_id));

  const positions = selected.map(p => p.position);
  const warnings = [];

  const hasGK = positions.some(p => p === 'GK');
  const defCount = positions.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)).length;
  const midCount = positions.filter(p => ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(p)).length;
  const atkCount = positions.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p)).length;

  if (!hasGK) warnings.push('No GK selected');
  if (defCount === 0) warnings.push('No defenders selected');
  if (midCount === 0) warnings.push('No midfielders selected');
  if (atkCount === 0) warnings.push('No attackers selected');

  this.setState({ positionWarnings: warnings });
};
```

- [ ] **Step 6: Render position warnings**

Below the player selection grid:
```jsx
{this.state.positionWarnings.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-3">
    {this.state.positionWarnings.map((w, i) => (
      <span key={i} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
        ⚠ {w}
      </span>
    ))}
  </div>
)}
```

- [ ] **Step 7: Add real-time response counters (same pattern as Training)**

Add the same `loadInvitationCounts`, `refreshInvitationCount`, `componentWillUnmount` pattern from Task 5, but using `event_type = 'match'`.

Render counters on each match card similarly.

- [ ] **Step 8: Grey out injured players in player grid**

When rendering players in the selection grid, check against injured IDs:
```jsx
const isInjured = this.state.injuredPlayerIds?.has(player.user_id);
// Add to the player card className:
className={`... ${isInjured ? 'opacity-40 pointer-events-none' : ''}`}
// Add injury icon if injured:
{isInjured && <span className="text-red-400 text-xs">🩹 Injured</span>}
```

- [ ] **Step 9: Update notification body to include match details**

In the match creation/invitation flow, ensure the notification body includes opponent, date, time, venue. The `sendInvitations` function in `schedulingService.js` (line 254) already creates notifications. Check that the notification body is rich enough. If not, modify the `handleSubmit` to pass a custom notification body:

```jsx
// After creating match and sending invitations, create richer notifications
await createBulkNotifications(playerUserIds, {
  title: `Match Invitation: vs ${opponent}`,
  body: `${matchDate} at ${matchTime} | ${location} | ${isHome ? 'Home' : 'Away'}`,
  type: 'match_invite',
  referenceType: 'match',
  referenceId: match.id,
});
```

- [ ] **Step 10: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 11: Commit**

```bash
git add src/pages/Dashboard/components/MatchScheduler.jsx
git commit -m "feat: add preset integration, position gap detection, and real-time counters to match scheduler"
```

---

## Chunk 4: Starting 11 + Notifications

### Task 7: Starting 11 Builder Enhancements

**Files:**
- Modify: `src/pages/Dashboard/components/FormationBuilder.jsx`

- [ ] **Step 1: Add 5-4-1 formation**

At line 12, update the COMMON_FORMATIONS array:
```jsx
const COMMON_FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '5-4-1'];
```

Also add slot positions for 5-4-1 in the SLOT_POSITIONS constant (lines 17-33) if not already present.

- [ ] **Step 2: Enhance publish notifications with arrival time and bench notifications**

Find the publish/notification logic in FormationBuilder. Update it to:

1. Calculate arrival time = match_time - 1 hour
2. Send different notifications for starting 11 vs bench

```jsx
handlePublish = async () => {
  // ... existing publish logic (set published = true) ...

  const match = this.state.matches.find(m => m.id === this.state.selectedMatchId);
  if (!match) return;

  // Calculate arrival time (1 hour before match)
  const [hours, minutes] = (match.match_time || '00:00').split(':').map(Number);
  const arrivalHours = hours - 1 < 0 ? 23 : hours - 1;
  const arrivalTime = `${String(arrivalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const matchDate = new Date(match.match_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Get starting 11 player IDs from placed positions
  const startingIds = Object.values(this.state.placedPlayers).filter(Boolean);

  // Get bench player IDs (accepted but not in starting 11)
  const allAccepted = this.state.availablePlayers.map(p => p.user_id);
  const benchIds = allAccepted.filter(id => !startingIds.includes(id));

  // Notify starting 11
  if (startingIds.length > 0) {
    await createBulkNotifications(startingIds, {
      title: `Starting 11: vs ${match.opponent}`,
      body: `You're in the starting 11 on ${matchDate}. Please arrive by ${arrivalTime} at ${match.location || 'the venue'}.`,
      type: 'starting_11',
      referenceType: 'match',
      referenceId: match.id,
    });
  }

  // Notify bench
  if (benchIds.length > 0) {
    await createBulkNotifications(benchIds, {
      title: `Bench: vs ${match.opponent}`,
      body: `You're on the bench for vs ${match.opponent} on ${matchDate}.`,
      type: 'formation_published',
      referenceType: 'match',
      referenceId: match.id,
    });
  }
};
```

Make sure to import `createBulkNotifications` from notificationService if not already imported.

- [ ] **Step 3: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard/components/FormationBuilder.jsx
git commit -m "feat: add 5-4-1 formation, arrival time and bench notifications to Starting 11"
```

---

### Task 8: Notification Accept/Decline Actions

**Files:**
- Modify: `src/pages/Notifications/Notifications.jsx`

- [ ] **Step 1: Add invitation response state and imports**

Add imports at top:
```jsx
import { supabase } from '../../services/supabase';
```

Add to constructor state:
```jsx
respondingId: null,
respondedIds: new Set(),
```

- [ ] **Step 2: Add response handler**

```jsx
handleInvitationResponse = async (notification, status) => {
  this.setState({ respondingId: notification.id });

  try {
    // Find the event invitation for this user and event
    const { data: invitation, error: findError } = await supabase
      .from('event_invitations')
      .select('id')
      .eq('event_type', notification.reference_type)
      .eq('event_id', notification.reference_id)
      .eq('player_id', this.props.user?.id)
      .single();

    if (findError || !invitation) {
      console.error('Could not find invitation:', findError);
      this.setState({ respondingId: null });
      return;
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('event_invitations')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error responding to invitation:', updateError);
      this.setState({ respondingId: null });
      return;
    }

    // Mark notification as read
    await this.handleMarkAsRead(notification.id);

    this.setState(prev => ({
      respondingId: null,
      respondedIds: new Set([...prev.respondedIds, notification.id]),
    }));
  } catch (err) {
    console.error('Error responding:', err);
    this.setState({ respondingId: null });
  }
};
```

- [ ] **Step 3: Render Accept/Decline buttons for invite-type notifications**

In the notification card render (around line 155-229), after the notification body, add:
```jsx
{['training_invite', 'match_invite'].includes(notification.type) && !this.state.respondedIds.has(notification.id) && (
  <div className="flex items-center gap-2 mt-3">
    <button
      onClick={(e) => { e.stopPropagation(); this.handleInvitationResponse(notification, 'accepted'); }}
      disabled={this.state.respondingId === notification.id}
      className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors disabled:opacity-50"
    >
      {this.state.respondingId === notification.id ? 'Responding...' : '✓ Accept'}
    </button>
    <button
      onClick={(e) => { e.stopPropagation(); this.handleInvitationResponse(notification, 'declined'); }}
      disabled={this.state.respondingId === notification.id}
      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
    >
      ✗ Decline
    </button>
  </div>
)}
{this.state.respondedIds.has(notification.id) && (
  <p className="text-white/40 text-xs mt-2">Response sent</p>
)}
```

- [ ] **Step 4: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/pages/Notifications/Notifications.jsx
git commit -m "feat: add accept/decline buttons for training and match invitations in notifications"
```

---

## Chunk 5: Real-time Infrastructure + Squad Builder

### Task 9: Real-time Navbar Badge

**Files:**
- Modify: `src/components/Layout/Navbar.jsx`

- [ ] **Step 1: Subscribe to real-time notifications on mount**

The Navbar already has notification fetching logic. Find `componentDidMount` and add a Realtime subscription.

Import `subscribeToNotifications` from `notificationService` if not already imported. The service already has a `subscribeToNotifications(userId, callback)` function (lines 87-105) that returns a channel.

In `componentDidMount`:
```jsx
// Subscribe to real-time notifications
if (user?.id) {
  this.notificationChannel = subscribeToNotifications(user.id, (payload) => {
    // Refresh notifications and increment unread count
    this.fetchNotifications();
  });
}
```

In `componentWillUnmount`:
```jsx
if (this.notificationChannel) {
  supabase.removeChannel(this.notificationChannel);
}
```

This ensures the navbar badge updates live without page refresh.

- [ ] **Step 2: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout/Navbar.jsx
git commit -m "feat: add real-time notification badge updates in navbar"
```

---

### Task 10: Squad Builder — Injury Indicators

**Files:**
- Modify: `src/pages/Dashboard/components/SquadPresets.jsx`

- [ ] **Step 1: Verify injury integration**

SquadPresets already imports `injuryService` and fetches `injuredIds` (constructor state line 11). Verify that:
- Injured players are greyed out in the player selection view
- Injury icon is shown on injured players
- Position and jersey number are shown on player cards

If these are missing, add to the player card rendering:
```jsx
const isInjured = this.state.injuredIds.has(player.user_id || player.id);

<div className={`... ${isInjured ? 'opacity-40' : ''}`}>
  <span className="text-white/50 text-xs">{player.position} {player.jersey_number ? `#${player.jersey_number}` : ''}</span>
  {isInjured && <span className="text-red-400 text-xs ml-1">🩹</span>}
</div>
```

- [ ] **Step 2: Verify build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard/components/SquadPresets.jsx
git commit -m "feat: enhance squad builder with injury indicators and position display"
```

---

### Task 11: Final Build Verification + Push

- [ ] **Step 1: Full build**

Run: `npx vite build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Push to git**

```bash
git push
```
Expected: All commits pushed to main

- [ ] **Step 3: Verify Render deployment**

Check Render dashboard — latest commit should be `live`.

- [ ] **Step 4: Push any migrations to production**

```bash
echo "Y" | npx supabase db push
```

Expected: All pending migrations applied

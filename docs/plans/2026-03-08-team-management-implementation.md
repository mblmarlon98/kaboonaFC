# Kaboona FC Team Management Platform — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full team management platform with scheduling, notifications, formations, match evaluation, and mobile app support.

**Architecture:** Extend existing Supabase schema with new tables for notifications, invitations, and formations. Add services layer for scheduling and notifications. Replace mock data in CoachingZone with real DB queries. Wrap with Capacitor for Android/iOS. FCM via Supabase Edge Functions.

**Tech Stack:** React 18 (class components), Supabase (DB + Realtime + Edge Functions + Storage), Redux Toolkit, Framer Motion, Capacitor, Firebase Cloud Messaging, Tailwind CSS, Leaflet/OpenStreetMap.

---

## Task 1: Database Migration — New Tables

**Files:**
- Create: `supabase/migrations/20260308000000_team_management.sql`

**Step 1: Write the migration SQL**

```sql
-- ============================================
-- Team Management Schema Extensions
-- ============================================

-- Extend matches table for scheduling
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'friendly'
    CHECK (match_type IN ('league', 'friendly')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS score_for INTEGER,
  ADD COLUMN IF NOT EXISTS score_against INTEGER;

-- Extend training_sessions for scheduling
ALTER TABLE public.training_sessions
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Event invitations (for both matches and training)
CREATE TABLE public.event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('match', 'training')),
  event_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_type, event_id, player_id)
);

-- Formations (linked to matches)
CREATE TABLE public.formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  formation_type TEXT NOT NULL DEFAULT '4-4-2',
  positions JSONB NOT NULL DEFAULT '[]',
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'training_invite', 'match_invite', 'formation_published',
    'match_reminder', 'general', 'player_approved'
  )),
  reference_type TEXT,
  reference_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FCM device tokens
CREATE TABLE public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT DEFAULT 'web' CHECK (platform IN ('web', 'android', 'ios')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_event_invitations_event ON public.event_invitations(event_type, event_id);
CREATE INDEX idx_event_invitations_player ON public.event_invitations(player_id, status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = FALSE;
CREATE INDEX idx_device_tokens_user ON public.device_tokens(user_id);
CREATE INDEX idx_formations_match ON public.formations(match_id);

-- RLS
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Event invitations policies
CREATE POLICY "Players can view own invitations"
  ON public.event_invitations FOR SELECT
  USING (player_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ));
CREATE POLICY "Coaches can create invitations"
  ON public.event_invitations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ));
CREATE POLICY "Players can update own invitation status"
  ON public.event_invitations FOR UPDATE
  USING (player_id = auth.uid());
CREATE POLICY "Coaches can manage invitations"
  ON public.event_invitations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ));

-- Formations policies
CREATE POLICY "Published formations viewable by invited players"
  ON public.formations FOR SELECT
  USING (published = TRUE OR EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ));
CREATE POLICY "Coaches can manage formations"
  ON public.formations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ));

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')
  ) OR user_id = auth.uid());

-- Device tokens policies
CREATE POLICY "Users can manage own tokens"
  ON public.device_tokens FOR ALL
  USING (user_id = auth.uid());

-- Triggers
CREATE TRIGGER update_formations_updated_at BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_tokens_updated_at BEFORE UPDATE ON public.device_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: players with profiles and season stats
CREATE OR REPLACE VIEW public.players_full AS
SELECT
  p.*,
  pr.email,
  pr.full_name,
  pr.profile_image_url,
  pr.role,
  pr.subscription_status,
  COALESCE(SUM(ps.goals), 0) as season_goals,
  COALESCE(SUM(ps.assists), 0) as season_assists,
  COALESCE(SUM(ps.yellow_cards), 0) as season_yellows,
  COALESCE(SUM(ps.red_cards), 0) as season_reds,
  COUNT(ps.id) as matches_played
FROM public.players p
JOIN public.profiles pr ON p.user_id = pr.id
LEFT JOIN public.player_stats ps ON p.id = ps.player_id
GROUP BY p.id, pr.email, pr.full_name, pr.profile_image_url, pr.role, pr.subscription_status;
```

**Step 2: Apply the migration**

Run: `npx supabase db reset` (local) or `npx supabase migration up` if already running.

**Step 3: Commit**

```bash
git add supabase/migrations/20260308000000_team_management.sql
git commit -m "feat: add team management schema (notifications, invitations, formations)"
```

---

## Task 2: Notification Service & Redux Slice

**Files:**
- Create: `src/services/notificationService.js`
- Create: `src/redux/slices/notificationSlice.js`
- Modify: `src/redux/store.js`

**Step 1: Create notification service**

`src/services/notificationService.js` — Supabase queries for notifications CRUD, realtime subscription, and batch creation (for sending to multiple players).

Key functions:
- `getNotifications(userId)` — fetch user's notifications ordered by created_at DESC
- `getUnreadCount(userId)` — count unread notifications
- `markAsRead(notificationId)` — set read = true
- `markAllAsRead(userId)` — batch mark all as read
- `createNotification({ userId, title, body, type, referenceType, referenceId })` — insert single
- `createBulkNotifications(playerIds, { title, body, type, referenceType, referenceId })` — insert for multiple players
- `subscribeToNotifications(userId, callback)` — Supabase Realtime subscription on notifications table filtered by user_id
- `deleteNotification(notificationId)` — remove

**Step 2: Create notification Redux slice**

`src/redux/slices/notificationSlice.js` — state: `{ notifications: [], unreadCount: 0, loading: false }`
Actions: `setNotifications`, `addNotification`, `markRead`, `markAllRead`, `setUnreadCount`

**Step 3: Register slice in store**

Add `notification: notificationReducer` to `src/redux/store.js` combineReducers.

**Step 4: Commit**

```bash
git add src/services/notificationService.js src/redux/slices/notificationSlice.js src/redux/store.js
git commit -m "feat: add notification service and Redux slice"
```

---

## Task 3: Notification Bell UI in Navbar

**Files:**
- Modify: `src/components/Layout/Navbar.jsx` (replace mock notifications with real data)
- Modify: `src/App.jsx` (init notification subscription on auth)

**Step 1: Update Navbar**

Replace the hardcoded `notifications` state array with Redux-connected notification state. Add:
- Bell icon with red badge showing `unreadCount` (from Redux)
- Dropdown panel listing real notifications from DB
- Each notification: type icon (training/match/formation), title, body, relative timestamp, read/unread styling
- "Mark all as read" button in dropdown header
- Click notification → mark as read + navigate to relevant page based on `type` and `reference_id`
- On mobile: full-screen notification panel instead of dropdown

**Step 2: Initialize realtime subscription in App.jsx**

In App.jsx's auth initialization (componentDidMount), after setting the user:
- Call `subscribeToNotifications(userId, callback)` from notification service
- On new notification: dispatch `addNotification` to Redux
- Store subscription reference for cleanup in componentWillUnmount

**Step 3: Commit**

```bash
git add src/components/Layout/Navbar.jsx src/App.jsx
git commit -m "feat: wire notification bell to real-time Supabase data"
```

---

## Task 4: Scheduling Service

**Files:**
- Create: `src/services/schedulingService.js`

**Step 1: Create scheduling service**

Key functions:
- `createTrainingSession({ title, date, time, durationMinutes, location, locationLat, locationLng, notes, createdBy })` — insert into training_sessions
- `createMatch({ title, opponent, matchType, date, time, location, locationLat, locationLng, createdBy, selectedPlayerIds })` — insert into matches
- `sendInvitations(eventType, eventId, playerIds)` — bulk insert into event_invitations + call `createBulkNotifications`
- `respondToInvitation(invitationId, status)` — update event_invitations status
- `getInvitationsForEvent(eventType, eventId)` — fetch all invitations with player profiles joined
- `getMyInvitations(userId, status?)` — fetch player's own invitations
- `getUpcomingEvents(userId)` — upcoming matches + trainings for a user
- `getTrainingSessions({ status })` — list training sessions
- `getMatches({ status, matchType })` — list matches
- `updateMatch(matchId, updates)` — update match details
- `updateTrainingSession(sessionId, updates)` — update training details
- `cancelEvent(eventType, eventId)` — set status = cancelled, notify players
- `getPositionBreakdown(eventType, eventId)` — count accepted players by position group (GK, DEF, MID, FWD)

**Step 2: Commit**

```bash
git add src/services/schedulingService.js
git commit -m "feat: add scheduling service for training and match management"
```

---

## Task 5: Training Scheduler UI (Coach)

**Files:**
- Create: `src/pages/CoachingZone/components/TrainingScheduler.jsx`
- Modify: `src/pages/CoachingZone/CoachingZone.jsx` (add tab)

**Step 1: Build TrainingScheduler component**

Class component with:
- **Create Training form**: date picker, time picker, duration dropdown (1h/1.5h/2h), location input (default "Sunway University Football Field"), optional notes
- **Map preview**: Leaflet map showing pin at location (default Sunway Uni coords: 3.0673, 101.6038). Coach can click to move pin or type address.
- **"Schedule Training" button**: creates training_session → sends invitations to all active players → creates notifications
- **Upcoming trainings list**: cards showing each scheduled training with:
  - Date, time, location
  - Accept/decline count: "8/22 accepted" with progress bar
  - Position breakdown badges: "GK: 1" "DEF: 3" "MID: 2" "FWD: 2" — missing positions in red
  - Expand to see individual player responses (accepted in green, declined in red, pending in gray)
  - Cancel button

**Step 2: Add "Schedule" tab to CoachingZone**

Add a 4th tab `{ id: 'schedule', label: 'Schedule' }` to the tabs array in CoachingZone.jsx. Render `<TrainingScheduler />` when active.

**Step 3: Install Leaflet**

Run: `npm install leaflet react-leaflet`

Add Leaflet CSS import to `src/main.jsx`: `import 'leaflet/dist/leaflet.css'`

**Step 4: Commit**

```bash
git add src/pages/CoachingZone/components/TrainingScheduler.jsx src/pages/CoachingZone/CoachingZone.jsx src/main.jsx package.json
git commit -m "feat: add training scheduler with map and invitations"
```

---

## Task 6: Match Scheduler UI (Coach)

**Files:**
- Create: `src/pages/CoachingZone/components/MatchScheduler.jsx`
- Modify: `src/pages/CoachingZone/CoachingZone.jsx` (add tab or combine with training)

**Step 1: Build MatchScheduler component**

Class component with:
- **Create Match form**:
  - Match type toggle: League / Friendly
  - Opponent name text input
  - Date picker, time picker
  - Location: defaults to "The New Camp, Bandar Utama" for league, editable for friendly. Same Leaflet map as training.
  - **Player selection**: list all active players with checkboxes, filter by position. Show FIFA card mini (xs) for each. Select all / deselect all buttons.
- **"Schedule Match" button**: creates match → sends invitations to SELECTED players only → creates notifications
- **Upcoming matches list**: similar to training but shows:
  - Opponent, match type badge (league=gold, friendly=blue)
  - Accept/decline count from selected players
  - "Set Formation" button → navigates to formation tab with this match pre-selected
  - "Evaluate" button (after match date has passed) → navigates to evaluation tab
  - Cancel button

**Step 2: Reorganize CoachingZone tabs**

New tab order:
1. Schedule (combined training + match, with sub-toggle)
2. Formation Builder
3. Squad Selection
4. Match Evaluation

Or keep them as separate tabs:
1. Training
2. Matches
3. Formation
4. Evaluation

Recommend: Combined "Schedule" tab with training/match sub-sections.

**Step 3: Commit**

```bash
git add src/pages/CoachingZone/components/MatchScheduler.jsx src/pages/CoachingZone/CoachingZone.jsx
git commit -m "feat: add match scheduler with player selection and notifications"
```

---

## Task 7: Player Invitation Response UI

**Files:**
- Create: `src/pages/CoachingZone/components/EventInvitation.jsx`
- Create: `src/pages/Profile/components/UpcomingEvents.jsx`
- Modify: `src/pages/Profile/Profile.jsx` (add upcoming events section)

**Step 1: Build EventInvitation component**

Reusable component showing an event invitation card:
- Event type icon (training whistle / match ball)
- Title, date/time, location
- Accept / Decline buttons (update event_invitations via schedulingService)
- Shows current status if already responded

**Step 2: Build UpcomingEvents component**

Shows on player's Profile page:
- List of pending + accepted invitations for upcoming events
- Each renders EventInvitation component
- Section header: "Upcoming Events"
- Grouped by: "This Week" / "Later"

**Step 3: Add to Profile page**

Insert UpcomingEvents component into Profile.jsx between QuickStats and RecentMatches sections.

**Step 4: Commit**

```bash
git add src/pages/CoachingZone/components/EventInvitation.jsx src/pages/Profile/components/UpcomingEvents.jsx src/pages/Profile/Profile.jsx
git commit -m "feat: add player invitation response UI and upcoming events on profile"
```

---

## Task 8: Match Evaluation — Wire to Real Data

**Files:**
- Modify: `src/pages/CoachingZone/components/MatchEvaluation.jsx`

**Step 1: Replace mock data with real data**

- Fetch completed matches from DB (matches where date <= today and status = 'scheduled' or 'completed')
- Show match selector dropdown at top
- On match select: fetch event_invitations for that match (accepted players)
- Fetch existing player_stats for that match (if already evaluated, show saved values)
- Per player form fields: goals (number input), assists, yellow cards, red cards, minutes played, rating (1-10 slider)
- Match result: score_for, score_against inputs
- "Save Evaluation" button: upserts player_stats rows + updates match result/status to 'completed'
- Show success message with updated season totals

**Step 2: Commit**

```bash
git add src/pages/CoachingZone/components/MatchEvaluation.jsx
git commit -m "feat: wire match evaluation to real Supabase data"
```

---

## Task 9: Formation Builder — Wire to Real Data + Publish

**Files:**
- Modify: `src/pages/CoachingZone/components/FormationBuilder.jsx`

**Step 1: Replace mock data with real data**

- Fetch upcoming matches from DB
- Match selector dropdown at top
- Fetch accepted players for selected match from event_invitations (joined with players table for stats)
- Sidebar shows real player cards (xs size) grouped by position, draggable
- Pitch uses existing FormationPitch component
- Formation type selector uses existing FORMATIONS config
- Load existing formation from DB if one exists for this match
- **"Save Formation"** button: upserts formations row (published = false)
- **"Publish Formation"** button: sets published = true + creates notification for all match players ("Formation published for vs {opponent}")
- Players can then view the formation (read-only) from their notification or profile

**Step 2: Create player-facing formation view**

Create route `/match/:matchId/formation` — shows FormationPitch in read-only mode with the player's position highlighted in gold. Accessible from notification click.

**Step 3: Commit**

```bash
git add src/pages/CoachingZone/components/FormationBuilder.jsx
git commit -m "feat: wire formation builder to real data with publish flow"
```

---

## Task 10: Squad Selection — Wire to Real Data

**Files:**
- Modify: `src/pages/CoachingZone/components/SquadSelection.jsx`

**Step 1: Replace mock data**

- Fetch all active players from players_full view
- Show real player cards with actual stats, positions, photos
- Filter/sort by position, overall rating, name
- Show scraped AGD Sports stats alongside DB stats (goals, assists from league-live.json matched by name)
- Coach can click a player to view full card + edit their stats (opens modal with stat sliders)

**Step 2: Commit**

```bash
git add src/pages/CoachingZone/components/SquadSelection.jsx
git commit -m "feat: wire squad selection to real player data"
```

---

## Task 11: Training Drill Suggestions with Animations

**Files:**
- Create: `src/pages/CoachingZone/components/DrillSuggestions.jsx`
- Modify: `src/pages/CoachingZone/components/TrainingScheduler.jsx` (show after players respond)

**Step 1: Build DrillSuggestions component**

Props: `acceptedPlayers` (array with positions)

Analyze available positions and suggest drills:
- **Passing Drill** (6+ players): SVG pitch with animated dots in triangle/rondo pattern, ball (small circle) moves between them via Framer Motion `animate` with keyframes
- **Shooting Drill** (need GK + 3 attackers): SVG with GK dot in goal, attacker dots taking turns shooting (ball animates from player to goal)
- **Defensive Shape** (4+ DEF): SVG with defensive line dots sliding left/right in sync
- **Small-Sided Game** (8+): SVG mini pitch with two teams of dots, ball moving between them
- **Fitness/Running** (any count): SVG with player dots running laps around the pitch perimeter

Each drill card:
- Title, minimum players needed, description
- Animated SVG preview (200x150px, loops infinitely)
- "Recommended" badge if player count fits

Use Framer Motion for all animations on SVG elements:
```jsx
<motion.circle
  cx={50} cy={50} r={4}
  animate={{ cx: [50, 80, 30, 50], cy: [50, 30, 70, 50] }}
  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
/>
```

**Step 2: Integrate into TrainingScheduler**

When viewing a training session with accepted players, show DrillSuggestions below the player response list.

**Step 3: Commit**

```bash
git add src/pages/CoachingZone/components/DrillSuggestions.jsx src/pages/CoachingZone/components/TrainingScheduler.jsx
git commit -m "feat: add animated training drill suggestions based on available players"
```

---

## Task 12: Capacitor Setup

**Files:**
- Create: `capacitor.config.ts`
- Modify: `package.json` (add capacitor scripts)

**Step 1: Install Capacitor**

```bash
npm install @capacitor/core @capacitor/cli @capacitor/push-notifications @capacitor/geolocation
npx cap init "Kaboona FC" "com.kaboonafc.app" --web-dir dist
```

**Step 2: Configure capacitor.config.ts**

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaboonafc.app',
  appName: 'Kaboona FC',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

**Step 3: Add platforms**

```bash
npx cap add android
npx cap add ios
```

**Step 4: Add scripts to package.json**

```json
{
  "cap:build": "npm run build && npx cap sync",
  "cap:android": "npx cap open android",
  "cap:ios": "npx cap open ios"
}
```

**Step 5: Commit**

```bash
git add capacitor.config.ts package.json android/ ios/
git commit -m "feat: add Capacitor setup for Android and iOS"
```

---

## Task 13: FCM Push Notifications — Service & Edge Function

**Files:**
- Create: `src/services/pushNotificationService.js` (client-side FCM token registration)
- Create: `supabase/functions/send-push-notification/index.ts` (Edge Function)
- Create: `firebase-messaging-sw.js` in `public/` (service worker for web push)

**Step 1: Create Firebase project**

1. Go to Firebase Console → Create project "Kaboona FC"
2. Add Web app → get config (apiKey, messagingSenderId, etc.)
3. Add Android app (com.kaboonafc.app) → download google-services.json → place in android/app/
4. Enable Cloud Messaging in project settings

**Step 2: Create client-side push service**

`src/services/pushNotificationService.js`:
- `initializePush()` — detect platform (web vs native via Capacitor)
  - Web: request permission via Notification API, get FCM token via Firebase SDK
  - Native: use @capacitor/push-notifications to register and get token
- `saveToken(userId, token, platform)` — upsert to device_tokens table
- `removeToken(token)` — delete from device_tokens on logout

**Step 3: Create Edge Function**

`supabase/functions/send-push-notification/index.ts`:
- Triggered via Supabase webhook on `notifications` table INSERT
- Reads the notification row → fetches user's device_tokens
- Sends FCM message via FCM HTTP v1 API using service account key
- Cleans up invalid tokens (404 responses)

**Step 4: Create web service worker**

`public/firebase-messaging-sw.js`:
- Handles background push notifications on web
- Shows native browser notification with title/body from FCM payload

**Step 5: Commit**

```bash
git add src/services/pushNotificationService.js supabase/functions/ public/firebase-messaging-sw.js
git commit -m "feat: add FCM push notification support (web + native)"
```

---

## Task 14: GPS Attendance

**Files:**
- Create: `src/services/attendanceService.js`
- Create: `src/pages/Profile/components/CheckInButton.jsx`

**Step 1: Create attendance service**

`src/services/attendanceService.js`:
- `checkIn(userId, eventType, eventId, lat, lng, venueLat, venueLng)`:
  - Calculate distance using Haversine formula
  - If distance <= 100m: insert attendance with status = 'verified'
  - If distance > 100m: insert with status = 'pending' (coach can manually approve)
- `getAttendanceForEvent(eventType, eventId)` — list who checked in
- `getCurrentLocation()` — wrapper around Capacitor Geolocation / browser navigator.geolocation
- `approveAttendance(attendanceId)` — coach manual approval

**Step 2: Build CheckInButton component**

Shows on player's UpcomingEvents card for today's events:
- "Check In" button (green, pulsing)
- On click: get GPS location → call checkIn
- Show result: "Checked in! (15m from venue)" or "Too far (2.3km) — pending approval"
- After check-in: button changes to "Checked In ✓"

**Step 3: Commit**

```bash
git add src/services/attendanceService.js src/pages/Profile/components/CheckInButton.jsx
git commit -m "feat: add GPS-based attendance check-in"
```

---

## Task 15: Player Registration Flow Enhancement

**Files:**
- Modify: `src/pages/Auth/Register.jsx` (add role selection)
- Modify: `src/pages/Profile/ProfileEdit.jsx` (detect first-time setup)
- Modify: `src/pages/Admin/components/PlayersManagement.jsx` (approve flow with real data)

**Step 1: Add role to registration**

On Register page, after email/password fields, add:
- "I am a..." toggle: Player / Fan
- If Player selected: after signup, redirect to `/profile/edit` with `?setup=true` query param

**Step 2: First-time profile setup wizard**

In ProfileEdit.jsx, detect `?setup=true`:
- Show wizard mode (step indicators, Next/Back buttons)
- Step 1: Photo, name, country
- Step 2: Position, number, preferred foot
- Step 3: Self-rate stats with sliders
- On final submit: create player record in DB with status pending, notify coach

**Step 3: Admin player approval**

In PlayersManagement.jsx, replace mock data:
- Fetch real players from players_full view
- "Pending" tab shows players where profile subscription_status = 'none' and recently created
- Approve button: updates profile role to 'player', creates notification for the player
- Edit button: opens modal with stat sliders (coach can override self-rated stats)
- Show scraped AGD Sports stats when available (matched by name)

**Step 4: Commit**

```bash
git add src/pages/Auth/Register.jsx src/pages/Profile/ProfileEdit.jsx src/pages/Admin/components/PlayersManagement.jsx
git commit -m "feat: enhance player registration with wizard and coach approval flow"
```

---

## Task 16: Match Reminder Notifications (3h before)

**Files:**
- Create: `supabase/functions/match-reminder/index.ts`

**Step 1: Create Edge Function for scheduled reminders**

Uses Supabase pg_cron or a scheduled Edge Function (runs every 30 minutes):
- Query matches where `match_date + match_time - 3 hours` is within the last 30 minutes
- For each match: get accepted invitations → create notification "Match vs {opponent} in 3 hours!"
- Mark match as "reminded" to avoid duplicate notifications (add `reminded BOOLEAN DEFAULT FALSE` to matches)

Alternative (simpler): Use Supabase's built-in cron extension:
```sql
SELECT cron.schedule('match-reminders', '*/30 * * * *', $$
  INSERT INTO public.notifications (user_id, title, body, type, reference_type, reference_id)
  SELECT ei.player_id,
    'Match Reminder',
    'Match vs ' || m.opponent || ' starts in 3 hours!',
    'match_reminder', 'match', m.id
  FROM public.matches m
  JOIN public.event_invitations ei ON ei.event_id = m.id AND ei.event_type = 'match' AND ei.status = 'accepted'
  WHERE m.status = 'scheduled'
    AND m.match_date = CURRENT_DATE
    AND m.match_time - INTERVAL '3 hours' <= CURRENT_TIME
    AND m.match_time - INTERVAL '2.5 hours' > CURRENT_TIME
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.reference_id = m.id AND n.type = 'match_reminder' AND n.user_id = ei.player_id
    )
$$);
```

**Step 2: Commit**

```bash
git add supabase/functions/match-reminder/ supabase/migrations/
git commit -m "feat: add 3-hour match reminder notifications via pg_cron"
```

---

## Execution Order & Dependencies

```
Task 1 (DB Schema) ─────────┬──► Task 2 (Notification Service)
                             │       └──► Task 3 (Notification Bell UI)
                             │
                             ├──► Task 4 (Scheduling Service)
                             │       ├──► Task 5 (Training Scheduler)
                             │       ├──► Task 6 (Match Scheduler)
                             │       └──► Task 7 (Player Invitation UI)
                             │
                             ├──► Task 8 (Match Evaluation)
                             ├──► Task 9 (Formation Builder)
                             ├──► Task 10 (Squad Selection)
                             └──► Task 15 (Player Registration)

Task 5 ──► Task 11 (Drill Suggestions)
Task 3 ──► Task 13 (FCM Push)
Task 7 ──► Task 14 (GPS Attendance)
Task 12 (Capacitor) — independent, can run in parallel
Task 16 (Match Reminders) — after Task 4 + Task 2
```

**Parallelizable groups:**
- Group A: Tasks 2+3 (notifications)
- Group B: Tasks 4+5+6+7 (scheduling)
- Group C: Tasks 8+9+10 (coaching zone rewire)
- Group D: Task 12 (Capacitor — fully independent)
- Group E: Tasks 13+14 (push + GPS — after groups A+B)
- Group F: Task 15 (registration — after Task 1)
- Group G: Tasks 11+16 (enhancements — after groups A+B)

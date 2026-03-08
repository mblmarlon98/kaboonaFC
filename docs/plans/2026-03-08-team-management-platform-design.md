# Kaboona FC Team Management Platform — Design

## Architecture

```
React Web App (existing)
  ├── Capacitor Shell → Android APK / iOS IPA
  ├── Supabase Backend (auth, DB, realtime, storage, edge functions)
  ├── Firebase Cloud Messaging (push notifications)
  └── Data Pipeline (AGD Sports scraper → league-live.json → DB sync)
```

Roles: `player`, `coach`, `admin` (coach and admin can overlap)

Scraped data from AGD Sports is the seed — coach overrides take priority.

## Database Schema Changes

### New Tables

**`scheduled_events`**
- `id`, `type` (training/league_match/friendly_match), `title`, `date`, `time`, `duration_minutes`
- `location_name`, `location_lat`, `location_lng`
- Defaults: Sunway Uni for training, New Camp Bandar Utama for league
- `created_by` (coach user_id), `status` (scheduled/completed/cancelled)
- `notify_at` (for 3h-before match reminders)

**`event_invitations`**
- `event_id`, `player_id`, `status` (pending/accepted/declined), `responded_at`

**`formations`**
- `event_id` FK, `formation_type` (e.g. "4-3-3"), `published` (boolean)
- `positions` JSONB: `[{ slot: "ST", player_id: "uuid", x: 50, y: 15 }, ...]`

**`notifications`**
- `user_id`, `title`, `body`, `type` (training_invite/match_invite/formation_published/general)
- `reference_id` (links to event), `read` (boolean), `created_at`

**`device_tokens`**
- `user_id`, `token`, `platform` (web/android/ios), `created_at`

**`player_match_stats`**
- `event_id`, `player_id`, `goals`, `assists`, `yellow_cards`, `red_cards`
- `minutes_played`, `rating` (1-10), `created_by` (coach)

## Feature Sections

### 1. Player Registration & Profile

- Sign up → Profile Setup wizard (3 steps: personal, position, self-rate stats)
- Profile starts as `pending` until coach approves
- Scraped data: "Official Stats" badge; Coach data: "Club Stats" (editable)
- Ghost entries for unregistered players from AGD Sports
- Overall rating computed from coach-adjusted stats after approval

### 2. Coach Dashboard — Scheduling

**Training Scheduler:**
- Date, time, duration (default 2h), location (default Sunway Uni)
- Notifies all active players
- Live accept/decline count with position breakdown
- Missing positions highlighted in red

**Training Drill Suggestions:**
- Based on accepted players' positions
- Categories: passing, shooting, defensive shape, small-sided game
- Animated SVG pitch with Framer Motion dots/ball

**Match Scheduler:**
- Type (league/friendly), opponent, date, time
- Location defaults by type, editable via text + map
- Coach selects specific players → only they get notified
- Two notifications: on schedule + 3h before kickoff

**Match Evaluation (post-match):**
- Per player: goals, assists, yellow/red cards, minutes, rating (1-10)
- Season totals recompute via DB aggregation
- Match result recorded

### 3. Formation Builder

- Full-screen SVG pitch with field markings
- Formation template picker (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 3-4-3, 5-3-2)
- Drag players from sidebar onto position slots
- Smart position highlighting (green glow for natural fits)
- "Publish Formation" → notifies selected players
- Players see read-only pitch with their position highlighted in gold

### 4. Notifications & FCM

**In-app:**
- Bell icon in Navbar with red unread badge
- Dropdown/full-page notification list
- Supabase Realtime for live updates

**Push (FCM):**
- device_tokens table for multi-device support
- Supabase Edge Function triggered by DB webhook on notifications insert
- Token cleanup for expired/invalid tokens

### 5. Capacitor Mobile App

- `@capacitor/core`, `@capacitor/push-notifications`, `@capacitor/geolocation`
- Build: `npm run build` → `npx cap sync` → Android Studio / Xcode
- Firebase google-services.json for Android, APNs for iOS

### 6. GPS Attendance

- On training day, app checks player location
- Within 100m of event coordinates → auto-mark present
- Uses existing `attendance` table columns (check_in_lat, check_in_lng, distance_from_venue)
- Coach sees real-time attendance as players arrive

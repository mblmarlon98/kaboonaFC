# Role-Based Dashboard Restructuring — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure separate admin/coaching/marketing zone pages into a unified role-filtered dashboard at `/dashboard/*` with role-based calendars and new features (events, attendance, player notes, activity log).

**Architecture:** Single dashboard shell with collapsible sidebar filtered by user roles. Renders outside the global `<Layout>` wrapper in App.jsx. Existing Admin and CoachingZone components are moved (not rewritten) into the new Dashboard structure. New shared Calendar component powers all role-based calendar views.

**Tech Stack:** React (class components), Redux, Supabase (PostgreSQL + Auth + Storage + RLS), Tailwind CSS dark theme, Framer Motion, Recharts

**Spec:** `docs/superpowers/specs/2026-03-15-role-based-dashboard-design.md`

---

## Chunk 1: Database Migration + Dashboard Shell

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260315100000_dashboard_restructure.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- Events table for marketing/community events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  type TEXT NOT NULL DEFAULT 'fan_event',
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for published events"
  ON events FOR SELECT
  USING (is_public = true);

CREATE POLICY "Staff read all events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('marketing', 'editor', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['marketing', 'editor', 'admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Marketing/admin manage events"
  ON events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('marketing', 'editor', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['marketing', 'editor', 'admin', 'super_admin']
      )
    )
  );

-- Player notes table
CREATE TABLE IF NOT EXISTS player_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE player_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaching staff read player notes"
  ON player_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('coach', 'owner', 'manager', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['coach', 'owner', 'manager', 'admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Coaching staff write player notes"
  ON player_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('coach', 'owner', 'manager', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['coach', 'owner', 'manager', 'admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Coaching staff update player notes"
  ON player_notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('coach', 'owner', 'manager', 'admin', 'super_admin')
        OR profiles.roles && ARRAY['coach', 'owner', 'manager', 'admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Author or admin delete player notes"
  ON player_notes FOR DELETE
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'super_admin')
        OR profiles.roles && ARRAY['admin', 'super_admin']
      )
    )
  );

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read activity log"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'super_admin')
        OR profiles.roles && ARRAY['admin', 'super_admin']
      )
    )
  );

CREATE POLICY "Authenticated insert activity log"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

- [ ] **Step 2: Apply migration locally**

Run: `npx supabase db reset`
Expected: Migration applies without errors. Verify tables exist:
Run: `npx supabase db reset 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260315100000_dashboard_restructure.sql
git commit -m "feat: add events, player_notes, activity_log tables with RLS"
```

---

### Task 2: Dashboard Shell — Sidebar Component

**Files:**
- Create: `src/pages/Dashboard/DashboardSidebar.jsx`

This is the core navigation component. It defines sidebar groups filtered by the user's roles.

- [ ] **Step 1: Create the DashboardSidebar component**

The sidebar must:
- Accept `user`, `collapsed`, and `onToggle` props
- Define sidebar groups with role-based visibility
- Use the same styling pattern as existing AdminSidebar (bg-surface-dark-elevated, accent-gold active states)
- Support collapsed mode (80px with icon-only + tooltips)
- Use Framer Motion for width animation
- Include "Public Site" group at bottom for staff to access public pages
- Use NavLink for active state detection

Key implementation details:
- Sidebar groups array: each group has `label`, `roles` (array of roles that can see it), `items` (array of {to, label, icon})
- Filter logic: `group.roles === 'all'` or `group.roles.some(r => user.hasRole(r))`
- Icons: use inline SVG paths (matching existing AdminSidebar pattern)
- Fixed positioning: `left-0 top-0 h-screen z-50`
- Width: collapsed=80px, expanded=256px (matches Admin)
- localStorage key: `dashboardSidebarCollapsed`

Sidebar groups definition:
```
Overview: [Dashboard Home (/dashboard), Calendar (/dashboard/calendar)] — all staff
Coaching: [Training, Matches, Formation, Squad, Match Eval, Attendance, Player Notes] — coach, owner, manager, admin
Marketing & Content: [Content Mgmt, News Articles (/dashboard/content?tab=news), Events] — editor, marketing, admin
Finance: [Payments, Investors Mgmt] — admin, owner
System: [Players Mgmt, Staff Mgmt, Analytics, Activity Log, User Mgmt (super_admin only)] — admin
Public Site: [Fan Portal, Our Team, Stats, Shop, Investors] — all staff (external links)
```

Mobile behavior (< md breakpoint):
- Sidebar is **hidden by default** on mobile
- Toggled via hamburger icon in DashboardHeader as a **slide-over overlay** with semi-transparent backdrop
- Track `mobileOpen` state separately from `collapsed` (desktop collapses to icons, mobile hides entirely)
- Clicking a nav link on mobile auto-closes the sidebar
- Backdrop click also closes the sidebar

- [ ] **Step 2: Verify sidebar renders**

Run: `npm run dev`
Navigate to `/dashboard` (will be wired in Task 5)
Expected: Sidebar visible with correct groups based on logged-in user's role

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard/DashboardSidebar.jsx
git commit -m "feat: add DashboardSidebar with role-filtered navigation groups"
```

---

### Task 3: Dashboard Shell — Header Component

**Files:**
- Create: `src/pages/Dashboard/DashboardHeader.jsx`

- [ ] **Step 1: Create the DashboardHeader component**

The header must:
- Accept `user`, `sidebarCollapsed`, `onToggleSidebar` props
- Connect to Redux for notifications (use `notificationSlice` state)
- Sticky positioning with `z-40`
- Left: hamburger toggle button + "Dashboard" title (or role-specific title)
- Right: notification bell with unread count badge + user avatar/name + role badge
- Notification dropdown (reuse pattern from current Admin.jsx lines ~280-340)
- Use existing dark theme: `bg-surface-dark-elevated border-b border-white/10`

Role-specific title logic:
- admin/super_admin → "Admin Dashboard"
- coach/owner/manager → "Coaching Zone"
- editor/marketing → "Marketing Zone"
- Fallback → "Dashboard"

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard/DashboardHeader.jsx
git commit -m "feat: add DashboardHeader with notifications and role-aware title"
```

---

### Task 4: Dashboard Shell — Main Layout

**Files:**
- Create: `src/pages/Dashboard/Dashboard.jsx`

- [ ] **Step 1: Create the Dashboard shell component**

The Dashboard must:
- Be a class component connected to Redux (user, loading from authSlice)
- Check if user has any staff role (admin, super_admin, coach, owner, manager, editor, marketing)
- Render access denied if not staff
- Render loading spinner while auth loading
- Layout: DashboardSidebar (fixed left) + DashboardHeader (sticky top) + content area (scrollable)
- Content area uses `<Routes>` for nested routing
- Sidebar collapse state from localStorage
- Main content margin: `ml-64` (expanded) or `ml-20` (collapsed) — same as current Admin

Nested routes to define (all lazy-loaded is optional, direct imports fine):
```
index → DashboardHome
calendar → Calendar
training → TrainingScheduler
matches → MatchScheduler
formation → FormationBuilder
squad → SquadSelection
match-evaluation → MatchEvaluation
attendance → PlayerAttendance
player-notes → PlayerNotes
content → ContentManagement
events → EventsManagement
payments → PaymentsOverview
investors → InvestorsManagement
players → PlayersManagement
staff → StaffPlayerManagement
analytics → UserAnalytics
activity-log → ActivityLog
users → UserManagement (super_admin only)
super → SuperAdminOverview (super_admin only)
```

Import existing components from their current locations first (we move files in Task 6).

- [ ] **Step 2: Commit**

```bash
git add src/pages/Dashboard/Dashboard.jsx
git commit -m "feat: add Dashboard shell with nested routing and role-based access"
```

---

### Task 5: Wire Dashboard into App.jsx + Redirects

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Restructure App.jsx routing**

Changes needed:
1. Import Dashboard component
2. Split the top-level `<Routes>` so `/dashboard/*` renders Dashboard directly (outside Layout)
3. All other routes stay inside Layout as-is
4. Add redirect routes from old zone URLs:
   - `/admin` → `/dashboard`
   - `/admin/players` → `/dashboard/players`
   - `/admin/content` → `/dashboard/content`
   - `/admin/training` → `/dashboard/training`
   - `/admin/payments` → `/dashboard/payments`
   - `/admin/investors` → `/dashboard/investors`
   - `/admin/analytics` → `/dashboard/analytics`
   - `/admin/staff` → `/dashboard/staff`
   - `/admin/super` → `/dashboard/super`
   - `/admin/users` → `/dashboard/users`
   - `/coaching-zone` → `/dashboard/training`
   - `/content-zone` → `/dashboard/content`
   - `/marketing-zone` → `/dashboard/events`

Pattern in App.jsx render:
```jsx
<Routes>
  {/* Dashboard renders outside Layout — ProtectedRoute reads user/loading from Redux internally */}
  <Route path="/dashboard/*" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />

  {/* Redirects from old zone URLs */}
  <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
  <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
  <Route path="/coaching-zone" element={<Navigate to="/dashboard/training" replace />} />
  <Route path="/content-zone" element={<Navigate to="/dashboard/content" replace />} />
  <Route path="/marketing-zone" element={<Navigate to="/dashboard/events" replace />} />

  {/* All public/other routes inside Layout */}
  <Route path="/*" element={
    <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user}>
      <Routes>
        {/* ...existing routes... */}
      </Routes>
    </Layout>
  } />
</Routes>
```

Note: This requires restructuring the current single `<Layout><Routes>...</Routes></Layout>` pattern into a top-level Routes with two branches.

- [ ] **Step 2: Verify routing works**

Run: `npm run dev`
- Navigate to `/dashboard` → should show Dashboard shell
- Navigate to `/admin` → should redirect to `/dashboard`
- Navigate to `/coaching-zone` → should redirect to `/dashboard/training`
- Navigate to `/` → should show Home inside Layout with Navbar
- Navigate to `/fan-portal` → should show Fan Portal inside Layout with Navbar

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire /dashboard/* route outside Layout, add redirects from old zone URLs"
```

---

## Chunk 2: Component Migration + Navbar

### Task 6: Move Existing Components into Dashboard

**Files:**
- Move: `src/pages/Admin/components/*.jsx` → `src/pages/Dashboard/components/`
- Move: `src/pages/CoachingZone/components/*.jsx` → `src/pages/Dashboard/components/`
- Modify: `src/pages/Dashboard/Dashboard.jsx` (update import paths)

- [ ] **Step 1: Move Admin components**

Move these files from `src/pages/Admin/components/` to `src/pages/Dashboard/components/`:
- ContentManagement.jsx
- DashboardOverview.jsx (keep as reference, rename to AdminOverview.jsx)
- InvestorsManagement.jsx
- PaymentsOverview.jsx
- PlayersManagement.jsx
- StaffPlayerManagement.jsx
- SuperAdminOverview.jsx
- TrainingManagement.jsx
- UserAnalytics.jsx
- UserManagement.jsx

Do NOT move AdminSidebar.jsx (it's replaced by DashboardSidebar).

- [ ] **Step 2: Move CoachingZone components**

Move these files from `src/pages/CoachingZone/components/` to `src/pages/Dashboard/components/`:
- DrillSuggestions.jsx
- FormationBuilder.jsx
- MatchEvaluation.jsx
- MatchScheduler.jsx
- SquadSelection.jsx
- TrainingScheduler.jsx

- [ ] **Step 3: Update import paths in Dashboard.jsx**

Change all imports in `src/pages/Dashboard/Dashboard.jsx` to reference `./components/` instead of the old locations.

- [ ] **Step 4: Update internal imports within moved components**

Some moved components may import from each other (e.g., TrainingScheduler imports DrillSuggestions). Update these relative imports to work from the new `Dashboard/components/` location.

- [ ] **Step 5: Verify everything still renders**

Run: `npm run dev`
Navigate to `/dashboard/training`, `/dashboard/content`, `/dashboard/players` etc.
Expected: All pages render correctly from new file locations.

- [ ] **Step 6: Remove old shell pages**

Delete (or leave as empty redirects):
- `src/pages/Admin/Admin.jsx` — no longer needed (Dashboard replaces it)
- `src/pages/Admin/components/AdminSidebar.jsx` — replaced by DashboardSidebar
- `src/pages/CoachingZone/CoachingZone.jsx` — no longer needed

Keep the `Admin/` and `CoachingZone/` directories if they still have files, otherwise remove.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: move admin and coaching components into unified Dashboard"
```

---

### Task 7: Navbar Role-Based Filtering

**Files:**
- Modify: `src/components/Layout/Navbar.jsx`

- [ ] **Step 1: Update navbar link logic**

Current logic (lines ~497-533) builds `navLinks` array with all public links, then pushes role-based zone links.

New logic:
1. Determine if user is "staff" (has any role besides fan/player)
2. If NOT staff (or not logged in): keep current navLinks as-is (Home, Our Team, Stats, Shop, Fan Portal, Investors)
3. If staff: strip navbar to just Home + role-based dashboard link(s):
   - If user has admin/super_admin → show only "Admin" linking to `/dashboard`
   - Else build links based on roles:
     - coach/owner/manager → "Coaching Zone" → `/dashboard`
     - editor/marketing → "Marketing Zone" → `/dashboard`

```javascript
const isStaff = user && (
  hasRole('admin') || hasRole('super_admin') || hasRole('coach') ||
  hasRole('owner') || hasRole('manager') || hasRole('editor') || hasRole('marketing')
);

if (!isStaff) {
  // Current public links array unchanged
  navLinks = [
    { to: '/', label: 'Home' },
    { to: '/our-team', label: 'Our Team' },
    { to: '/stats', label: 'Stats' },
    { to: '/shop', label: 'Shop' },
    { to: '/fan-portal', label: 'Fan Portal' },
    { to: '/investors', label: 'Investors' },
  ];
} else {
  navLinks = [{ to: '/', label: 'Home' }];

  if (hasRole('admin') || hasRole('super_admin')) {
    navLinks.push({ to: '/dashboard', label: 'Admin' });
  } else {
    if (hasRole('coach') || hasRole('owner') || hasRole('manager')) {
      navLinks.push({ to: '/dashboard', label: 'Coaching Zone' });
    }
    if (hasRole('editor') || hasRole('marketing')) {
      navLinks.push({ to: '/dashboard', label: 'Marketing Zone' });
    }
  }
}
```

- [ ] **Step 2: Verify navbar**

Run: `npm run dev`
- Log in as admin → navbar shows: Home, Admin
- Log in as coach → navbar shows: Home, Coaching Zone
- Log in as fan → navbar shows: Home, Our Team, Stats, Shop, Fan Portal, Investors
- Not logged in → full public nav

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout/Navbar.jsx
git commit -m "feat: simplify navbar for staff users with role-based dashboard links"
```

---

## Chunk 3: DashboardHome + Calendar

### Task 8: DashboardHome — Role-Aware Welcome Page

**Files:**
- Create: `src/pages/Dashboard/DashboardHome.jsx`

- [ ] **Step 1: Create DashboardHome component**

The DashboardHome must:
- Accept `user` prop (or read from Redux)
- Show a welcome message with user's name and role
- Display role-aware quick stat cards (Framer Motion stagger animation):
  - **Coaches**: Next Training (date), Next Match (date+opponent), Training Attendance Rate (%)
  - **Marketing/Editor**: Upcoming Events (count), Published Articles (count), Draft Articles (count)
  - **Admin**: All of the above + Total Users (count), Pending Player Requests (count)
- Display a mini calendar widget showing next 7 days of events (filtered by role)
- Fetch data from Supabase on mount:
  - Coaches: query `trainings` and `matches` tables for upcoming, count attendance from `event_invitations`
  - Marketing: query `events` and `news_articles` tables for counts
  - Admin: all of the above + count from `profiles` + count pending from `profiles` where `player_request_status = 'pending'`

Styling: Match existing DashboardOverview pattern — stat cards in a grid, each with icon, title, value, colored accent.

- [ ] **Step 2: Wire into Dashboard.jsx as index route**

In Dashboard.jsx, the index route should render `<DashboardHome />`.

- [ ] **Step 3: Verify**

Run: `npm run dev`
Navigate to `/dashboard`
Expected: Welcome page with stats relevant to logged-in user's role

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard/DashboardHome.jsx src/pages/Dashboard/Dashboard.jsx
git commit -m "feat: add DashboardHome with role-aware stats and welcome page"
```

---

### Task 9: Shared Calendar Component

**Files:**
- Create: `src/pages/Dashboard/components/Calendar.jsx`
- Create: `src/pages/Dashboard/components/CalendarEventModal.jsx`

- [ ] **Step 1: Create Calendar component**

The Calendar must:
- Accept `userRoles` prop (array) to filter visible event types
- Accept `readOnly` prop (boolean) for Fan Portal use
- Support 3 views: month, week, list (toggle buttons at top)
- Color-code events: blue=training, red=match, green=event
- Fetch from Supabase on mount and when month changes:
  - If roles include coach/owner/manager/admin: fetch trainings + matches for date range
  - If roles include editor/marketing/admin: fetch events + matches (read-only) for date range
  - If readOnly: fetch all public events
- Month view: grid of days, events shown as colored dots or chips
- Week view: 7-column layout with time slots
- List view: chronological list of upcoming events (simplest, good default)
- Click on event → open CalendarEventModal
- If not readOnly: "Create" button filtered by role (coaches create training/match, marketing creates event, admin creates any)
- Admin users see filter toggle pills (Training / Match / Event) to show/hide event types

Implementation approach: Build a custom calendar (no external library) to stay consistent with existing patterns. Use a simple grid for month view.

- [ ] **Step 2: Create CalendarEventModal**

Modal for viewing/creating/editing events:
- View mode: show event details (title, date, time, location, type, description)
- Create mode: form with fields based on event type
  - Training: title, date, time, location, notes
  - Match: opponent, date, time, venue, type (friendly/league/cup)
  - Event: title, description, date, end_date, location, type, image_url, is_public
- Edit mode: same as create but pre-filled
- Save → Supabase insert/update
- Delete button (with confirmation)
- Framer Motion enter/exit animation
- Dark theme styling

- [ ] **Step 3: Wire Calendar into Dashboard routing**

In Dashboard.jsx, `/dashboard/calendar` renders `<Calendar userRoles={user.roles} />`.

- [ ] **Step 4: Verify**

Run: `npm run dev`
Navigate to `/dashboard/calendar`
Expected: Calendar renders with month/week/list toggle. Events appear color-coded. Create button visible based on role.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard/components/Calendar.jsx src/pages/Dashboard/components/CalendarEventModal.jsx src/pages/Dashboard/Dashboard.jsx
git commit -m "feat: add shared Calendar component with role-filtered events and create modal"
```

---

## Chunk 4: New Features

### Task 10: Events Management (Marketing)

**Files:**
- Create: `src/pages/Dashboard/components/EventsManagement.jsx`

- [ ] **Step 1: Create EventsManagement component**

CRUD interface for marketing events:
- List view: table/cards of all events with title, date, type, is_public status
- Create button → modal form (title, description, date, end_date, location, type dropdown, image upload, is_public toggle)
- Image upload to Supabase Storage `site-content` bucket at `events/{timestamp}.{ext}`
- Edit button on each event → same modal pre-filled
- Delete button with confirmation
- Filter by type (fan_event, sponsor_event, community)
- Sort by date (upcoming first)
- Supabase queries: select/insert/update/delete on `events` table

Follow the same card-based CRUD pattern used in ContentManagement.jsx.

- [ ] **Step 2: Wire into Dashboard routing**

`/dashboard/events` → `<EventsManagement />`

- [ ] **Step 3: Verify**

Create an event, verify it appears in the Calendar component.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard/components/EventsManagement.jsx src/pages/Dashboard/Dashboard.jsx
git commit -m "feat: add EventsManagement CRUD for marketing events"
```

---

### Task 11: Player Attendance Tracking

**Files:**
- Create: `src/pages/Dashboard/components/PlayerAttendance.jsx`

- [ ] **Step 1: Create PlayerAttendance component**

- List upcoming and past trainings/matches
- Click on a training/match → expand to show invited players with checkboxes
- Coach marks attendance: checkbox toggles `event_invitations.status` between 'accepted'/'attended'/'absent'
- Summary stats: attendance rate per player, per training
- Fetch from: `event_invitations` joined with `profiles` for player names
- Update: `supabase.from('event_invitations').update({ status }).eq('id', invitationId)`

- [ ] **Step 2: Wire into Dashboard routing**

`/dashboard/attendance` → `<PlayerAttendance />`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard/components/PlayerAttendance.jsx src/pages/Dashboard/Dashboard.jsx
git commit -m "feat: add PlayerAttendance tracking for coaches"
```

---

### Task 12: Player Notes

**Files:**
- Create: `src/pages/Dashboard/components/PlayerNotes.jsx`

- [ ] **Step 1: Create PlayerNotes component**

- Player list (from profiles where role=player) in left panel or dropdown
- Select player → show notes for that player
- Each note: author name, date, category badge, note text
- Add note form: textarea + category dropdown (general/injury/form/feedback)
- Delete own notes (trash icon)
- Filter notes by category
- Supabase: select/insert/delete on `player_notes`, join with profiles for author name

- [ ] **Step 2: Wire into Dashboard routing**

`/dashboard/player-notes` → `<PlayerNotes />`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Dashboard/components/PlayerNotes.jsx src/pages/Dashboard/Dashboard.jsx
git commit -m "feat: add PlayerNotes for coaching staff"
```

---

### Task 13: Activity Log

**Files:**
- Create: `src/pages/Dashboard/components/ActivityLog.jsx`
- Create: `src/services/activityLog.js`

- [ ] **Step 1: Create activityLog service helper**

```javascript
// src/services/activityLog.js
import { supabase } from './supabase';

export async function logActivity(action, entityType, entityId, details = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('activity_log').insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}
```

- [ ] **Step 2: Create ActivityLog viewer component**

- Read-only list of recent activity
- Each entry: user avatar + name, action description, timestamp (relative: "2 hours ago")
- Filter by entity_type (training, match, event, article, player)
- Pagination or infinite scroll (load 50 at a time)
- Fetch from: `activity_log` joined with `profiles` for user names
- Auto-refresh every 30 seconds

- [ ] **Step 3: Wire into Dashboard routing**

`/dashboard/activity-log` → `<ActivityLog />`

- [ ] **Step 4: Add logActivity calls to key components**

Add `logActivity()` calls in these existing components (after their Supabase mutations):
- ContentManagement: after creating/updating/publishing articles and site content
- EventsManagement: after creating/updating/deleting events
- TrainingScheduler: after creating/updating trainings
- MatchScheduler: after creating/updating matches
- StaffPlayerManagement: after role changes/invitations

This can be done incrementally — start with EventsManagement and ContentManagement as proof of concept.

- [ ] **Step 5: Commit**

```bash
git add src/services/activityLog.js src/pages/Dashboard/components/ActivityLog.jsx src/pages/Dashboard/Dashboard.jsx
git commit -m "feat: add ActivityLog viewer and logActivity helper"
```

---

## Chunk 5: Fan Portal Calendar + Cleanup

### Task 14: Fan Portal Events Calendar

**Files:**
- Create: `src/pages/FanPortal/components/EventsCalendar.jsx`
- Modify: `src/pages/FanPortal/FanPortal.jsx`

- [ ] **Step 1: Create EventsCalendar component**

Public read-only calendar for fans:
- Default to list view (upcoming events)
- Optional calendar grid toggle
- Fetch public events: trainings, matches, events where is_public=true
- Color-coded cards: blue=training, red=match, green=event
- Each card: title, date (formatted day/month/year), location, type badge
- Click to expand details (no edit capability)
- Responsive: 1 column mobile, 2 columns tablet, 3 columns desktop

Can reuse the Calendar component from Dashboard with `readOnly={true}` prop, or build a simpler standalone list. Recommend: simpler standalone list component for Fan Portal (less overhead than full calendar).

- [ ] **Step 2: Add EventsCalendar to FanPortal**

In `src/pages/FanPortal/FanPortal.jsx`:
1. Import EventsCalendar
2. Add to SECTIONS array: `{ id: 'events-calendar', label: 'Events' }` (position after News or Match Center)
3. Add `<div ref={this.sectionRefs['events-calendar']}><EventsCalendar /></div>` in render

- [ ] **Step 3: Verify**

Run: `npm run dev`
Navigate to `/fan-portal`
Expected: Events Calendar section appears with upcoming public events

- [ ] **Step 4: Commit**

```bash
git add src/pages/FanPortal/components/EventsCalendar.jsx src/pages/FanPortal/FanPortal.jsx
git commit -m "feat: add public Events Calendar to Fan Portal"
```

---

### Task 15: Final Cleanup and Verification

**Files:**
- Remove or verify: old Admin.jsx, CoachingZone.jsx, ContentZone, MarketingZone shells
- Verify: all redirects work
- Verify: all Dashboard routes render correctly

- [ ] **Step 1: Clean up old zone pages**

If not already done in Task 6:
- Delete `src/pages/Admin/Admin.jsx` and `src/pages/Admin/components/AdminSidebar.jsx`
- Delete `src/pages/CoachingZone/CoachingZone.jsx`
- If `src/pages/ContentZone/` and `src/pages/MarketingZone/` exist, delete them (redirects handle old URLs)
- Remove unused imports from App.jsx (old Admin, CoachingZone, ContentZone, MarketingZone)

- [ ] **Step 2: Full verification pass**

Run: `npm run dev`

Test each route:
- `/dashboard` → DashboardHome
- `/dashboard/calendar` → Calendar
- `/dashboard/training` → TrainingScheduler
- `/dashboard/matches` → MatchScheduler
- `/dashboard/formation` → FormationBuilder
- `/dashboard/squad` → SquadSelection
- `/dashboard/match-evaluation` → MatchEvaluation
- `/dashboard/attendance` → PlayerAttendance
- `/dashboard/player-notes` → PlayerNotes
- `/dashboard/content` → ContentManagement
- `/dashboard/events` → EventsManagement
- `/dashboard/payments` → PaymentsOverview
- `/dashboard/investors` → InvestorsManagement
- `/dashboard/players` → PlayersManagement
- `/dashboard/staff` → StaffPlayerManagement
- `/dashboard/analytics` → UserAnalytics
- `/dashboard/activity-log` → ActivityLog
- `/dashboard/users` → UserManagement (super_admin)
- `/dashboard/super` → SuperAdminOverview (super_admin)

Test redirects:
- `/admin` → `/dashboard`
- `/coaching-zone` → `/dashboard/training`
- `/content-zone` → `/dashboard/content`
- `/marketing-zone` → `/dashboard/events`

Test navbar:
- Admin user: Home + Admin
- Coach user: Home + Coaching Zone
- Fan user: Full public nav
- Unauthenticated: Full public nav

Test public pages still work:
- `/`, `/our-team`, `/fan-portal`, `/stats`, `/shop`, `/investors`

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: clean up old zone pages and verify all dashboard routes"
```

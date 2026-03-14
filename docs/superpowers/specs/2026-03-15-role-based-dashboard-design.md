# Role-Based Dashboard Restructuring — Design Spec

## Goal

Restructure Kaboona FC's navigation and dashboard system so that each staff role (admin, coach, editor, marketing) gets a unified, role-filtered dashboard with relevant tools and calendars, while simplifying the navbar for staff users.

## Architecture

Replace the separate `/admin`, `/coaching-zone`, `/content-zone`, `/marketing-zone` routes with a single unified dashboard at `/dashboard/*`. The dashboard uses a shared shell (sidebar + header + content area) with sidebar sections filtered by the user's roles. Navbar links still display role-specific names ("Admin", "Coaching Zone", "Marketing Zone") but all route to `/dashboard`. Old URLs redirect for backwards compatibility.

## Tech Stack

- React (class components, following existing patterns)
- Redux for auth/user state
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Tailwind CSS with existing dark theme tokens (`bg-surface-dark`, `bg-surface-dark-elevated`, `accent-gold`)
- Framer Motion for transitions

## Role Inheritance Note

`super_admin` inherits all `admin` permissions. Anywhere this spec says "admin", `super_admin` is implicitly included. `super_admin` is only listed separately where it has *exclusive* access (e.g., User Management).

---

## 1. Navbar Changes

### Unauthenticated users & fans
No change. Links: Home, Our Team, Stats, Shop, Fan Portal, Investors.

### Players
Full public nav + Profile. No zone link.

### Staff users (any role besides fan/player)
Navbar strips down to:
- **Home** (logo click)
- **Role-based zone link(s):**
  - `admin` / `super_admin` → "Admin" → `/dashboard`
  - `coach` / `manager` → "Coaching Zone" → `/dashboard`
  - `owner` → "Coaching Zone" → `/dashboard` (owner also sees Finance group in sidebar)
  - `editor` → "Marketing Zone" → `/dashboard`
  - `marketing` → "Marketing Zone" → `/dashboard`
- If a user has both admin + another role, they see **only "Admin"** (admin contains all departments).

### Accessing public pages as staff
The dashboard sidebar includes a "Public Site" group at the bottom with links to: Fan Portal, Our Team, Stats, Shop, Investors.

---

## 2. Unified Dashboard Shell

### Route
`/dashboard/*` — single route replacing all zone routes.

### Sub-Routes

| Sidebar Item | Path | Component |
|---|---|---|
| Dashboard Home | `/dashboard` | DashboardHome |
| Calendar | `/dashboard/calendar` | Calendar |
| Training | `/dashboard/training` | TrainingScheduler |
| Matches | `/dashboard/matches` | MatchScheduler |
| Formation Builder | `/dashboard/formation` | FormationBuilder |
| Squad Selection | `/dashboard/squad` | SquadSelection |
| Match Evaluation | `/dashboard/match-evaluation` | MatchEvaluation |
| Player Attendance | `/dashboard/attendance` | PlayerAttendance |
| Player Notes | `/dashboard/player-notes` | PlayerNotes |
| Content Management | `/dashboard/content` | ContentManagement |
| News Articles | `/dashboard/news` | NewsManagement (section within ContentManagement) |
| Events | `/dashboard/events` | EventsManagement |
| Payments | `/dashboard/payments` | PaymentsOverview |
| Investors Management | `/dashboard/investors` | InvestorsManagement |
| Players Management | `/dashboard/players` | PlayersManagement |
| Staff Management | `/dashboard/staff` | StaffPlayerManagement |
| Analytics | `/dashboard/analytics` | UserAnalytics |
| Activity Log | `/dashboard/activity-log` | ActivityLog |
| User Management | `/dashboard/users` | UserManagement |
| Super Admin | `/dashboard/super` | SuperAdminOverview |

### Redirects

| Old Path | New Path |
|---|---|
| `/admin` | `/dashboard` |
| `/admin/players` | `/dashboard/players` |
| `/admin/content` | `/dashboard/content` |
| `/admin/training` | `/dashboard/training` |
| `/admin/payments` | `/dashboard/payments` |
| `/admin/investors` | `/dashboard/investors` |
| `/admin/analytics` | `/dashboard/analytics` |
| `/admin/staff` | `/dashboard/staff` |
| `/admin/super` | `/dashboard/super` |
| `/admin/users` | `/dashboard/users` |
| `/coaching-zone` | `/dashboard/training` |
| `/content-zone` | `/dashboard/content` |
| `/marketing-zone` | `/dashboard/events` |

### Layout
Same as current Admin page:
- Collapsible sidebar on the left (collapses to icon-only at 80px)
- Sticky header with notifications and user info
- Content area on the right
- **On mobile (< md):** sidebar is hidden by default, toggled via hamburger icon in the dashboard header as a slide-over overlay

### Rendering Context
`/dashboard/*` renders **outside** the global `<Layout>` wrapper (which includes the public Navbar + Footer). The dashboard has its own header and sidebar — no double-navbar. In `App.jsx`, `<Dashboard>` is a sibling to `<Layout>`, not a child.

### Sidebar Groups (filtered by role)

| Group | Sidebar Items | Visible To |
|-------|--------------|------------|
| **Overview** | Dashboard Home, Calendar | All staff |
| **Coaching** | Training, Matches, Formation Builder, Squad Selection, Match Evaluation, Player Attendance, Player Notes | coach, owner, manager, admin |
| **Marketing & Content** | Content Management, News Articles, Events | editor, marketing, admin |
| **Finance** | Payments, Investors Management | admin, owner |
| **System** | Players Management, Staff Management, Analytics, Activity Log, User Management | admin (User Mgmt: super_admin only) |
| **Public Site** | Fan Portal, Our Team, Stats, Shop, Investors (public page) | All staff |

Note: The **Overview > Calendar** is the role-filtered calendar view (all event types the user has access to). There is no separate calendar under Marketing & Content — marketing uses the same shared calendar filtered to events.

### Dashboard Home
Role-aware welcome page with:
- Calendar widget showing events relevant to user's role
- Quick stats cards:
  - Coaches: next training, next match, training attendance rate
  - Marketing/Editor: upcoming events, recent articles, content stats
  - Admin: all of the above + user count, pending player requests

### Default landing per role
When a user navigates to `/dashboard`:
- Admin lands on Dashboard Home (sees everything)
- Coach lands on Dashboard Home (coaching-focused stats)
- Marketing/Editor lands on Dashboard Home (marketing-focused stats)

---

## 3. Role-Based Calendars

### Shared Calendar Component
One reusable calendar component used in:
- Dashboard Home (widget view)
- Dedicated Calendar page in sidebar
- Fan Portal (read-only public view)

### Event Types
- **Training** — created by coaches. Fields: title, date/time, location, notes, invited_players
- **Match** — created by coaches. Fields: opponent, date/time, venue, type (friendly/league/cup), notes
- **Event** — created by marketing. New table. Fields: title, description, date/time, location, type (fan_event/sponsor_event/community), image_url, is_public, created_by

### Visibility Matrix

| Role | Creates | Sees |
|------|---------|------|
| Coach/Owner/Manager | Trainings, Matches | Trainings + Matches |
| Marketing/Editor | Events | Events + Matches (read-only) |
| Admin | Everything | Everything |
| Fan Portal | Nothing (read-only) | Public matches, trainings, events |

### Calendar Features
- Month / week / list view toggle
- Color-coded by type: blue = training, red = match, green = event
- Click to view event details
- Create button (role-filtered — coaches create training/match, marketing creates event, admin creates any)
- Admin filter toggles to show/hide event types

### Fan Portal Calendar
New section added to Fan Portal. Read-only, public-facing. Shows upcoming matches, trainings, and events with basic info (no internal notes or player lists).

---

## 4. New Features Per Role

### Coaching Zone Additions

**Player Attendance Tracking**
- New UI accessible from Training and Match detail views
- Coach marks which players attended (checkbox list of invited players)
- Stores in existing `event_invitations` table (status: attended/absent)
- Feeds into attendance stats on player profiles

**Player Notes**
- New `player_notes` table: id, player_id, author_id, note, category (general/injury/form/feedback), created_at
- Quick note input on player list within coaching zone
- Notes visible to coaches, owners, managers, admin
- RLS: coaches can read/write, players cannot see coach notes

### Marketing Zone Additions

**Events Management**
- New `events` table: id, title, description, date, end_date, location, type (fan_event/sponsor_event/community), image_url, is_public, created_by, created_at, updated_at
- CRUD interface within Marketing & Content sidebar group
- Events appear on shared calendar
- Public events appear on Fan Portal calendar
- RLS: marketing/editor/admin can manage, public read for is_public=true events

### Admin Additions

**Activity Log**
- New `activity_log` table: id, user_id, action, entity_type, entity_id, details (JSONB), created_at
- Populated via **application-level logging**: a shared `logActivity(action, entityType, entityId, details)` helper function called in service/component code after key actions (create training, publish article, create event, update player, etc.)
- Read-only view in System sidebar group
- Shows: who did what, when, with links to the entity
- RLS: admin/super_admin read-only, insert allowed for authenticated users (the app controls what gets logged)

### Fan Portal Addition

**Events Calendar**
- New section in Fan Portal (added to SECTIONS array)
- Uses shared Calendar component in read-only mode
- Fetches public trainings, matches, and events
- Clean card-based list view as default, with optional calendar grid view

---

## 5. Database Changes

### New Tables

```sql
-- Marketing/community events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  type TEXT NOT NULL DEFAULT 'fan_event', -- fan_event, sponsor_event, community
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coach notes on players
CREATE TABLE player_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  category TEXT DEFAULT 'general', -- general, injury, form, feedback
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on events
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

-- Activity log for admin oversight
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- created, updated, deleted, published
  entity_type TEXT NOT NULL, -- training, match, event, article, player
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

**events:**
- Public read: `is_public = true`
- Insert/update/delete: user has role marketing, editor, admin, or super_admin

**player_notes:**
- Read: user has role coach, owner, manager, admin, or super_admin
- Insert/update: user has role coach, owner, manager, admin, or super_admin
- Delete: author_id = auth.uid() OR user is admin

**activity_log:**
- Read: user has role admin or super_admin
- Insert: any authenticated user (controlled at application level)

---

## 6. File Structure

### New files
```
src/pages/Dashboard/
  Dashboard.jsx              -- Shell: sidebar + header + content area + routing
  DashboardHome.jsx          -- Role-aware welcome page with calendar widget + quick stats
  DashboardSidebar.jsx       -- Role-filtered sidebar with grouped navigation
  DashboardHeader.jsx        -- Sticky header (reuse from current Admin)

src/pages/Dashboard/components/
  Calendar.jsx               -- Shared calendar component (month/week/list views)
  CalendarEventModal.jsx     -- View/create/edit event modal
  EventsManagement.jsx       -- Marketing events CRUD
  PlayerAttendance.jsx       -- Coach attendance marking UI
  PlayerNotes.jsx            -- Coach notes on players
  ActivityLog.jsx            -- Admin activity log viewer
  QuickStats.jsx             -- Role-aware stats cards for dashboard home

src/pages/FanPortal/components/
  EventsCalendar.jsx         -- Public read-only calendar for Fan Portal
```

### Modified files
```
src/components/Layout/Navbar.jsx    -- Role-based nav link filtering
src/App.jsx                         -- New /dashboard/* routes, redirects from old zone URLs
```

### Moved (not duplicated)
Existing components from Admin and CoachingZone move into `Dashboard/components/`:
- **From Admin:** TrainingManagement, PlayersManagement, ContentManagement, PaymentsOverview, InvestorsManagement, UserAnalytics, StaffPlayerManagement, SuperAdminOverview, UserManagement, DashboardOverview (renamed to AdminOverview, used as reference for QuickStats)
- **From CoachingZone:** TrainingScheduler, MatchScheduler, FormationBuilder, SquadSelection, MatchEvaluation, DrillSuggestions

### Intentionally Dropped
- **ContentZone task board** (`content_tasks` table) — low usage, not part of the new design. Content planning happens via the shared calendar.
- **MarketingZone goals tracker** (`marketing_goals` table) — low usage, not carried forward. Can be revisited if needed.

---

## 7. Migration Path

1. Build the new Dashboard shell and sidebar
2. Move existing admin components into Dashboard
3. Move existing coaching zone components into Dashboard
4. Add new features (events, attendance, notes, activity log, fan calendar)
5. Update Navbar with role-based filtering
6. Add redirects from old routes
7. Remove old Admin.jsx, CoachingZone.jsx shell pages (components are preserved)

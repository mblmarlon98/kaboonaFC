# Kaboona FC

Football club management platform built with React, Supabase, and Tailwind CSS.

## Tech Stack

- **Frontend:** React (class components), Redux, Framer Motion, Tailwind CSS, Recharts
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Email:** Brevo SMTP for transactional emails (password reset, confirmations)
- **OAuth:** Google and Apple Sign-In via Supabase Auth

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (for Supabase local dev)
- Supabase CLI

### Setup

```bash
# Install dependencies
npm install

# Start Docker Desktop, then start Supabase
supabase start

# Start the dev server
npm run dev
```

### Running Services

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173       |
| API      | http://localhost:54331      |
| Studio   | http://localhost:54333      |
| Mailpit  | http://localhost:54334      |

### Environment Variables

Supabase secrets are stored in `supabase/.env` (not committed):

- `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `SECRET` — Google OAuth
- `SUPABASE_AUTH_EXTERNAL_APPLE_CLIENT_ID` / `SECRET` — Apple OAuth
- `SMTP_PASS` — Brevo SMTP key for auth emails

## Auth & Roles

### Role System

Everyone signs up as **Fan** by default. Roles are managed via the `profiles` table:

- `profiles.role` — primary role (`fan`, `player`, `coach`, `admin`)
- `profiles.roles` — array of all roles (supports multi-role users)

Available roles: `fan`, `player`, `coach`, `admin`, `manager`, `owner`, `editor`, `super_admin`

### Super Admin

The designated super admin email (configured in the super_admin migration) is automatically assigned `super_admin` + `admin` roles on signup via a database trigger. Super admin has:

- Full admin dashboard access
- All user emails visible in analytics
- Enhanced user analytics with real-time data from the database
- All admin capabilities

### Password Reset Flow

1. User clicks "Forgot password?" on `/login`
2. Email sent via Brevo SMTP with reset link
3. Link opens `/reset-password` page
4. User sets new password, gets redirected to `/login?reset=success`
5. Login page shows green "Password updated successfully" banner

### Player Request Flow

1. Fan visits `/profile` and clicks "Request Player Status"
2. `profiles.player_request_status` set to `pending`
3. Notification sent to all admins and coaches (`player_request` type)
4. Admin/coach sees Accept/Decline buttons in notification dropdown
5. **Accept:** adds `player` to roles, creates player record, sends `player_approved` notification
6. **Decline:** sets status to `declined`, sends `player_declined` notification; user can request again

### Signup Pages

- `/login` — Sign in + "Become a Fan" tab (fan signup with OAuth)
- `/register` — Standalone signup form (fan only, no role selector)
- `/training-signup` — Multi-step training registration (creates fan account)

## Project Structure

```
src/
  components/
    Layout/          # Navbar, Footer
    common/          # Shared components (CountrySelect, etc.)
    shared/          # Context providers (PlayerModal)
  pages/
    Auth/            # Login, Register, ForgotPassword, ResetPassword
    Profile/         # Player dashboard, profile edit
    Admin/           # Admin dashboard with sidebar navigation
      components/    # Dashboard, Players, Content, Training, Payments, Investors, Analytics
    CoachingZone/    # Coach-only tools
    FanPortal/       # Fan portal (single-page scroll layout)
    Stats/           # Statistics with competition tabs
    Home/            # Landing page
    OurTeam/         # Team roster
    Shop/            # Merchandise store
    Investors/       # Investor information
    Legal/           # Terms, Privacy, Refund, Cookies
    TrainingSignup/  # Multi-step training registration
  services/
    supabase.js              # Supabase client
    auth.js                  # Auth helpers (signIn, signUp, getCurrentUser, etc.)
    notificationService.js   # Notification CRUD + realtime subscription
    playerRequestService.js  # Player status request/approve/decline
    fanPortalService.js      # Fan portal data
    schedulingService.js     # Event scheduling
  redux/
    slices/          # authSlice, notificationSlice
    store.js
  data/
    matches.js       # Match data + computed stats
    teamLogos.jsx    # Team logo component

supabase/
  config.toml        # Supabase local config (SMTP, OAuth, etc.)
  migrations/        # Database migrations (chronological)
  .env               # Secrets (not committed)
```

## Database Migrations

| Migration | Description |
|-----------|-------------|
| `20260202144632_initial_schema.sql` | Core tables: profiles, players, matches |
| `20260203000000_performance_tracking.sql` | Player performance tracking |
| `20260203020000_avatars_storage.sql` | Avatar storage bucket |
| `20260203030000_add_missing_player_fields.sql` | Extra player fields |
| `20260203040000_multiple_roles.sql` | Multi-role support (roles array) |
| `20260203050000_setup_admin_player.sql` | Initial admin + player setup |
| `20260203060000_alternate_positions.sql` | Alternate positions for players |
| `20260308000000_team_management.sql` | Notifications, event invitations, formations |
| `20260308100000_match_reminders.sql` | Match reminder scheduling |
| `20260312000000_fan_portal.sql` | Fan wall, POTM voting, albums, predictions |
| `20260314000000_player_request.sql` | Player request status + notification types |
| `20260314100000_super_admin.sql` | Super admin auto-assignment trigger |

## Admin Dashboard

Accessible at `/admin` for users with `admin` or `super_admin` roles.

| Tab        | Path              | Description |
|------------|-------------------|-------------|
| Dashboard  | `/admin`          | Overview stats |
| Players    | `/admin/players`  | Player management with edit modal |
| Content    | `/admin/content`  | Content management |
| Training   | `/admin/training` | Training session management |
| Payments   | `/admin/payments` | Payment overview |
| Investors  | `/admin/investors`| Investor management |
| Analytics  | `/admin/analytics`| User analytics (enhanced for super_admin) |

## Key Features

- **Fan Portal** — Single-page scroll layout with Match Center, Fan Wall, POTM Voting, Leaderboard, Match Day Hub, Gallery
- **Stats Page** — Competition-specific tabs (Div 3, Sunday Edition, Friendlies, All Time) with league table, top scorers, clean sheets, attendance, disciplinary charts
- **Player FIFA Cards** — Interactive player cards with stats radar
- **Real-time Notifications** — Supabase Realtime for instant notification delivery
- **OAuth** — Google and Apple sign-in
- **Legal Pages** — Terms, Privacy Policy, Refund Policy, Cookie Policy

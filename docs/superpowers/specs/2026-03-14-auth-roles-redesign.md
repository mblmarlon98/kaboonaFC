# Auth, Password Reset & Player Request Flow Redesign

**Date:** 2026-03-14
**Status:** Draft

## Overview

Redesign the auth flow, add password reset landing page, configure Brevo SMTP, simplify signup to default everyone as Fan, and add a player-request workflow where fans can request player status from their profile.

## 1. Password Reset Flow

### Current State
- `ForgotPassword.jsx` sends reset email via `supabase.auth.resetPasswordForEmail()`
- No landing page exists for the reset link — users hit a 404

### Changes
- **New page: `/reset-password` (`ResetPassword.jsx`)** — handles the token from the email link
  - Two fields: new password + confirm password
  - Calls `supabase.auth.updateUser({ password })` to set the new password
  - On success: redirect to `/login` with query param `?reset=success` to show success message
  - On error (expired/invalid token): show error with link to `/forgot-password`
- **Login.jsx** — detect `?reset=success` query param and show "Password updated successfully" banner
- **auth.js** — update `resetPassword()` redirect URL to point to `/reset-password` (not `/kaboonaFC/reset-password` since base is now `/`)
- **App.jsx** — add `<Route path="/reset-password">` with the new component

### Brevo SMTP Configuration
- **Server:** `smtp-relay.brevo.com`
- **Port:** `587`
- **Login:** stored in `supabase/.env` as `SMTP_USER`
- **Key:** stored in `supabase/.env` as `SMTP_PASS`
- **config.toml** — uncomment and configure `[auth.email.smtp]` section with Brevo credentials
- **Sender:** configure appropriate sender name/email (e.g., `noreply@kaboonafc.com` or whatever verified sender exists in Brevo)

## 2. Signup Simplification

### Current State
- `/login` has "Become a Fan" tab with fan signup + Google/Apple OAuth
- `/register` has Player/Fan role selector
- `/training-signup` creates accounts with player role in step 6

### Changes
- **Register.jsx** — remove Player/Fan role selector. Everyone signs up as `fan`. Remove `selectedRole` state, hardcode `role: 'fan'` in signup metadata. Update UI to remove role cards.
- **Training Signup** — account creation step (step 6) should register with `role: 'fan'` (player role is granted later via the request flow)
- **OAuth signup** — already defaults to fan (no changes needed)

## 3. Player Request Flow

### Database Changes

**`profiles` table** — add column:
```sql
ALTER TABLE public.profiles ADD COLUMN player_request_status TEXT
  CHECK (player_request_status IN ('pending', 'approved', 'declined'))
  DEFAULT NULL;
```
- `NULL` = never requested
- `pending` = request submitted, awaiting review
- `approved` = request accepted (player role granted)
- `declined` = request denied

**`notifications` type enum** — add new values:
- `player_request` — sent to admins/coaches when a fan requests player status
- `player_declined` — sent to user when request is declined

(Note: `player_approved` already exists in the current enum)

### Frontend: Fan Profile

**Profile.jsx** — add player request section for fans:
- If `player_request_status` is `NULL`: show "Request Player Status" button
- If `pending`: show "Player request pending" with disabled state
- If `approved`: normal player profile (they already have the role)
- If `declined`: show "Request declined" with option to request again

**On request:**
1. Update `profiles.player_request_status` to `'pending'`
2. Create `player_request` notification for all admin + coach users
3. Notification includes requester's name and a reference to their profile

### Frontend: Admin/Coach Notification Handling

**Notification display** — for `player_request` type notifications:
- Show "X requested player status" with Accept / Decline buttons
- **Accept:**
  1. Add `'player'` to user's `roles` array in `profiles`
  2. Update `profiles.role` to `'player'` (primary role)
  3. Set `player_request_status` to `'approved'`
  4. Insert row in `players` table (name, position defaults)
  5. Send `player_approved` notification to the user
- **Decline:**
  1. Set `player_request_status` to `'declined'`
  2. Send `player_declined` notification to the user

### Backend: RLS Policies
- Users can update their own `player_request_status` to `'pending'` only
- Admins/coaches can update `player_request_status` to `'approved'` or `'declined'`
- Admins/coaches can update other users' `roles` array

## 4. Admin Player Management

### Current State
- Admin panel exists at `/admin/*` but no dedicated player list/edit view

### Changes
- **Admin player list** — a view showing all users with `player` role
  - Displays: name, position, jersey number, email, status
  - Edit button per row to modify player details (position, number, stats, etc.)
  - Uses existing `players` + `profiles` joined data
- This leverages the existing `ProfileEdit` patterns but for admin use on any player

## 5. Files to Modify/Create

### New Files
- `src/pages/Auth/ResetPassword.jsx` — password reset landing page

### Modified Files
- `src/pages/Auth/Login.jsx` — show success banner on `?reset=success`
- `src/pages/Auth/Register.jsx` — remove role selector, hardcode fan
- `src/pages/Profile/Profile.jsx` — add player request button/status
- `src/pages/Admin/` — add player management component
- `src/services/auth.js` — fix reset redirect URL
- `src/services/notificationService.js` — add player request helpers
- `src/App.jsx` — add `/reset-password` route
- `supabase/config.toml` — configure Brevo SMTP
- `supabase/migrations/` — new migration for `player_request_status` column + notification types

### No Changes Needed
- OAuth flow (already defaults to fan)
- ForgotPassword.jsx (already works)
- Footer/Navbar legal links (already correct)

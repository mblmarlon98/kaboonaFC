# Auth, Password Reset & Player Request Flow — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add password reset landing page with Brevo SMTP, simplify signup to fan-only, and add player-request workflow with admin approval.

**Architecture:** Supabase handles auth emails via Brevo SMTP. New ResetPassword page catches the token from the email link. A new `player_request_status` column on `profiles` drives the request workflow. Notifications connect fans to admins/coaches for approval. Admin panel gets a player edit view.

**Tech Stack:** React (class components), Supabase Auth, Supabase Realtime, Redux, Framer Motion, Tailwind CSS

---

## Chunk 1: SMTP Configuration & Password Reset

### Task 1: Configure Brevo SMTP in Supabase

**Files:**
- Modify: `supabase/config.toml:183-191`
- Modify: `supabase/.env`

- [ ] **Step 1: Update config.toml SMTP section**

Replace the commented-out SMTP block (lines 183-191) with:

```toml
[auth.email.smtp]
enabled = true
host = "smtp-relay.brevo.com"
port = 587
user = "env(SMTP_USER)"
pass = "env(SMTP_PASS)"
admin_email = "noreply@kaboonafc.com"
sender_name = "Kaboona FC"
```

- [ ] **Step 2: Add SMTP_PASS to supabase/.env**

Add to `supabase/.env`:
```
SMTP_PASS=<user-provides-brevo-smtp-key>
```

- [ ] **Step 3: Update redirect URLs in config.toml**

Change line 122 `additional_redirect_urls` to include the reset password path:
```toml
additional_redirect_urls = ["http://localhost:5173/auth/callback", "http://localhost:5173/reset-password"]
```

- [ ] **Step 4: Restart Supabase to apply config**

Run: `supabase stop && supabase start`

- [ ] **Step 5: Commit**

```bash
git add supabase/config.toml
git commit -m "feat: configure Brevo SMTP for auth emails"
```

Note: Do NOT commit `supabase/.env` (contains secrets).

---

### Task 2: Create ResetPassword Page

**Files:**
- Create: `src/pages/Auth/ResetPassword.jsx`

- [ ] **Step 1: Create the ResetPassword component**

```jsx
import React, { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';

class ResetPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      password: '',
      confirmPassword: '',
      isSubmitting: false,
      formError: null,
      success: false,
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value, formError: null });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { password, confirmPassword } = this.state;

    if (!password) {
      this.setState({ formError: 'Please enter a new password' });
      return;
    }
    if (password.length < 6) {
      this.setState({ formError: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      this.setState({ formError: 'Passwords do not match' });
      return;
    }

    this.setState({ isSubmitting: true, formError: null });

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        this.setState({
          formError: error.message.includes('session')
            ? 'This reset link has expired. Please request a new one.'
            : error.message,
          isSubmitting: false,
        });
        return;
      }
      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();
      this.setState({ success: true, isSubmitting: false });
    } catch (err) {
      this.setState({ formError: 'An unexpected error occurred', isSubmitting: false });
    }
  };

  render() {
    const { password, confirmPassword, isSubmitting, formError, success } = this.state;

    if (success) {
      return <Navigate to="/login?reset=success" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-dark">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-surface-dark-elevated rounded-xl shadow-2xl p-8 border border-white/10">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display font-bold text-accent-gold mb-1">
                Set New Password
              </h1>
              <p className="text-white/60 text-sm">
                Enter your new password below
              </p>
            </div>

            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{formError}</p>
                {formError.includes('expired') && (
                  <Link
                    to="/forgot-password"
                    className="text-accent-gold hover:text-accent-gold-light text-sm mt-2 inline-block"
                  >
                    Request a new reset link
                  </Link>
                )}
              </motion.div>
            )}

            <form onSubmit={this.handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={this.handleChange}
                  className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="Enter new password (min 6 chars)"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={this.handleChange}
                  className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-4 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-dark focus:ring-accent-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Update Password'
                )}
              </motion.button>

              <div className="text-center pt-4 border-t border-white/10">
                <Link to="/login" className="text-sm text-accent-gold hover:text-accent-gold-light">
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }
}

export default ResetPassword;
```

- [ ] **Step 2: Export from Auth index**

Add to `src/pages/Auth/index.js`:
```javascript
export { default as ResetPassword } from './ResetPassword';
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Auth/ResetPassword.jsx src/pages/Auth/index.js
git commit -m "feat: add ResetPassword page component"
```

---

### Task 3: Wire Up Reset Route + Login Success Banner

**Files:**
- Modify: `src/App.jsx` (import + route)
- Modify: `src/pages/Auth/Login.jsx` (success banner)

- [ ] **Step 1: Add route in App.jsx**

Add import alongside other Auth imports (line 12):
```javascript
import { Login, Register, ForgotPassword, ResetPassword } from './pages/Auth';
```

Note: `ResetPassword` was not previously in this import. `ForgotPassword` may be imported separately — check and consolidate.

Add route in the legal routes area (before the 404 route):
```jsx
<Route path="/reset-password" element={<ResetPassword />} />
```

- [ ] **Step 2: Add success banner to Login.jsx**

In Login.jsx, detect `?reset=success` from URL search params. The component already has `withSearchParams` HOC (line 10-15) and reads `searchParams` in constructor (line 20).

In constructor, add:
```javascript
const resetSuccess = props.searchParams?.get('reset') === 'success';
```

Add `resetSuccess` to initial state:
```javascript
resetSuccess: resetSuccess || false,
```

In render, add a success banner right after the mode toggle div (after line 206), before the header:
```jsx
{this.state.resetSuccess && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
  >
    <div className="flex items-center gap-3">
      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <p className="text-green-400 text-sm">Password updated successfully. Sign in with your new password.</p>
    </div>
  </motion.div>
)}
```

- [ ] **Step 3: Verify manually**

1. Go to http://localhost:5173/reset-password — should show the form
2. Go to http://localhost:5173/login?reset=success — should show green success banner
3. Go to http://localhost:5173/forgot-password — submit email, check Inbucket at http://localhost:54334

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/pages/Auth/Login.jsx
git commit -m "feat: wire reset-password route and login success banner"
```

---

## Chunk 2: Signup Simplification

### Task 4: Simplify Register Page (Fan Only)

**Files:**
- Modify: `src/pages/Auth/Register.jsx`

- [ ] **Step 1: Remove role selector state and UI**

In constructor (line 14-25), remove `selectedRole: 'player'` from state.

In `handleSubmit` (line 76-121), change the signup call to always use `role: 'fan'`:
```javascript
const { data, error } = await signUp(email, password, {
  full_name: fullName,
  role: 'fan',
});
```

Remove the player-specific redirect logic (lines 104-109). After successful signup, always show the success message:
```javascript
if (data?.user) {
  setUser(data.user);
  if (data.session) {
    setSession(data.session);
  }
  this.setState({
    isSubmitting: false,
    successMessage: 'Welcome to Kaboona FC! Check your email to confirm your account.',
  });
}
```

In render, remove the entire "Role Selection" section (lines 196-286 — the "I am a..." label and Player/Fan cards).

Update the submit button text (line 397):
```jsx
'Create Account'
```

Remove `selectedRole` from state destructuring in render and anywhere it's referenced.

- [ ] **Step 2: Verify manually**

Go to http://localhost:5173/register — should show a clean signup form without Player/Fan role cards. Submit button says "Create Account".

- [ ] **Step 3: Commit**

```bash
git add src/pages/Auth/Register.jsx
git commit -m "feat: simplify register page to fan-only signup"
```

---

### Task 5: Fix Training Signup Role

**Files:**
- Modify: `src/pages/TrainingSignup/TrainingSignup.jsx:203`

- [ ] **Step 1: Change role from 'player' to 'fan'**

In `handleNext()` around line 203, change:
```javascript
const { data, error } = await signUp(formData.email, formData.password, {
  full_name: `${formData.firstName} ${formData.lastName}`,
  role: 'fan',
});
```

(Previously was `role: 'player'`)

- [ ] **Step 2: Commit**

```bash
git add src/pages/TrainingSignup/TrainingSignup.jsx
git commit -m "fix: training signup defaults to fan role"
```

---

## Chunk 3: Player Request Database & Service

### Task 6: Database Migration

**Files:**
- Create: `supabase/migrations/20260314000000_player_request.sql`

- [ ] **Step 1: Write migration**

```sql
-- Add player_request_status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS player_request_status TEXT
  CHECK (player_request_status IN ('pending', 'approved', 'declined'))
  DEFAULT NULL;

-- Expand notifications type CHECK to include new types
-- Drop existing constraint and recreate with new values
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'training_invite',
    'match_invite',
    'formation_published',
    'match_reminder',
    'general',
    'player_approved',
    'player_request',
    'player_declined'
  ));

-- RLS: Users can set their own player_request_status to 'pending' only
CREATE POLICY "users_can_request_player_status"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND player_request_status = 'pending'
  );

-- RLS: Admins and coaches can update player_request_status and roles for any user
CREATE POLICY "admins_coaches_manage_player_requests"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role IN ('admin', 'coach') OR roles && ARRAY['admin', 'coach'])
    )
  );
```

- [ ] **Step 2: Apply migration**

Run: `supabase db reset` (applies all migrations fresh) or `supabase migration up`

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260314000000_player_request.sql
git commit -m "feat: add player_request_status column and notification types"
```

---

### Task 7: Player Request Service Functions

**Files:**
- Modify: `src/services/notificationService.js`
- Create: `src/services/playerRequestService.js`

- [ ] **Step 1: Create playerRequestService.js**

```javascript
import { supabase } from './supabase';
import { createBulkNotifications } from './notificationService';

/**
 * Submit a player status request
 * Updates the user's profile and notifies admins/coaches
 */
export const requestPlayerStatus = async (userId, userName) => {
  // Update profile request status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ player_request_status: 'pending' })
    .eq('id', userId);

  if (updateError) return { error: updateError };

  // Find all admins and coaches
  const { data: staff, error: staffError } = await supabase
    .from('profiles')
    .select('id')
    .or('role.in.(admin,coach),roles.cs.{admin},roles.cs.{coach}');

  if (staffError) return { error: staffError };

  // Send notification to all admins/coaches
  const staffIds = staff?.map(s => s.id) || [];
  if (staffIds.length > 0) {
    await createBulkNotifications(staffIds, {
      title: 'Player Status Request',
      body: `${userName} has requested to become a player`,
      type: 'player_request',
      referenceType: 'profile',
      referenceId: userId,
    });
  }

  return { error: null };
};

/**
 * Approve a player request (admin/coach only)
 */
export const approvePlayerRequest = async (requesterId, requesterName) => {
  // Update profile: set status, add player role
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('roles, role')
    .eq('id', requesterId)
    .single();

  if (fetchError) return { error: fetchError };

  const currentRoles = profile.roles || [profile.role || 'fan'];
  const updatedRoles = currentRoles.includes('player')
    ? currentRoles
    : [...currentRoles, 'player'];

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      player_request_status: 'approved',
      roles: updatedRoles,
      role: 'player',
    })
    .eq('id', requesterId);

  if (updateError) return { error: updateError };

  // Insert into players table with defaults
  const { error: playerError } = await supabase
    .from('players')
    .upsert({
      profile_id: requesterId,
      name: requesterName,
      position: 'Unassigned',
    }, { onConflict: 'profile_id' });

  if (playerError) console.warn('Could not create player entry:', playerError);

  // Notify the requester
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: requesterId,
      title: 'Player Status Approved',
      body: 'Your request to become a player has been approved! You can now edit your player profile.',
      type: 'player_approved',
      reference_type: 'profile',
      reference_id: requesterId,
    });

  if (notifError) console.warn('Could not send approval notification:', notifError);

  return { error: null };
};

/**
 * Decline a player request (admin/coach only)
 */
export const declinePlayerRequest = async (requesterId) => {
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ player_request_status: 'declined' })
    .eq('id', requesterId);

  if (updateError) return { error: updateError };

  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: requesterId,
      title: 'Player Request Declined',
      body: 'Your request to become a player was not approved at this time. You can request again later.',
      type: 'player_declined',
      reference_type: 'profile',
      reference_id: requesterId,
    });

  if (notifError) console.warn('Could not send decline notification:', notifError);

  return { error: null };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/playerRequestService.js
git commit -m "feat: add player request service (request, approve, decline)"
```

---

## Chunk 4: Player Request UI

### Task 8: Add Player Request Section to Profile

**Files:**
- Modify: `src/pages/Profile/Profile.jsx`
- Modify: `src/services/auth.js:83-85` (fetch player_request_status)

- [ ] **Step 1: Include player_request_status in auth profile fetch**

In `src/services/auth.js`, update the profile select (line 85) to include the new column:

```javascript
.select('role, roles, full_name, profile_image_url, player_request_status')
```

This makes `user.profile.player_request_status` available throughout the app.

- [ ] **Step 2: Add player request UI to Profile.jsx**

In `Profile.jsx`, after loading player data and determining the user is NOT a player (i.e., no player data found from `players_with_profiles`), render a player request section.

Find the section where the profile renders when there's no player data. Add this block:

```jsx
{/* Player Request Section — shown for non-players */}
{!this.state.playerData?.isFromDatabase && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-surface-dark-elevated rounded-xl border border-white/5 p-6 mb-6"
  >
    <h3 className="text-lg font-display font-bold text-white mb-2">
      Want to play for Kaboona FC?
    </h3>
    {(() => {
      const status = this.props.user?.profile?.player_request_status;
      if (status === 'pending') {
        return (
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            <p className="text-yellow-400 text-sm">Your player request is pending review by the coaching staff.</p>
          </div>
        );
      }
      if (status === 'declined') {
        return (
          <div>
            <p className="text-white/60 text-sm mb-3">Your previous request was not approved. You can request again.</p>
            <button
              onClick={this.handlePlayerRequest}
              disabled={this.state.requestingPlayer}
              className="px-4 py-2 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50"
            >
              Request Again
            </button>
          </div>
        );
      }
      // NULL — never requested
      return (
        <div>
          <p className="text-white/60 text-sm mb-3">
            Request player status to join training sessions and matches.
          </p>
          <button
            onClick={this.handlePlayerRequest}
            disabled={this.state.requestingPlayer}
            className="px-4 py-2 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50"
          >
            {this.state.requestingPlayer ? 'Requesting...' : 'Request Player Status'}
          </button>
        </div>
      );
    })()}
  </motion.div>
)}
```

- [ ] **Step 3: Add handlePlayerRequest method to Profile component**

```javascript
import { requestPlayerStatus } from '../../services/playerRequestService';

// In constructor, add to state:
requestingPlayer: false,

// Add method:
handlePlayerRequest = async () => {
  const { user } = this.props;
  if (!user) return;

  this.setState({ requestingPlayer: true });

  const userName = user.user_metadata?.full_name || user.email;
  const { error } = await requestPlayerStatus(user.id, userName);

  if (error) {
    console.error('Failed to request player status:', error);
    this.setState({ requestingPlayer: false });
    return;
  }

  // Refresh user to get updated player_request_status
  const { refreshUser } = await import('../../services/auth');
  const { user: updatedUser } = await refreshUser();
  if (updatedUser) {
    this.props.setUser(updatedUser);
  }

  this.setState({ requestingPlayer: false });
};
```

- [ ] **Step 4: Verify manually**

1. Log in as a fan user
2. Go to /profile — should see "Want to play for Kaboona FC?" with request button
3. Click request — button should show loading, then switch to pending state
4. Check Supabase Studio (http://localhost:54333) — profiles table should show `player_request_status = 'pending'`

- [ ] **Step 5: Commit**

```bash
git add src/services/auth.js src/pages/Profile/Profile.jsx
git commit -m "feat: add player request UI on fan profile page"
```

---

### Task 9: Admin/Coach Notification Handling

**Files:**
- Modify: `src/components/Layout/Navbar.jsx` (notification dropdown — find where notifications are rendered)

Note: The notification display is in the Navbar. We need to add accept/decline buttons for `player_request` type notifications.

- [ ] **Step 1: Find notification rendering in Navbar**

The Navbar renders notifications in a dropdown. Find the notification list rendering section. For each notification, check if `type === 'player_request'` and the current user is admin/coach, then render Accept/Decline buttons.

- [ ] **Step 2: Add player request actions to notification items**

Import at top of Navbar:
```javascript
import { approvePlayerRequest, declinePlayerRequest } from '../../services/playerRequestService';
```

In the notification rendering loop, add conditional buttons:

```jsx
{notification.type === 'player_request' && (user?.isAdmin || user?.isCoach) && !notification.read && (
  <div className="flex gap-2 mt-2">
    <button
      onClick={async (e) => {
        e.stopPropagation();
        await approvePlayerRequest(notification.reference_id, notification.body?.split(' has ')[0]);
        await markAsRead(notification.id);
        // Refresh notifications
      }}
      className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/30 transition-colors"
    >
      Accept
    </button>
    <button
      onClick={async (e) => {
        e.stopPropagation();
        await declinePlayerRequest(notification.reference_id);
        await markAsRead(notification.id);
        // Refresh notifications
      }}
      className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors"
    >
      Decline
    </button>
  </div>
)}
```

- [ ] **Step 3: Verify manually**

1. Log in as fan, request player status
2. Log in as admin — should see notification with Accept/Decline buttons
3. Click Accept — fan's profile should update to player role
4. Check notifications for the fan — should see "Player Status Approved"

- [ ] **Step 4: Commit**

```bash
git add src/components/Layout/Navbar.jsx
git commit -m "feat: add accept/decline buttons for player request notifications"
```

---

## Chunk 5: Admin Player Management

### Task 10: Admin Player Edit View

**Files:**
- Modify: `src/pages/Admin/components/PlayersManagement.jsx` (or create if it's a placeholder)

- [ ] **Step 1: Examine current PlayersManagement component**

Read the existing `PlayersManagement` component inside `src/pages/Admin/`. It may be inline in `Admin.jsx` or a separate file. Determine what exists and what needs to be added.

The component needs to:
- Fetch all players via `players` JOIN `profiles`
- Display a table: name, position, jersey number, email, roles
- Edit button per row that opens an inline editor or modal
- Edit fields: position, number, height, weight, preferred foot, stats
- Save updates to both `players` and `profiles` tables

- [ ] **Step 2: Implement or update the component**

Use existing patterns from the Admin page. The component should:

```javascript
// Fetch all players with profiles
const { data } = await supabase
  .from('players')
  .select('*, profiles!inner(id, full_name, email, role, roles, profile_image_url)')
  .order('name');
```

Render as a table with edit functionality. Follow the existing admin component patterns for styling (dark elevated cards, accent gold highlights, etc.).

- [ ] **Step 3: Verify manually**

1. Log in as admin
2. Go to /admin/players
3. Should see list of all players
4. Click edit on a player — should be able to change position, number, etc.
5. Save — changes should persist

- [ ] **Step 4: Commit**

```bash
git add src/pages/Admin/
git commit -m "feat: admin player management with edit capabilities"
```

---

## Pre-flight Checklist

Before starting implementation, confirm with user:

- [ ] User provides Brevo SMTP key for `supabase/.env`
- [ ] User confirms sender email (`noreply@kaboonafc.com` or other verified Brevo sender)
- [ ] `supabase db reset` is acceptable (resets local data to apply new migration)

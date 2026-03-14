import { supabase } from './supabase';

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

/**
 * Sign in with OAuth provider (Google, Apple)
 * @param {'google' | 'apple'} provider - OAuth provider
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const signInWithOAuth = async (provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
    },
  });
  return { data, error };
};

/**
 * Sign up with email, password, and metadata
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} metadata - Additional user metadata (fullName, role, etc.)
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  return { data, error };
};

/**
 * Sign out the current user
 * @returns {Promise<{error: Object}>}
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
};

/**
 * Get the current authenticated user with profile data (including roles)
 * @returns {Promise<{user: Object, error: Object}>}
 */
export const getCurrentUser = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, error: authError };
  }

  // Fetch profile to get role and roles array
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, roles, full_name, profile_image_url, player_request_status')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.warn('Could not fetch profile:', profileError);
    // Return user without profile data
    return { user, error: null };
  }

  // Get roles array or fallback to single role
  const roles = profile?.roles || (profile?.role ? [profile.role] : ['fan']);
  const primaryRole = profile?.role || roles[0] || 'fan';

  // Helper to check if user has a specific role
  const hasRole = (checkRole) => roles.includes(checkRole) || primaryRole === checkRole;

  // Merge profile data into user object
  const userWithProfile = {
    ...user,
    role: primaryRole,
    roles: roles,
    hasRole: hasRole,
    isAdmin: hasRole('admin') || hasRole('super_admin'),
    isSuperAdmin: hasRole('super_admin'),
    isPlayer: hasRole('player'),
    isCoach: hasRole('coach'),
    isOwner: hasRole('owner'),
    isEditor: hasRole('editor'),
    isMarketing: hasRole('marketing'),
    profile: profile,
    user_metadata: {
      ...user.user_metadata,
      role: primaryRole,
      roles: roles,
      full_name: profile?.full_name || user.user_metadata?.full_name,
      avatar_url: profile?.profile_image_url || user.user_metadata?.avatar_url,
    },
  };

  return { user: userWithProfile, error: null };
};

/**
 * Get the current session
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Object} - Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription;
};

/**
 * Force refresh the current user's profile data from the database
 * Call this after database updates to roles/profile
 * @returns {Promise<{user: Object, error: Object}>}
 */
export const refreshUser = async () => {
  // Force a token refresh to ensure we have fresh data
  const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

  if (refreshError) {
    console.warn('Could not refresh session:', refreshError);
  }

  // Get the updated user with profile data
  return getCurrentUser();
};

export default {
  signIn,
  signInWithOAuth,
  signUp,
  signOut,
  resetPassword,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  refreshUser,
};

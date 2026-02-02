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
 * Get the current authenticated user
 * @returns {Promise<{data: Object, error: Object}>}
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
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

export default {
  signIn,
  signUp,
  signOut,
  resetPassword,
  getCurrentUser,
  getSession,
  onAuthStateChange,
};

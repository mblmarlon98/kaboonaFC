import supabase from './supabase';

// Detect if running in Capacitor native shell
function isNativePlatform() {
  return typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();
}

// Get platform string
function getPlatform() {
  if (!isNativePlatform()) return 'web';
  return window.Capacitor.getPlatform(); // 'android' or 'ios'
}

// Initialize push notifications
export async function initializePushNotifications(userId) {
  try {
    if (isNativePlatform()) {
      return await initializeNativePush(userId);
    } else {
      return await initializeWebPush(userId);
    }
  } catch (error) {
    console.warn('Push notification setup failed:', error.message);
    return null;
  }
}

// Native (Capacitor) push setup
async function initializeNativePush(userId) {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    console.warn('Push permission denied');
    return null;
  }

  await PushNotifications.register();

  // Listen for registration success
  PushNotifications.addListener('registration', async (token) => {
    await saveToken(userId, token.value, getPlatform());
  });

  // Listen for push received while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
    // The in-app notification system handles display via Supabase Realtime
  });

  // Listen for push tap (app opened from notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action:', action);
    // Navigate to relevant page based on notification data
    const data = action.notification.data;
    if (data?.referenceType && data?.referenceId) {
      // Navigation will be handled by the app's routing
      window.location.href = getNotificationUrl(data.type, data.referenceType, data.referenceId);
    }
  });

  return true;
}

// Web push setup (Firebase)
async function initializeWebPush(userId) {
  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  // Firebase web push will be configured here when Firebase project is set up
  // For now, register a placeholder to indicate web push is supported
  console.log('Web push permission granted. Firebase config needed for FCM token.');
  return true;
}

// Save FCM token to database
export async function saveToken(userId, token, platform) {
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' }
    );

  if (error) {
    console.error('Failed to save device token:', error);
  }
  return !error;
}

// Remove token on logout
export async function removeToken(token) {
  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('token', token);

  if (error) {
    console.error('Failed to remove device token:', error);
  }
}

// Remove all tokens for a user (on account deletion or full logout)
export async function removeAllTokens(userId) {
  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to remove device tokens:', error);
  }
}

// Helper to get URL for notification navigation
function getNotificationUrl(type, referenceType, referenceId) {
  switch (type) {
    case 'training_invite':
    case 'match_invite':
      return '/profile';
    case 'formation_published':
      return `/match/${referenceId}/formation`;
    case 'match_reminder':
      return '/profile';
    case 'player_approved':
      return '/profile';
    default:
      return '/';
  }
}

export default {
  initializePushNotifications,
  saveToken,
  removeToken,
  removeAllTokens,
};

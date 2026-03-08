import supabase from '../services/supabase';

export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
};

export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count;
};

export const markAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const markAllAsRead = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
    .select();

  if (error) throw error;
  return data;
};

export const createNotification = async ({ userId, title, body, type, referenceType, referenceId }) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      body,
      type,
      reference_type: referenceType,
      reference_id: referenceId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const createBulkNotifications = async (playerIds, notificationData) => {
  const rows = playerIds.map((playerId) => ({
    user_id: playerId,
    title: notificationData.title,
    body: notificationData.body,
    type: notificationData.type,
    reference_type: notificationData.referenceType,
    reference_id: notificationData.referenceId,
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
};

export const subscribeToNotifications = (userId, callback) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
};

export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};

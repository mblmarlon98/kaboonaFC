import { supabase } from './supabase';
import { createBulkNotifications } from './notificationService';

/**
 * Submit a player status request
 * Updates the user's profile and notifies admins/coaches
 */
export const requestPlayerStatus = async (userId, userName) => {
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

  const staffIds = staff?.map(s => s.id) || [];
  if (staffIds.length > 0) {
    await createBulkNotifications(staffIds, {
      title: 'Pending Player Request',
      body: `${userName} has requested to join the team`,
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

  // Check if player record already exists
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('id')
    .eq('user_id', requesterId)
    .limit(1);

  if (!existingPlayer || existingPlayer.length === 0) {
    const { error: playerError } = await supabase
      .from('players')
      .insert({
        user_id: requesterId,
        name: requesterName,
        position: 'CM',
      });
    if (playerError) console.warn('Could not create player entry:', playerError);
  }

  // Mark all player_request notifications for this user as read (so other admins see it's handled)
  const { error: markError } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('type', 'player_request')
    .eq('reference_id', requesterId);

  if (markError) console.warn('Could not mark request notifications as read:', markError);

  // Notify the requester
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_id: requesterId,
      title: 'Welcome to the Squad!',
      body: 'Your request to join the team has been approved! You can now edit your player profile.',
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

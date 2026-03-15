import supabase from './supabase';
import { createBulkNotifications } from './notificationService';
import { getInjuredPlayerIds } from './injuryService';

/**
 * Scheduling service for training sessions and match management
 * Handles creation, invitations, responses, and event lifecycle
 */

// ─── Training Sessions ───────────────────────────────────────────────

/**
 * Create a new training session
 * @param {Object} params - Training session details
 * @returns {Promise<Object>} The created training session
 */
export const createTrainingSession = async ({
  title,
  date,
  time,
  durationMinutes,
  location,
  locationLat,
  locationLng,
  notes,
  createdBy,
}) => {
  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      title,
      session_date: date,
      session_time: time,
      duration_minutes: durationMinutes,
      location,
      location_lat: locationLat,
      location_lng: locationLng,
      notes,
      created_by: createdBy,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a training session
 * @param {string} sessionId - Training session UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated training session
 */
export const updateTrainingSession = async (sessionId, updates) => {
  const { data, error } = await supabase
    .from('training_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get upcoming training sessions (scheduled, date >= today)
 * @returns {Promise<Array>} Array of upcoming training sessions
 */
export const getUpcomingTrainingSessions = async () => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('status', 'scheduled')
    .gte('session_date', today)
    .order('session_date', { ascending: true })
    .order('session_time', { ascending: true });

  if (error) throw error;
  return data || [];
};

// ─── Matches ─────────────────────────────────────────────────────────

/**
 * Create a new match
 * @param {Object} params - Match details
 * @returns {Promise<Object>} The created match
 */
export const createMatch = async ({
  title,
  opponent,
  matchType,
  date,
  time,
  location,
  locationLat,
  locationLng,
  createdBy,
}) => {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      title,
      opponent,
      match_type: matchType,
      match_date: date,
      match_time: time,
      location,
      location_lat: locationLat,
      location_lng: locationLng,
      created_by: createdBy,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update a match
 * @param {string} matchId - Match UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated match
 */
export const updateMatch = async (matchId, updates) => {
  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', matchId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get upcoming matches (scheduled, date >= today)
 * @returns {Promise<Array>} Array of upcoming matches
 */
export const getUpcomingMatches = async () => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'scheduled')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Complete a match with final score
 * @param {string} matchId - Match UUID
 * @param {number} scoreFor - Goals scored by the team
 * @param {number} scoreAgainst - Goals conceded
 * @returns {Promise<Object>} The updated match
 */
export const completeMatch = async (matchId, scoreFor, scoreAgainst) => {
  let result;
  if (scoreFor > scoreAgainst) {
    result = 'win';
  } else if (scoreFor < scoreAgainst) {
    result = 'loss';
  } else {
    result = 'draw';
  }

  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'completed',
      score_for: scoreFor,
      score_against: scoreAgainst,
      result,
      completed_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── Invitations ─────────────────────────────────────────────────────

/**
 * Send invitations for an event to multiple players
 * @param {string} eventType - 'match' or 'training'
 * @param {string} eventId - The event UUID
 * @param {string[]} playerIds - Array of player user IDs
 * @returns {Promise<Array>} The created invitations
 */
export const sendInvitations = async (eventType, eventId, playerIds) => {
  // Filter out injured players
  const injuredIds = await getInjuredPlayerIds();
  const healthyPlayerIds = playerIds.filter((id) => !injuredIds.has(id));

  if (healthyPlayerIds.length === 0) return [];

  const rows = healthyPlayerIds.map((playerId) => ({
    event_type: eventType,
    event_id: eventId,
    player_id: playerId,
    status: 'pending',
  }));

  const { data, error } = await supabase
    .from('event_invitations')
    .insert(rows)
    .select();

  if (error) throw error;

  // Fetch event details for notification text
  let notificationTitle;
  let notificationBody;

  if (eventType === 'training') {
    const { data: session } = await supabase
      .from('training_sessions')
      .select('session_date, session_time')
      .eq('id', eventId)
      .single();

    notificationTitle = 'Training Session Scheduled';
    notificationBody = session
      ? `Training on ${session.session_date} at ${session.session_time}`
      : 'A new training session has been scheduled';
  } else {
    const { data: match } = await supabase
      .from('matches')
      .select('opponent, match_date')
      .eq('id', eventId)
      .single();

    notificationTitle = 'Match Scheduled';
    notificationBody = match
      ? `Match vs ${match.opponent} on ${match.match_date}`
      : 'A new match has been scheduled';
  }

  await createBulkNotifications(healthyPlayerIds, {
    title: notificationTitle,
    body: notificationBody,
    type: eventType === 'training' ? 'training_invite' : 'match_invite',
    referenceType: eventType,
    referenceId: eventId,
  });

  return data;
};

/**
 * Respond to an invitation (accept/decline)
 * @param {string} invitationId - Invitation UUID
 * @param {string} status - 'accepted' or 'declined'
 * @returns {Promise<Object>} The updated invitation
 */
export const respondToInvitation = async (invitationId, status) => {
  const { data, error } = await supabase
    .from('event_invitations')
    .update({
      status,
      responded_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get all invitations for a specific event with player details
 * @param {string} eventType - 'match' or 'training'
 * @param {string} eventId - Event UUID
 * @returns {Promise<Array>} Invitations with player profile and position info
 */
export const getInvitationsForEvent = async (eventType, eventId) => {
  const { data, error } = await supabase
    .from('event_invitations')
    .select(`
      *,
      profiles:player_id (
        full_name,
        profile_image_url
      )
    `)
    .eq('event_type', eventType)
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Fetch player positions separately since player_id references profiles, not players
  const playerUserIds = data.map((inv) => inv.player_id).filter(Boolean);
  const { data: players } = await supabase
    .from('players')
    .select('user_id, position')
    .in('user_id', playerUserIds);

  const positionMap = {};
  (players || []).forEach((p) => {
    positionMap[p.user_id] = p.position;
  });

  return data.map((inv) => ({
    ...inv,
    players: { position: positionMap[inv.player_id] || null },
  }));
};

/**
 * Get invitations for a specific user, optionally filtered by status
 * Joins with match or training session details for enriched data
 * @param {string} userId - The user's UUID
 * @param {string|null} status - Optional status filter ('pending', 'accepted', 'declined')
 * @returns {Promise<Array>} Enriched invitations with event details
 */
export const getMyInvitations = async (userId, status = null) => {
  let query = supabase
    .from('event_invitations')
    .select('*')
    .eq('player_id', userId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: invitations, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  if (!invitations || invitations.length === 0) return [];

  // Separate invitations by event type for batch fetching
  const matchIds = invitations
    .filter((inv) => inv.event_type === 'match')
    .map((inv) => inv.event_id);

  const trainingIds = invitations
    .filter((inv) => inv.event_type === 'training')
    .map((inv) => inv.event_id);

  // Fetch event details in parallel
  const [matchesResult, trainingsResult] = await Promise.all([
    matchIds.length > 0
      ? supabase.from('matches').select('*').in('id', matchIds)
      : { data: [] },
    trainingIds.length > 0
      ? supabase.from('training_sessions').select('*').in('id', trainingIds)
      : { data: [] },
  ]);

  const matchesMap = {};
  (matchesResult.data || []).forEach((m) => {
    matchesMap[m.id] = m;
  });

  const trainingsMap = {};
  (trainingsResult.data || []).forEach((t) => {
    trainingsMap[t.id] = t;
  });

  // Enrich invitations with event details
  return invitations.map((inv) => ({
    ...inv,
    event:
      inv.event_type === 'match'
        ? matchesMap[inv.event_id] || null
        : trainingsMap[inv.event_id] || null,
  }));
};

// ─── Event Lifecycle ─────────────────────────────────────────────────

/**
 * Cancel an event (match or training) and notify invited players
 * @param {string} eventType - 'match' or 'training'
 * @param {string} eventId - Event UUID
 * @returns {Promise<Object>} The updated event
 */
export const cancelEvent = async (eventType, eventId) => {
  const table = eventType === 'match' ? 'matches' : 'training_sessions';

  const { data, error } = await supabase
    .from(table)
    .update({ status: 'cancelled' })
    .eq('id', eventId)
    .select()
    .single();

  if (error) throw error;

  // Get all invited players for this event
  const { data: invitations } = await supabase
    .from('event_invitations')
    .select('player_id')
    .eq('event_type', eventType)
    .eq('event_id', eventId);

  if (invitations && invitations.length > 0) {
    const playerIds = invitations.map((inv) => inv.player_id);

    const eventLabel = eventType === 'match' ? 'Match' : 'Training Session';

    await createBulkNotifications(playerIds, {
      title: `${eventLabel} Cancelled`,
      body: `The ${eventLabel.toLowerCase()} has been cancelled.`,
      type: 'event_cancellation',
      referenceType: eventType,
      referenceId: eventId,
    });
  }

  return data;
};

// ─── Analytics ───────────────────────────────────────────────────────

/**
 * Get position breakdown for accepted invitations on an event
 * Groups players into GK, DEF, MID, FWD categories
 * @param {string} eventType - 'match' or 'training'
 * @param {string} eventId - Event UUID
 * @returns {Promise<Object>} Position breakdown { gk, def, mid, fwd, total }
 */
export const getPositionBreakdown = async (eventType, eventId) => {
  const { data, error } = await supabase
    .from('event_invitations')
    .select('player_id')
    .eq('event_type', eventType)
    .eq('event_id', eventId)
    .eq('status', 'accepted');

  if (error) throw error;

  const playerUserIds = (data || []).map((inv) => inv.player_id).filter(Boolean);
  if (playerUserIds.length === 0) {
    return { gk: 0, def: 0, mid: 0, fwd: 0, total: 0 };
  }

  const { data: players } = await supabase
    .from('players')
    .select('user_id, position')
    .in('user_id', playerUserIds);

  const DEF_POSITIONS = ['CB', 'LB', 'RB', 'LWB', 'RWB'];
  const MID_POSITIONS = ['CM', 'CDM', 'CAM', 'LM', 'RM'];
  const FWD_POSITIONS = ['ST', 'CF', 'LW', 'RW'];

  const breakdown = { gk: 0, def: 0, mid: 0, fwd: 0, total: 0 };

  (players || []).forEach((p) => {
    const position = p.position?.toUpperCase();
    if (!position) return;

    breakdown.total += 1;

    if (position === 'GK') {
      breakdown.gk += 1;
    } else if (DEF_POSITIONS.includes(position)) {
      breakdown.def += 1;
    } else if (MID_POSITIONS.includes(position)) {
      breakdown.mid += 1;
    } else if (FWD_POSITIONS.includes(position)) {
      breakdown.fwd += 1;
    }
  });

  return breakdown;
};

// ─── New Player Auto-Invite ──────────────────────────────────────────

/**
 * Auto-invite a newly registered player to all upcoming scheduled events.
 * Creates pending invitations and sends immediate notifications for
 * any events happening within 24 hours.
 * @param {string} userId - The new player's user ID
 */
export const autoInviteNewPlayer = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Fetch upcoming trainings and matches in parallel
  const [{ data: trainings }, { data: matches }] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('id, session_date, session_time')
      .eq('status', 'scheduled')
      .gte('session_date', today),
    supabase
      .from('matches')
      .select('id, opponent, match_date, match_time')
      .eq('status', 'scheduled')
      .gte('match_date', today),
  ]);

  const invitationRows = [];
  const immediateNotifications = [];

  // Create invitations for trainings
  (trainings || []).forEach((t) => {
    invitationRows.push({
      event_type: 'training',
      event_id: t.id,
      player_id: userId,
      status: 'pending',
    });

    const eventDateTime = new Date(`${t.session_date}T${t.session_time || '00:00:00'}`);
    const hoursUntil = (eventDateTime - now) / (1000 * 60 * 60);

    if (hoursUntil > 0 && hoursUntil <= 24) {
      immediateNotifications.push({
        user_id: userId,
        title: 'Training Session Soon!',
        body: `Training on ${t.session_date} at ${t.session_time} — happening within 24 hours!`,
        type: 'match_reminder',
        reference_type: 'training',
        reference_id: t.id,
      });
    }
  });

  // Create invitations for matches
  (matches || []).forEach((m) => {
    invitationRows.push({
      event_type: 'match',
      event_id: m.id,
      player_id: userId,
      status: 'pending',
    });

    const eventDateTime = new Date(`${m.match_date}T${m.match_time || '00:00:00'}`);
    const hoursUntil = (eventDateTime - now) / (1000 * 60 * 60);

    if (hoursUntil > 0 && hoursUntil <= 24) {
      immediateNotifications.push({
        user_id: userId,
        title: 'Match Day Approaching!',
        body: `Match vs ${m.opponent || 'TBD'} on ${m.match_date} — happening within 24 hours!`,
        type: 'match_reminder',
        reference_type: 'match',
        reference_id: m.id,
      });
    }
  });

  // Insert invitations
  if (invitationRows.length > 0) {
    await supabase.from('event_invitations').insert(invitationRows);
  }

  // Send immediate notifications for events within 24h
  if (immediateNotifications.length > 0) {
    await supabase.from('notifications').insert(immediateNotifications);
  }

  // Also send standard training/match invite notifications for ALL upcoming events
  const standardNotifications = [];
  (trainings || []).forEach((t) => {
    standardNotifications.push({
      user_id: userId,
      title: 'Training Session Scheduled',
      body: `Training on ${t.session_date} at ${t.session_time}`,
      type: 'training_invite',
      reference_type: 'training',
      reference_id: t.id,
    });
  });
  (matches || []).forEach((m) => {
    standardNotifications.push({
      user_id: userId,
      title: 'Match Scheduled',
      body: `Match vs ${m.opponent || 'TBD'} on ${m.match_date}`,
      type: 'match_invite',
      reference_type: 'match',
      reference_id: m.id,
    });
  });

  if (standardNotifications.length > 0) {
    await supabase.from('notifications').insert(standardNotifications);
  }
};

// ─── Upcoming Event Reminders ────────────────────────────────────────

/**
 * Check for upcoming events within 24 hours and send reminder
 * notifications if they haven't been sent yet.
 * Call this on app load / login for player users.
 * @param {string} userId - The player's user ID
 */
export const checkUpcomingEventReminders = async (userId) => {
  const now = new Date();

  // Get the player's accepted invitations
  const { data: invitations } = await supabase
    .from('event_invitations')
    .select('event_type, event_id')
    .eq('player_id', userId)
    .eq('status', 'accepted');

  if (!invitations || invitations.length === 0) return;

  const trainingIds = invitations.filter((i) => i.event_type === 'training').map((i) => i.event_id);
  const matchIds = invitations.filter((i) => i.event_type === 'match').map((i) => i.event_id);

  const pendingReminders = [];

  // Check trainings within 24h
  if (trainingIds.length > 0) {
    const { data: trainings } = await supabase
      .from('training_sessions')
      .select('id, session_date, session_time')
      .in('id', trainingIds)
      .eq('status', 'scheduled');

    (trainings || []).forEach((t) => {
      const eventDateTime = new Date(`${t.session_date}T${t.session_time || '00:00:00'}`);
      const hoursUntil = (eventDateTime - now) / (1000 * 60 * 60);

      if (hoursUntil > 0 && hoursUntil <= 24) {
        pendingReminders.push({
          eventType: 'training',
          eventId: t.id,
          title: 'Training Tomorrow!',
          body: `Training session on ${t.session_date} at ${t.session_time}`,
        });
      }
    });
  }

  // Check matches within 24h
  if (matchIds.length > 0) {
    const { data: matches } = await supabase
      .from('matches')
      .select('id, opponent, match_date, match_time')
      .in('id', matchIds)
      .eq('status', 'scheduled');

    (matches || []).forEach((m) => {
      const eventDateTime = new Date(`${m.match_date}T${m.match_time || '00:00:00'}`);
      const hoursUntil = (eventDateTime - now) / (1000 * 60 * 60);

      if (hoursUntil > 0 && hoursUntil <= 24) {
        pendingReminders.push({
          eventType: 'match',
          eventId: m.id,
          title: 'Match Day Tomorrow!',
          body: `Match vs ${m.opponent || 'TBD'} on ${m.match_date}`,
        });
      }
    });
  }

  if (pendingReminders.length === 0) return;

  // Check which reminders have already been sent (avoid duplicates)
  const { data: existingReminders } = await supabase
    .from('notifications')
    .select('reference_id, reference_type')
    .eq('user_id', userId)
    .eq('type', 'match_reminder');

  const existingSet = new Set(
    (existingReminders || []).map((r) => `${r.reference_type}:${r.reference_id}`)
  );

  const newReminders = pendingReminders
    .filter((r) => !existingSet.has(`${r.eventType}:${r.eventId}`))
    .map((r) => ({
      user_id: userId,
      title: r.title,
      body: r.body,
      type: 'match_reminder',
      reference_type: r.eventType,
      reference_id: r.eventId,
    }));

  if (newReminders.length > 0) {
    await supabase.from('notifications').insert(newReminders);
  }
};

// ─── Players ─────────────────────────────────────────────────────────

/**
 * Get all active (non-retired) players with profile information
 * @returns {Promise<Array>} Array of active players with profile data
 */
export const getAllActivePlayers = async () => {
  const { data, error } = await supabase
    .from('players')
    .select(`
      id,
      user_id,
      position,
      jersey_number,
      profiles:user_id (
        full_name,
        profile_image_url
      )
    `)
    .eq('is_retired', false)
    .eq('profiles.role', 'player');

  if (error) throw error;

  // Flatten the profile data and filter out any without a matching profile
  return (data || [])
    .filter((player) => player.profiles)
    .map((player) => ({
      id: player.id,
      user_id: player.user_id,
      full_name: player.profiles.full_name,
      position: player.position,
      jersey_number: player.jersey_number,
      profile_image_url: player.profiles.profile_image_url,
    }));
};

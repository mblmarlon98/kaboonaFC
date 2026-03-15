import { supabase } from './supabase';
import { createBulkNotifications } from './notificationService';

/**
 * Get active injury for a specific player (null if healthy)
 */
export const getActiveInjury = async (playerId) => {
  const { data, error } = await supabase
    .from('injuries')
    .select('*')
    .eq('player_id', playerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Get all active injuries (for squad selection views)
 */
export const getAllActiveInjuries = async () => {
  const { data, error } = await supabase
    .from('injuries')
    .select('*, profiles!injuries_player_id_fkey(full_name, profile_image_url)')
    .eq('status', 'active');

  if (error) throw error;
  return data || [];
};

/**
 * Get injury history for a player
 */
export const getInjuryHistory = async (playerId) => {
  const { data, error } = await supabase
    .from('injuries')
    .select('*, reporter:profiles!injuries_reported_by_fkey(full_name)')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Report an injury (coach or player self-report)
 */
export const reportInjury = async ({ playerId, reportedBy, injuryNote, expectedReturn }) => {
  const { data, error } = await supabase
    .from('injuries')
    .insert({
      player_id: playerId,
      reported_by: reportedBy,
      injury_note: injuryNote,
      expected_return: expectedReturn,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Notify coaches when a player self-reports an injury
 */
export const notifyCoachesOfInjury = async (playerName) => {
  const { data: coaches } = await supabase
    .from('profiles')
    .select('id')
    .or('roles.cs.{coach},roles.cs.{manager},roles.cs.{owner}');

  if (coaches && coaches.length > 0) {
    const coachIds = coaches.map((c) => c.id);
    await createBulkNotifications(coachIds, {
      title: 'Player Injury Reported',
      body: `${playerName} has just filed an injury`,
      type: 'injury_reported',
      referenceType: 'injury',
      referenceId: null,
    });
  }
};

/**
 * Mark an injury as recovered
 */
export const recoverInjury = async (injuryId) => {
  const { data, error } = await supabase
    .from('injuries')
    .update({ status: 'recovered', recovered_at: new Date().toISOString() })
    .eq('id', injuryId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get set of injured player IDs (for filtering)
 */
export const getInjuredPlayerIds = async () => {
  const { data, error } = await supabase
    .from('injuries')
    .select('player_id')
    .eq('status', 'active');

  if (error) throw error;
  return new Set((data || []).map((r) => r.player_id));
};

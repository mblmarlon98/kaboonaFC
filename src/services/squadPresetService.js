import { supabase } from './supabase';

/**
 * Get all squad presets with player counts
 */
export const getPresets = async () => {
  const { data, error } = await supabase
    .from('squad_presets')
    .select('*, squad_preset_players(player_id)')
    .order('name');

  if (error) throw error;
  return (data || []).map((p) => ({
    ...p,
    playerCount: (p.squad_preset_players || []).length,
    playerIds: (p.squad_preset_players || []).map((sp) => sp.player_id),
  }));
};

/**
 * Get a single preset with full player details
 */
export const getPresetWithPlayers = async (presetId) => {
  const { data, error } = await supabase
    .from('squad_presets')
    .select('*, squad_preset_players(player_id, profiles(id, full_name, profile_image_url, roles))')
    .eq('id', presetId)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Create a new squad preset
 */
export const createPreset = async (name, createdBy) => {
  const { data, error } = await supabase
    .from('squad_presets')
    .insert({ name, created_by: createdBy })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update preset name
 */
export const updatePreset = async (presetId, name) => {
  const { data, error } = await supabase
    .from('squad_presets')
    .update({ name })
    .eq('id', presetId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a preset
 */
export const deletePreset = async (presetId) => {
  const { error } = await supabase
    .from('squad_presets')
    .delete()
    .eq('id', presetId);

  if (error) throw error;
};

/**
 * Set players for a preset (replaces all existing)
 */
export const setPresetPlayers = async (presetId, playerIds) => {
  // Delete existing
  await supabase
    .from('squad_preset_players')
    .delete()
    .eq('preset_id', presetId);

  if (playerIds.length === 0) return [];

  // Insert new
  const rows = playerIds.map((playerId) => ({
    preset_id: presetId,
    player_id: playerId,
  }));

  const { data, error } = await supabase
    .from('squad_preset_players')
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
};

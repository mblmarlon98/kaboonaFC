import { supabase } from './supabase';
import { getStreakThreshold, calculateOverall } from '../utils/cardTiers';

/**
 * Performance tracking service for player streak system
 * Handles recording performances, updating streaks, and rating increases
 */

/**
 * Record a player's performance for a match
 * @param {string} playerId - The player's UUID
 * @param {string} matchDate - Date of the match (YYYY-MM-DD)
 * @param {number} rating - Performance rating (0-10)
 * @param {string|null} matchId - Optional match UUID for linking
 * @returns {Promise<Object>} The created performance record
 */
export const recordPerformance = async (playerId, matchDate, rating, matchId = null) => {
  const isGood = rating >= 7.0;

  // Insert performance record
  const { data: performance, error: perfError } = await supabase
    .from('player_performances')
    .insert({
      player_id: playerId,
      match_date: matchDate,
      rating,
      is_good_performance: isGood,
      match_id: matchId,
    })
    .select()
    .single();

  if (perfError) {
    console.error('Error recording performance:', perfError);
    throw perfError;
  }

  // Update streak based on performance
  await updateStreak(playerId, isGood);

  return performance;
};

/**
 * Update a player's performance streak
 * @param {string} playerId - The player's UUID
 * @param {boolean} isGoodPerformance - Whether the performance was good (7.0+ rating)
 */
export const updateStreak = async (playerId, isGoodPerformance) => {
  try {
    // Get current streak data
    const { data: streak } = await supabase
      .from('player_streaks')
      .select('*')
      .eq('player_id', playerId)
      .single();

    // Get player's current stats to calculate overall
    const { data: player } = await supabase
      .from('players')
      .select('stats, position')
      .eq('id', playerId)
      .single();

    if (!player) {
      console.error('Player not found:', playerId);
      return;
    }

    const currentOverall = calculateOverall(player.stats, player.position);
    const threshold = getStreakThreshold(currentOverall);

    let newStreak = 0;
    let shouldIncreaseRating = false;

    if (isGoodPerformance) {
      newStreak = (streak?.current_streak || 0) + 1;
      if (newStreak >= threshold) {
        shouldIncreaseRating = true;
        newStreak = 0; // Reset after rating increase
      }
    }
    // Bad performance resets streak to 0 (newStreak stays 0)

    // Upsert streak record
    const { error: streakError } = await supabase
      .from('player_streaks')
      .upsert({
        player_id: playerId,
        current_streak: newStreak,
        streak_threshold: threshold,
        last_rating_increase: shouldIncreaseRating ? new Date().toISOString().split('T')[0] : streak?.last_rating_increase,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'player_id',
      });

    if (streakError) {
      console.error('Error updating streak:', streakError);
    }

    if (shouldIncreaseRating) {
      await increasePlayerRating(playerId, currentOverall, player.stats, player.position);
    }
  } catch (error) {
    console.error('Error in updateStreak:', error);
  }
};

/**
 * Increase a player's overall rating after achieving streak threshold
 * @param {string} playerId - The player's UUID
 * @param {number} currentOverall - Current overall rating
 * @param {Object} currentStats - Current stats object
 * @param {string} position - Player position
 */
export const increasePlayerRating = async (playerId, currentOverall, currentStats, position) => {
  try {
    // Record history
    await supabase
      .from('rating_history')
      .insert({
        player_id: playerId,
        old_overall: currentOverall,
        new_overall: currentOverall + 1,
        reason: 'Streak achievement',
      });

    // Calculate which stats to increase
    // Simple approach: increase the lowest stats to balance the player
    const statKeys = position === 'GK'
      ? ['diving', 'handling', 'kicking', 'reflexes', 'gk_speed', 'gk_positioning']
      : ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

    // Find the lowest stat and increase it by 1
    const sortedStats = statKeys
      .map(key => ({ key, value: currentStats[key] || 50 }))
      .sort((a, b) => a.value - b.value);

    const statToIncrease = sortedStats[0];
    const newStats = {
      ...currentStats,
      [statToIncrease.key]: Math.min(99, statToIncrease.value + 1),
    };

    // Update player stats in database
    const { error } = await supabase
      .from('players')
      .update({ stats: newStats })
      .eq('id', playerId);

    if (error) {
      console.error('Error updating player stats:', error);
    }
  } catch (error) {
    console.error('Error in increasePlayerRating:', error);
  }
};

/**
 * Get a player's current streak data
 * @param {string} playerId - The player's UUID
 * @returns {Promise<Object|null>} Streak data or null
 */
export const getPlayerStreak = async (playerId) => {
  const { data, error } = await supabase
    .from('player_streaks')
    .select('*')
    .eq('player_id', playerId)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
    console.error('Error fetching streak:', error);
  }

  return data;
};

/**
 * Get a player's recent performance history
 * @param {string} playerId - The player's UUID
 * @param {number} limit - Maximum number of performances to return
 * @returns {Promise<Array>} Array of performance records
 */
export const getRecentPerformances = async (playerId, limit = 10) => {
  const { data, error } = await supabase
    .from('player_performances')
    .select('*')
    .eq('player_id', playerId)
    .order('match_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching performances:', error);
    return [];
  }

  return data || [];
};

/**
 * Get a player's rating history
 * @param {string} playerId - The player's UUID
 * @param {number} limit - Maximum number of history records
 * @returns {Promise<Array>} Array of rating history records
 */
export const getRatingHistory = async (playerId, limit = 10) => {
  const { data, error } = await supabase
    .from('rating_history')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching rating history:', error);
    return [];
  }

  return data || [];
};

/**
 * Batch record performances for multiple players (for match evaluation)
 * @param {Array<{playerId: string, rating: number}>} playerRatings - Array of player ratings
 * @param {string} matchDate - Date of the match
 * @param {string|null} matchId - Optional match UUID
 * @returns {Promise<Array>} Array of created performance records
 */
export const batchRecordPerformances = async (playerRatings, matchDate, matchId = null) => {
  const results = [];

  for (const { playerId, rating } of playerRatings) {
    try {
      const performance = await recordPerformance(playerId, matchDate, rating, matchId);
      results.push({ playerId, success: true, performance });
    } catch (error) {
      results.push({ playerId, success: false, error: error.message });
    }
  }

  return results;
};

/**
 * Check if a player had a recent rating increase (within last 7 days)
 * @param {string} playerId - The player's UUID
 * @returns {Promise<boolean>}
 */
export const hasRecentRatingIncrease = async (playerId) => {
  const { data } = await supabase
    .from('player_streaks')
    .select('last_rating_increase')
    .eq('player_id', playerId)
    .single();

  if (!data?.last_rating_increase) return false;

  const lastIncrease = new Date(data.last_rating_increase);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  return lastIncrease > weekAgo;
};

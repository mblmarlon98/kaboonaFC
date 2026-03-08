import React, { Component } from 'react';
import { motion } from 'framer-motion';
import supabase from '../../../services/supabase';
import { getInvitationsForEvent, completeMatch } from '../../../services/schedulingService';

/**
 * MatchEvaluation - Evaluate player performances after matches
 * Fetches real match and player data from Supabase
 */
class MatchEvaluation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Match selector
      matches: [],
      selectedMatchId: '',
      loadingMatches: true,
      matchError: null,

      // Player evaluation form
      players: [],
      loadingPlayers: false,
      playersError: null,

      // Match result
      scoreFor: 0,
      scoreAgainst: 0,

      // Per-player stats: { [playerId]: { goals, assists, yellowCards, redCards, minutesPlayed, rating } }
      playerStats: {},

      // Save state
      isSaving: false,
      saveMessage: null,
    };
  }

  componentDidMount() {
    this.loadMatches();
  }

  /**
   * Load all matches (scheduled + completed) ordered by date DESC
   */
  loadMatches = async () => {
    try {
      this.setState({ loadingMatches: true, matchError: null });

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false });

      if (error) throw error;

      this.setState({ matches: data || [], loadingMatches: false });
    } catch (err) {
      console.error('Error loading matches:', err);
      this.setState({
        matchError: 'Failed to load matches.',
        loadingMatches: false,
      });
    }
  };

  /**
   * Handle match selection from the dropdown
   */
  handleMatchSelect = async (matchId) => {
    if (!matchId) {
      this.setState({
        selectedMatchId: '',
        players: [],
        playerStats: {},
        scoreFor: 0,
        scoreAgainst: 0,
        saveMessage: null,
      });
      return;
    }

    const match = this.state.matches.find((m) => m.id === matchId);

    this.setState({
      selectedMatchId: matchId,
      loadingPlayers: true,
      playersError: null,
      saveMessage: null,
      scoreFor: match?.score_for || 0,
      scoreAgainst: match?.score_against || 0,
    });

    try {
      // Fetch accepted invitations for this match
      const invitations = await getInvitationsForEvent('match', matchId);
      const accepted = invitations.filter((inv) => inv.status === 'accepted');

      if (accepted.length === 0) {
        this.setState({
          players: [],
          playerStats: {},
          loadingPlayers: false,
        });
        return;
      }

      // Map player_id (user_id from profiles) to players table id
      const userIds = accepted.map((inv) => inv.player_id);

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, user_id, position, jersey_number')
        .in('user_id', userIds);

      if (playersError) throw playersError;

      // Build enriched player list
      const enrichedPlayers = accepted
        .map((inv) => {
          const playerRecord = (playersData || []).find(
            (p) => p.user_id === inv.player_id
          );
          if (!playerRecord) return null;
          return {
            id: playerRecord.id,
            user_id: inv.player_id,
            full_name: inv.profiles?.full_name || 'Unknown Player',
            position: playerRecord.position || inv.players?.position || '',
            jersey_number: playerRecord.jersey_number,
            profile_image_url: inv.profiles?.profile_image_url,
          };
        })
        .filter(Boolean);

      // Check if player_stats already exist for this match
      const playerIds = enrichedPlayers.map((p) => p.id);
      const { data: existingStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('match_id', matchId)
        .in('player_id', playerIds);

      // Build playerStats state
      const statsMap = {};
      enrichedPlayers.forEach((player) => {
        const existing = (existingStats || []).find(
          (s) => s.player_id === player.id
        );
        statsMap[player.id] = {
          goals: existing?.goals ?? 0,
          assists: existing?.assists ?? 0,
          yellowCards: existing?.yellow_cards ?? 0,
          redCards: existing?.red_cards ?? 0,
          minutesPlayed: existing?.minutes_played ?? 90,
          rating: existing?.rating ?? 6,
        };
      });

      this.setState({
        players: enrichedPlayers,
        playerStats: statsMap,
        loadingPlayers: false,
      });
    } catch (err) {
      console.error('Error loading players for match:', err);
      this.setState({
        playersError: 'Failed to load player data.',
        loadingPlayers: false,
      });
    }
  };

  /**
   * Update a single player stat field
   */
  handlePlayerStatChange = (playerId, field, value) => {
    this.setState((prevState) => ({
      playerStats: {
        ...prevState.playerStats,
        [playerId]: {
          ...prevState.playerStats[playerId],
          [field]: value,
        },
      },
    }));
  };

  /**
   * Get the CSS classes for rating color coding
   */
  getRatingColor = (rating) => {
    if (rating >= 9) return '#D4AF37'; // gold
    if (rating >= 7) return '#22c55e'; // green
    if (rating >= 4) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  getRatingBadgeClasses = (rating) => {
    if (rating >= 9) return 'text-accent-gold bg-accent-gold/20';
    if (rating >= 7) return 'text-green-400 bg-green-500/20';
    if (rating >= 4) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  getRatingLabel = (rating) => {
    if (rating >= 9) return 'Outstanding';
    if (rating >= 8) return 'Excellent';
    if (rating >= 7) return 'Good';
    if (rating >= 5) return 'Average';
    if (rating >= 4) return 'Below Average';
    return 'Poor';
  };

  /**
   * Save evaluation: upsert player_stats and complete match
   */
  handleSave = async () => {
    const { selectedMatchId, playerStats, players, scoreFor, scoreAgainst } =
      this.state;

    if (!selectedMatchId || players.length === 0) return;

    this.setState({ isSaving: true, saveMessage: null });

    try {
      // Delete existing stats for this match then insert fresh
      const playerIds = players.map((p) => p.id);

      await supabase
        .from('player_stats')
        .delete()
        .eq('match_id', selectedMatchId)
        .in('player_id', playerIds);

      // Build rows to insert
      const rows = players.map((player) => {
        const stats = playerStats[player.id] || {};
        return {
          player_id: player.id,
          match_id: selectedMatchId,
          goals: stats.goals || 0,
          assists: stats.assists || 0,
          yellow_cards: stats.yellowCards || 0,
          red_cards: stats.redCards || 0,
          minutes_played: stats.minutesPlayed ?? 90,
          clean_sheet:
            parseInt(scoreAgainst, 10) === 0 &&
            ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(
              player.position?.toUpperCase()
            ),
        };
      });

      const { error: insertError } = await supabase
        .from('player_stats')
        .insert(rows);

      if (insertError) throw insertError;

      // Complete the match with the score
      await completeMatch(
        selectedMatchId,
        parseInt(scoreFor, 10),
        parseInt(scoreAgainst, 10)
      );

      this.setState({
        isSaving: false,
        saveMessage: {
          type: 'success',
          text: 'Evaluation saved successfully! Match marked as completed.',
        },
      });

      // Refresh match list to reflect completed status
      await this.loadMatches();
    } catch (err) {
      console.error('Error saving evaluation:', err);
      this.setState({
        isSaving: false,
        saveMessage: {
          type: 'error',
          text: 'Failed to save evaluation. Please try again.',
        },
      });
    }
  };

  /**
   * Format a date string for display
   */
  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Render the position badge
   */
  renderPositionBadge = (position) => {
    const posUpper = (position || '').toUpperCase();
    let color = 'bg-gray-500/20 text-gray-400';

    if (posUpper === 'GK') color = 'bg-orange-500/20 text-orange-400';
    else if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(posUpper))
      color = 'bg-blue-500/20 text-blue-400';
    else if (['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(posUpper))
      color = 'bg-green-500/20 text-green-400';
    else if (['ST', 'CF', 'LW', 'RW'].includes(posUpper))
      color = 'bg-red-500/20 text-red-400';

    return (
      <span
        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${color}`}
      >
        {posUpper || '—'}
      </span>
    );
  };

  /**
   * Render a single player evaluation row
   */
  renderPlayerRow = (player) => {
    const stats = this.state.playerStats[player.id] || {};
    const rating = stats.rating ?? 6;
    const ratingColor = this.getRatingColor(rating);

    return (
      <motion.div
        key={player.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-dark-elevated rounded-xl p-4 border border-white/5"
      >
        {/* Player identity */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-accent-gold/20 rounded-lg flex items-center justify-center text-accent-gold font-bold text-sm">
            {player.jersey_number || '—'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">
              {player.full_name}
            </p>
            {this.renderPositionBadge(player.position)}
          </div>
          {/* Rating display */}
          <div
            className={`text-center py-1 px-3 rounded-lg font-bold text-sm ${this.getRatingBadgeClasses(rating)}`}
          >
            {rating}/10
          </div>
        </div>

        {/* Rating slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400">Rating</label>
            <span className="text-xs text-gray-500">
              {this.getRatingLabel(rating)}
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={rating}
              onChange={(e) =>
                this.handlePlayerStatChange(
                  player.id,
                  'rating',
                  parseInt(e.target.value, 10)
                )
              }
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${ratingColor} 0%, ${ratingColor} ${((rating - 1) / 9) * 100}%, rgba(255,255,255,0.1) ${((rating - 1) / 9) * 100}%, rgba(255,255,255,0.1) 100%)`,
                accentColor: '#D4AF37',
              }}
            />
            <div className="flex justify-between mt-1 text-[10px] text-gray-600">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Stat inputs - grid on desktop, stack on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Goals */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Goals</label>
            <input
              type="number"
              min="0"
              value={stats.goals ?? 0}
              onChange={(e) =>
                this.handlePlayerStatChange(
                  player.id,
                  'goals',
                  Math.max(0, parseInt(e.target.value, 10) || 0)
                )
              }
              className="w-full px-3 py-2 bg-surface-dark border border-white/10 rounded-lg text-white text-center text-sm focus:ring-2 focus:ring-accent-gold focus:border-transparent"
            />
          </div>

          {/* Assists */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Assists</label>
            <input
              type="number"
              min="0"
              value={stats.assists ?? 0}
              onChange={(e) =>
                this.handlePlayerStatChange(
                  player.id,
                  'assists',
                  Math.max(0, parseInt(e.target.value, 10) || 0)
                )
              }
              className="w-full px-3 py-2 bg-surface-dark border border-white/10 rounded-lg text-white text-center text-sm focus:ring-2 focus:ring-accent-gold focus:border-transparent"
            />
          </div>

          {/* Yellow Cards */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Yellows
            </label>
            <input
              type="number"
              min="0"
              max="2"
              value={stats.yellowCards ?? 0}
              onChange={(e) =>
                this.handlePlayerStatChange(
                  player.id,
                  'yellowCards',
                  Math.min(2, Math.max(0, parseInt(e.target.value, 10) || 0))
                )
              }
              className="w-full px-3 py-2 bg-surface-dark border border-white/10 rounded-lg text-white text-center text-sm focus:ring-2 focus:ring-accent-gold focus:border-transparent"
            />
          </div>

          {/* Red Cards */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Reds</label>
            <input
              type="number"
              min="0"
              max="1"
              value={stats.redCards ?? 0}
              onChange={(e) =>
                this.handlePlayerStatChange(
                  player.id,
                  'redCards',
                  Math.min(1, Math.max(0, parseInt(e.target.value, 10) || 0))
                )
              }
              className="w-full px-3 py-2 bg-surface-dark border border-white/10 rounded-lg text-white text-center text-sm focus:ring-2 focus:ring-accent-gold focus:border-transparent"
            />
          </div>

          {/* Minutes Played */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs text-gray-400 mb-1">
              Minutes
            </label>
            <input
              type="number"
              min="0"
              max="120"
              value={stats.minutesPlayed ?? 90}
              onChange={(e) =>
                this.handlePlayerStatChange(
                  player.id,
                  'minutesPlayed',
                  Math.min(120, Math.max(0, parseInt(e.target.value, 10) || 0))
                )
              }
              className="w-full px-3 py-2 bg-surface-dark border border-white/10 rounded-lg text-white text-center text-sm focus:ring-2 focus:ring-accent-gold focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>
    );
  };

  render() {
    const {
      matches,
      selectedMatchId,
      loadingMatches,
      matchError,
      players,
      loadingPlayers,
      playersError,
      scoreFor,
      scoreAgainst,
      isSaving,
      saveMessage,
    } = this.state;

    const selectedMatch = matches.find((m) => m.id === selectedMatchId);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-display font-bold text-white">
            Match Evaluation
          </h2>
          <p className="text-gray-400 mt-1">
            Rate player performances and record match statistics
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              saveMessage.type === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {saveMessage.text}
          </motion.div>
        )}

        {/* Match Selector */}
        <div className="bg-surface-dark-elevated rounded-xl p-4 sm:p-6 border border-white/5">
          <h3 className="text-lg font-display font-bold text-white mb-4">
            Select Match
          </h3>

          {loadingMatches ? (
            <div className="flex items-center gap-3 text-gray-400">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading matches...
            </div>
          ) : matchError ? (
            <p className="text-red-400">{matchError}</p>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-400 font-medium">No matches found.</p>
              <p className="text-gray-500 text-sm mt-1">
                Schedule a match first.
              </p>
            </div>
          ) : (
            <select
              value={selectedMatchId}
              onChange={(e) => this.handleMatchSelect(e.target.value)}
              className="w-full px-4 py-3 bg-surface-dark border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-accent-gold focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">-- Select a match --</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  vs {match.opponent} — {this.formatDate(match.match_date)}
                  {match.status === 'completed' ? ' [Evaluated]' : ''}
                </option>
              ))}
            </select>
          )}

          {/* Evaluated badge for selected match */}
          {selectedMatch && selectedMatch.status === 'completed' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-accent-gold/10 border border-accent-gold/30 rounded-lg text-accent-gold text-sm font-medium">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Evaluated
            </div>
          )}
        </div>

        {/* Player Evaluation Form (shown after selecting a match) */}
        {selectedMatchId && (
          <>
            {/* Match Result Section */}
            <div className="bg-surface-dark-elevated rounded-xl p-4 sm:p-6 border border-white/5">
              <h3 className="text-lg font-display font-bold text-white mb-4">
                Match Result
              </h3>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <label className="block text-xs text-gray-400 mb-2">
                    Kaboona FC
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreFor}
                    onChange={(e) =>
                      this.setState({
                        scoreFor: Math.max(
                          0,
                          parseInt(e.target.value, 10) || 0
                        ),
                      })
                    }
                    className="w-20 px-3 py-3 bg-surface-dark border border-white/10 rounded-lg text-white text-center text-2xl font-bold focus:ring-2 focus:ring-accent-gold focus:border-transparent"
                  />
                </div>
                <span className="text-gray-500 text-2xl font-bold mt-5">
                  —
                </span>
                <div className="text-center">
                  <label className="block text-xs text-gray-400 mb-2">
                    {selectedMatch?.opponent || 'Opponent'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreAgainst}
                    onChange={(e) =>
                      this.setState({
                        scoreAgainst: Math.max(
                          0,
                          parseInt(e.target.value, 10) || 0
                        ),
                      })
                    }
                    className="w-20 px-3 py-3 bg-surface-dark border border-white/10 rounded-lg text-white text-center text-2xl font-bold focus:ring-2 focus:ring-accent-gold focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Player Stats */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold text-white">
                  Player Evaluations
                </h3>
                {players.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {players.length} player{players.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {loadingPlayers ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <svg
                    className="animate-spin w-6 h-6 mr-3"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Loading players...
                </div>
              ) : playersError ? (
                <div className="text-center py-8 text-red-400">
                  {playersError}
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-12 bg-surface-dark-elevated rounded-xl border border-white/5">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-400 font-medium">
                    No players accepted this match invitation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {players.map((player) => this.renderPlayerRow(player))}
                </div>
              )}
            </div>

            {/* Save Button */}
            {players.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={this.handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Save Evaluation
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
}

export default MatchEvaluation;

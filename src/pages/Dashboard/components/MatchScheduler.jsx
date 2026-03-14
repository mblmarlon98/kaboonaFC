import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createMatch,
  sendInvitations,
  getUpcomingMatches,
  getInvitationsForEvent,
  getPositionBreakdown,
  getAllActivePlayers,
  cancelEvent,
} from '../../../services/schedulingService';

/**
 * Position filter categories for player selection
 */
const POSITION_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'gk', label: 'GK' },
  { key: 'def', label: 'DEF' },
  { key: 'mid', label: 'MID' },
  { key: 'fwd', label: 'FWD' },
];

const DEF_POSITIONS = ['CB', 'LB', 'RB', 'LWB', 'RWB'];
const MID_POSITIONS = ['CM', 'CDM', 'CAM', 'LM', 'RM'];
const FWD_POSITIONS = ['ST', 'CF', 'LW', 'RW'];

/**
 * Format a date string (YYYY-MM-DD) into a human-readable form like "Mon, 10 Mar"
 */
const formatDate = (dateStr) => {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format a time string (HH:MM:SS or HH:MM) into 12-hour format
 */
const formatTime = (timeStr) => {
  try {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  } catch {
    return timeStr;
  }
};

/**
 * Determine position category for a player position string
 */
const getPositionCategory = (position) => {
  if (!position) return 'unknown';
  const pos = position.toUpperCase();
  if (pos === 'GK') return 'gk';
  if (DEF_POSITIONS.includes(pos)) return 'def';
  if (MID_POSITIONS.includes(pos)) return 'mid';
  if (FWD_POSITIONS.includes(pos)) return 'fwd';
  return 'unknown';
};

/**
 * Get the display color for a position category
 */
const getPositionColor = (position) => {
  const cat = getPositionCategory(position);
  switch (cat) {
    case 'gk':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'def':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'mid':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'fwd':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

/**
 * Check if a match date has passed
 */
const isMatchPast = (dateStr) => {
  try {
    const matchDate = new Date(dateStr + 'T23:59:59');
    return matchDate < new Date();
  } catch {
    return false;
  }
};

/**
 * MatchScheduler - Create and manage match events with player selection
 * Class component with connect/mapStateToProps pattern
 */
class MatchScheduler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Form state
      matchType: 'league',
      opponent: '',
      date: '',
      time: '',
      location: 'The New Camp, Bandar Utama',

      // Player selection
      allPlayers: [],
      selectedPlayerIds: new Set(),
      positionFilter: 'all',
      playersLoading: true,

      // Submit state
      isSubmitting: false,

      // Matches list
      matches: [],
      matchesLoading: true,

      // Invitation data keyed by match ID
      invitationData: {},
      positionData: {},
      expandedMatches: {},

      // Toast
      toast: null,

      // Cancel confirmation
      cancelConfirmId: null,
    };
  }

  componentDidMount() {
    this.loadPlayers();
    this.loadMatches();
  }

  loadPlayers = async () => {
    this.setState({ playersLoading: true });
    try {
      const players = await getAllActivePlayers();
      this.setState({
        allPlayers: players,
        playersLoading: false,
      });
    } catch (err) {
      console.error('Failed to load players:', err);
      this.setState({ playersLoading: false });
      this.showToast('Failed to load players', 'error');
    }
  };

  loadMatches = async () => {
    this.setState({ matchesLoading: true });
    try {
      const matches = await getUpcomingMatches();
      this.setState({ matches, matchesLoading: false });

      // Load invitation data for each match in parallel
      await Promise.all(matches.map((m) => this.loadInvitationData(m.id)));
    } catch (err) {
      console.error('Failed to load matches:', err);
      this.setState({ matchesLoading: false });
      this.showToast('Failed to load matches', 'error');
    }
  };

  loadInvitationData = async (matchId) => {
    try {
      const [invitations, breakdown] = await Promise.all([
        getInvitationsForEvent('match', matchId),
        getPositionBreakdown('match', matchId),
      ]);
      this.setState((prev) => ({
        invitationData: { ...prev.invitationData, [matchId]: invitations },
        positionData: { ...prev.positionData, [matchId]: breakdown },
      }));
    } catch (err) {
      console.error('Failed to load invitation data for match', matchId, err);
    }
  };

  showToast = (message, type = 'success') => {
    this.setState({ toast: { message, type } });
    setTimeout(() => {
      this.setState({ toast: null });
    }, 3500);
  };

  handleInputChange = (field) => (e) => {
    this.setState({ [field]: e.target.value });
  };

  handleMatchTypeChange = (type) => {
    const newState = { matchType: type };
    if (type === 'league') {
      newState.location = 'The New Camp, Bandar Utama';
    } else {
      newState.location = '';
    }
    this.setState(newState);
  };

  handleTogglePlayer = (userId) => {
    this.setState((prev) => {
      const next = new Set(prev.selectedPlayerIds);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return { selectedPlayerIds: next };
    });
  };

  handleSelectAll = () => {
    const filtered = this.getFilteredPlayers();
    this.setState((prev) => {
      const next = new Set(prev.selectedPlayerIds);
      filtered.forEach((p) => next.add(p.user_id));
      return { selectedPlayerIds: next };
    });
  };

  handleDeselectAll = () => {
    const filtered = this.getFilteredPlayers();
    this.setState((prev) => {
      const next = new Set(prev.selectedPlayerIds);
      filtered.forEach((p) => next.delete(p.user_id));
      return { selectedPlayerIds: next };
    });
  };

  getFilteredPlayers = () => {
    const { allPlayers, positionFilter } = this.state;
    if (positionFilter === 'all') return allPlayers;

    return allPlayers.filter((p) => {
      const cat = getPositionCategory(p.position);
      return cat === positionFilter;
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    const { matchType, opponent, date, time, location, selectedPlayerIds } = this.state;
    const { user } = this.props;

    if (!opponent.trim() || !date || !time) {
      this.showToast('Please fill in opponent, date, and time', 'error');
      return;
    }

    if (selectedPlayerIds.size === 0) {
      this.showToast('Please select at least one player', 'error');
      return;
    }

    this.setState({ isSubmitting: true });
    try {
      const title = `${matchType === 'league' ? 'League' : 'Friendly'} vs ${opponent.trim()}`;

      const match = await createMatch({
        title,
        opponent: opponent.trim(),
        matchType,
        date,
        time,
        location: location.trim() || null,
        locationLat: null,
        locationLng: null,
        createdBy: user?.id,
      });

      // Send invitations to selected players
      const playerUserIds = Array.from(selectedPlayerIds);
      if (playerUserIds.length > 0) {
        await sendInvitations('match', match.id, playerUserIds);
      }

      this.showToast('Match scheduled and invitations sent!', 'success');

      // Reset form
      this.setState({
        matchType: 'league',
        opponent: '',
        date: '',
        time: '',
        location: 'The New Camp, Bandar Utama',
        selectedPlayerIds: new Set(),
        positionFilter: 'all',
        isSubmitting: false,
      });

      // Refresh the list
      await this.loadMatches();
    } catch (err) {
      console.error('Failed to create match:', err);
      this.showToast(err.message || 'Failed to schedule match', 'error');
      this.setState({ isSubmitting: false });
    }
  };

  handleCancel = async (matchId) => {
    this.setState({ cancelConfirmId: null });
    try {
      await cancelEvent('match', matchId);
      this.showToast('Match cancelled', 'success');
      await this.loadMatches();
    } catch (err) {
      console.error('Failed to cancel match:', err);
      this.showToast('Failed to cancel match', 'error');
    }
  };

  toggleExpanded = (matchId) => {
    this.setState((prev) => ({
      expandedMatches: {
        ...prev.expandedMatches,
        [matchId]: !prev.expandedMatches[matchId],
      },
    }));
  };

  renderToast() {
    const { toast } = this.state;
    if (!toast) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-accent-gold/90 text-black'
          }`}
        >
          {toast.message}
        </motion.div>
      </AnimatePresence>
    );
  }

  renderPlayerSelection() {
    const { selectedPlayerIds, positionFilter, allPlayers, playersLoading } = this.state;
    const filteredPlayers = this.getFilteredPlayers();

    return (
      <div className="mt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-400">
            Select Players{' '}
            <span className="text-accent-gold">
              ({selectedPlayerIds.size}/{allPlayers.length})
            </span>
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={this.handleSelectAll}
              className="px-3 py-1.5 text-xs font-medium text-accent-gold bg-accent-gold/10 rounded-lg hover:bg-accent-gold/20 transition-colors border border-accent-gold/20"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={this.handleDeselectAll}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Position filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {POSITION_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => this.setState({ positionFilter: filter.key })}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                positionFilter === filter.key
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Player grid */}
        {playersLoading ? (
          <div className="flex items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full"
            />
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">No players found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredPlayers.map((player) => {
              const isSelected = selectedPlayerIds.has(player.user_id);
              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => this.handleTogglePlayer(player.user_id)}
                  className={`relative p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-accent-gold/10 border-2 border-accent-gold shadow-lg shadow-accent-gold/10'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Checkbox indicator */}
                  <div
                    className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-accent-gold'
                        : 'bg-white/10 border border-white/20'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Jersey number */}
                  <div className="text-2xl font-display font-bold text-white/20 mb-1">
                    #{player.jersey_number || '-'}
                  </div>

                  {/* Player name */}
                  <p className="text-sm font-medium text-white truncate pr-5">
                    {player.full_name || 'Unknown'}
                  </p>

                  {/* Position badge */}
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-bold border ${getPositionColor(
                      player.position
                    )}`}
                  >
                    {player.position?.toUpperCase() || 'N/A'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  renderForm() {
    const { matchType, opponent, date, time, location, isSubmitting } = this.state;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6 mb-8"
      >
        <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          Schedule New Match
        </h2>

        <form onSubmit={this.handleSubmit}>
          {/* Match type toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Match Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => this.handleMatchTypeChange('league')}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  matchType === 'league'
                    ? 'bg-accent-gold text-black shadow-lg shadow-accent-gold/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                League
              </button>
              <button
                type="button"
                onClick={() => this.handleMatchTypeChange('friendly')}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  matchType === 'friendly'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                Friendly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Opponent */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Opponent</label>
              <input
                type="text"
                value={opponent}
                onChange={this.handleInputChange('opponent')}
                placeholder="e.g. FC United, City Lions"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-colors"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={this.handleInputChange('date')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-colors [color-scheme:dark]"
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={this.handleInputChange('time')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-colors [color-scheme:dark]"
                required
              />
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Location</label>
              <input
                type="text"
                value={location}
                onChange={this.handleInputChange('location')}
                placeholder="Enter match venue"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-colors"
              />
            </div>
          </div>

          {/* Player selection */}
          {this.renderPlayerSelection()}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full sm:w-auto px-8 py-3 bg-accent-gold text-black font-bold rounded-xl hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                />
                Scheduling...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule Match
              </>
            )}
          </button>
        </form>
      </motion.div>
    );
  }

  renderPositionBadges(breakdown) {
    if (!breakdown) return null;

    const positions = [
      { key: 'gk', label: 'GK' },
      { key: 'def', label: 'DEF' },
      { key: 'mid', label: 'MID' },
      { key: 'fwd', label: 'FWD' },
    ];

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {positions.map((pos) => {
          const count = breakdown[pos.key] || 0;
          const isZero = count === 0;
          return (
            <span
              key={pos.key}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                isZero
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
              }`}
            >
              {pos.label}: {count}
            </span>
          );
        })}
      </div>
    );
  }

  renderPlayerResponses(invitations) {
    if (!invitations || invitations.length === 0) {
      return (
        <p className="text-gray-500 text-sm py-3">No invitations sent yet.</p>
      );
    }

    // Sort: accepted first, then pending, then declined
    const statusOrder = { accepted: 0, pending: 1, declined: 2 };
    const sorted = [...invitations].sort(
      (a, b) => (statusOrder[a.status] || 1) - (statusOrder[b.status] || 1)
    );

    return (
      <div className="divide-y divide-white/5">
        {sorted.map((inv) => {
          const name = inv.profiles?.full_name || 'Unknown Player';
          const status = inv.status;

          let icon, statusColor;
          if (status === 'accepted') {
            icon = (
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            );
            statusColor = 'text-green-400';
          } else if (status === 'declined') {
            icon = (
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            );
            statusColor = 'text-red-400';
          } else {
            icon = (
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            );
            statusColor = 'text-gray-400';
          }

          return (
            <div key={inv.id} className="flex items-center gap-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <span className={`text-sm ${statusColor}`}>{name}</span>
              <span className={`text-xs capitalize ml-auto ${statusColor}`}>{status}</span>
            </div>
          );
        })}
      </div>
    );
  }

  renderMatchCard(match, index) {
    const { invitationData, positionData, expandedMatches, cancelConfirmId } = this.state;
    const invitations = invitationData[match.id] || [];
    const breakdown = positionData[match.id];
    const isExpanded = expandedMatches[match.id];
    const isPast = isMatchPast(match.match_date);

    const totalInvited = invitations.length;
    const accepted = invitations.filter((i) => i.status === 'accepted').length;
    const progressPercent = totalInvited > 0 ? Math.round((accepted / totalInvited) * 100) : 0;

    const isLeague = match.match_type === 'league';

    return (
      <motion.div
        key={match.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 overflow-hidden"
      >
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    isLeague
                      ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/20'
                      : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {isLeague ? 'League' : 'Friendly'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white truncate">
                vs {match.opponent}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(match.match_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(match.match_time)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {match.location || 'TBD'}
                </span>
              </div>
            </div>
          </div>

          {/* Response summary */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">
                <span className="text-green-400 font-medium">{accepted}</span>/{totalInvited} accepted
              </span>
              <span className="text-white font-medium">{progressPercent}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`h-full rounded-full ${isLeague ? 'bg-accent-gold' : 'bg-blue-500'}`}
              />
            </div>

            {/* Position breakdown badges */}
            {this.renderPositionBadges(breakdown)}
          </div>

          {/* Expand/collapse toggle */}
          <button
            onClick={() => this.toggleExpanded(match.id)}
            className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <motion.svg
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
            {isExpanded ? 'Hide' : 'Show'} player responses
          </button>

          {/* Expandable player responses */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-white/5">
                  {this.renderPlayerResponses(invitations)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-3 justify-end">
            {isPast ? (
              <button
                onClick={() => {
                  // Navigate to evaluation tab
                  const event = new CustomEvent('coaching-zone-tab', { detail: 'evaluation' });
                  window.dispatchEvent(event);
                }}
                className="px-4 py-2 bg-accent-gold/10 text-accent-gold text-sm font-medium rounded-xl hover:bg-accent-gold/20 transition-colors border border-accent-gold/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Evaluate
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    // Navigate to formation tab
                    const event = new CustomEvent('coaching-zone-tab', { detail: 'formation' });
                    window.dispatchEvent(event);
                  }}
                  className="px-4 py-2 bg-white/5 text-gray-300 text-sm font-medium rounded-xl hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  Set Formation
                </button>

                {cancelConfirmId === match.id ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">Cancel this match?</span>
                    <button
                      onClick={() => this.handleCancel(match.id)}
                      className="px-4 py-1.5 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                    >
                      Yes, Cancel
                    </button>
                    <button
                      onClick={() => this.setState({ cancelConfirmId: null })}
                      className="px-4 py-1.5 bg-white/5 text-gray-400 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => this.setState({ cancelConfirmId: match.id })}
                    className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  renderMatchesList() {
    const { matches, matchesLoading } = this.state;

    return (
      <div>
        <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          Upcoming Matches
        </h2>

        {matchesLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-3 border-accent-gold border-t-transparent rounded-full"
            />
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg font-medium">No upcoming matches</p>
            <p className="text-gray-500 text-sm mt-1">Schedule a match using the form above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, index) => this.renderMatchCard(match, index))}
          </div>
        )}
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderToast()}
        {this.renderForm()}
        {this.renderMatchesList()}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(MatchScheduler);

import React, { Component } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';
import {
  sendInvitations,
  getInvitationsForEvent,
  getAllActivePlayers,
} from '../../../services/schedulingService';
import { getPresets } from '../../../services/squadPresetService';
import { getInjuredPlayerIds } from '../../../services/injuryService';

// ─── Animation Variants ──────────────────────────────────────────────
const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const statusColor = (status) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'completed':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'cancelled':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-white/10 text-white/60 border-white/10';
  }
};

const matchTypeColor = (type) => {
  switch (type) {
    case 'league':
      return 'bg-accent-gold/20 text-accent-gold border-accent-gold/30';
    case 'cup':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'friendly':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    default:
      return 'bg-white/10 text-white/60 border-white/10';
  }
};

// ─── Inner Class Component ───────────────────────────────────────────
class MatchDetailInner extends Component {
  state = {
    match: null,
    invitations: [],
    players: [],
    presets: [],
    injuredIds: new Set(),
    selectedPlayerIds: new Set(),
    inviteMode: null,
    selectedPresetId: null,
    loading: true,
    sending: false,
    showNotification: false,
    notificationMessage: '',
  };

  componentDidMount() {
    this.fetchMatchData();
  }

  fetchMatchData = async () => {
    const { matchId } = this.props;

    try {
      const [matchResult, invitations, players, presets, injuredIds] =
        await Promise.all([
          supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single(),
          getInvitationsForEvent('match', matchId),
          getAllActivePlayers(),
          getPresets(),
          getInjuredPlayerIds(),
        ]);

      this.setState({
        match: matchResult.error ? null : matchResult.data,
        invitations: invitations || [],
        players: players || [],
        presets: presets || [],
        injuredIds,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to fetch match data:', err);
      this.setState({ loading: false });
    }
  };

  getAlreadyInvitedIds = () => {
    return new Set(this.state.invitations.map((inv) => inv.player_id));
  };

  handleInviteFromPreset = (presetId) => {
    const { presets, injuredIds } = this.state;
    const alreadyInvited = this.getAlreadyInvitedIds();
    const preset = presets.find((p) => p.id === presetId);

    if (!preset) {
      this.setState({ selectedPresetId: null, selectedPlayerIds: new Set() });
      return;
    }

    const eligible = (preset.playerIds || []).filter(
      (id) => !injuredIds.has(id) && !alreadyInvited.has(id)
    );

    this.setState({
      selectedPresetId: presetId,
      selectedPlayerIds: new Set(eligible),
    });
  };

  handleInviteAll = () => {
    const { players, injuredIds } = this.state;
    const alreadyInvited = this.getAlreadyInvitedIds();

    const eligible = players
      .filter((p) => !injuredIds.has(p.user_id) && !alreadyInvited.has(p.user_id))
      .map((p) => p.user_id);

    this.setState({
      inviteMode: 'all',
      selectedPlayerIds: new Set(eligible),
    });
  };

  handleTogglePlayer = (playerId) => {
    this.setState((prev) => {
      const next = new Set(prev.selectedPlayerIds);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return { selectedPlayerIds: next };
    });
  };

  handleSendInvitations = async () => {
    const { matchId } = this.props;
    const { selectedPlayerIds } = this.state;

    if (selectedPlayerIds.size === 0) return;

    this.setState({ sending: true });

    try {
      await sendInvitations('match', matchId, [...selectedPlayerIds]);

      this.setState({
        selectedPlayerIds: new Set(),
        inviteMode: null,
        selectedPresetId: null,
        sending: false,
      });

      this.showNotificationToast(
        `Invitations sent to ${selectedPlayerIds.size} player${selectedPlayerIds.size !== 1 ? 's' : ''}`
      );

      await this.fetchMatchData();
    } catch (err) {
      console.error('Failed to send invitations:', err);
      this.showNotificationToast('Failed to send invitations. Please try again.');
      this.setState({ sending: false });
    }
  };

  showNotificationToast = (msg) => {
    this.setState({ showNotification: true, notificationMessage: msg });
    clearTimeout(this._notificationTimer);
    this._notificationTimer = setTimeout(() => {
      this.setState({ showNotification: false, notificationMessage: '' });
    }, 3500);
  };

  componentWillUnmount() {
    clearTimeout(this._notificationTimer);
  }

  // ─── Render Helpers ──────────────────────────────────────────────
  renderLoadingSkeleton() {
    return (
      <div className="space-y-6 p-6">
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6 animate-pulse">
          <div className="h-4 w-32 bg-white/10 rounded mb-3" />
          <div className="h-8 w-64 bg-white/10 rounded mb-2" />
          <div className="h-4 w-48 bg-white/10 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-dark-elevated rounded-xl border border-white/5 p-4 animate-pulse"
            >
              <div className="h-8 w-12 bg-white/10 rounded mx-auto mb-2" />
              <div className="h-3 w-16 bg-white/10 rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6 animate-pulse">
          <div className="h-5 w-40 bg-white/10 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-white/10 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  renderNotFound() {
    return (
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center py-24"
      >
        <div className="text-6xl mb-4 opacity-30">?</div>
        <h2 className="text-xl font-semibold text-white mb-2">Match not found</h2>
        <p className="text-white/40 mb-6">
          The match you are looking for does not exist or has been removed.
        </p>
        <Link
          to="/dashboard/matches"
          className="px-5 py-2.5 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold/90 transition-colors"
        >
          Back to Matches
        </Link>
      </motion.div>
    );
  }

  renderMatchHeader() {
    const { match } = this.state;
    const { matchId } = this.props;

    return (
      <motion.div
        variants={fadeIn}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${matchTypeColor(match.match_type)}`}
              >
                {match.match_type || 'Match'}
              </span>
              <span
                className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusColor(match.status)}`}
              >
                {match.status}
              </span>
            </div>
            <h2 className="text-3xl font-display font-bold text-white">
              vs {match.opponent}
            </h2>
            <p className="text-white/50 mt-1">
              {formatDate(match.match_date)} &bull; {match.match_time || 'TBD'} &bull;{' '}
              {match.location || 'TBD'}
            </p>
            {match.status === 'completed' && match.score_for != null && (
              <p className="mt-2 text-lg font-bold text-accent-gold">
                {match.score_for} &ndash; {match.score_against}
                <span className="ml-2 text-sm font-normal text-white/40">
                  ({match.result})
                </span>
              </p>
            )}
          </div>
          <Link
            to={`/dashboard/formation?match=${matchId}`}
            className="px-4 py-2 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold/90 transition-colors whitespace-nowrap"
          >
            Formation Builder
          </Link>
        </div>
      </motion.div>
    );
  }

  renderInvitationStatus() {
    const { invitations } = this.state;

    const accepted = invitations.filter((inv) => inv.status === 'accepted');
    const pending = invitations.filter((inv) => inv.status === 'pending');
    const declined = invitations.filter((inv) => inv.status === 'declined');

    return (
      <motion.div variants={fadeIn} className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-400">{accepted.length}</p>
            <p className="text-white/50 text-xs uppercase tracking-wider">Accepted</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-400">{pending.length}</p>
            <p className="text-white/50 text-xs uppercase tracking-wider">Pending</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{declined.length}</p>
            <p className="text-white/50 text-xs uppercase tracking-wider">Declined</p>
          </div>
        </div>

        {/* Grouped player lists */}
        {invitations.length > 0 && (
          <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Invited Players</h3>

            {accepted.length > 0 && (
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-green-400 mb-2">
                  Accepted ({accepted.length})
                </p>
                <div className="space-y-2">
                  {accepted.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 bg-surface-dark rounded-lg p-3 border-l-4 border-green-500"
                    >
                      {inv.profiles?.profile_image_url ? (
                        <img
                          src={inv.profiles.profile_image_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                          {(inv.profiles?.full_name || '?')[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {inv.profiles?.full_name || 'Unknown Player'}
                        </p>
                        <p className="text-white/40 text-xs">
                          {inv.players?.position || '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pending.length > 0 && (
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider text-yellow-400 mb-2">
                  Pending ({pending.length})
                </p>
                <div className="space-y-2">
                  {pending.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 bg-surface-dark rounded-lg p-3 border-l-4 border-yellow-500"
                    >
                      {inv.profiles?.profile_image_url ? (
                        <img
                          src={inv.profiles.profile_image_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                          {(inv.profiles?.full_name || '?')[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {inv.profiles?.full_name || 'Unknown Player'}
                        </p>
                        <p className="text-white/40 text-xs">
                          {inv.players?.position || '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {declined.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-red-400 mb-2">
                  Declined ({declined.length})
                </p>
                <div className="space-y-2">
                  {declined.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-3 bg-surface-dark rounded-lg p-3 border-l-4 border-red-500"
                    >
                      {inv.profiles?.profile_image_url ? (
                        <img
                          src={inv.profiles.profile_image_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                          {(inv.profiles?.full_name || '?')[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {inv.profiles?.full_name || 'Unknown Player'}
                        </p>
                        <p className="text-white/40 text-xs">
                          {inv.players?.position || '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {invitations.length === 0 && (
          <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6 text-center">
            <p className="text-white/40">No players have been invited yet.</p>
          </div>
        )}
      </motion.div>
    );
  }

  renderInvitePlayersSection() {
    const {
      players,
      injuredIds,
      inviteMode,
      selectedPlayerIds,
      selectedPresetId,
      presets,
      sending,
    } = this.state;
    const alreadyInvited = this.getAlreadyInvitedIds();

    const modeButtonBase =
      'px-4 py-2 rounded-lg text-sm font-semibold transition-colors border';
    const modeButtonActive =
      'bg-accent-gold/20 text-accent-gold border-accent-gold/30';
    const modeButtonInactive =
      'bg-surface-dark text-white/50 border-white/5 hover:text-white/70 hover:border-white/10';

    return (
      <motion.div
        variants={fadeIn}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Invite Players</h3>

        {/* Mode buttons */}
        <div className="flex gap-3 mb-4">
          <button
            className={`${modeButtonBase} ${inviteMode === 'preset' ? modeButtonActive : modeButtonInactive}`}
            onClick={() =>
              this.setState({
                inviteMode: 'preset',
                selectedPlayerIds: new Set(),
                selectedPresetId: null,
              })
            }
          >
            From Preset
          </button>
          <button
            className={`${modeButtonBase} ${inviteMode === 'all' ? modeButtonActive : modeButtonInactive}`}
            onClick={this.handleInviteAll}
          >
            All Players
          </button>
          <button
            className={`${modeButtonBase} ${inviteMode === 'manual' ? modeButtonActive : modeButtonInactive}`}
            onClick={() =>
              this.setState({
                inviteMode: 'manual',
                selectedPlayerIds: new Set(),
                selectedPresetId: null,
              })
            }
          >
            Manual
          </button>
        </div>

        {/* Preset dropdown */}
        {inviteMode === 'preset' && (
          <div className="mb-4">
            <select
              value={selectedPresetId || ''}
              onChange={(e) => this.handleInviteFromPreset(e.target.value)}
              className="w-full bg-surface-dark border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-gold/50"
            >
              <option value="">Select a preset...</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.playerCount} players)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Player selection grid */}
        {(inviteMode === 'preset' || inviteMode === 'all' || inviteMode === 'manual') && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6"
          >
            {players.map((player) => {
              const isInjured = injuredIds.has(player.user_id);
              const isAlreadyInvited = alreadyInvited.has(player.user_id);
              const isSelected = selectedPlayerIds.has(player.user_id);
              const isDisabled = isInjured || isAlreadyInvited;

              return (
                <motion.div
                  key={player.user_id}
                  variants={fadeIn}
                  className={`relative flex items-center gap-3 rounded-xl p-3 border transition-colors cursor-pointer ${
                    isDisabled
                      ? 'bg-surface-dark/50 border-white/5 opacity-50 cursor-not-allowed'
                      : isSelected
                        ? 'bg-accent-gold/10 border-accent-gold/30'
                        : 'bg-surface-dark border-white/5 hover:border-white/10'
                  }`}
                  onClick={() => {
                    if (!isDisabled && inviteMode !== 'all') {
                      this.handleTogglePlayer(player.user_id);
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-accent-gold border-accent-gold'
                        : 'border-white/20'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-black"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Player avatar */}
                  {player.profile_image_url ? (
                    <img
                      src={player.profile_image_url}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/40 text-xs font-bold flex-shrink-0">
                      {(player.full_name || '?')[0]}
                    </div>
                  )}

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {player.full_name}
                    </p>
                    <p className="text-white/40 text-xs">
                      {player.position || '—'}
                      {player.jersey_number != null && ` #${player.jersey_number}`}
                    </p>
                  </div>

                  {/* Status badges */}
                  {isInjured && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
                      Injured
                    </span>
                  )}
                  {isAlreadyInvited && !isInjured && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0">
                      Invited
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Send button */}
        {inviteMode && (
          <button
            disabled={selectedPlayerIds.size === 0 || sending}
            onClick={this.handleSendInvitations}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
              selectedPlayerIds.size === 0 || sending
                ? 'bg-white/5 text-white/20 cursor-not-allowed'
                : 'bg-accent-gold text-black hover:bg-accent-gold/90'
            }`}
          >
            {sending
              ? 'Sending...'
              : `Send Invitations (${selectedPlayerIds.size})`}
          </button>
        )}
      </motion.div>
    );
  }

  renderNotification() {
    const { showNotification, notificationMessage } = this.state;
    if (!showNotification) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-6 right-6 z-50 bg-green-500/20 border border-green-500/30 text-green-400 px-5 py-3 rounded-xl shadow-lg backdrop-blur-sm"
      >
        {notificationMessage}
      </motion.div>
    );
  }

  render() {
    const { loading, match } = this.state;

    if (loading) {
      return this.renderLoadingSkeleton();
    }

    if (!match) {
      return this.renderNotFound();
    }

    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6 p-6 bg-surface-dark min-h-screen"
      >
        {this.renderNotification()}

        {/* Back link */}
        <motion.div variants={fadeIn}>
          <Link
            to="/dashboard/matches"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Matches
          </Link>
        </motion.div>

        {this.renderMatchHeader()}
        {this.renderInvitationStatus()}
        {this.renderInvitePlayersSection()}
      </motion.div>
    );
  }
}

// ─── Wrapper Function Component ──────────────────────────────────────
function MatchDetailWrapper() {
  const { matchId } = useParams();
  return <MatchDetailInner matchId={matchId} />;
}

export default MatchDetailWrapper;

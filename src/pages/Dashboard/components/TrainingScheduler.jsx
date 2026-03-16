import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import DrillSuggestions from './DrillSuggestions';
import {
  createTrainingSession,
  sendInvitations,
  getUpcomingTrainingSessions,
  getInvitationsForEvent,
  getPositionBreakdown,
  getAllActivePlayers,
  cancelEvent,
} from '../../../services/schedulingService';
import { supabase } from '../../../services/supabase';

/**
 * Duration options for the training session dropdown
 */
const DURATION_OPTIONS = [
  { label: '1 hour', value: 60 },
  { label: '1.5 hours', value: 90 },
  { label: '2 hours', value: 120 },
];

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
 * TrainingScheduler - Create and manage training sessions
 * Class component with connect/mapStateToProps pattern
 */
class TrainingScheduler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Form state
      title: '',
      date: '',
      time: '',
      durationMinutes: 120,
      location: 'Sunway University Football Field',
      notes: '',
      isSubmitting: false,

      // List state
      sessions: [],
      sessionsLoading: true,

      // Invitation data keyed by session ID
      invitationData: {},
      positionData: {},
      expandedSessions: {},

      // Toast
      toast: null,

      // Cancel confirmation
      cancelConfirmId: null,

      // Realtime channels for live invitation tracking
      realtimeChannels: {},
    };
  }

  componentDidMount() {
    this.loadSessions();
  }

  componentWillUnmount() {
    Object.values(this.state.realtimeChannels).forEach(ch => {
      supabase.removeChannel(ch);
    });
  }

  loadSessions = async () => {
    this.setState({ sessionsLoading: true });
    try {
      const sessions = await getUpcomingTrainingSessions();
      this.setState({ sessions, sessionsLoading: false });

      // Load invitation data for each session in parallel
      await Promise.all(sessions.map((s) => this.loadInvitationData(s.id)));

      // Subscribe to real-time invitation changes for each session
      this.subscribeToSessions(sessions);
    } catch (err) {
      console.error('Failed to load training sessions:', err);
      this.setState({ sessionsLoading: false });
      this.showToast('Failed to load sessions', 'error');
    }
  };

  subscribeToSessions = (sessions) => {
    // Clean up old channels
    Object.values(this.state.realtimeChannels).forEach(ch => {
      supabase.removeChannel(ch);
    });

    const channels = {};
    sessions.forEach(session => {
      const channel = supabase
        .channel(`training-invites-${session.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'event_invitations',
          filter: `event_id=eq.${session.id}`,
        }, () => {
          // Re-fetch invitation data on any change
          this.loadInvitationData(session.id);
        })
        .subscribe();
      channels[session.id] = channel;
    });

    this.setState({ realtimeChannels: channels });
  };

  loadInvitationData = async (sessionId) => {
    try {
      const [invitations, breakdown] = await Promise.all([
        getInvitationsForEvent('training', sessionId),
        getPositionBreakdown('training', sessionId),
      ]);
      this.setState((prev) => ({
        invitationData: { ...prev.invitationData, [sessionId]: invitations },
        positionData: { ...prev.positionData, [sessionId]: breakdown },
      }));
    } catch (err) {
      console.error('Failed to load invitation data for session', sessionId, err);
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

  handleSubmit = async (e) => {
    e.preventDefault();

    const { title, date, time, durationMinutes, location, notes } = this.state;
    const { user } = this.props;

    if (!title.trim() || !date || !time) {
      this.showToast('Please fill in title, date, and time', 'error');
      return;
    }

    this.setState({ isSubmitting: true });
    try {
      // Create the training session
      const session = await createTrainingSession({
        title: title.trim(),
        date,
        time,
        durationMinutes: parseInt(durationMinutes, 10),
        location: location.trim(),
        locationLat: null,
        locationLng: null,
        notes: notes.trim() || null,
        createdBy: user?.id,
      });

      // Send invitations to all active players
      const players = await getAllActivePlayers();
      const playerUserIds = players.map((p) => p.user_id);

      if (playerUserIds.length > 0) {
        await sendInvitations('training', session.id, playerUserIds);
      }

      this.showToast('Training session scheduled and invitations sent!', 'success');

      // Reset form
      this.setState({
        title: '',
        date: '',
        time: '',
        durationMinutes: 120,
        location: 'Sunway University Football Field',
        notes: '',
        isSubmitting: false,
      });

      // Refresh the list
      await this.loadSessions();
    } catch (err) {
      console.error('Failed to create training session:', err);
      this.showToast(err.message || 'Failed to schedule training', 'error');
      this.setState({ isSubmitting: false });
    }
  };

  handleCancel = async (sessionId) => {
    this.setState({ cancelConfirmId: null });
    try {
      await cancelEvent('training', sessionId);
      this.showToast('Training session cancelled', 'success');
      await this.loadSessions();
    } catch (err) {
      console.error('Failed to cancel session:', err);
      this.showToast('Failed to cancel session', 'error');
    }
  };

  toggleExpanded = (sessionId) => {
    this.setState((prev) => ({
      expandedSessions: {
        ...prev.expandedSessions,
        [sessionId]: !prev.expandedSessions[sessionId],
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

  renderForm() {
    const { title, date, time, durationMinutes, location, notes, isSubmitting } = this.state;

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
          Schedule New Training
        </h2>

        <form onSubmit={this.handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Title</label>
              <input
                type="text"
                value={title}
                onChange={this.handleInputChange('title')}
                placeholder="e.g. Passing Drills Session"
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

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Duration</label>
              <select
                value={durationMinutes}
                onChange={this.handleInputChange('durationMinutes')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-colors appearance-none"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-surface-dark">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Location</label>
              <input
                type="text"
                value={location}
                onChange={this.handleInputChange('location')}
                placeholder="Enter location"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-colors"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={this.handleInputChange('notes')}
                placeholder="Any additional notes or instructions..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/30 transition-colors resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-accent-gold text-black font-bold rounded-xl hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                Schedule Training
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

  renderSessionCard(session, index) {
    const { invitationData, positionData, expandedSessions, cancelConfirmId } = this.state;
    const invitations = invitationData[session.id] || [];
    const breakdown = positionData[session.id];
    const isExpanded = expandedSessions[session.id];

    const totalInvited = invitations.length;
    const accepted = invitations.filter((i) => i.status === 'accepted').length;
    const declined = invitations.filter((i) => i.status === 'declined').length;
    const pending = invitations.filter((i) => i.status === 'pending').length;
    const progressPercent = totalInvited > 0 ? Math.round((accepted / totalInvited) * 100) : 0;

    return (
      <motion.div
        key={session.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 overflow-hidden"
      >
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{session.title}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(session.session_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(session.session_time)}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {session.location || 'TBD'}
                </span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/20 flex-shrink-0">
              {session.status}
            </span>
          </div>

          {/* Response summary */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">
                Responses: <span className="text-green-400 font-medium">{accepted}</span> accepted
                {declined > 0 && <>, <span className="text-red-400 font-medium">{declined}</span> declined</>}
                {pending > 0 && <>, <span className="text-gray-300 font-medium">{pending}</span> pending</>}
              </span>
              <span className="text-white font-medium">{accepted}/{totalInvited}</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-accent-gold rounded-full"
              />
            </div>

            {/* Position breakdown badges */}
            {this.renderPositionBadges(breakdown)}
          </div>

          {/* Expand/collapse toggle */}
          <button
            onClick={() => this.toggleExpanded(session.id)}
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

                {/* Drill suggestions based on accepted players */}
                {invitations.filter((i) => i.status === 'accepted').length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-accent-gold/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      Suggested Drills
                    </h4>
                    <DrillSuggestions
                      acceptedPlayers={invitations
                        .filter((i) => i.status === 'accepted')
                        .map((i) => ({ position: i.players?.position || null }))}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cancel button */}
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
            {cancelConfirmId === session.id ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Cancel this session?</span>
                <button
                  onClick={() => this.handleCancel(session.id)}
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
                onClick={() => this.setState({ cancelConfirmId: session.id })}
                className="px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/20 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel Session
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  renderSessionsList() {
    const { sessions, sessionsLoading } = this.state;

    return (
      <div>
        <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          Upcoming Training Sessions
        </h2>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-3 border-accent-gold border-t-transparent rounded-full"
            />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg font-medium">No upcoming training sessions</p>
            <p className="text-gray-500 text-sm mt-1">Schedule a session using the form above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => this.renderSessionCard(session, index))}
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
        {this.renderSessionsList()}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(TrainingScheduler);

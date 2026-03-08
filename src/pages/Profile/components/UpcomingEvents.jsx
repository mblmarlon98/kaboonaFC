import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { getMyInvitations, respondToInvitation } from '../../../services/schedulingService';

/**
 * UpcomingEvents component for the Player Profile
 * Shows pending and accepted invitations for training sessions and matches
 * Allows players to accept/decline pending invitations
 */
class UpcomingEvents extends Component {
  constructor(props) {
    super(props);
    this.state = {
      invitations: [],
      isLoading: true,
      error: null,
      respondingId: null,
      successId: null,
    };
  }

  componentDidMount() {
    this.loadInvitations();
  }

  loadInvitations = async () => {
    const { user } = this.props;

    if (!user?.id) {
      this.setState({ isLoading: false, error: 'Not logged in' });
      return;
    }

    try {
      const invitations = await getMyInvitations(user.id);
      this.setState({ invitations, isLoading: false });
    } catch (error) {
      console.error('Error loading invitations:', error);
      this.setState({ isLoading: false, error: 'Failed to load events' });
    }
  };

  handleRespond = async (invitationId, status) => {
    this.setState({ respondingId: invitationId });

    try {
      await respondToInvitation(invitationId, status);

      // Update local state
      this.setState((prevState) => ({
        invitations: prevState.invitations.map((inv) =>
          inv.id === invitationId ? { ...inv, status } : inv
        ),
        respondingId: null,
        successId: invitationId,
      }));

      // Clear success animation after 2 seconds
      setTimeout(() => {
        this.setState((prevState) => {
          if (prevState.successId === invitationId) {
            return { successId: null };
          }
          return null;
        });
      }, 2000);
    } catch (error) {
      console.error('Error responding to invitation:', error);
      this.setState({ respondingId: null });
    }
  };

  formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  getEventDate = (invitation) => {
    if (!invitation.event) return null;
    return invitation.event_type === 'match'
      ? invitation.event.match_date
      : invitation.event.session_date;
  };

  getEventTime = (invitation) => {
    if (!invitation.event) return null;
    return invitation.event_type === 'match'
      ? invitation.event.match_time
      : invitation.event.session_time;
  };

  getEventLocation = (invitation) => {
    if (!invitation.event) return null;
    return invitation.event.location;
  };

  getEventTitle = (invitation) => {
    if (!invitation.event) return 'Unknown Event';
    if (invitation.event_type === 'match') {
      return invitation.event.opponent
        ? `vs ${invitation.event.opponent}`
        : invitation.event.title || 'Match';
    }
    return invitation.event.title || 'Training Session';
  };

  getEventTypeBadge = (invitation) => {
    if (invitation.event_type === 'training') {
      return { label: 'Training', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
    }
    if (invitation.event?.match_type === 'league') {
      return { label: 'League Match', className: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30' };
    }
    return { label: 'Friendly', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
  };

  isFutureEvent = (invitation) => {
    const eventDate = this.getEventDate(invitation);
    if (!eventDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return eventDate >= today;
  };

  getGroupedInvitations = () => {
    const { invitations } = this.state;

    const pending = invitations.filter(
      (inv) => inv.status === 'pending' && inv.event && this.isFutureEvent(inv)
    );

    const upcoming = invitations.filter(
      (inv) => inv.status === 'accepted' && inv.event && this.isFutureEvent(inv)
    );

    // Sort both by date ascending
    const sortByDate = (a, b) => {
      const dateA = this.getEventDate(a) || '';
      const dateB = this.getEventDate(b) || '';
      return dateA.localeCompare(dateB);
    };

    pending.sort(sortByDate);
    upcoming.sort(sortByDate);

    return { pending, upcoming };
  };

  renderTrainingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 6h18M3 6l3 12h12l3-12M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2M10 11v4M14 11v4"
      />
    </svg>
  );

  renderMatchIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth={2} />
      <path
        d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.5l2.3 3.2-1.4 2H11l-1.4-2L12 4.5zM6.5 9.2l2.8-.5 1.4 2-.8 2.3H6.7L5.3 11l1.2-1.8zm8.3-.5l2.8.5L18.7 11l-1.4 2h-3.2l-.8-2.3 1.5-2zM8.1 15h2.6l1.3 2.5-.7 2.2a7.5 7.5 0 01-4.5-3.3l1.3-1.4zm5.2 0h2.6l1.3 1.4a7.5 7.5 0 01-4.5 3.3l-.7-2.2L13.3 15z"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );

  renderStatusBadge = (status) => {
    if (status === 'accepted') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
          Accepted
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    }
    if (status === 'declined') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/50 border border-white/20">
          Declined
        </span>
      );
    }
    return null;
  };

  renderInvitationCard = (invitation, index) => {
    const { respondingId, successId } = this.state;
    const isResponding = respondingId === invitation.id;
    const isSuccess = successId === invitation.id;
    const title = this.getEventTitle(invitation);
    const date = this.getEventDate(invitation);
    const time = this.getEventTime(invitation);
    const location = this.getEventLocation(invitation);
    const badge = this.getEventTypeBadge(invitation);
    const isTraining = invitation.event_type === 'training';

    return (
      <motion.div
        key={invitation.id}
        className="relative px-5 py-4 hover:bg-white/5 transition-colors duration-200"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 + index * 0.05 }}
        layout
      >
        {/* Success flash animation */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              className="absolute inset-0 bg-green-500/10 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        <div className="flex items-start gap-4 relative">
          {/* Event type icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              isTraining ? 'bg-green-500/20 text-green-400' : 'bg-accent-gold/20 text-accent-gold'
            }`}
          >
            {isTraining ? this.renderTrainingIcon() : this.renderMatchIcon()}
          </div>

          {/* Event details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Event type badge */}
              <span
                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>

            <h4 className="text-white font-semibold text-sm truncate">{title}</h4>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
              {/* Date */}
              {date && (
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {this.formatDate(date)}
                </span>
              )}

              {/* Time */}
              {time && (
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {this.formatTime(time)}
                </span>
              )}

              {/* Location */}
              {location && (
                <span className="inline-flex items-center gap-1 truncate">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate">{location}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons / status badge */}
          <div className="shrink-0 flex items-center gap-2">
            {invitation.status === 'pending' && (
              <>
                <motion.button
                  onClick={() => this.handleRespond(invitation.id, 'accepted')}
                  disabled={isResponding}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isResponding ? '...' : 'Accept'}
                </motion.button>
                <motion.button
                  onClick={() => this.handleRespond(invitation.id, 'declined')}
                  disabled={isResponding}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isResponding ? '...' : 'Decline'}
                </motion.button>
              </>
            )}
            {invitation.status !== 'pending' && this.renderStatusBadge(invitation.status)}
          </div>
        </div>
      </motion.div>
    );
  };

  renderSectionHeader = (title, count) => (
    <div className="px-5 py-2 bg-white/5">
      <span className="text-xs font-bold uppercase tracking-wider text-white/40">
        {title} ({count})
      </span>
    </div>
  );

  renderEmptyState = () => (
    <div className="px-6 py-10 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
        <svg className="w-7 h-7 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-white/40 text-sm">
        No upcoming events. Your coach will schedule training and matches.
      </p>
    </div>
  );

  renderLoadingState = () => (
    <div className="px-6 py-10 text-center">
      <div className="w-8 h-8 mx-auto mb-3">
        <svg
          className="animate-spin w-full h-full text-accent-gold"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="text-white/40 text-sm">Loading events...</p>
    </div>
  );

  render() {
    const { isLoading, error } = this.state;

    if (isLoading) {
      return (
        <motion.div
          className="w-full bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="px-6 py-4 border-b border-accent-gold/20">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                Upcoming Events
              </h3>
            </div>
          </div>
          {this.renderLoadingState()}
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div
          className="w-full bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="px-6 py-4 border-b border-accent-gold/20">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                Upcoming Events
              </h3>
            </div>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="text-red-400 text-sm mb-3">{error}</p>
            <button
              onClick={this.loadInvitations}
              className="text-accent-gold hover:text-accent-gold-light transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      );
    }

    const { pending, upcoming } = this.getGroupedInvitations();
    const hasEvents = pending.length > 0 || upcoming.length > 0;

    return (
      <motion.div
        className="w-full bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-accent-gold/20">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
              Upcoming Events
            </h3>
          </div>
        </div>

        {!hasEvents && this.renderEmptyState()}

        {hasEvents && (
          <div>
            {/* Pending Invitations */}
            {pending.length > 0 && (
              <div>
                {this.renderSectionHeader('Pending', pending.length)}
                <div className="divide-y divide-white/5">
                  {pending.map((inv, idx) => this.renderInvitationCard(inv, idx))}
                </div>
              </div>
            )}

            {/* Upcoming (Accepted) */}
            {upcoming.length > 0 && (
              <div>
                {this.renderSectionHeader('Upcoming', upcoming.length)}
                <div className="divide-y divide-white/5">
                  {upcoming.map((inv, idx) =>
                    this.renderInvitationCard(inv, idx + pending.length)
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(UpcomingEvents);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentLocation, checkIn, getCheckInStatus } from '../../../services/attendanceService';

/**
 * CheckInButton component for GPS-based attendance check-in
 * Shows check-in status or a pulsing check-in button for today's events
 *
 * Props:
 *   eventType - 'match' or 'training'
 *   eventId - UUID of the event
 *   venueLat - Latitude of the venue
 *   venueLng - Longitude of the venue
 *   eventDate - Date string (YYYY-MM-DD) of the event
 */
class CheckInButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checking: false,
      checkInResult: null,
      error: null,
    };
  }

  componentDidMount() {
    this.loadCheckInStatus();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.eventId !== this.props.eventId ||
      prevProps.eventType !== this.props.eventType
    ) {
      this.loadCheckInStatus();
    }
  }

  loadCheckInStatus = async () => {
    const { user, eventType, eventId } = this.props;
    if (!user?.id || !eventId) return;

    try {
      const existing = await getCheckInStatus(user.id, eventType, eventId);
      if (existing) {
        this.setState({
          checkInResult: {
            status: existing.status,
            distance: existing.distance_from_venue,
          },
        });
      }
    } catch (err) {
      console.error('Error loading check-in status:', err);
    }
  };

  isToday = () => {
    const { eventDate } = this.props;
    if (!eventDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return eventDate === today;
  };

  handleCheckIn = async () => {
    const { user, eventType, eventId, venueLat, venueLng } = this.props;
    if (!user?.id) return;

    this.setState({ checking: true, error: null });

    try {
      const location = await getCurrentLocation();
      const result = await checkIn(
        user.id,
        eventType,
        eventId,
        location.lat,
        location.lng,
        venueLat,
        venueLng
      );

      this.setState({
        checking: false,
        checkInResult: {
          status: result.status,
          distance: result.distance,
        },
      });
    } catch (err) {
      console.error('Check-in error:', err);
      this.setState({
        checking: false,
        error: 'Could not get location. Please enable GPS.',
      });
    }
  };

  renderSpinner = () => (
    <svg
      className="animate-spin w-4 h-4 text-white"
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
  );

  renderLocationIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );

  render() {
    const { checking, checkInResult, error } = this.state;
    const { venueLat, venueLng } = this.props;

    // Don't render if no venue coordinates
    if (venueLat == null || venueLng == null) return null;

    // Already checked in - show status badge
    if (checkInResult) {
      const { status, distance } = checkInResult;

      if (status === 'verified') {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Checked In ({distance}m)
            </span>
          </motion.div>
        );
      }

      if (status === 'pending') {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pending Approval ({distance}m)
            </span>
          </motion.div>
        );
      }

      if (status === 'manual_approved') {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              Approved
            </span>
          </motion.div>
        );
      }

      if (status === 'rejected') {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Rejected
            </span>
          </motion.div>
        );
      }
    }

    // Not today - show informational text
    if (!this.isToday()) {
      return (
        <div className="mt-2">
          <span className="text-[11px] text-white/30 italic">
            Available on match day
          </span>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            {error}
          </span>
          <button
            onClick={this.handleCheckIn}
            className="ml-2 text-xs text-accent-gold hover:text-accent-gold/80 transition-colors font-medium"
          >
            Retry
          </button>
        </motion.div>
      );
    }

    // Loading state while getting location
    if (checking) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/10 text-white/70 border border-white/20">
            {this.renderSpinner()}
            Getting location...
          </span>
        </motion.div>
      );
    }

    // Check-in button (today, not yet checked in)
    return (
      <div className="mt-2">
        <motion.button
          onClick={this.handleCheckIn}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(34, 197, 94, 0.4)',
              '0 0 0 8px rgba(34, 197, 94, 0)',
            ],
          }}
          transition={{
            boxShadow: {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          {this.renderLocationIcon()}
          Check In
        </motion.button>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(CheckInButton);

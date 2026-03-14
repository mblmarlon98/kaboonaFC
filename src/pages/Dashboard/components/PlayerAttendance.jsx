import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../services/supabase';

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'training', label: 'Trainings' },
  { value: 'match', label: 'Matches' },
];

class PlayerAttendance extends Component {
  constructor(props) {
    super(props);
    this.state = {
      trainings: [],
      matches: [],
      loading: true,
      error: null,
      activeFilter: 'all',
      expandedEvents: {},
      updatingStatus: {},
      // Notification
      showNotification: false,
      notificationMessage: '',
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  showNotification = (message) => {
    this.setState({ showNotification: true, notificationMessage: message });
    setTimeout(() => this.setState({ showNotification: false }), 3000);
  };

  fetchData = async () => {
    this.setState({ loading: true, error: null });
    try {
      // Fetch trainings, matches, and invitations separately
      // (event_invitations uses polymorphic event_type+event_id, no direct FK)
      const [trainingsRes, matchesRes, trainingInvRes, matchInvRes] = await Promise.all([
        supabase
          .from('training_sessions')
          .select('*')
          .order('session_date', { ascending: false }),
        supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: false }),
        supabase
          .from('event_invitations')
          .select('*, profiles(full_name, profile_image_url)')
          .eq('event_type', 'training'),
        supabase
          .from('event_invitations')
          .select('*, profiles(full_name, profile_image_url)')
          .eq('event_type', 'match'),
      ]);

      if (trainingsRes.error) throw trainingsRes.error;
      if (matchesRes.error) throw matchesRes.error;
      if (trainingInvRes.error) throw trainingInvRes.error;
      if (matchInvRes.error) throw matchInvRes.error;

      // Group invitations by event_id
      const trainingInvByEvent = {};
      (trainingInvRes.data || []).forEach((inv) => {
        if (!trainingInvByEvent[inv.event_id]) trainingInvByEvent[inv.event_id] = [];
        trainingInvByEvent[inv.event_id].push(inv);
      });
      const matchInvByEvent = {};
      (matchInvRes.data || []).forEach((inv) => {
        if (!matchInvByEvent[inv.event_id]) matchInvByEvent[inv.event_id] = [];
        matchInvByEvent[inv.event_id].push(inv);
      });

      // Attach invitations to their events
      const trainings = (trainingsRes.data || []).map((t) => ({
        ...t,
        event_invitations: trainingInvByEvent[t.id] || [],
      }));
      const matches = (matchesRes.data || []).map((m) => ({
        ...m,
        event_invitations: matchInvByEvent[m.id] || [],
      }));

      this.setState({ trainings, matches, loading: false });
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      this.setState({ error: err.message, loading: false });
    }
  };

  toggleExpanded = (eventId) => {
    this.setState((prev) => ({
      expandedEvents: {
        ...prev.expandedEvents,
        [eventId]: !prev.expandedEvents[eventId],
      },
    }));
  };

  updateAttendanceStatus = async (invitationId, newStatus, eventKey) => {
    this.setState((prev) => ({
      updatingStatus: { ...prev.updatingStatus, [invitationId]: true },
    }));
    try {
      const { error } = await supabase
        .from('event_invitations')
        .update({ status: newStatus })
        .eq('id', invitationId);
      if (error) throw error;

      // Update local state
      const updateInvitation = (events) =>
        events.map((event) => ({
          ...event,
          event_invitations: (event.event_invitations || []).map((inv) =>
            inv.id === invitationId ? { ...inv, status: newStatus } : inv
          ),
        }));

      this.setState((prev) => ({
        trainings: updateInvitation(prev.trainings),
        matches: updateInvitation(prev.matches),
        updatingStatus: { ...prev.updatingStatus, [invitationId]: false },
      }));

      this.showNotification(`Marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      this.setState((prev) => ({
        updatingStatus: { ...prev.updatingStatus, [invitationId]: false },
      }));
      this.showNotification('Failed to update status');
    }
  };

  getAllEvents = () => {
    const { trainings, matches, activeFilter } = this.state;
    const trainingEvents = trainings.map((t) => ({ ...t, _type: 'training' }));
    const matchEvents = matches.map((m) => ({ ...m, _type: 'match' }));

    let allEvents;
    if (activeFilter === 'training') {
      allEvents = trainingEvents;
    } else if (activeFilter === 'match') {
      allEvents = matchEvents;
    } else {
      allEvents = [...trainingEvents, ...matchEvents];
    }

    allEvents.sort((a, b) => new Date(b.session_date || b.match_date) - new Date(a.session_date || a.match_date));
    return allEvents;
  };

  getEventDate = (event) => {
    return event.session_date || event.match_date || '';
  };

  getEventTitle = (event) => {
    if (event._type === 'match') {
      return `vs ${event.opponent || 'TBD'}`;
    }
    return 'Training Session';
  };

  isUpcoming = (event) => {
    const dateStr = this.getEventDate(event);
    if (!dateStr) return false;
    return new Date(dateStr) >= new Date();
  };

  getOverallAttendanceRate = () => {
    const events = this.getAllEvents();
    let totalInvitations = 0;
    let totalAttended = 0;
    events.forEach((event) => {
      const invitations = event.event_invitations || [];
      totalInvitations += invitations.length;
      totalAttended += invitations.filter((i) => i.status === 'attended' || i.status === 'accepted').length;
    });
    if (totalInvitations === 0) return 0;
    return Math.round((totalAttended / totalInvitations) * 100);
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin mb-4" />
      <p className="text-white/50">Loading attendance data...</p>
    </div>
  );

  renderEventCard = (event, index) => {
    const { expandedEvents, updatingStatus } = this.state;
    const isExpanded = expandedEvents[event.id + event._type];
    const invitations = event.event_invitations || [];
    const attendedCount = invitations.filter((i) => i.status === 'attended' || i.status === 'accepted').length;
    const totalCount = invitations.length;
    const upcoming = this.isUpcoming(event);

    return (
      <motion.div
        key={event.id + event._type}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden"
      >
        <div
          className="p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={() => this.toggleExpanded(event.id + event._type)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-white font-bold truncate">{this.getEventTitle(event)}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  event._type === 'training'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {event._type === 'training' ? 'Training' : 'Match'}
                </span>
                {upcoming && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex-shrink-0">
                    Upcoming
                  </span>
                )}
              </div>
              <p className="text-white/40 text-sm">{this.formatDate(this.getEventDate(event))}</p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-white font-bold">{attendedCount}/{totalCount}</p>
                <p className="text-white/40 text-xs">attended</p>
              </div>
              <motion.svg
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 text-white/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-gold rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (attendedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Expanded player list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-2 border-t border-white/5">
                {invitations.length === 0 ? (
                  <p className="text-white/40 text-sm py-3">No players invited to this event.</p>
                ) : (
                  <div className="space-y-2">
                    {invitations.map((inv) => {
                      const name = inv.profiles?.full_name || 'Unknown Player';
                      const avatar = inv.profiles?.profile_image_url;
                      const isUpdating = updatingStatus[inv.id];

                      return (
                        <div key={inv.id} className="flex items-center gap-3 py-2">
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-white/10">
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Name */}
                          <span className="text-white text-sm flex-1">{name}</span>

                          {/* Status buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                this.updateAttendanceStatus(inv.id, 'attended', event.id + event._type);
                              }}
                              disabled={isUpdating}
                              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                inv.status === 'attended'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              } disabled:opacity-50`}
                            >
                              Present
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                this.updateAttendanceStatus(inv.id, 'absent', event.id + event._type);
                              }}
                              disabled={isUpdating}
                              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                inv.status === 'absent'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              } disabled:opacity-50`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  render() {
    const { loading, error, activeFilter, showNotification, notificationMessage } = this.state;
    const allEvents = this.getAllEvents();
    const upcomingEvents = allEvents.filter((e) => this.isUpcoming(e));
    const pastEvents = allEvents.filter((e) => !this.isUpcoming(e));
    const overallRate = this.getOverallAttendanceRate();

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-white">Player Attendance</h1>
          <p className="text-white/50 mt-1">Track and manage player attendance for trainings and matches</p>
        </motion.div>

        {/* Notification */}
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 right-4 z-50 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {notificationMessage}
          </motion.div>
        )}

        {/* Summary Card */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full border-4 border-accent-gold/30 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 010 31.831 15.9155 15.9155 0 010-31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${overallRate}, 100`}
                    className="text-accent-gold"
                  />
                </svg>
                <span className="text-white font-bold text-lg">{overallRate}%</span>
              </div>
              <div>
                <h3 className="text-white font-display font-bold text-lg">Overall Attendance Rate</h3>
                <p className="text-white/50 text-sm">
                  Across {allEvents.length} events ({upcomingEvents.length} upcoming, {pastEvents.length} past)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => this.setState({ activeFilter: tab.value })}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeFilter === tab.value
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? this.renderLoading() : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-red-400 mb-2">Something went wrong</p>
            <p className="text-white/40 text-sm mb-4">{error}</p>
            <button onClick={this.fetchData} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Upcoming Events
                </h2>
                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => this.renderEventCard(event, index))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/30" />
                  Past Events
                </h2>
                <div className="space-y-3">
                  {pastEvents.map((event, index) => this.renderEventCard(event, index))}
                </div>
              </div>
            )}

            {allEvents.length === 0 && (
              <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-white font-display font-bold text-lg mb-2">No events found</h3>
                <p className="text-white/50">Schedule trainings or matches to start tracking attendance.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default PlayerAttendance;

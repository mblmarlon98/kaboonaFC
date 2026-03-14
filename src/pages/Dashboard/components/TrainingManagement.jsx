import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

/**
 * Training Management Component
 * Training sessions calendar, add/edit sessions, view attendance, verify pending requests
 * All data fetched from Supabase: training_sessions, attendance, profiles
 */
class TrainingManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeView: 'calendar',
      sessions: [],
      pendingAttendance: [],
      selectedSession: null,
      showSessionModal: false,
      showAttendanceModal: false,
      currentMonth: new Date(),
      loading: true,
      saving: false,
      attendanceLoading: false,
      attendanceRecords: [],
      coaches: [],
      sessionForm: {
        name: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        coach: '',
        notes: '',
      },
    };
  }

  componentDidMount() {
    this.fetchSessions();
    this.fetchPendingAttendance();
    this.fetchCoaches();
  }

  // ─── Data Fetching ──────────────────────────────────────────────────

  fetchSessions = async () => {
    this.setState({ loading: true });
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('session_date', { ascending: false });

      if (error) throw error;

      // For each session, get registration count (accepted invitations) and attendance count (checked_in)
      const sessionsWithCounts = await Promise.all(
        (data || []).map(async (session) => {
          const [regResult, attResult] = await Promise.all([
            supabase
              .from('event_invitations')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', session.id)
              .eq('status', 'accepted'),
            supabase
              .from('attendance')
              .select('id', { count: 'exact', head: true })
              .eq('session_id', session.id)
              .in('status', ['verified', 'checked_in', 'manual_approved']),
          ]);

          return {
            ...session,
            registered: regResult.count || 0,
            attended: attResult.count || 0,
          };
        })
      );

      this.setState({ sessions: sessionsWithCounts, loading: false });
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      this.setState({ sessions: [], loading: false });
    }
  };

  fetchPendingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          user_id,
          session_id,
          session_type,
          checked_in_at,
          status,
          created_at,
          profiles:user_id (full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        this.setState({ pendingAttendance: [] });
        return;
      }

      // Fetch session titles for each pending attendance
      const sessionIds = [...new Set(data.map((a) => a.session_id).filter(Boolean))];
      const { data: sessionsData } = await supabase
        .from('training_sessions')
        .select('id, title, session_date')
        .in('id', sessionIds);

      const sessionMap = {};
      (sessionsData || []).forEach((s) => {
        sessionMap[s.id] = s;
      });

      const pendingAttendance = data.map((record) => {
        const session = sessionMap[record.session_id];
        const checkedInAt = record.checked_in_at
          ? new Date(record.checked_in_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : new Date(record.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

        return {
          id: record.id,
          player: record.profiles?.full_name || 'Unknown Player',
          session: session?.title || 'Unknown Session',
          date: session?.session_date || '',
          requestTime: checkedInAt,
        };
      });

      this.setState({ pendingAttendance });
    } catch (error) {
      console.error('Error fetching pending attendance:', error);
      this.setState({ pendingAttendance: [] });
    }
  };

  fetchCoaches = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .or('role.in.(admin,coach),roles.cs.{coach}');

      if (error) throw error;
      this.setState({ coaches: data || [] });
    } catch (error) {
      console.error('Error fetching coaches:', error);
      this.setState({ coaches: [] });
    }
  };

  fetchAttendanceForSession = async (session) => {
    this.setState({ attendanceLoading: true, attendanceRecords: [] });
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          user_id,
          status,
          checked_in_at,
          created_at,
          profiles:user_id (full_name)
        `)
        .eq('session_id', session.id)
        .order('checked_in_at', { ascending: true });

      if (error) throw error;
      this.setState({
        attendanceRecords: data || [],
        attendanceLoading: false,
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      this.setState({ attendanceRecords: [], attendanceLoading: false });
    }
  };

  // ─── View Helpers ───────────────────────────────────────────────────

  handleViewChange = (view) => {
    this.setState({ activeView: view });
  };

  getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  getSessionsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return this.state.sessions.filter((s) => s.session_date === dateStr);
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  getSessionDisplayTime = (session) => {
    if (!session.session_time) return '';
    const startFormatted = this.formatTime(session.session_time);
    if (session.duration_minutes) {
      const [h, m] = session.session_time.split(':').map(Number);
      const totalMins = h * 60 + m + session.duration_minutes;
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      const endFormatted = this.formatTime(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
      return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted;
  };

  previousMonth = () => {
    this.setState((prevState) => ({
      currentMonth: new Date(prevState.currentMonth.getFullYear(), prevState.currentMonth.getMonth() - 1),
    }));
  };

  nextMonth = () => {
    this.setState((prevState) => ({
      currentMonth: new Date(prevState.currentMonth.getFullYear(), prevState.currentMonth.getMonth() + 1),
    }));
  };

  // ─── Session Modal ──────────────────────────────────────────────────

  openSessionModal = (session = null) => {
    if (session) {
      this.setState({
        showSessionModal: true,
        selectedSession: session,
        sessionForm: {
          name: session.title || '',
          date: session.session_date || '',
          startTime: session.session_time ? session.session_time.substring(0, 5) : '',
          endTime: '',
          location: session.location || '',
          coach: session.created_by || '',
          notes: session.notes || '',
        },
      });
    } else {
      this.setState({
        showSessionModal: true,
        selectedSession: null,
        sessionForm: {
          name: '',
          date: '',
          startTime: '',
          endTime: '',
          location: '',
          coach: '',
          notes: '',
        },
      });
    }
  };

  closeSessionModal = () => {
    this.setState({ showSessionModal: false, selectedSession: null });
  };

  handleSessionFormChange = (field, value) => {
    this.setState((prevState) => ({
      sessionForm: { ...prevState.sessionForm, [field]: value },
    }));
  };

  saveSession = async () => {
    const { selectedSession, sessionForm } = this.state;
    this.setState({ saving: true });

    // Calculate duration in minutes from startTime and endTime
    let durationMinutes = null;
    if (sessionForm.startTime && sessionForm.endTime) {
      const [sh, sm] = sessionForm.startTime.split(':').map(Number);
      const [eh, em] = sessionForm.endTime.split(':').map(Number);
      durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (durationMinutes < 0) durationMinutes += 24 * 60; // handle overnight
    }

    const payload = {
      title: sessionForm.name,
      session_date: sessionForm.date,
      session_time: sessionForm.startTime || null,
      duration_minutes: durationMinutes,
      location: sessionForm.location || null,
      created_by: sessionForm.coach || null,
      notes: sessionForm.notes || null,
    };

    try {
      if (selectedSession) {
        // Update existing session
        const { error } = await supabase
          .from('training_sessions')
          .update(payload)
          .eq('id', selectedSession.id);

        if (error) throw error;
      } else {
        // Create new session
        const { error } = await supabase
          .from('training_sessions')
          .insert({ ...payload, status: 'scheduled' });

        if (error) throw error;
      }

      this.closeSessionModal();
      await this.fetchSessions();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Failed to save session. Please try again.');
    } finally {
      this.setState({ saving: false });
    }
  };

  deleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;

    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      await this.fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Failed to delete session. Please try again.');
    }
  };

  // ─── Attendance Modal ───────────────────────────────────────────────

  openAttendanceModal = (session) => {
    this.setState({ showAttendanceModal: true, selectedSession: session });
    this.fetchAttendanceForSession(session);
  };

  closeAttendanceModal = () => {
    this.setState({ showAttendanceModal: false, selectedSession: null, attendanceRecords: [] });
  };

  // ─── Approve / Reject ──────────────────────────────────────────────

  approveAttendance = async (requestId) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ status: 'manual_approved' })
        .eq('id', requestId);

      if (error) throw error;

      this.setState((prevState) => ({
        pendingAttendance: prevState.pendingAttendance.filter((r) => r.id !== requestId),
      }));
      // Refresh counts
      this.fetchSessions();
    } catch (error) {
      console.error('Error approving attendance:', error);
    }
  };

  rejectAttendance = async (requestId) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      this.setState((prevState) => ({
        pendingAttendance: prevState.pendingAttendance.filter((r) => r.id !== requestId),
      }));
    } catch (error) {
      console.error('Error rejecting attendance:', error);
    }
  };

  // ─── Attendance Status Helpers ──────────────────────────────────────

  getAttendanceStatusLabel = (status) => {
    switch (status) {
      case 'verified':
      case 'checked_in':
      case 'manual_approved':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return status || 'Unknown';
    }
  };

  getAttendanceStatusClass = (status) => {
    switch (status) {
      case 'verified':
      case 'checked_in':
      case 'manual_approved':
        return 'bg-green-400/20 text-green-400';
      case 'absent':
      case 'rejected':
        return 'bg-red-400/20 text-red-400';
      case 'pending':
        return 'bg-yellow-400/20 text-yellow-400';
      default:
        return 'bg-white/20 text-white/60';
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────

  render() {
    const {
      activeView,
      sessions,
      pendingAttendance,
      currentMonth,
      showSessionModal,
      showAttendanceModal,
      selectedSession,
      sessionForm,
      loading,
      saving,
      attendanceLoading,
      attendanceRecords,
      coaches,
    } = this.state;

    const days = this.getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Training Management</h1>
            <p className="text-white/50 mt-1">Manage training sessions and track attendance</p>
          </div>
          <button
            onClick={() => this.openSessionModal()}
            className="px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Session
          </button>
        </motion.div>

        {/* Pending Attendance Requests */}
        {pendingAttendance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-400/10 rounded-xl border border-yellow-400/30 p-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Pending Attendance Requests</h3>
                <p className="text-white/50 text-sm">{pendingAttendance.length} requests awaiting verification</p>
              </div>
            </div>
            <div className="space-y-2">
              {pendingAttendance.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{request.player}</p>
                    <p className="text-white/50 text-sm">
                      {request.session} - {request.date} at {request.requestTime}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => this.approveAttendance(request.id)}
                      className="p-2 bg-green-400/20 text-green-400 rounded-lg hover:bg-green-400/30 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => this.rejectAttendance(request.id)}
                      className="p-2 bg-red-400/20 text-red-400 rounded-lg hover:bg-red-400/30 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          <button
            onClick={() => this.handleViewChange('calendar')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeView === 'calendar'
                ? 'bg-accent-gold text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => this.handleViewChange('list')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeView === 'list'
                ? 'bg-accent-gold text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            List View
          </button>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold" />
            <span className="ml-3 text-white/50">Loading sessions...</span>
          </div>
        )}

        {/* Calendar View */}
        {!loading && activeView === 'calendar' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden"
          >
            {/* Calendar Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <button
                onClick={this.previousMonth}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg font-display font-bold text-white">{monthName}</h3>
              <button
                onClick={this.nextMonth}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-white/50 text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const sessionsForDay = this.getSessionsForDate(day);
                  const isToday =
                    day && day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={`min-h-24 p-2 rounded-lg border ${
                        day
                          ? isToday
                            ? 'border-accent-gold bg-accent-gold/10'
                            : 'border-white/10 hover:bg-white/5'
                          : 'border-transparent'
                      } transition-colors`}
                    >
                      {day && (
                        <>
                          <span
                            className={`text-sm ${
                              isToday ? 'text-accent-gold font-bold' : 'text-white/70'
                            }`}
                          >
                            {day.getDate()}
                          </span>
                          <div className="mt-1 space-y-1">
                            {sessionsForDay.slice(0, 2).map((session) => (
                              <button
                                key={session.id}
                                onClick={() => this.openSessionModal(session)}
                                className="w-full text-left px-1.5 py-0.5 bg-accent-gold/20 text-accent-gold text-xs rounded truncate hover:bg-accent-gold/30 transition-colors"
                              >
                                {session.title}
                              </button>
                            ))}
                            {sessionsForDay.length > 2 && (
                              <span className="text-white/50 text-xs">
                                +{sessionsForDay.length - 2} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* List View */}
        {!loading && activeView === 'list' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {sessions.length === 0 && (
              <div className="text-center py-12 text-white/40">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No training sessions found. Create your first session to get started.</p>
              </div>
            )}
            {sessions.map((session) => {
              const coachProfile = coaches.find((c) => c.id === session.created_by);
              const coachName = coachProfile?.full_name || '';
              const displayTime = this.getSessionDisplayTime(session);

              return (
                <div
                  key={session.id}
                  className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Session Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-display font-bold text-white">{session.title}</h3>
                        <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold text-xs rounded-full">
                          {session.registered} registered
                        </span>
                        {session.status && session.status !== 'scheduled' && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            session.status === 'cancelled'
                              ? 'bg-red-400/20 text-red-400'
                              : session.status === 'completed'
                                ? 'bg-green-400/20 text-green-400'
                                : 'bg-white/20 text-white/60'
                          }`}>
                            {session.status}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-white/60 text-sm">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {this.formatDate(session.session_date)}
                        </span>
                        {displayTime && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {displayTime}
                          </span>
                        )}
                        {session.location && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {session.location}
                          </span>
                        )}
                        {coachName && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {coachName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attendance Stats */}
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-display font-bold text-white">{session.attended}</p>
                        <p className="text-white/50 text-xs">Attended</p>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="text-center">
                        <p className="text-2xl font-display font-bold text-accent-gold">
                          {session.registered > 0
                            ? Math.round((session.attended / session.registered) * 100)
                            : 0}
                          %
                        </p>
                        <p className="text-white/50 text-xs">Rate</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => this.openAttendanceModal(session)}
                        className="px-4 py-2 bg-secondary-blue/20 text-secondary-blue rounded-lg hover:bg-secondary-blue/30 transition-colors"
                      >
                        View Attendance
                      </button>
                      <button
                        onClick={() => this.openSessionModal(session)}
                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => this.deleteSession(session.id)}
                        className="p-2 bg-red-400/20 text-red-400 rounded-lg hover:bg-red-400/30 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Session Modal */}
        {showSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={this.closeSessionModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-dark-elevated rounded-xl p-6 max-w-lg w-full border border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-display font-bold text-white mb-6">
                {selectedSession ? 'Edit Session' : 'Add New Session'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Session Name</label>
                  <input
                    type="text"
                    value={sessionForm.name}
                    onChange={(e) => this.handleSessionFormChange('name', e.target.value)}
                    placeholder="e.g., Morning Training"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Date</label>
                  <input
                    type="date"
                    value={sessionForm.date}
                    onChange={(e) => this.handleSessionFormChange('date', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Start Time</label>
                    <input
                      type="time"
                      value={sessionForm.startTime}
                      onChange={(e) => this.handleSessionFormChange('startTime', e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 text-sm mb-1">End Time</label>
                    <input
                      type="time"
                      value={sessionForm.endTime}
                      onChange={(e) => this.handleSessionFormChange('endTime', e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Location</label>
                  <input
                    type="text"
                    value={sessionForm.location}
                    onChange={(e) => this.handleSessionFormChange('location', e.target.value)}
                    placeholder="e.g., Kaboona Stadium"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Coach</label>
                  <select
                    value={sessionForm.coach}
                    onChange={(e) => this.handleSessionFormChange('coach', e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                  >
                    <option value="">Select Coach</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Notes</label>
                  <textarea
                    value={sessionForm.notes}
                    onChange={(e) => this.handleSessionFormChange('notes', e.target.value)}
                    placeholder="Optional notes about this session..."
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={this.closeSessionModal}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={this.saveSession}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : selectedSession
                      ? 'Save Changes'
                      : 'Create Session'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Attendance Modal */}
        {showAttendanceModal && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={this.closeAttendanceModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-dark-elevated rounded-xl p-6 max-w-lg w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-display font-bold text-white mb-2">
                Attendance - {selectedSession.title}
              </h3>
              <p className="text-white/50 text-sm mb-6">
                {this.formatDate(selectedSession.session_date)} | {this.getSessionDisplayTime(selectedSession)}
              </p>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {attendanceLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-gold" />
                    <span className="ml-2 text-white/50 text-sm">Loading attendance...</span>
                  </div>
                )}
                {!attendanceLoading && attendanceRecords.length === 0 && (
                  <div className="text-center py-8 text-white/40 text-sm">
                    No attendance records for this session yet.
                  </div>
                )}
                {!attendanceLoading &&
                  attendanceRecords.map((record) => {
                    const name = record.profiles?.full_name || 'Unknown';
                    return (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center">
                            <span className="text-accent-gold font-bold text-sm">
                              {name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-white">{name}</span>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${this.getAttendanceStatusClass(
                            record.status
                          )}`}
                        >
                          {this.getAttendanceStatusLabel(record.status)}
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={this.closeAttendanceModal}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Close
                </button>
                <button className="flex-1 px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors">
                  Export List
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }
}

export default TrainingManagement;

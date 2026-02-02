import React, { Component } from 'react';
import { motion } from 'framer-motion';

// Mock training sessions data
const mockSessions = [
  {
    id: 1,
    name: 'Morning Training',
    date: '2024-02-15',
    time: '07:00 - 09:00',
    location: 'Sunway Stadium',
    coach: 'Coach Ahmad',
    capacity: 25,
    registered: 22,
    attended: 18,
  },
  {
    id: 2,
    name: 'Evening Session',
    date: '2024-02-15',
    time: '18:00 - 20:00',
    location: 'Sunway Stadium',
    coach: 'Sarah Wong',
    capacity: 20,
    registered: 20,
    attended: 0,
  },
  {
    id: 3,
    name: 'Weekend Drills',
    date: '2024-02-17',
    time: '09:00 - 12:00',
    location: 'Training Ground A',
    coach: 'Coach Ahmad',
    capacity: 30,
    registered: 28,
    attended: 0,
  },
  {
    id: 4,
    name: 'Goalkeeper Training',
    date: '2024-02-18',
    time: '08:00 - 10:00',
    location: 'Training Ground B',
    coach: 'Michael Tan',
    capacity: 10,
    registered: 6,
    attended: 0,
  },
];

// Mock pending attendance requests
const mockPendingAttendance = [
  { id: 1, player: 'John Smith', session: 'Morning Training', date: '2024-02-15', requestTime: '07:15 AM' },
  { id: 2, player: 'Sarah Lee', session: 'Morning Training', date: '2024-02-15', requestTime: '07:22 AM' },
  { id: 3, player: 'Wei Chen', session: 'Evening Session', date: '2024-02-14', requestTime: '06:05 PM' },
];

/**
 * Training Management Component
 * Training sessions calendar, add/edit sessions, view attendance, verify pending requests
 */
class TrainingManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeView: 'calendar',
      sessions: mockSessions,
      pendingAttendance: mockPendingAttendance,
      selectedSession: null,
      showSessionModal: false,
      showAttendanceModal: false,
      currentMonth: new Date(),
      sessionForm: {
        name: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        coach: '',
        capacity: 25,
      },
    };
  }

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
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  getSessionsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return this.state.sessions.filter((s) => s.date === dateStr);
  };

  formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

  openSessionModal = (session = null) => {
    if (session) {
      const [startTime, endTime] = session.time.split(' - ');
      this.setState({
        showSessionModal: true,
        selectedSession: session,
        sessionForm: {
          name: session.name,
          date: session.date,
          startTime,
          endTime,
          location: session.location,
          coach: session.coach,
          capacity: session.capacity,
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
          capacity: 25,
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

  saveSession = () => {
    const { sessions, selectedSession, sessionForm } = this.state;

    if (selectedSession) {
      // Update existing session
      const updatedSessions = sessions.map((s) =>
        s.id === selectedSession.id
          ? {
              ...s,
              name: sessionForm.name,
              date: sessionForm.date,
              time: `${sessionForm.startTime} - ${sessionForm.endTime}`,
              location: sessionForm.location,
              coach: sessionForm.coach,
              capacity: sessionForm.capacity,
            }
          : s
      );
      this.setState({ sessions: updatedSessions });
    } else {
      // Add new session
      const newSession = {
        id: sessions.length + 1,
        name: sessionForm.name,
        date: sessionForm.date,
        time: `${sessionForm.startTime} - ${sessionForm.endTime}`,
        location: sessionForm.location,
        coach: sessionForm.coach,
        capacity: parseInt(sessionForm.capacity),
        registered: 0,
        attended: 0,
      };
      this.setState({ sessions: [...sessions, newSession] });
    }

    this.closeSessionModal();
  };

  deleteSession = (sessionId) => {
    this.setState((prevState) => ({
      sessions: prevState.sessions.filter((s) => s.id !== sessionId),
    }));
  };

  openAttendanceModal = (session) => {
    this.setState({ showAttendanceModal: true, selectedSession: session });
  };

  closeAttendanceModal = () => {
    this.setState({ showAttendanceModal: false, selectedSession: null });
  };

  approveAttendance = (requestId) => {
    this.setState((prevState) => ({
      pendingAttendance: prevState.pendingAttendance.filter((r) => r.id !== requestId),
    }));
  };

  rejectAttendance = (requestId) => {
    this.setState((prevState) => ({
      pendingAttendance: prevState.pendingAttendance.filter((r) => r.id !== requestId),
    }));
  };

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

        {/* Calendar View */}
        {activeView === 'calendar' && (
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
                                {session.name}
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
        {activeView === 'list' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-display font-bold text-white">{session.name}</h3>
                      <span className="px-2 py-1 bg-accent-gold/20 text-accent-gold text-xs rounded-full">
                        {session.registered}/{session.capacity} registered
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-white/60 text-sm">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {this.formatDate(session.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {session.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {session.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {session.coach}
                      </span>
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
            ))}
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
                    placeholder="e.g., Sunway Stadium"
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
                    <option value="Coach Ahmad">Coach Ahmad</option>
                    <option value="Sarah Wong">Sarah Wong</option>
                    <option value="Michael Tan">Michael Tan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Capacity</label>
                  <input
                    type="number"
                    value={sessionForm.capacity}
                    onChange={(e) => this.handleSessionFormChange('capacity', e.target.value)}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={this.closeSessionModal}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={this.saveSession}
                  className="flex-1 px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
                >
                  {selectedSession ? 'Save Changes' : 'Create Session'}
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
                Attendance - {selectedSession.name}
              </h3>
              <p className="text-white/50 text-sm mb-6">
                {this.formatDate(selectedSession.date)} | {selectedSession.time}
              </p>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {/* Mock attendees */}
                {['Ahmad Rahman', 'Sarah Lee', 'Wei Chen', 'Maria Garcia', 'John Smith'].map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center">
                        <span className="text-accent-gold font-bold text-sm">{name.charAt(0)}</span>
                      </div>
                      <span className="text-white">{name}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      i < 3 ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                    }`}>
                      {i < 3 ? 'Present' : 'Absent'}
                    </span>
                  </div>
                ))}
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

import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../services/supabase';
import CalendarEventModal from './CalendarEventModal';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_COLORS = {
  training: { bg: 'bg-blue-500', dot: 'bg-blue-500', text: 'text-blue-400', light: 'bg-blue-500/20', hex: '#3B82F6' },
  match: { bg: 'bg-red-500', dot: 'bg-red-500', text: 'text-red-400', light: 'bg-red-500/20', hex: '#EF4444' },
  event: { bg: 'bg-green-500', dot: 'bg-green-500', text: 'text-green-400', light: 'bg-green-500/20', hex: '#22C55E' },
};

/**
 * Calendar Component
 * Shared calendar for Dashboard and Fan Portal with role-based event filtering.
 * Supports month, week, and list view modes.
 */
class Calendar extends Component {
  constructor(props) {
    super(props);
    const today = new Date();
    this.state = {
      viewMode: 'list', // 'month', 'week', 'list'
      currentDate: new Date(today.getFullYear(), today.getMonth(), 1),
      allEvents: [],
      loading: true,
      filters: {
        training: true,
        match: true,
        event: true,
      },
      selectedEvent: null,
      showModal: false,
      createEventType: null,
      showCreateMenu: false,
    };
  }

  componentDidMount() {
    this.fetchEvents();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.currentDate.getMonth() !== this.state.currentDate.getMonth() ||
      prevState.currentDate.getFullYear() !== this.state.currentDate.getFullYear()
    ) {
      this.fetchEvents();
    }
  }

  /**
   * Determine role capabilities.
   */
  getRoleFlags = () => {
    const { userRoles, readOnly } = this.props;
    if (readOnly) return { hasCoachRole: false, hasMarketingRole: false, isAdmin: false };

    const hasCoachRole = userRoles?.some((r) =>
      ['coach', 'owner', 'manager', 'admin', 'super_admin'].includes(r)
    );
    const hasMarketingRole = userRoles?.some((r) =>
      ['editor', 'marketing', 'admin', 'super_admin'].includes(r)
    );
    const isAdmin = userRoles?.some((r) => ['admin', 'super_admin'].includes(r));

    return { hasCoachRole, hasMarketingRole, isAdmin };
  };

  fetchEvents = async () => {
    this.setState({ loading: true });

    const { userRoles, readOnly } = this.props;
    const { currentDate } = this.state;

    const startOfMonthDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const endOfMonthDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(endOfMonthDay).padStart(2, '0')}`;
    const startOfMonthISO = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
    const endOfMonthISO = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    let trainings = [];
    let matches = [];
    let events = [];

    const hasCoachRole = readOnly || userRoles?.some((r) =>
      ['coach', 'owner', 'manager', 'admin', 'super_admin'].includes(r)
    );
    const hasMarketingRole = readOnly || userRoles?.some((r) =>
      ['editor', 'marketing', 'admin', 'super_admin'].includes(r)
    );

    try {
      if (hasCoachRole) {
        const { data } = await supabase
          .from('training_sessions')
          .select('*')
          .gte('session_date', startOfMonthDate)
          .lte('session_date', endOfMonthDate);
        trainings = (data || []).map((t) => ({ ...t, date: t.session_date, eventType: 'training' }));
      }

      if (hasCoachRole || hasMarketingRole) {
        const { data } = await supabase
          .from('matches')
          .select('*')
          .gte('match_date', startOfMonthDate)
          .lte('match_date', endOfMonthDate);
        matches = (data || []).map((m) => ({ ...m, date: m.match_date, eventType: 'match' }));
      }

      if (hasMarketingRole) {
        let query = supabase
          .from('events')
          .select('*')
          .gte('date', startOfMonthISO)
          .lte('date', endOfMonthISO);
        if (readOnly) {
          query = query.eq('is_public', true);
        }
        const { data } = await query;
        events = (data || []).map((e) => ({ ...e, eventType: 'event' }));
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    }

    this.setState({
      allEvents: [...trainings, ...matches, ...events],
      loading: false,
    });
  };

  /**
   * Get filtered events based on active filters.
   */
  getFilteredEvents = () => {
    const { allEvents, filters } = this.state;
    return allEvents.filter((e) => filters[e.eventType]);
  };

  navigateMonth = (direction) => {
    this.setState((prevState) => {
      const d = new Date(prevState.currentDate);
      d.setMonth(d.getMonth() + direction);
      return { currentDate: d };
    });
  };

  goToToday = () => {
    const today = new Date();
    this.setState({
      currentDate: new Date(today.getFullYear(), today.getMonth(), 1),
    });
  };

  toggleFilter = (type) => {
    this.setState((prevState) => ({
      filters: { ...prevState.filters, [type]: !prevState.filters[type] },
    }));
  };

  openEvent = (event) => {
    this.setState({ selectedEvent: event, createEventType: null, showModal: true });
  };

  openCreateModal = (eventType) => {
    this.setState({ selectedEvent: null, createEventType: eventType, showModal: true, showCreateMenu: false });
  };

  closeModal = () => {
    this.setState({ showModal: false, selectedEvent: null, createEventType: null });
  };

  handleEventSaved = () => {
    this.closeModal();
    this.fetchEvents();
  };

  /**
   * Get the event display title.
   */
  getEventTitle = (event) => {
    if (event.eventType === 'match') return `vs ${event.opponent || 'TBD'}`;
    if (event.eventType === 'training') return 'Training Session';
    return event.title || event.name || 'Untitled';
  };

  /**
   * Build calendar grid for month view.
   */
  getMonthGrid = () => {
    const { currentDate } = this.state;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      grid.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) });
    }

    // Next month leading days
    const remaining = 42 - grid.length;
    for (let d = 1; d <= remaining; d++) {
      grid.push({ day: d, isCurrentMonth: false, date: new Date(year, month + 1, d) });
    }

    return grid;
  };

  /**
   * Get events for a specific date.
   */
  getEventsForDate = (date) => {
    const events = this.getFilteredEvents();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      const eventStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      return eventStr === dateStr;
    });
  };

  /**
   * Get current week days.
   */
  getCurrentWeekDays = () => {
    const { currentDate } = this.state;
    const today = new Date();
    // Use a date in the current month to anchor the week
    const anchor = new Date(currentDate.getFullYear(), currentDate.getMonth(), today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear() ? today.getDate() : 1);
    const dayOfWeek = anchor.getDay();
    const startOfWeek = new Date(anchor);
    startOfWeek.setDate(anchor.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  renderViewToggle = () => {
    const { viewMode } = this.state;
    const modes = [
      { key: 'list', label: 'List' },
      { key: 'month', label: 'Month' },
      { key: 'week', label: 'Week' },
    ];

    return (
      <div className="flex bg-white/5 rounded-lg p-1">
        {modes.map((mode) => (
          <button
            key={mode.key}
            onClick={() => this.setState({ viewMode: mode.key })}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === mode.key
                ? 'bg-accent-gold text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    );
  };

  renderFilterPills = () => {
    const { isAdmin } = this.getRoleFlags();
    if (!isAdmin && !this.props.readOnly) return null;

    const { filters } = this.state;
    const types = [
      { key: 'training', label: 'Training', color: EVENT_COLORS.training },
      { key: 'match', label: 'Match', color: EVENT_COLORS.match },
      { key: 'event', label: 'Event', color: EVENT_COLORS.event },
    ];

    return (
      <div className="flex gap-2 flex-wrap">
        {types.map((type) => (
          <button
            key={type.key}
            onClick={() => this.toggleFilter(type.key)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
              filters[type.key]
                ? `${type.color.light} ${type.color.text}`
                : 'bg-white/5 text-white/30 line-through'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>
    );
  };

  renderCreateButton = () => {
    const { readOnly } = this.props;
    if (readOnly) return null;

    const { hasCoachRole, hasMarketingRole } = this.getRoleFlags();
    const { showCreateMenu } = this.state;

    if (!hasCoachRole && !hasMarketingRole) return null;

    return (
      <div className="relative">
        <button
          onClick={() => this.setState((prev) => ({ showCreateMenu: !prev.showCreateMenu }))}
          className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create
        </button>

        {showCreateMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => this.setState({ showCreateMenu: false })}
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-dark-elevated rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden">
              {hasCoachRole && (
                <>
                  <button
                    onClick={() => this.openCreateModal('training')}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Create Training
                  </button>
                  <button
                    onClick={() => this.openCreateModal('match')}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Create Match
                  </button>
                </>
              )}
              {hasMarketingRole && (
                <button
                  onClick={() => this.openCreateModal('event')}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Create Event
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  renderMonthView = () => {
    const grid = this.getMonthGrid();

    return (
      <div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {DAY_NAMES.map((day) => (
            <div key={day} className="text-center text-white/40 text-xs font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px">
          {grid.map((cell, idx) => {
            const dayEvents = this.getEventsForDate(cell.date);
            const today = this.isToday(cell.date);

            return (
              <div
                key={idx}
                className={`min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-lg border transition-colors ${
                  cell.isCurrentMonth
                    ? 'border-white/5 bg-surface-dark-elevated'
                    : 'border-transparent bg-white/[0.02]'
                } ${today ? 'ring-1 ring-accent-gold' : ''}`}
              >
                <span
                  className={`text-xs font-medium ${
                    cell.isCurrentMonth ? 'text-white/70' : 'text-white/20'
                  } ${today ? 'text-accent-gold font-bold' : ''}`}
                >
                  {cell.day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 3).map((event) => {
                    const color = EVENT_COLORS[event.eventType] || EVENT_COLORS.event;
                    return (
                      <button
                        key={event.id}
                        onClick={() => this.openEvent(event)}
                        className={`w-full text-left px-1 py-0.5 rounded text-[10px] md:text-xs truncate ${color.light} ${color.text} hover:opacity-80 transition-opacity`}
                      >
                        {this.getEventTitle(event)}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-white/40 pl-1">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  renderWeekView = () => {
    const weekDays = this.getCurrentWeekDays();

    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayEvents = this.getEventsForDate(day);
          const today = this.isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`rounded-xl border p-3 min-h-[200px] ${
                today
                  ? 'border-accent-gold bg-accent-gold/5'
                  : 'border-white/5 bg-surface-dark-elevated'
              }`}
            >
              <div className="text-center mb-2">
                <p className="text-white/40 text-xs">{DAY_NAMES[day.getDay()]}</p>
                <p className={`text-lg font-bold ${today ? 'text-accent-gold' : 'text-white'}`}>
                  {day.getDate()}
                </p>
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((event) => {
                  const color = EVENT_COLORS[event.eventType] || EVENT_COLORS.event;
                  return (
                    <button
                      key={event.id}
                      onClick={() => this.openEvent(event)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs ${color.light} ${color.text} hover:opacity-80 transition-opacity`}
                    >
                      <p className="font-medium truncate">{this.getEventTitle(event)}</p>
                      <p className="text-[10px] opacity-70">{this.formatTime(event.date)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  renderListView = () => {
    const events = this.getFilteredEvents();
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sorted.length === 0) {
      return (
        <div className="text-center py-12 text-white/40">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No events this month</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {sorted.map((event) => {
          const color = EVENT_COLORS[event.eventType] || EVENT_COLORS.event;
          return (
            <motion.button
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => this.openEvent(event)}
              className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-surface-dark-elevated border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className={`w-1 h-12 rounded-full ${color.bg}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${color.light} ${color.text}`}>
                    {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                  </span>
                </div>
                <p className="text-white font-medium truncate">{this.getEventTitle(event)}</p>
                {event.location && (
                  <p className="text-white/40 text-sm truncate">{event.location}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white/70 text-sm">{this.formatDate(event.date)}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  };

  render() {
    const { readOnly } = this.props;
    const { currentDate, viewMode, loading, showModal, selectedEvent, createEventType } = this.state;

    return (
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Calendar</h1>
            <p className="text-white/50 mt-1">
              {readOnly ? 'Upcoming club events and matches' : 'Manage trainings, matches, and events'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {this.renderFilterPills()}
            {this.renderViewToggle()}
            {this.renderCreateButton()}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => this.navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-display font-bold text-white min-w-[180px] text-center">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => this.navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={this.goToToday}
            className="px-3 py-1.5 text-sm text-white/60 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
          >
            Today
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="animate-spin w-10 h-10 text-accent-gold mx-auto mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-white/40 text-sm">Loading events...</p>
            </div>
          </div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'month' && this.renderMonthView()}
            {viewMode === 'week' && this.renderWeekView()}
            {viewMode === 'list' && this.renderListView()}
          </motion.div>
        )}

        {/* Event Modal */}
        <AnimatePresence>
          {showModal && (
            <CalendarEventModal
              event={selectedEvent}
              eventType={createEventType || selectedEvent?.eventType}
              onClose={this.closeModal}
              onSave={this.handleEventSaved}
              readOnly={readOnly || false}
              user={this.props.user}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }
}

export default Calendar;

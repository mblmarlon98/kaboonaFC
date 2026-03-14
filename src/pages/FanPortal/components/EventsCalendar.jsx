import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

const TYPE_CONFIG = {
  training: {
    label: 'Training',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  match: {
    label: 'Match',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
  },
  event: {
    label: 'Event',
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30',
  },
};

class EventsCalendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      loading: true,
      error: null,
      expandedId: null,
      view: 'list', // 'list' | 'calendar'
      calendarMonth: new Date(),
    };
  }

  componentDidMount() {
    this.fetchAllEvents();
  }

  fetchAllEvents = async () => {
    this.setState({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      const todayDate = new Date().toISOString().split('T')[0];

      const [trainingsRes, matchesRes, eventsRes] = await Promise.all([
        supabase
          .from('training_sessions')
          .select('id, session_date, session_time, location')
          .gte('session_date', todayDate)
          .order('session_date')
          .limit(20),
        supabase
          .from('matches')
          .select('id, opponent, match_date, match_time, location')
          .gte('match_date', todayDate)
          .order('match_date')
          .limit(20),
        supabase
          .from('events')
          .select('id, title, description, date, location, type')
          .eq('is_public', true)
          .gte('date', now)
          .order('date')
          .limit(20),
      ]);

      const normalized = [];

      if (trainingsRes.data) {
        trainingsRes.data.forEach((t) => {
          normalized.push({
            id: `training-${t.id}`,
            title: 'Training Session',
            date: t.session_date,
            location: t.location || null,
            eventType: 'training',
            details: null,
          });
        });
      }

      if (matchesRes.data) {
        matchesRes.data.forEach((m) => {
          normalized.push({
            id: `match-${m.id}`,
            title: `vs ${m.opponent}`,
            date: m.match_date,
            location: m.location || null,
            eventType: 'match',
            details: null,
          });
        });
      }

      if (eventsRes.data) {
        eventsRes.data.forEach((e) => {
          normalized.push({
            id: `event-${e.id}`,
            title: e.title,
            date: e.date,
            location: e.location || null,
            eventType: 'event',
            details: e.description || null,
          });
        });
      }

      // Sort all by date
      normalized.sort((a, b) => new Date(a.date) - new Date(b.date));

      this.setState({ events: normalized, loading: false });
    } catch (err) {
      console.error('Error fetching events:', err);
      this.setState({ error: err.message, loading: false });
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  toggleExpand = (id) => {
    this.setState((prev) => ({
      expandedId: prev.expandedId === id ? null : id,
    }));
  };

  setView = (view) => {
    this.setState({ view });
  };

  changeMonth = (delta) => {
    this.setState((prev) => {
      const d = new Date(prev.calendarMonth);
      d.setMonth(d.getMonth() + delta);
      return { calendarMonth: d };
    });
  };

  renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-surface-dark-elevated rounded-xl border border-white/10 p-5 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-16 h-5 bg-white/10 rounded-full" />
            <div className="w-24 h-4 bg-white/10 rounded" />
          </div>
          <div className="w-40 h-5 bg-white/10 rounded mb-2" />
          <div className="w-28 h-4 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );

  renderCalendarGrid = () => {
    const { events, calendarMonth } = this.state;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const monthLabel = calendarMonth.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });

    // Group events by date key (YYYY-MM-DD)
    const eventsByDate = {};
    events.forEach((ev) => {
      const d = new Date(ev.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate();
        if (!eventsByDate[key]) eventsByDate[key] = [];
        eventsByDate[key].push(ev);
      }
    });

    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="h-20 bg-white/5 rounded-lg" />);
    }
    // Day cells
    for (let day = 1; day <= totalDays; day++) {
      const dayEvents = eventsByDate[day] || [];
      const isToday =
        new Date().getFullYear() === year &&
        new Date().getMonth() === month &&
        new Date().getDate() === day;

      cells.push(
        <div
          key={day}
          className={`h-20 rounded-lg p-1.5 border transition-colors ${
            isToday
              ? 'border-accent-gold/50 bg-accent-gold/5'
              : 'border-white/5 bg-white/5 hover:border-white/10'
          }`}
        >
          <span
            className={`text-xs font-medium ${
              isToday ? 'text-accent-gold' : 'text-white/50'
            }`}
          >
            {day}
          </span>
          <div className="mt-0.5 space-y-0.5 overflow-hidden">
            {dayEvents.slice(0, 2).map((ev) => {
              const cfg = TYPE_CONFIG[ev.eventType] || TYPE_CONFIG.event;
              return (
                <div
                  key={ev.id}
                  className={`text-[9px] px-1 py-0.5 rounded truncate ${cfg.bg} ${cfg.text}`}
                >
                  {ev.title}
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <span className="text-[9px] text-white/40">
                +{dayEvents.length - 2} more
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => this.changeMonth(-1)}
            className="p-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-white font-semibold">{monthLabel}</h3>
          <button
            onClick={() => this.changeMonth(1)}
            className="p-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs text-white/40 font-medium py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
      </div>
    );
  };

  render() {
    const { events, loading, error, expandedId, view } = this.state;

    return (
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">
              Events <span className="text-accent-gold">Calendar</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Upcoming trainings, matches &amp; community events
            </p>
          </div>
          {/* View Toggle */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => this.setView('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'list'
                  ? 'bg-accent-gold text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              List
            </button>
            <button
              onClick={() => this.setView('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-accent-gold text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && this.renderSkeletons()}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400">Failed to load events</p>
            <button
              onClick={this.fetchAllEvents}
              className="mt-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent-gold"
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
            <h3 className="text-white font-display font-bold text-lg mb-2">
              No Upcoming Events
            </h3>
            <p className="text-gray-400">No upcoming events scheduled</p>
          </div>
        )}

        {/* Calendar Grid View */}
        {!loading && !error && events.length > 0 && view === 'calendar' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-surface-dark-elevated rounded-xl border border-white/10 p-5"
          >
            {this.renderCalendarGrid()}
          </motion.div>
        )}

        {/* List View */}
        {!loading && !error && events.length > 0 && view === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev, index) => {
              const cfg = TYPE_CONFIG[ev.eventType] || TYPE_CONFIG.event;
              const isExpanded = expandedId === ev.id;

              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => this.toggleExpand(ev.id)}
                  className="bg-surface-dark-elevated rounded-xl border border-white/10 p-5 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-white/50 text-sm">
                      {this.formatDate(ev.date)}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold">{ev.title}</h3>
                  {ev.location && (
                    <p className="text-white/60 text-sm mt-1 flex items-center gap-1">
                      <svg
                        className="w-3.5 h-3.5 text-white/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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
                      {ev.location}
                    </p>
                  )}

                  {/* Expanded details */}
                  {isExpanded && ev.details && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-white/10"
                    >
                      <p className="text-white/50 text-sm">{ev.details}</p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

export default EventsCalendar;

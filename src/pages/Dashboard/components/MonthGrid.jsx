import React, { Component } from 'react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EVENT_COLORS = {
  training: { bg: 'bg-blue-500', text: 'text-blue-400', light: 'bg-blue-500/20' },
  match: { bg: 'bg-red-500', text: 'text-red-400', light: 'bg-red-500/20' },
  event: { bg: 'bg-green-500', text: 'text-green-400', light: 'bg-green-500/20' },
};

const CREATE_OPTIONS = [
  { key: 'training', label: 'Training', color: 'bg-blue-500' },
  { key: 'match', label: 'Match', color: 'bg-red-500' },
  { key: 'event', label: 'Event', color: 'bg-green-500' },
];

/**
 * MonthGrid
 * Reusable month calendar grid component.
 * Shows a month view with day cells, event indicators, and an optional
 * day-click create menu for quickly adding events.
 *
 * Props:
 *  - currentDate: Date (first of the month to display)
 *  - events: Array of event objects with { id, eventType, date, ... }
 *  - onEventClick: (event) => void
 *  - onCreateEvent: (date, eventType) => void
 *  - getEventTitle: (event) => string
 *  - readOnly: boolean
 *  - canCreateTypes: string[] (subset of ['training','match','event'])
 */
class MonthGrid extends Component {
  constructor(props) {
    super(props);
    this.state = {
      createMenuDay: null,
    };
  }

  toDateString = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  getMonthGrid = () => {
    const { currentDate } = this.props;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      grid.push({ day: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) });
    }
    const remaining = 42 - grid.length;
    for (let d = 1; d <= remaining; d++) {
      grid.push({ day: d, isCurrentMonth: false, date: new Date(year, month + 1, d) });
    }

    return grid;
  };

  getEventsForDate = (date) => {
    const { events } = this.props;
    if (!events) return [];
    const dateStr = this.toDateString(date);
    return events.filter((e) => {
      const eventDate = new Date(e.date);
      return this.toDateString(eventDate) === dateStr;
    });
  };

  handleDayClick = (cell, e) => {
    if (this.props.readOnly) return;
    // Don't trigger if clicking on an event button
    if (e.target.closest('[data-event-btn]')) return;
    if (!cell.isCurrentMonth) return;

    const dateStr = this.toDateString(cell.date);
    this.setState((prev) => ({
      createMenuDay: prev.createMenuDay === dateStr ? null : dateStr,
    }));
  };

  handleCreateSelect = (date, type) => {
    this.setState({ createMenuDay: null });
    if (this.props.onCreateEvent) {
      this.props.onCreateEvent(date, type);
    }
  };

  handleEventClick = (e, event) => {
    e.stopPropagation();
    if (this.props.onEventClick) {
      this.props.onEventClick(event);
    }
  };

  getTitle = (event) => {
    if (this.props.getEventTitle) return this.props.getEventTitle(event);
    if (event.eventType === 'match') return `vs ${event.opponent || 'TBD'}`;
    if (event.eventType === 'training') return 'Training';
    return event.title || 'Event';
  };

  renderCreateMenu = (date) => {
    const canCreate = this.props.canCreateTypes || ['training', 'match', 'event'];
    const options = CREATE_OPTIONS.filter((o) => canCreate.includes(o.key));
    if (options.length === 0) return null;

    return (
      <div className="absolute inset-0 z-20 bg-surface-dark-elevated/95 rounded-lg flex flex-col items-center justify-center gap-1 p-1 border border-accent-gold/30 backdrop-blur-sm">
        <span className="text-[9px] md:text-[10px] text-white/50 font-medium mb-0.5">Create</span>
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={(e) => {
              e.stopPropagation();
              this.handleCreateSelect(date, opt.key);
            }}
            className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] md:text-xs text-white/80 hover:bg-white/10 transition-colors"
          >
            <span className={`w-2 h-2 rounded-full ${opt.color} flex-shrink-0`} />
            {opt.label}
          </button>
        ))}
      </div>
    );
  };

  render() {
    const { readOnly } = this.props;
    const { createMenuDay } = this.state;
    const grid = this.getMonthGrid();

    return (
      <div>
        {/* Dismiss create menu on outside click */}
        {createMenuDay && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => this.setState({ createMenuDay: null })}
          />
        )}

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
            const dateStr = this.toDateString(cell.date);
            const showMenu = createMenuDay === dateStr && !readOnly;

            return (
              <div
                key={idx}
                onClick={(e) => this.handleDayClick(cell, e)}
                className={`relative min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-lg border transition-colors ${
                  !readOnly && cell.isCurrentMonth ? 'cursor-pointer hover:border-accent-gold/20' : ''
                } ${
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
                        data-event-btn="true"
                        onClick={(e) => this.handleEventClick(e, event)}
                        className={`w-full text-left px-1 py-0.5 rounded text-[10px] md:text-xs truncate ${color.light} ${color.text} hover:opacity-80 transition-opacity`}
                      >
                        {this.getTitle(event)}
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-white/40 pl-1">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>

                {/* Create menu overlay */}
                {showMenu && this.renderCreateMenu(cell.date)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default MonthGrid;

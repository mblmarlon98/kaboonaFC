import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Attendance history with calendar/list view toggle
 */
class AttendanceHistory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewMode: 'calendar', // 'calendar' or 'list'
      currentMonth: new Date(),
    };
  }

  // Generate calendar days for current month
  generateCalendarDays = () => {
    const { currentMonth } = this.state;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // Empty slots before first day
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, status: null });
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        date: dateStr,
        status: this.getAttendanceStatus(dateStr),
      });
    }

    return days;
  };

  getAttendanceStatus = (dateStr) => {
    const { attendance } = this.props;

    // Mock attendance data
    const mockAttendance = attendance || {
      '2024-01-02': 'present',
      '2024-01-05': 'present',
      '2024-01-09': 'absent',
      '2024-01-12': 'present',
      '2024-01-16': 'present',
      '2024-01-19': 'late',
      '2024-01-23': 'present',
      '2024-01-26': 'present',
      '2024-01-30': 'present',
    };

    return mockAttendance[dateStr] || null;
  };

  getStatusStyle = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'absent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'late':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-transparent text-white/30';
    }
  };

  navigateMonth = (direction) => {
    this.setState((prevState) => {
      const newMonth = new Date(prevState.currentMonth);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return { currentMonth: newMonth };
    });
  };

  toggleViewMode = () => {
    this.setState((prevState) => ({
      viewMode: prevState.viewMode === 'calendar' ? 'list' : 'calendar',
    }));
  };

  renderCalendarView = () => {
    const { currentMonth } = this.state;
    const days = this.generateCalendarDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => this.navigateMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className="text-lg font-display font-bold text-white">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <button
            onClick={() => this.navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-white/50 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((item, index) => (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                item.day ? 'hover:bg-white/10 cursor-pointer' : ''
              } ${item.status ? this.getStatusStyle(item.status) : ''}`}
            >
              {item.day && (
                <span className={item.status ? '' : 'text-white/50'}>
                  {item.day}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="text-xs text-white/60">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <span className="text-xs text-white/60">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <span className="text-xs text-white/60">Absent</span>
          </div>
        </div>
      </div>
    );
  };

  renderListView = () => {
    // Mock list data
    const attendanceList = [
      { date: '2024-01-30', type: 'Training', status: 'present', time: '6:00 PM' },
      { date: '2024-01-28', type: 'Match', status: 'present', time: '2:00 PM' },
      { date: '2024-01-26', type: 'Training', status: 'present', time: '6:00 PM' },
      { date: '2024-01-23', type: 'Training', status: 'present', time: '6:00 PM' },
      { date: '2024-01-21', type: 'Match', status: 'present', time: '3:00 PM' },
      { date: '2024-01-19', type: 'Training', status: 'late', time: '6:30 PM' },
      { date: '2024-01-16', type: 'Training', status: 'present', time: '6:00 PM' },
      { date: '2024-01-14', type: 'Match', status: 'present', time: '4:00 PM' },
      { date: '2024-01-12', type: 'Training', status: 'present', time: '6:00 PM' },
      { date: '2024-01-09', type: 'Training', status: 'absent', time: '-' },
    ];

    return (
      <div className="divide-y divide-white/10">
        {attendanceList.map((item, index) => (
          <motion.div
            key={item.date}
            className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div className="flex items-center gap-4">
              <div className="text-sm text-white/50 w-24">
                {new Date(item.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
              <div>
                <span className="text-white font-medium">{item.type}</span>
                <span className="text-white/40 ml-2 text-sm">{item.time}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${this.getStatusStyle(item.status)}`}>
              {item.status}
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  render() {
    const { viewMode } = this.state;

    return (
      <motion.div
        className="w-full bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-accent-gold/20 flex items-center justify-between">
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
            Attendance History
          </h3>
          <div className="flex items-center gap-2 bg-surface-dark rounded-lg p-1">
            <button
              onClick={() => this.setState({ viewMode: 'calendar' })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-accent-gold text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => this.setState({ viewMode: 'list' })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-accent-gold text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? this.renderCalendarView() : this.renderListView()}
      </motion.div>
    );
  }
}

export default AttendanceHistory;

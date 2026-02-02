import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Generate mock attendance data for the past 12 weeks
 */
const generateMockAttendanceData = () => {
  const weeks = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trainingDays = [0, 2, 5]; // Monday, Wednesday, Saturday

  for (let week = 0; week < 12; week++) {
    const weekData = days.map((day, dayIndex) => {
      const isTrainingDay = trainingDays.includes(dayIndex);
      if (!isTrainingDay) {
        return { day, attendance: null, week: week + 1 };
      }
      // Generate random attendance between 60-100%
      const attendance = isTrainingDay ? Math.floor(Math.random() * 40) + 60 : null;
      return { day, attendance, week: week + 1 };
    });
    weeks.push(weekData);
  }
  return weeks;
};

const MOCK_ATTENDANCE_DATA = generateMockAttendanceData();

/**
 * Mock player attendance data
 */
const MOCK_TOP_ATTENDANCE = [
  { name: 'Samuel Okonkwo', sessions: 34, total: 36, percentage: 94 },
  { name: 'Pierre Dubois', sessions: 33, total: 36, percentage: 92 },
  { name: 'Carlos Rodriguez', sessions: 32, total: 36, percentage: 89 },
  { name: 'Lucas Mendes', sessions: 31, total: 36, percentage: 86 },
  { name: 'Viktor Kozlov', sessions: 30, total: 36, percentage: 83 },
];

/**
 * AttendanceHeatmap - Visual showing attendance patterns
 */
class AttendanceHeatmap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      attendanceData: [],
      topAttendance: [],
      isLoading: true,
      hoveredCell: null,
    };
  }

  componentDidMount() {
    this.fetchAttendanceData();
  }

  fetchAttendanceData = async () => {
    try {
      setTimeout(() => {
        this.setState({
          attendanceData: MOCK_ATTENDANCE_DATA,
          topAttendance: MOCK_TOP_ATTENDANCE,
          isLoading: false,
        });
      }, 800);
    } catch (error) {
      console.warn('Error fetching attendance data:', error);
      this.setState({
        attendanceData: MOCK_ATTENDANCE_DATA,
        topAttendance: MOCK_TOP_ATTENDANCE,
        isLoading: false,
      });
    }
  };

  getHeatColor = (attendance) => {
    if (attendance === null) return 'bg-surface-dark';
    if (attendance >= 90) return 'bg-green-500';
    if (attendance >= 80) return 'bg-green-600';
    if (attendance >= 70) return 'bg-yellow-500';
    if (attendance >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  getHeatOpacity = (attendance) => {
    if (attendance === null) return 'opacity-20';
    const opacity = Math.min(100, Math.max(40, attendance));
    return `opacity-${Math.round(opacity / 10) * 10}`;
  };

  handleCellHover = (weekIndex, dayIndex) => {
    this.setState({ hoveredCell: { weekIndex, dayIndex } });
  };

  handleCellLeave = () => {
    this.setState({ hoveredCell: null });
  };

  render() {
    const { attendanceData, topAttendance, isLoading, hoveredCell } = this.state;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (isLoading) {
      return (
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-48 bg-white/5 rounded" />
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Attendance Heatmap
          </h3>
          <p className="text-white/50 text-sm mt-1">Training session attendance over 12 weeks</p>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Day labels */}
            <div className="flex mb-2">
              <div className="w-12" />
              {days.map((day, i) => (
                <div key={day} className="flex-1 text-center text-xs text-white/50">
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            <div className="space-y-1">
              {attendanceData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex items-center">
                  <div className="w-12 text-xs text-white/40">W{weekIndex + 1}</div>
                  <div className="flex-1 flex gap-1">
                    {week.map((cell, dayIndex) => (
                      <motion.div
                        key={dayIndex}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2, delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                        className={`relative flex-1 h-8 rounded-sm cursor-pointer transition-all duration-200 ${
                          cell.attendance !== null
                            ? this.getHeatColor(cell.attendance)
                            : 'bg-white/5'
                        } ${
                          hoveredCell?.weekIndex === weekIndex && hoveredCell?.dayIndex === dayIndex
                            ? 'ring-2 ring-white scale-110 z-10'
                            : ''
                        }`}
                        style={{
                          opacity: cell.attendance !== null ? (cell.attendance / 100) * 0.8 + 0.2 : 0.2,
                        }}
                        onMouseEnter={() => this.handleCellHover(weekIndex, dayIndex)}
                        onMouseLeave={this.handleCellLeave}
                      >
                        {/* Tooltip */}
                        {hoveredCell?.weekIndex === weekIndex && hoveredCell?.dayIndex === dayIndex && cell.attendance !== null && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-surface-dark-elevated border border-white/20 rounded-lg shadow-xl whitespace-nowrap z-20">
                            <p className="text-xs text-white/60">Week {weekIndex + 1}, {days[dayIndex]}</p>
                            <p className="text-sm font-bold text-white">{cell.attendance}% attendance</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-xs text-white/50">Low</span>
          <div className="flex gap-1">
            {[60, 70, 80, 90, 100].map((level) => (
              <div
                key={level}
                className={`w-6 h-4 rounded-sm ${this.getHeatColor(level)}`}
                style={{ opacity: (level / 100) * 0.8 + 0.2 }}
              />
            ))}
          </div>
          <span className="text-xs text-white/50">High</span>
        </div>

        {/* Top Attendance List */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
            Most Consistent Players
          </h4>
          <div className="space-y-3">
            {topAttendance.map((player, index) => (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-dark hover:bg-surface-dark-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-accent-gold text-black'
                        : index === 1
                        ? 'bg-white/20 text-white'
                        : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <span className="text-white/90 font-medium">{player.name}</span>
                    <p className="text-white/40 text-xs">{player.sessions}/{player.total} sessions</p>
                  </div>
                </div>
                <span className={`font-bold ${
                  player.percentage >= 90 ? 'text-green-400' :
                  player.percentage >= 80 ? 'text-yellow-400' : 'text-orange-400'
                }`}>
                  {player.percentage}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
}

export default AttendanceHeatmap;

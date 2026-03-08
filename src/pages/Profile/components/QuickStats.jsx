import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Quick stats overview showing Goals, Assists, Matches, Attendance
 */
class QuickStats extends Component {
  renderStatCard = (stat, index) => {
    const { icon, label, value, subValue, trend, color } = stat;

    return (
      <motion.div
        key={label}
        className="relative bg-surface-dark-elevated rounded-xl p-6 border border-accent-gold/20 hover:border-accent-gold/50 transition-all duration-300 group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02, y: -5 }}
      >
        {/* Background Glow */}
        <div className="absolute inset-0 rounded-xl bg-accent-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
          {icon}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-display font-bold text-white">
            {value}
          </span>
          {subValue && (
            <span className="text-sm text-white/50">{subValue}</span>
          )}
        </div>

        {/* Label */}
        <p className="text-white/60 text-sm mt-1">{label}</p>

        {/* Trend */}
        {trend && (
          <div className={`mt-3 flex items-center gap-1 text-sm ${
            trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-white/40'
          }`}>
            {trend > 0 ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : trend < 0 ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            ) : null}
            <span>{Math.abs(trend)}% vs last month</span>
          </div>
        )}
      </motion.div>
    );
  };

  getCommonStats = (stats) => [
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: 'Games Played',
      value: stats?.matches || 0,
      color: 'bg-purple-500/20',
    },
  ];

  getOutfieldStats = (stats) => [
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M12 2v4m0 12v4M2 12h4m12 0h4" />
        </svg>
      ),
      label: 'Goals',
      value: stats?.goals || 0,
      color: 'bg-green-500/20',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      label: 'Assists',
      value: stats?.assists || 0,
      color: 'bg-cyan-500/20',
    },
  ];

  getGoalkeeperStats = (stats) => [
    {
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: 'Clean Sheets',
      value: stats?.cleanSheets || 0,
      color: 'bg-green-500/20',
    },
  ];

  getCardStats = (stats) => [
    {
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="2" width="12" height="18" rx="2" fill="#FBBF24" />
        </svg>
      ),
      label: 'Yellow Cards',
      value: stats?.yellowCards || 0,
      color: 'bg-yellow-500/20',
    },
    {
      icon: (
        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="2" width="12" height="18" rx="2" fill="#EF4444" />
        </svg>
      ),
      label: 'Red Cards',
      value: stats?.redCards || 0,
      color: 'bg-red-500/20',
    },
  ];

  render() {
    const { stats, position } = this.props;
    const isGoalkeeper = position === 'GK';

    // Build stats array based on position
    const commonStats = this.getCommonStats(stats);
    const positionStats = isGoalkeeper
      ? this.getGoalkeeperStats(stats)
      : this.getOutfieldStats(stats);
    const cardStats = this.getCardStats(stats);

    const allStats = [...commonStats, ...positionStats, ...cardStats];

    return (
      <motion.div
        className="w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider mb-6">
          Kaboona FC Statistics
        </h3>
        <div className="flex flex-wrap gap-4 [&>*]:flex-1 [&>*]:min-w-[140px]">
          {allStats.map((stat, index) => this.renderStatCard(stat, index))}
        </div>
      </motion.div>
    );
  }
}

export default QuickStats;

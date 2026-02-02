import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Recent matches list showing last 5 matches with player ratings
 */
class RecentMatches extends Component {
  getRatingColor = (rating) => {
    if (rating >= 8) return 'bg-green-500 text-white';
    if (rating >= 7) return 'bg-lime-500 text-white';
    if (rating >= 6) return 'bg-yellow-500 text-black';
    if (rating >= 5) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  getResultStyle = (result) => {
    switch (result) {
      case 'W':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'D':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'L':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  render() {
    const { matches } = this.props;

    // Mock data for recent matches
    const mockMatches = matches || [
      {
        id: 1,
        date: '2024-01-28',
        opponent: 'FC Barcelona B',
        score: '3-1',
        result: 'W',
        rating: 8.5,
        goals: 1,
        assists: 1,
        minutesPlayed: 90,
      },
      {
        id: 2,
        date: '2024-01-21',
        opponent: 'Real Madrid C',
        score: '2-2',
        result: 'D',
        rating: 7.2,
        goals: 1,
        assists: 0,
        minutesPlayed: 78,
      },
      {
        id: 3,
        date: '2024-01-14',
        opponent: 'Atletico Youth',
        score: '0-1',
        result: 'L',
        rating: 5.8,
        goals: 0,
        assists: 0,
        minutesPlayed: 90,
      },
      {
        id: 4,
        date: '2024-01-07',
        opponent: 'Sevilla Reserves',
        score: '4-2',
        result: 'W',
        rating: 9.1,
        goals: 2,
        assists: 1,
        minutesPlayed: 90,
      },
      {
        id: 5,
        date: '2023-12-31',
        opponent: 'Valencia B',
        score: '2-0',
        result: 'W',
        rating: 7.8,
        goals: 0,
        assists: 2,
        minutesPlayed: 85,
      },
    ];

    return (
      <motion.div
        className="w-full bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-accent-gold/20">
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
            Recent Matches
          </h3>
        </div>

        {/* Matches List */}
        <div className="divide-y divide-white/10">
          {mockMatches.map((match, index) => (
            <motion.div
              key={match.id}
              className="px-6 py-4 hover:bg-white/5 transition-colors duration-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <div className="flex items-center justify-between">
                {/* Left: Date & Opponent */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-white/50 w-12">
                    {this.formatDate(match.date)}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded border ${this.getResultStyle(match.result)}`}>
                      {match.result}
                    </span>
                    <span className="text-white font-medium">{match.opponent}</span>
                  </div>
                </div>

                {/* Center: Score */}
                <div className="text-lg font-display font-bold text-white">
                  {match.score}
                </div>

                {/* Right: Performance */}
                <div className="flex items-center gap-4">
                  {/* Goals/Assists */}
                  <div className="flex items-center gap-3 text-sm">
                    {match.goals > 0 && (
                      <span className="flex items-center gap-1 text-green-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        {match.goals}
                      </span>
                    )}
                    {match.assists > 0 && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {match.assists}
                      </span>
                    )}
                  </div>

                  {/* Minutes Played */}
                  <div className="text-sm text-white/50 hidden sm:block">
                    {match.minutesPlayed}'
                  </div>

                  {/* Rating */}
                  <div className={`px-3 py-1 rounded-lg font-bold text-sm ${this.getRatingColor(match.rating)}`}>
                    {match.rating.toFixed(1)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        <div className="px-6 py-4 border-t border-white/10">
          <button className="text-accent-gold hover:text-accent-gold-light transition-colors text-sm font-medium">
            View All Matches
          </button>
        </div>
      </motion.div>
    );
  }
}

export default RecentMatches;

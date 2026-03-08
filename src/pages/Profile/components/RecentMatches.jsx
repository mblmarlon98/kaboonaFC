import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { ALL_MATCHES } from '../../../data/matches';

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

    // Use real match data, most recent 5
    const mockMatches = matches || ALL_MATCHES.slice(0, 5).map(m => ({
      id: m.id,
      date: m.date,
      opponent: m.opponent,
      score: m.score,
      result: m.result,
    }));

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
              <div className="flex items-center">
                {/* Date */}
                <div className="text-sm text-white/50 w-14 shrink-0">
                  {this.formatDate(match.date)}
                </div>

                {/* Result */}
                <span className={`px-2 py-1 text-xs font-bold rounded border shrink-0 ${this.getResultStyle(match.result)}`}>
                  {match.result}
                </span>

                {/* Opponent */}
                <span className="text-white font-medium truncate flex-1 mx-3">{match.opponent}</span>

                {/* Score */}
                <div className="text-lg font-display font-bold text-white w-16 text-right shrink-0">
                  {match.score}
                </div>

                {/* Rating (if available) */}
                {match.rating && (
                  <div className={`px-3 py-1 rounded-lg font-bold text-sm ml-4 shrink-0 ${this.getRatingColor(match.rating)}`}>
                    {match.rating.toFixed(1)}
                  </div>
                )}
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

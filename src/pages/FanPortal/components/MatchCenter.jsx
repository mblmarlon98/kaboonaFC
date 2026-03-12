import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { getNextMatch, getRecentResults, getSeasonRecord, getPublishedLineup } from '../../../services/fanPortalService';

class MatchCenter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nextMatch: null,
      lineup: null,
      recentResults: [],
      seasonRecord: null,
      loading: true,
      countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    };
    this.countdownInterval = null;
  }

  async componentDidMount() {
    try {
      const [nextMatch, recentResults, seasonRecord] = await Promise.all([
        getNextMatch(),
        getRecentResults(),
        getSeasonRecord(),
      ]);
      let lineup = null;
      if (nextMatch) {
        lineup = await getPublishedLineup(nextMatch.id);
      }
      this.setState({ nextMatch, lineup, recentResults, seasonRecord, loading: false });
      if (nextMatch) this.startCountdown(nextMatch);
    } catch (err) {
      console.error('MatchCenter load error:', err);
      this.setState({ loading: false });
    }
  }

  componentWillUnmount() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  startCountdown = (match) => {
    const target = new Date(`${match.match_date}T${match.match_time || '00:00:00'}`);
    const update = () => {
      const now = new Date();
      const diff = Math.max(0, target - now);
      this.setState({
        countdown: {
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        },
      });
    };
    update();
    this.countdownInterval = setInterval(update, 1000);
  };

  getResultBadge = (result) => {
    const colors = { win: 'bg-green-500', draw: 'bg-yellow-500', loss: 'bg-red-500' };
    const labels = { win: 'W', draw: 'D', loss: 'L' };
    return (
      <span className={`${colors[result] || 'bg-gray-500'} text-white text-xs font-bold px-2 py-0.5 rounded`}>
        {labels[result] || '?'}
      </span>
    );
  };

  render() {
    const { nextMatch, lineup, recentResults, seasonRecord, loading, countdown } = this.state;

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Next Match Card */}
        {nextMatch ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-bold text-white">Next Match</h2>
              <div className="flex gap-2">
                <span className="bg-accent-gold/10 text-accent-gold text-xs font-semibold px-3 py-1 rounded-full border border-accent-gold/30">
                  {nextMatch.match_type || 'League'}
                </span>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm mb-1">
                {nextMatch.match_date} &middot; {nextMatch.match_time || 'TBD'} &middot; {nextMatch.location || 'TBD'}
              </p>
              <h3 className="text-3xl md:text-4xl font-display font-bold text-white">
                Kaboona FC <span className="text-accent-gold">vs</span> {nextMatch.opponent}
              </h3>
            </div>

            {/* Countdown */}
            <div className="flex justify-center gap-4 md:gap-8">
              {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                <div key={unit} className="text-center">
                  <div className="text-3xl md:text-5xl font-display font-bold text-accent-gold tabular-nums">
                    {String(countdown[unit]).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{unit}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-8 text-center">
            <p className="text-gray-400">No upcoming matches scheduled.</p>
          </div>
        )}

        {/* Lineup Reveal */}
        {nextMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-6"
          >
            <h2 className="text-xl font-display font-bold text-white mb-4">Lineup</h2>
            {lineup ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {(lineup.positions || []).map((pos, i) => (
                  <motion.div
                    key={i}
                    initial={{ rotateY: 180, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-surface-dark-hover rounded-lg p-3 text-center border border-gray-700"
                  >
                    <div className="text-xs text-accent-gold font-semibold">{pos.position}</div>
                    <div className="text-sm text-white mt-1 truncate">{pos.playerName || 'TBD'}</div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p>Lineup not yet announced</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Recent Results */}
        {recentResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-display font-bold text-white mb-4">Recent Results</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {recentResults.map((match) => (
                <div
                  key={match.id}
                  className="flex-shrink-0 w-48 bg-surface-dark-elevated rounded-xl border border-gray-800 p-4 text-center"
                >
                  <p className="text-xs text-gray-500 mb-2">{match.match_date}</p>
                  <p className="text-sm text-gray-300 mb-1">vs {match.opponent}</p>
                  <p className="text-2xl font-display font-bold text-white mb-2">
                    {match.score_for} - {match.score_against}
                  </p>
                  {this.getResultBadge(match.result)}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Season Record Strip */}
        {seasonRecord && seasonRecord.played > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4"
          >
            <h2 className="text-lg font-display font-bold text-white mb-3">Season Record</h2>
            <div className="grid grid-cols-6 gap-2 text-center">
              {[
                { label: 'P', value: seasonRecord.played },
                { label: 'W', value: seasonRecord.won, color: 'text-green-400' },
                { label: 'D', value: seasonRecord.drawn, color: 'text-yellow-400' },
                { label: 'L', value: seasonRecord.lost, color: 'text-red-400' },
                { label: 'GF', value: seasonRecord.goalsFor, color: 'text-accent-gold' },
                { label: 'GA', value: seasonRecord.goalsAgainst },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-xs text-gray-500 uppercase">{stat.label}</div>
                  <div className={`text-xl font-display font-bold ${stat.color || 'text-white'}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }
}

export default MatchCenter;

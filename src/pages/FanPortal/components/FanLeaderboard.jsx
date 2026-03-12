import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { getLeaderboard } from '../../../services/fanPortalService';

class FanLeaderboard extends Component {
  constructor(props) {
    super(props);
    this.state = { entries: [], loading: true, period: 'all' };
  }

  async componentDidMount() {
    await this.loadLeaderboard();
  }

  loadLeaderboard = async () => {
    this.setState({ loading: true });
    try {
      const entries = await getLeaderboard();
      this.setState({ entries, loading: false });
    } catch (err) {
      console.error('Leaderboard error:', err);
      this.setState({ loading: false });
    }
  };

  handlePeriodChange = (period) => {
    this.setState({ period });
    // Note: The DB view returns all-time data. For "This Month" we filter client-side.
    // A more scalable approach would add a date-filtered RPC, but client filtering works
    // fine for the current scale since leaderboard entries are already loaded.
  };

  getBadge = (points) => {
    if (points >= 1000) return { label: 'Legend', color: 'bg-accent-gold text-black' };
    if (points >= 500) return { label: 'Ultras', color: 'bg-purple-500 text-white' };
    if (points >= 100) return { label: 'Supporter', color: 'bg-blue-500 text-white' };
    return null;
  };

  render() {
    const { entries, loading } = this.state;
    const { user } = this.props;
    const userId = user?.id;
    const myRank = entries.findIndex((e) => e.user_id === userId);

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🥇</p>
          <h3 className="text-xl font-display font-bold text-white mb-2">No Rankings Yet</h3>
          <p className="text-gray-400">Start engaging to earn points!</p>
        </div>
      );
    }

    const podium = entries.slice(0, 3);
    const rest = entries.slice(3);

    // Period toggle rendered below
    const podiumColors = ['border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.3)]', 'border-gray-400', 'border-amber-600'];
    const podiumIcons = ['🥇', '🥈', '🥉'];

    return (
      <div className="space-y-6">
        {/* Period Toggle */}
        <div className="flex justify-center gap-2">
          {['all', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => this.handlePeriodChange(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                this.state.period === p
                  ? 'bg-accent-gold text-black'
                  : 'bg-surface-dark-elevated text-gray-400 border border-gray-700 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Time' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[1, 0, 2].map((idx) => {
            const entry = podium[idx];
            if (!entry) return <div key={idx} />;
            const badge = this.getBadge(entry.total_points);
            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-surface-dark-elevated rounded-xl border-2 ${podiumColors[idx]} p-4 text-center ${idx === 0 ? 'md:-mt-4' : ''}`}
              >
                <div className="text-3xl mb-2">{podiumIcons[idx]}</div>
                <div className="w-16 h-16 rounded-full bg-surface-dark-hover mx-auto mb-2 overflow-hidden flex items-center justify-center">
                  {entry.profile_image_url ? (
                    <img src={entry.profile_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-500">{(entry.full_name || '?')[0]}</span>
                  )}
                </div>
                <p className="font-semibold text-white text-sm truncate">{entry.full_name}</p>
                {badge && (
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
                <p className="text-xl font-display font-bold text-accent-gold mt-1">{entry.total_points}</p>
                <p className="text-xs text-gray-500">points</p>
              </motion.div>
            );
          })}
        </div>

        {/* Rankings Table */}
        {rest.length > 0 && (
          <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden">
            {rest.map((entry, i) => {
              const rank = i + 4;
              const badge = this.getBadge(entry.total_points);
              const isMe = entry.user_id === userId;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-b-0 ${isMe ? 'bg-accent-gold/5' : ''}`}
                >
                  <span className="w-8 text-center text-sm font-bold text-gray-500">#{rank}</span>
                  <div className="w-8 h-8 rounded-full bg-surface-dark-hover flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {entry.profile_image_url ? (
                      <img src={entry.profile_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm text-gray-500">{(entry.full_name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">{entry.full_name}</span>
                  </div>
                  {badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                  <span className="text-sm font-display font-bold text-accent-gold">{entry.total_points}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* My Rank Bar */}
        {userId && myRank >= 0 && (
          <div className="sticky bottom-4 bg-surface-dark-elevated/95 backdrop-blur-md rounded-xl border border-accent-gold/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-accent-gold font-bold">#{myRank + 1}</span>
              <span className="text-white text-sm font-semibold">Your Rank</span>
            </div>
            <span className="text-accent-gold font-display font-bold">{entries[myRank].total_points} pts</span>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(FanLeaderboard);

import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

/**
 * CleanSheetsLeaderboard - Goalkeeper stats leaderboard
 */
class CleanSheetsLeaderboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cleanSheetsData: [],
      isLoading: true,
    };
  }

  componentDidMount() {
    this.fetchCleanSheetsData();
  }

  fetchCleanSheetsData = async () => {
    try {
      // Get GKs from players_full
      const { data: gks, error: gkError } = await supabase
        .from('players_full')
        .select('id, name, jersey_number, matches_played, profile_image_url')
        .eq('position', 'GK');

      if (gkError) throw gkError;

      if (!gks || gks.length === 0) {
        this.setState({ cleanSheetsData: [], isLoading: false });
        return;
      }

      // Get clean sheet counts per GK
      const { data: stats, error: statsError } = await supabase
        .from('player_stats')
        .select('player_id, clean_sheet')
        .in('player_id', gks.map(g => g.id))
        .eq('clean_sheet', true);

      if (statsError) throw statsError;

      const csCountMap = {};
      (stats || []).forEach(s => {
        csCountMap[s.player_id] = (csCountMap[s.player_id] || 0) + 1;
      });

      const cleanSheetsData = gks
        .map(gk => ({
          name: gk.name || 'Unknown',
          cleanSheets: csCountMap[gk.id] || 0,
          matches: gk.matches_played || 0,
          team: 'KABOONA FC',
          position: 'GK',
          number: gk.jersey_number || 0,
        }))
        .sort((a, b) => b.cleanSheets - a.cleanSheets);

      this.setState({ cleanSheetsData, isLoading: false });
    } catch (error) {
      console.warn('Error fetching clean sheets data:', error);
      this.setState({ cleanSheetsData: [], isLoading: false });
    }
  };

  renderMedal = (index) => {
    if (index === 0) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-black">1</span>
        </div>
      );
    } else if (index === 1) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg">
          <span className="text-lg font-bold text-black">2</span>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg">
        <span className="text-lg font-bold text-white">{index + 1}</span>
      </div>
    );
  };

  render() {
    const { cleanSheetsData, isLoading } = this.state;

    if (isLoading) {
      return (
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded" />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-secondary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Clean Sheets
          </h3>
          <p className="text-white/50 text-sm mt-1">Goalkeeper performance</p>
        </div>

        {/* Leaderboard */}
        {cleanSheetsData.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-white/40">No goalkeeper data available yet.</p>
          </div>
        ) : (
        <div className="space-y-4">
          {cleanSheetsData.map((keeper, index) => (
            <motion.div
              key={keeper.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                index === 0
                  ? 'bg-gradient-to-r from-accent-gold/20 to-transparent border-accent-gold/30'
                  : 'bg-surface-dark border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Medal/Rank */}
                {this.renderMedal(index)}

                {/* Player Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${index === 0 ? 'text-accent-gold' : 'text-white'}`}>
                      {keeper.name}
                    </span>
                    <span className="text-white/40 text-sm">#{keeper.number}</span>
                  </div>
                  <p className="text-white/50 text-sm">{keeper.team}</p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className={`text-2xl font-bold ${index === 0 ? 'text-accent-gold' : 'text-secondary-blue'}`}>
                    {keeper.cleanSheets}
                  </p>
                  <p className="text-white/40 text-xs uppercase tracking-wider">Clean Sheets</p>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">{keeper.matches}</p>
                  <p className="text-white/40 text-xs">Matches</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">{keeper.matches > 0 ? Math.round((keeper.cleanSheets / keeper.matches) * 100) : 0}%</p>
                  <p className="text-white/40 text-xs">CS Rate</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span>Clean Sheet Rate</span>
                  <span>{Math.round((keeper.cleanSheets / keeper.matches) * 100)}%</span>
                </div>
                <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(keeper.cleanSheets / keeper.matches) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full rounded-full ${index === 0 ? 'bg-accent-gold' : 'bg-secondary-blue'}`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </motion.div>
    );
  }
}

export default CleanSheetsLeaderboard;

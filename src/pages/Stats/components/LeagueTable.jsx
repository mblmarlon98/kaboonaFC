import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Mock data for league table
 */
const MOCK_LEAGUE_DATA = [
  { position: 1, team: 'Tigers FC', played: 14, won: 11, drawn: 2, lost: 1, goalsFor: 38, goalsAgainst: 12, gd: 26, points: 35 },
  { position: 2, team: 'Sunway United', played: 14, won: 10, drawn: 3, lost: 1, goalsFor: 32, goalsAgainst: 14, gd: 18, points: 33 },
  { position: 3, team: 'KABOONA FC', played: 14, won: 9, drawn: 3, lost: 2, goalsFor: 29, goalsAgainst: 15, gd: 14, points: 30, isKaboona: true },
  { position: 4, team: 'Phoenix Stars', played: 14, won: 8, drawn: 2, lost: 4, goalsFor: 26, goalsAgainst: 18, gd: 8, points: 26 },
  { position: 5, team: 'Warriors SC', played: 14, won: 7, drawn: 3, lost: 4, goalsFor: 24, goalsAgainst: 20, gd: 4, points: 24 },
  { position: 6, team: 'Thunder Bay FC', played: 14, won: 6, drawn: 4, lost: 4, goalsFor: 22, goalsAgainst: 21, gd: 1, points: 22 },
  { position: 7, team: 'Royal Eagles', played: 14, won: 5, drawn: 5, lost: 4, goalsFor: 20, goalsAgainst: 19, gd: 1, points: 20 },
  { position: 8, team: 'City Rangers', played: 14, won: 5, drawn: 4, lost: 5, goalsFor: 18, goalsAgainst: 22, gd: -4, points: 19 },
  { position: 9, team: 'United Stars', played: 14, won: 4, drawn: 4, lost: 6, goalsFor: 17, goalsAgainst: 24, gd: -7, points: 16 },
  { position: 10, team: 'Northern FC', played: 14, won: 3, drawn: 4, lost: 7, goalsFor: 15, goalsAgainst: 26, gd: -11, points: 13 },
  { position: 11, team: 'Coastal United', played: 14, won: 2, drawn: 3, lost: 9, goalsFor: 12, goalsAgainst: 30, gd: -18, points: 9 },
  { position: 12, team: 'Valley FC', played: 14, won: 1, drawn: 1, lost: 12, goalsFor: 8, goalsAgainst: 40, gd: -32, points: 4 },
];

/**
 * LeagueTable - Full league standings with Kaboona highlighted
 */
class LeagueTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      leagueData: [],
      isLoading: true,
    };
  }

  componentDidMount() {
    this.fetchLeagueData();
  }

  fetchLeagueData = async () => {
    try {
      // Try to fetch from Supabase (placeholder for real implementation)
      // For now, use mock data
      setTimeout(() => {
        this.setState({
          leagueData: MOCK_LEAGUE_DATA,
          isLoading: false,
        });
      }, 500);
    } catch (error) {
      console.warn('Error fetching league data:', error);
      this.setState({
        leagueData: MOCK_LEAGUE_DATA,
        isLoading: false,
      });
    }
  };

  renderPositionBadge = (position) => {
    if (position <= 3) {
      // Promotion zone
      return (
        <div className="w-2 h-full absolute left-0 top-0 bg-green-500" />
      );
    } else if (position >= 11) {
      // Relegation zone
      return (
        <div className="w-2 h-full absolute left-0 top-0 bg-red-500" />
      );
    }
    return null;
  };

  render() {
    const { leagueData, isLoading } = this.state;

    if (isLoading) {
      return (
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded" />
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
        transition={{ duration: 0.5 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            League Standings
          </h3>
          <p className="text-white/50 text-sm mt-1">Season 2024/25</p>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 bg-surface-dark flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-white/60">Promotion Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-white/60">Relegation Zone</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 text-xs uppercase tracking-wider bg-surface-dark">
                <th className="py-4 px-4 text-left">Pos</th>
                <th className="py-4 px-4 text-left">Team</th>
                <th className="py-4 px-4 text-center hidden sm:table-cell">P</th>
                <th className="py-4 px-4 text-center hidden md:table-cell">W</th>
                <th className="py-4 px-4 text-center hidden md:table-cell">D</th>
                <th className="py-4 px-4 text-center hidden md:table-cell">L</th>
                <th className="py-4 px-4 text-center hidden lg:table-cell">GF</th>
                <th className="py-4 px-4 text-center hidden lg:table-cell">GA</th>
                <th className="py-4 px-4 text-center">GD</th>
                <th className="py-4 px-4 text-center">Pts</th>
              </tr>
            </thead>
            <tbody>
              {leagueData.map((team, index) => (
                <motion.tr
                  key={team.position}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative border-b border-white/5 transition-all duration-300 ${
                    team.isKaboona
                      ? 'bg-accent-gold/10 hover:bg-accent-gold/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {this.renderPositionBadge(team.position)}
                  <td className={`py-4 px-4 font-bold ${team.isKaboona ? 'text-accent-gold' : 'text-white'}`}>
                    {team.position}
                  </td>
                  <td className={`py-4 px-4 font-medium ${team.isKaboona ? 'text-accent-gold' : 'text-white/90'}`}>
                    <div className="flex items-center gap-2">
                      {team.isKaboona && (
                        <div className="w-2 h-2 bg-accent-gold rounded-full animate-pulse" />
                      )}
                      {team.team}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-white/70 hidden sm:table-cell">{team.played}</td>
                  <td className="py-4 px-4 text-center text-green-400 hidden md:table-cell">{team.won}</td>
                  <td className="py-4 px-4 text-center text-yellow-400 hidden md:table-cell">{team.drawn}</td>
                  <td className="py-4 px-4 text-center text-red-400 hidden md:table-cell">{team.lost}</td>
                  <td className="py-4 px-4 text-center text-white/70 hidden lg:table-cell">{team.goalsFor}</td>
                  <td className="py-4 px-4 text-center text-white/70 hidden lg:table-cell">{team.goalsAgainst}</td>
                  <td className={`py-4 px-4 text-center font-medium ${
                    team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : 'text-white/70'
                  }`}>
                    {team.gd > 0 ? `+${team.gd}` : team.gd}
                  </td>
                  <td className={`py-4 px-4 text-center font-bold ${team.isKaboona ? 'text-accent-gold' : 'text-white'}`}>
                    {team.points}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  }
}

export default LeagueTable;

import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { SUNDAY_LEAGUE_TABLE, THIRD_DIV_LEAGUE_TABLE } from '../../../data/matches';
import liveData from '../../../data/league-live.json';
import { TeamLogo } from '../../../data/teamLogos';

/**
 * LeagueTable - Full league standings with Kaboona highlighted
 */
class LeagueTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      leagueData: [],
      activeLeague: 'third-div',
      isLoading: true,
    };
  }

  componentDidMount() {
    this.fetchLeagueData();
  }

  fetchLeagueData = async () => {
    // Use live scraped data if available, fallback to static
    const liveStandings = liveData?.standings?.length > 0
      ? liveData.standings.map(t => ({ ...t, isKaboona: t.isKaboona || t.team?.toLowerCase().includes('kaboona') }))
      : null;

    this.setState({
      leagueData: liveStandings || THIRD_DIV_LEAGUE_TABLE,
      lastUpdated: liveData?.lastUpdated || null,
      isLoading: false,
    });
  };

  switchLeague = (league) => {
    const liveStandings = liveData?.standings?.length > 0
      ? liveData.standings.map(t => ({ ...t, isKaboona: t.isKaboona || t.team?.toLowerCase().includes('kaboona') }))
      : null;

    this.setState({
      activeLeague: league,
      leagueData: league === 'third-div' ? (liveStandings || THIRD_DIV_LEAGUE_TABLE) : SUNDAY_LEAGUE_TABLE,
    });
  };

  renderPositionBadge = (position) => {
    const { leagueData } = this.state;
    const totalTeams = leagueData.length;
    if (position <= 2) {
      // Promotion zone
      return (
        <div className="w-2 h-full absolute left-0 top-0 bg-green-500" />
      );
    } else if (position >= totalTeams) {
      // Relegation zone
      return (
        <div className="w-2 h-full absolute left-0 top-0 bg-red-500" />
      );
    }
    return null;
  };

  render() {
    const { leagueData, isLoading, activeLeague } = this.state;

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
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => this.switchLeague('third-div')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                activeLeague === 'third-div'
                  ? 'bg-accent-gold text-black font-semibold'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              New Camp Edition Div 3 (Ongoing)
            </button>
            <button
              onClick={() => this.switchLeague('sunday')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                activeLeague === 'sunday'
                  ? 'bg-accent-gold text-black font-semibold'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              Sunday Edition
            </button>
          </div>
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
                      <TeamLogo teamName={team.team} size={24} />
                      {team.team}
                      {team.isKaboona && (
                        <div className="w-2 h-2 bg-accent-gold rounded-full animate-pulse" />
                      )}
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

import React, { Component, createRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import supabase from '../../../services/supabase';
import { PlayerFIFACard } from '../../../components/shared';
import { ALL_MATCHES, OVERALL_STATS, THIRD_DIV_LEAGUE_TABLE, TOURNAMENTS } from '../../../data/matches';
import liveData from '../../../data/league-live.json';
import { TeamLogo } from '../../../data/teamLogos';

gsap.registerPlugin(ScrollTrigger);

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-white/10 rounded" />
      <div className="h-4 bg-white/10 rounded w-5/6" />
      <div className="h-4 bg-white/10 rounded w-4/6" />
    </div>
  </div>
);

class GlorySection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.state = {
      leagueTable: [],
      topScorers: [],
      cleanSheets: [],
      mostAttendance: [],
      wallOfShame: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchGloryData();
    this.initScrollAnimation();
  }

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  initScrollAnimation = () => {
    if (this.sectionRef.current) {
      gsap.fromTo(
        this.sectionRef.current.querySelectorAll('.glory-card'),
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  };

  fetchGloryData = async () => {
    try {
      // Fetch league table data
      const { data: leagueData, error: leagueError } = await supabase
        .from('league_table')
        .select('*')
        .order('position', { ascending: true });

      if (leagueError && leagueError.code !== 'PGRST116') {
        console.warn('League table not available:', leagueError);
      }

      // Use live scraped data if available, fallback to static
      const liveStandings = liveData?.standings?.length > 0
        ? liveData.standings.map(t => ({ ...t, isKaboona: t.isKaboona || t.team?.toLowerCase().includes('kaboona') }))
        : null;
      const realLeagueTable = liveStandings || THIRD_DIV_LEAGUE_TABLE;

      const mockTopScorers = [
        {
          name: 'Ahmad Rizal',
          goals: 12,
          position: 'ST',
          number: 9,
          country: 'my',
          stats: { pace: 82, shooting: 85, passing: 70, dribbling: 78, defending: 35, physical: 75 }
        },
        {
          name: 'Chen Wei',
          goals: 8,
          position: 'CAM',
          number: 10,
          country: 'my',
          stats: { pace: 75, shooting: 80, passing: 85, dribbling: 82, defending: 40, physical: 65 }
        },
        {
          name: 'Danial Hakim',
          goals: 6,
          position: 'LW',
          number: 11,
          country: 'my',
          stats: { pace: 88, shooting: 72, passing: 68, dribbling: 80, defending: 30, physical: 60 }
        },
      ];

      const mockCleanSheets = [
        {
          name: 'Faizal Rahman',
          cleanSheets: 5,
          position: 'GK',
          number: 1,
          country: 'my',
          stats: { diving: 80, handling: 78, kicking: 70, reflexes: 82, speed: 55, positioning: 75 }
        },
        {
          name: 'Kevin Tan',
          cleanSheets: 3,
          position: 'GK',
          number: 13,
          country: 'my',
          stats: { diving: 75, handling: 72, kicking: 68, reflexes: 76, speed: 50, positioning: 70 }
        },
      ];

      const mockMostAttendance = [
        {
          name: 'Muhammad Amir',
          sessions: 48,
          attendance: '96%',
          position: 'CM',
          number: 8,
          country: 'my',
          stats: { pace: 70, shooting: 65, passing: 80, dribbling: 72, defending: 75, physical: 78 }
        },
        {
          name: 'Lee Jun Wei',
          sessions: 47,
          attendance: '94%',
          position: 'CB',
          number: 4,
          country: 'my',
          stats: { pace: 65, shooting: 45, passing: 60, dribbling: 55, defending: 82, physical: 80 }
        },
        {
          name: 'Hafiz Ismail',
          sessions: 46,
          attendance: '92%',
          position: 'RB',
          number: 2,
          country: 'my',
          stats: { pace: 78, shooting: 50, passing: 68, dribbling: 65, defending: 75, physical: 72 }
        },
      ];

      const mockWallOfShame = [
        { name: 'Crazy Legs Kamal', yellowCards: 8, redCards: 1, reason: 'Slide tackle specialist' },
        { name: 'Hot Head Harris', yellowCards: 6, redCards: 2, reason: 'Referee best friend' },
        { name: 'Wild Card Wafi', yellowCards: 5, redCards: 0, reason: 'Creative fouls' },
      ];

      this.setState({
        leagueTable: (leagueData && leagueData.length > 0) ? leagueData : realLeagueTable,
        topScorers: mockTopScorers,
        cleanSheets: mockCleanSheets,
        mostAttendance: mockMostAttendance,
        wallOfShame: mockWallOfShame,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching glory data:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  renderLeagueTable = () => {
    const { leagueTable, loading } = this.state;

    if (loading) return <SkeletonCard />;

    // Find Kaboona's position and get +-3 teams
    const kaboonaIndex = leagueTable.findIndex(
      (team) => team.isKaboona || team.team?.toLowerCase().includes('kaboona')
    );
    const startIndex = Math.max(0, kaboonaIndex - 3);
    const endIndex = Math.min(leagueTable.length, kaboonaIndex + 4);
    const visibleTeams = leagueTable.slice(startIndex, endIndex);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/50 text-xs uppercase tracking-wider border-b border-white/10">
              <th className="py-3 px-2 text-left">Pos</th>
              <th className="py-3 px-2 text-left">Team</th>
              <th className="py-3 px-2 text-center">P</th>
              <th className="py-3 px-2 text-center">GD</th>
              <th className="py-3 px-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {visibleTeams.map((team, index) => (
              <tr
                key={index}
                className={`border-b border-white/5 ${
                  team.isKaboona || team.team?.toLowerCase().includes('kaboona')
                    ? 'bg-accent-gold/10 text-accent-gold font-semibold'
                    : 'text-white/80'
                }`}
              >
                <td className="py-3 px-2">{team.position}</td>
                <td className="py-3 px-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <TeamLogo teamName={team.team} size={22} />
                    {team.team}
                  </div>
                </td>
                <td className="py-3 px-2 text-center">{team.played}</td>
                <td className="py-3 px-2 text-center">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                <td className="py-3 px-2 text-center font-bold">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  renderWallOfShame = () => {
    const { wallOfShame, loading } = this.state;

    if (loading) return <SkeletonCard />;

    return (
      <div className="space-y-4">
        {wallOfShame.map((player, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-surface-dark hover:bg-surface-dark-hover transition-colors border border-white/5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{player.name}</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-yellow-400 text-sm">
                  <span className="w-3 h-4 bg-yellow-400 rounded-sm" />
                  {player.yellowCards}
                </span>
                <span className="flex items-center gap-1 text-red-400 text-sm">
                  <span className="w-3 h-4 bg-red-500 rounded-sm" />
                  {player.redCards}
                </span>
              </div>
            </div>
            <p className="text-white/40 text-sm italic">"{player.reason}"</p>
          </div>
        ))}
      </div>
    );
  };

  render() {
    const { topScorers, cleanSheets, mostAttendance, loading } = this.state;

    return (
      <section
        ref={this.sectionRef}
        className="py-20 md:py-32 bg-surface-dark relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.3) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* GLORY SECTION - League Table */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-accent-gold/10 text-accent-gold text-sm font-semibold tracking-wider rounded-full mb-6">
                GLORY SECTION
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
                League <span className="text-accent-gold">Standing</span>
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="glory-card p-6 bg-surface-dark-elevated rounded-2xl border border-white/5 hover:border-accent-gold/30 transition-all duration-300">
                <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  The New Camp Edition (Division 3)
                </h3>
                {this.renderLeagueTable()}
              </div>
            </div>
          </div>

          {/* ACHIEVEMENTS SECTION */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-green-500/10 text-green-400 text-sm font-semibold tracking-wider rounded-full mb-6">
                ACHIEVEMENTS
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
                Our <span className="text-accent-gold">Stars</span>
              </h2>
            </div>

            {/* Top Scorers */}
            <div className="mb-16">
              <h3 className="text-2xl font-display font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                <svg className="w-8 h-8 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Top Scorers
              </h3>
              <div className="flex flex-wrap justify-center gap-6">
                {loading ? (
                  <SkeletonCard />
                ) : (
                  topScorers.map((player, index) => (
                    <div key={index} className="glory-card">
                      <PlayerFIFACard
                        name={player.name}
                        position={player.position}
                        number={player.number}
                        country={player.country}
                        stats={player.stats}
                        size="md"
                        badge={`${player.goals} Goals`}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clean Sheets */}
            <div className="mb-16">
              <h3 className="text-2xl font-display font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                <svg className="w-8 h-8 text-secondary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Clean Sheets
              </h3>
              <div className="flex flex-wrap justify-center gap-6">
                {loading ? (
                  <SkeletonCard />
                ) : (
                  cleanSheets.map((player, index) => (
                    <div key={index} className="glory-card">
                      <PlayerFIFACard
                        name={player.name}
                        position={player.position}
                        number={player.number}
                        country={player.country}
                        stats={player.stats}
                        size="md"
                        badge={`${player.cleanSheets} Clean Sheets`}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Best Attendance */}
            <div className="mb-16">
              <h3 className="text-2xl font-display font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Best Attendance
              </h3>
              <div className="flex flex-wrap justify-center gap-6">
                {loading ? (
                  <SkeletonCard />
                ) : (
                  mostAttendance.map((player, index) => (
                    <div key={index} className="glory-card">
                      <PlayerFIFACard
                        name={player.name}
                        position={player.position}
                        number={player.number}
                        country={player.country}
                        stats={player.stats}
                        size="md"
                        badge={player.attendance}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* WALL OF SHAME */}
          <div>
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-red-500/10 text-red-400 text-sm font-semibold tracking-wider rounded-full mb-6">
                HALL OF INFAMY
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
                Wall of <span className="text-red-400">Shame</span>
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="glory-card p-6 bg-surface-dark-elevated rounded-2xl border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
                {this.renderWallOfShame()}
                <p className="text-white/30 text-xs mt-4 italic text-center">
                  * All in good fun! We love these guys.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default GlorySection;

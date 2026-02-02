import React, { Component, createRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import supabase from '../../../services/supabase';

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

      // For now, use mock data if Supabase is not configured
      const mockLeagueTable = [
        { position: 1, team: 'Tigers FC', played: 10, won: 8, drawn: 1, lost: 1, gd: 15, points: 25 },
        { position: 2, team: 'Sunway United', played: 10, won: 7, drawn: 2, lost: 1, gd: 12, points: 23 },
        { position: 3, team: 'KABOONA FC', played: 10, won: 6, drawn: 3, lost: 1, gd: 10, points: 21, isKaboona: true },
        { position: 4, team: 'Phoenix Stars', played: 10, won: 5, drawn: 2, lost: 3, gd: 5, points: 17 },
        { position: 5, team: 'Warriors SC', played: 10, won: 4, drawn: 3, lost: 3, gd: 2, points: 15 },
      ];

      const mockTopScorers = [
        { name: 'Ahmad Rizal', goals: 12, team: 'KABOONA FC' },
        { name: 'Chen Wei', goals: 8, team: 'KABOONA FC' },
        { name: 'Danial Hakim', goals: 6, team: 'KABOONA FC' },
      ];

      const mockCleanSheets = [
        { name: 'Faizal Rahman', cleanSheets: 5, team: 'KABOONA FC' },
        { name: 'Kevin Tan', cleanSheets: 3, team: 'KABOONA FC' },
      ];

      const mockMostAttendance = [
        { name: 'Muhammad Amir', sessions: 48, attendance: '96%' },
        { name: 'Lee Jun Wei', sessions: 47, attendance: '94%' },
        { name: 'Hafiz Ismail', sessions: 46, attendance: '92%' },
      ];

      const mockWallOfShame = [
        { name: 'Crazy Legs Kamal', yellowCards: 8, redCards: 1, reason: 'Slide tackle specialist' },
        { name: 'Hot Head Harris', yellowCards: 6, redCards: 2, reason: 'Referee best friend' },
        { name: 'Wild Card Wafi', yellowCards: 5, redCards: 0, reason: 'Creative fouls' },
      ];

      this.setState({
        leagueTable: leagueData || mockLeagueTable,
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
                <td className="py-3 px-2 whitespace-nowrap">{team.team}</td>
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

  renderTopScorers = () => {
    const { topScorers, loading } = this.state;

    if (loading) return <SkeletonCard />;

    return (
      <div className="space-y-4">
        {topScorers.map((player, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-dark hover:bg-surface-dark-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0
                    ? 'bg-accent-gold text-black'
                    : index === 1
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {index + 1}
              </span>
              <span className="text-white/90">{player.name}</span>
            </div>
            <span className="text-accent-gold font-bold">{player.goals} goals</span>
          </div>
        ))}
      </div>
    );
  };

  renderCleanSheets = () => {
    const { cleanSheets, loading } = this.state;

    if (loading) return <SkeletonCard />;

    return (
      <div className="space-y-4">
        {cleanSheets.map((player, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-dark hover:bg-surface-dark-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {index === 0 ? String.fromCodePoint(0x1F947) : String.fromCodePoint(0x1F948)}
              </span>
              <span className="text-white/90">{player.name}</span>
            </div>
            <span className="text-secondary-blue font-bold">{player.cleanSheets} clean sheets</span>
          </div>
        ))}
      </div>
    );
  };

  renderMostAttendance = () => {
    const { mostAttendance, loading } = this.state;

    if (loading) return <SkeletonCard />;

    return (
      <div className="space-y-4">
        {mostAttendance.map((player, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-surface-dark hover:bg-surface-dark-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-white/90">{player.name}</span>
            </div>
            <span className="text-green-400 font-bold">{player.attendance}</span>
          </div>
        ))}
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
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 bg-accent-gold/10 text-accent-gold text-sm font-semibold tracking-wider rounded-full mb-6">
              GLORY SECTION
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
              Our <span className="text-accent-gold">Achievements</span>
            </h2>
          </div>

          {/* Glory Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* League Table Card */}
            <div className="glory-card lg:col-span-2 p-6 bg-surface-dark-elevated rounded-2xl border border-white/5 hover:border-accent-gold/30 transition-all duration-300">
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                League Table
              </h3>
              {this.renderLeagueTable()}
            </div>

            {/* Top Scorers Card */}
            <div className="glory-card p-6 bg-surface-dark-elevated rounded-2xl border border-white/5 hover:border-accent-gold/30 transition-all duration-300">
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Top Scorers
              </h3>
              {this.renderTopScorers()}
            </div>

            {/* Clean Sheets Card */}
            <div className="glory-card p-6 bg-surface-dark-elevated rounded-2xl border border-white/5 hover:border-accent-gold/30 transition-all duration-300">
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-secondary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Clean Sheets
              </h3>
              {this.renderCleanSheets()}
            </div>

            {/* Most Attendance Card */}
            <div className="glory-card p-6 bg-surface-dark-elevated rounded-2xl border border-white/5 hover:border-accent-gold/30 transition-all duration-300">
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Most Attendance
              </h3>
              {this.renderMostAttendance()}
            </div>

            {/* Wall of Shame Card */}
            <div className="glory-card p-6 bg-surface-dark-elevated rounded-2xl border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
              <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Wall of Shame
              </h3>
              {this.renderWallOfShame()}
              <p className="text-white/30 text-xs mt-4 italic text-center">
                * All in good fun! We love these guys.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default GlorySection;

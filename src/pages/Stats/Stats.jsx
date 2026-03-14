import React, { Component, createRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LeagueTable from './components/LeagueTable';
import TopScorersChart from './components/TopScorersChart';
import CleanSheetsLeaderboard from './components/CleanSheetsLeaderboard';
import AttendanceHeatmap from './components/AttendanceHeatmap';
import DisciplinaryChart from './components/DisciplinaryChart';
import RatingsRadar from './components/RatingsRadar';
import { OVERALL_STATS, THIRD_DIV_STATS, SUNDAY_LEAGUE_STATS, FRIENDLY_STATS } from '../../data/matches';

gsap.registerPlugin(ScrollTrigger);

/**
 * Stats page - Comprehensive statistics and visualizations
 * Displays league table, top scorers, clean sheets, attendance,
 * disciplinary records, and coach ratings
 */
class Stats extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.state = {
      isLoaded: false,
      activeSection: 'all',
      activeCompetition: 'div3',
    };

    this.competitions = [
      { id: 'div3', label: 'Div 3 (Current)', stats: THIRD_DIV_STATS },
      { id: 'sunday', label: 'Sunday Edition', stats: SUNDAY_LEAGUE_STATS },
      { id: 'friendlies', label: 'Friendlies', stats: FRIENDLY_STATS },
      { id: 'alltime', label: 'All Time', stats: OVERALL_STATS },
    ];
  }

  componentDidMount() {
    this.setState({ isLoaded: true });
    window.scrollTo(0, 0);
    this.initScrollAnimations();
  }

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  initScrollAnimations = () => {
    if (this.sectionRef.current) {
      gsap.fromTo(
        this.sectionRef.current.querySelectorAll('.stats-card'),
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.15,
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  };

  handleSectionChange = (section) => {
    this.setState({ activeSection: section });
  };

  render() {
    const { activeSection, activeCompetition } = this.state;

    const sections = [
      { id: 'all', label: 'All Stats' },
      { id: 'league', label: 'League' },
      { id: 'players', label: 'Players' },
      { id: 'team', label: 'Team' },
    ];

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Hero Section */}
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated via-surface-dark to-surface-dark" />

          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-64 h-64 rounded-full bg-accent-gold/5"
                initial={{ x: Math.random() * 100 - 50, y: Math.random() * 100 - 50 }}
                animate={{
                  x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                  y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                }}
                transition={{
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'linear',
                }}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + i * 10}%`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center px-4"
          >
            <motion.span
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block px-4 py-1 bg-accent-gold/10 text-accent-gold text-sm font-semibold tracking-wider rounded-full mb-6"
            >
              SEASON 2025/26
            </motion.span>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4">
              Statistics
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Dive deep into the numbers. Track our progress, celebrate our successes, and analyze every aspect of Kaboona FC's performance.
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mt-6" />
          </motion.div>

          {/* Bottom Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-dark to-transparent" />
        </section>

        {/* Section Filter */}
        <section className="sticky top-0 z-30 bg-surface-dark/95 backdrop-blur-sm border-b border-white/5 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => this.handleSectionChange(section.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    activeSection === section.id
                      ? 'bg-accent-gold text-black'
                      : 'bg-surface-dark-elevated text-white/70 hover:text-white hover:bg-surface-dark-hover'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Content */}
        <section ref={this.sectionRef} className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Kaboona FC Stats */}
            <div className="mb-12">
              {/* Competition Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {this.competitions.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => this.setState({ activeCompetition: comp.id })}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                      activeCompetition === comp.id
                        ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40'
                        : 'bg-surface-dark-elevated text-white/50 border border-white/5 hover:text-white/70 hover:border-white/10'
                    }`}
                  >
                    {comp.label}
                  </button>
                ))}
              </div>

              {/* Stats Cards */}
              {(() => {
                const currentStats = this.competitions.find(c => c.id === activeCompetition)?.stats || THIRD_DIV_STATS;
                const gd = currentStats.goalDifference;
                const isLeague = activeCompetition === 'div3' || activeCompetition === 'sunday';
                const ppg = (currentStats.points / currentStats.played).toFixed(1);
                const fourthStat = isLeague
                  ? { label: 'Pts Per Game', value: ppg, color: 'text-purple-400' }
                  : { label: 'Win Rate', value: `${currentStats.winRate}%`, color: 'text-purple-400' };
                return (
                  <motion.div
                    key={activeCompetition}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {[
                      { label: 'Matches Played', value: `${currentStats.played}`, color: 'text-accent-gold' },
                      { label: 'Goals Scored', value: `${currentStats.goalsFor}`, color: 'text-green-400' },
                      { label: 'Goal Difference', value: `${gd > 0 ? '+' : ''}${gd}`, color: gd >= 0 ? 'text-secondary-blue' : 'text-red-400' },
                      fourthStat,
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-surface-dark-elevated rounded-xl p-4 md:p-6 border border-white/5 hover:border-accent-gold/30 transition-all duration-300"
                      >
                        <p className={`text-3xl md:text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-white/50 text-sm mt-1">{stat.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                );
              })()}

              {/* Record Summary */}
              {(() => {
                const currentStats = this.competitions.find(c => c.id === activeCompetition)?.stats || THIRD_DIV_STATS;
                return (
                  <div className="flex items-center gap-4 mt-4 text-xs text-white/40">
                    <span className="text-green-400">{currentStats.wins}W</span>
                    <span className="text-yellow-400">{currentStats.draws}D</span>
                    <span className="text-red-400">{currentStats.losses}L</span>
                    <span className="ml-auto">{currentStats.goalsFor} GF / {currentStats.goalsAgainst} GA</span>
                  </div>
                );
              })()}
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* League Table - Full Width */}
              {(activeSection === 'all' || activeSection === 'league') && (
                <div className="stats-card lg:col-span-2">
                  <LeagueTable />
                </div>
              )}

              {/* Top Scorers Chart */}
              {(activeSection === 'all' || activeSection === 'players') && (
                <div className="stats-card">
                  <TopScorersChart />
                </div>
              )}

              {/* Clean Sheets Leaderboard */}
              {(activeSection === 'all' || activeSection === 'players') && (
                <div className="stats-card">
                  <CleanSheetsLeaderboard />
                </div>
              )}

              {/* Attendance Heatmap */}
              {(activeSection === 'all' || activeSection === 'team') && (
                <div className="stats-card">
                  <AttendanceHeatmap />
                </div>
              )}

              {/* Disciplinary Chart */}
              {(activeSection === 'all' || activeSection === 'team') && (
                <div className="stats-card">
                  <DisciplinaryChart />
                </div>
              )}

              {/* Ratings Radar - Full Width */}
              {(activeSection === 'all' || activeSection === 'team') && (
                <div className="stats-card lg:col-span-2">
                  <RatingsRadar />
                </div>
              )}
            </div>

            {/* Stats Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="mt-12 text-center"
            >
              <p className="text-white/30 text-sm">
                Statistics are updated after each match. Some data may be based on sample data during off-season.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }
}

export default Stats;

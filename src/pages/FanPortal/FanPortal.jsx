import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { getNextMatch } from '../../services/fanPortalService';
import MatchCenter from './components/MatchCenter';
import FanWall from './components/FanWall';
import POTMVoting from './components/POTMVoting';
import FanLeaderboard from './components/FanLeaderboard';
import MatchDayHub from './components/MatchDayHub';
import Gallery from './components/Gallery';
import News from './components/News';
import EventsCalendar from './components/EventsCalendar';

const SECTIONS = [
  { id: 'news', label: 'News' },
  { id: 'match-center', label: 'Match Center' },
  { id: 'fan-wall', label: 'Fan Wall' },
  { id: 'vote', label: 'POTM Vote' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'match-day', label: 'Match Day' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'events-calendar', label: 'Events' },
];

class FanPortal extends Component {
  constructor(props) {
    super(props);
    this.state = { nextMatch: null };
    this.sectionRefs = {};
    SECTIONS.forEach(s => { this.sectionRefs[s.id] = React.createRef(); });
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    try {
      const nextMatch = await getNextMatch();
      this.setState({ nextMatch });
    } catch (err) { /* ignore */ }
  }

  scrollToSection = (id) => {
    const ref = this.sectionRefs[id];
    if (ref?.current) {
      const offset = 80;
      const top = ref.current.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  render() {
    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Hero */}
        <section className="relative py-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated via-surface-dark to-surface-dark" />
          <div className="absolute inset-0 opacity-5">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 1px)',
                backgroundSize: '50px 50px',
              }}
            />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-2"
            >
              FAN PORTAL
            </motion.h1>
            {this.state.nextMatch && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 mt-2 mb-1"
              >
                Next: <span className="text-white font-semibold">vs {this.state.nextMatch.opponent}</span>
                <span className="text-accent-gold ml-2">{this.state.nextMatch.match_date}</span>
              </motion.p>
            )}
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto" />
          </div>
        </section>

        {/* Quick Nav */}
        <div className="sticky top-16 z-20 bg-surface-dark/95 backdrop-blur-md border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => this.scrollToSection(section.id)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 text-gray-400 hover:text-white hover:bg-surface-dark-hover"
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* All Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
          <div ref={this.sectionRefs['news']}><News /></div>
          <div ref={this.sectionRefs['match-center']}><MatchCenter /></div>
          <div ref={this.sectionRefs['fan-wall']}><FanWall /></div>
          <div ref={this.sectionRefs['vote']}><POTMVoting /></div>
          <div ref={this.sectionRefs['leaderboard']}><FanLeaderboard /></div>
          <div ref={this.sectionRefs['match-day']}><MatchDayHub /></div>
          <div ref={this.sectionRefs['gallery']}><Gallery /></div>
          <div ref={this.sectionRefs['events-calendar']}><EventsCalendar /></div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user || null,
});

export default connect(mapStateToProps)(FanPortal);

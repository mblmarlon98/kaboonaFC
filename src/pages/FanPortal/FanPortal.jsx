import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { getNextMatch } from '../../services/fanPortalService';
import MatchCenter from './components/MatchCenter';

const TABS = [
  { id: 'match-center', label: 'Match Center', icon: '⚽' },
  { id: 'fan-wall', label: 'Fan Wall', icon: '💬' },
  { id: 'vote', label: 'POTM Vote', icon: '🏆' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🥇' },
  { id: 'match-day', label: 'Match Day', icon: '📍' },
  { id: 'gallery', label: 'Gallery', icon: '📸' },
];

class FanPortal extends Component {
  constructor(props) {
    super(props);
    this.state = { activeTab: 'match-center', nextMatch: null };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    try {
      const nextMatch = await getNextMatch();
      this.setState({ nextMatch });
    } catch (err) { /* ignore */ }
  }

  handleTabChange = (tabId) => {
    this.setState({ activeTab: tabId });
  };

  renderTabContent = () => {
    const { activeTab } = this.state;
    const { user } = this.props;

    switch (activeTab) {
      case 'match-center':
        return <MatchCenter />;
      case 'fan-wall':
        return <div className="text-center py-20 text-gray-400">Fan Wall — coming soon</div>;
      case 'vote':
        return <div className="text-center py-20 text-gray-400">POTM Vote — coming soon</div>;
      case 'leaderboard':
        return <div className="text-center py-20 text-gray-400">Leaderboard — coming soon</div>;
      case 'match-day':
        return <div className="text-center py-20 text-gray-400">Match Day — coming soon</div>;
      case 'gallery':
        return <div className="text-center py-20 text-gray-400">Gallery — coming soon</div>;
      default:
        return null;
    }
  };

  render() {
    const { activeTab } = this.state;

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

        {/* Sticky Tab Bar */}
        <div className="sticky top-16 z-20 bg-surface-dark/95 backdrop-blur-md border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => this.handleTabChange(tab.id)}
                    className={`
                      flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200
                      ${isActive
                        ? 'bg-accent-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                        : 'text-gray-400 hover:text-white hover:bg-surface-dark-hover'
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {this.renderTabContent()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user || null,
});

export default connect(mapStateToProps)(FanPortal);

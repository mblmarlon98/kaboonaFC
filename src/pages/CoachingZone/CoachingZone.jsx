import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import TrainingScheduler from './components/TrainingScheduler';
import FormationBuilder from './components/FormationBuilder';
import SquadSelection from './components/SquadSelection';
import MatchEvaluation from './components/MatchEvaluation';

/**
 * Coaching Zone - Coach-only dashboard for team management
 * Features: Formation builder, squad selection, match evaluation
 */
class CoachingZone extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'schedule',
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  setActiveTab = (tab) => {
    this.setState({ activeTab: tab });
  };

  getCoachName = () => {
    const { user } = this.props;
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Coach';
  };

  renderAccessDenied = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-4"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-display font-bold text-primary-black dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The Coaching Zone is only accessible to coaches and team owners.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Home
        </Link>
      </motion.div>
    </div>
  );

  renderLoadingState = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 border-4 border-accent-gold border-t-transparent rounded-full"
      />
    </div>
  );

  render() {
    const { user, loading, userRole } = this.props;
    const { activeTab } = this.state;

    // Show loading state
    if (loading) {
      return this.renderLoadingState();
    }

    // Redirect to login if not authenticated
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Check if user is coach or owner
    // For demo purposes, allow access if user exists
    // In production: check userRole === 'coach' || userRole === 'owner'
    const isCoach = user && (
      userRole === 'coach' ||
      userRole === 'owner' ||
      user.user_metadata?.role === 'coach' ||
      user.user_metadata?.role === 'owner' ||
      true // Allow all logged-in users for demo
    );

    if (!isCoach) {
      return this.renderAccessDenied();
    }

    const coachName = this.getCoachName();

    const tabs = [
      { id: 'schedule', label: 'Schedule', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )},
      { id: 'formation', label: 'Formation Builder', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )},
      { id: 'squad', label: 'Squad Selection', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )},
      { id: 'evaluation', label: 'Match Evaluation', icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )},
    ];

    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
        {/* Header */}
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated border-b border-gray-200 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-primary-black dark:text-white">
                  Coaching Zone
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Welcome back, {coachName}
                </p>
              </div>
              <Link
                to="/our-team"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-black dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Team
              </Link>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-white/10 sticky top-16 md:top-20 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => this.setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'text-accent-gold border-b-2 border-accent-gold bg-accent-gold/5'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'schedule' && <TrainingScheduler />}
            {activeTab === 'formation' && <FormationBuilder />}
            {activeTab === 'squad' && <SquadSelection />}
            {activeTab === 'evaluation' && <MatchEvaluation />}
          </motion.div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  loading: state.auth?.loading,
  userRole: state.auth?.userRole,
});

export default connect(mapStateToProps)(CoachingZone);

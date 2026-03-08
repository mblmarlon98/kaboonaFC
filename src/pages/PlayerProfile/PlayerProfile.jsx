import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PlayerFIFACard from '../../components/shared/PlayerFIFACard';
import { supabase } from '../../services/supabase';

/**
 * Public Player Profile page
 * Displays a player's FIFA card and stats
 * Shows edit button only if viewing own profile
 */
class PlayerProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      player: null,
      isLoading: true,
      error: null,
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.loadPlayer();
  }

  componentDidUpdate(prevProps) {
    // Reload if player ID changes
    if (this.getPlayerId() !== this.getPlayerId(prevProps)) {
      this.loadPlayer();
    }
  }

  getPlayerId = (props = this.props) => {
    // Get player ID from URL params
    const path = window.location.pathname;
    const match = path.match(/\/player\/(.+)/);
    return match ? match[1] : null;
  };

  loadPlayer = async () => {
    const playerId = this.getPlayerId();

    if (!playerId) {
      this.setState({ error: 'Player not found', isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;

      this.setState({
        player: data,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading player:', error);
      this.setState({
        error: 'Player not found',
        isLoading: false,
      });
    }
  };

  calculateOverall = (stats, position) => {
    if (!stats) return 70;
    if (position === 'GK') {
      const { diving = 70, handling = 70, kicking = 70, reflexes = 70, speed = 70, positioning = 70 } = stats;
      return Math.round((diving + handling + kicking + reflexes + speed + positioning) / 6);
    }
    const { pace = 70, shooting = 70, passing = 70, dribbling = 70, defending = 70, physical = 70 } = stats;
    return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
  };

  getStatConfig = (position) => {
    if (position === 'GK') {
      return [
        { label: 'Diving', key: 'diving' },
        { label: 'Handling', key: 'handling' },
        { label: 'Kicking', key: 'kicking' },
        { label: 'Reflexes', key: 'reflexes' },
        { label: 'Speed', key: 'speed' },
        { label: 'Positioning', key: 'positioning' },
      ];
    }
    return [
      { label: 'Pace', key: 'pace' },
      { label: 'Shooting', key: 'shooting' },
      { label: 'Passing', key: 'passing' },
      { label: 'Dribbling', key: 'dribbling' },
      { label: 'Defending', key: 'defending' },
      { label: 'Physical', key: 'physical' },
    ];
  };

  getStatColor = (value) => {
    if (value >= 90) return 'text-green-400';
    if (value >= 80) return 'text-lime-400';
    if (value >= 70) return 'text-yellow-400';
    if (value >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  getStatBarColor = (value) => {
    if (value >= 90) return 'bg-green-500';
    if (value >= 80) return 'bg-lime-500';
    if (value >= 70) return 'bg-yellow-500';
    if (value >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  render() {
    const { currentUser } = this.props;
    const { player, isLoading, error } = this.state;

    if (isLoading) {
      return (
        <div className="min-h-screen bg-surface-dark flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-accent-gold border-t-transparent rounded-full"
          />
        </div>
      );
    }

    if (error || !player) {
      return (
        <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl font-display font-bold text-white mb-4">Player Not Found</h1>
          <p className="text-gray-400 mb-6">The player you're looking for doesn't exist.</p>
          <Link
            to="/our-team"
            className="px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold/90 transition-colors"
          >
            View Our Team
          </Link>
        </div>
      );
    }

    const isOwnProfile = currentUser && (
      player.user_id === currentUser.id ||
      player.id === currentUser.id
    );

    const overall = this.calculateOverall(player.stats, player.position);
    const statConfig = this.getStatConfig(player.position);

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated to-surface-dark" />

          <div className="relative z-10 max-w-6xl mx-auto px-4">
            {/* Welcome Message - Only for own profile */}
            {isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">
                  Welcome back, {player.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-400">This is your player dashboard</p>
              </motion.div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Player Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-shrink-0 mx-auto lg:mx-0"
              >
                <PlayerFIFACard
                  player={player}
                  size="lg"
                  showStats={true}
                  showSkillsAndWF={true}
                />
              </motion.div>

              {/* Player Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-grow w-full"
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-5xl sm:text-6xl font-display font-bold text-accent-gold">
                      {overall}
                    </span>
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
                        {player.name}
                      </h2>
                      <p className="text-lg text-gray-400">
                        {player.position} | #{player.number}
                      </p>
                    </div>
                  </div>
                  {player.country && (
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={`https://flagcdn.com/w40/${player.country.toLowerCase()}.png`}
                        alt={player.country}
                        className="w-8 h-5 object-cover rounded"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className="text-gray-400">{player.countryName || player.country}</span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="bg-surface-dark-elevated rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-display text-accent-gold mb-4 uppercase tracking-wider">
                    Attributes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {statConfig.map((stat) => {
                      const value = player.stats?.[stat.key] || 70;
                      return (
                        <div key={stat.key} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">{stat.label}</span>
                            <span className={`text-lg font-bold ${this.getStatColor(value)}`}>
                              {value}
                            </span>
                          </div>
                          <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${value}%` }}
                              transition={{ delay: 0.5, duration: 0.5 }}
                              className={`h-full ${this.getStatBarColor(value)}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bio */}
                {player.bio && (
                  <div className="bg-surface-dark-elevated rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-display text-accent-gold mb-2 uppercase tracking-wider">
                      Biography
                    </h3>
                    <p className="text-gray-300 leading-relaxed">{player.bio}</p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {player.age && (
                    <div className="text-center p-4 bg-surface-dark-elevated rounded-lg">
                      <span className="block text-2xl font-display font-bold text-accent-gold">
                        {player.age}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">Age</span>
                    </div>
                  )}
                  {player.height && (
                    <div className="text-center p-4 bg-surface-dark-elevated rounded-lg">
                      <span className="block text-2xl font-display font-bold text-accent-gold">
                        {player.height}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">Height</span>
                    </div>
                  )}
                  {player.position && (
                    <div className="text-center p-4 bg-surface-dark-elevated rounded-lg">
                      <span className="block text-2xl font-display font-bold text-accent-gold">
                        {player.position}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">Position</span>
                    </div>
                  )}
                  {player.foot && (
                    <div className="text-center p-4 bg-surface-dark-elevated rounded-lg">
                      <span className="block text-2xl font-display font-bold text-accent-gold capitalize">
                        {player.foot}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">Foot</span>
                    </div>
                  )}
                </div>

                {/* Edit Profile Button - Only for own profile */}
                {isOwnProfile && (
                  <Link
                    to="/profile/edit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold/90 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  currentUser: state.auth?.user,
});

export default connect(mapStateToProps)(PlayerProfile);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerFIFACard from './PlayerFIFACard';

/**
 * Shared Player detail modal with full stats, bio, skill moves, weak foot, and streak progress
 * Mobile-optimized layout
 * Shows View Profile button for all players
 * Shows Edit Profile only if viewing own profile
 */
class PlayerModal extends Component {
  constructor(props) {
    super(props);
    this.modalRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    if (this.props.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.isOpen && !prevProps.isOpen) {
      document.body.style.overflow = 'hidden';
    } else if (!this.props.isOpen && prevProps.isOpen) {
      document.body.style.overflow = 'unset';
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = 'unset';
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      this.props.onClose();
    }
  };

  handleBackdropClick = (e) => {
    if (this.modalRef.current && !this.modalRef.current.contains(e.target)) {
      this.props.onClose();
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

  getStatConfig = () => {
    const { player } = this.props;
    if (player.position === 'GK') {
      return [
        { label: 'Diving', key: 'diving', icon: 'DIV' },
        { label: 'Handling', key: 'handling', icon: 'HAN' },
        { label: 'Kicking', key: 'kicking', icon: 'KIC' },
        { label: 'Reflexes', key: 'reflexes', icon: 'REF' },
        { label: 'Speed', key: 'speed', icon: 'SPD' },
        { label: 'Positioning', key: 'positioning', icon: 'POS' },
      ];
    }
    return [
      { label: 'Pace', key: 'pace', icon: 'PAC' },
      { label: 'Shooting', key: 'shooting', icon: 'SHO' },
      { label: 'Passing', key: 'passing', icon: 'PAS' },
      { label: 'Dribbling', key: 'dribbling', icon: 'DRI' },
      { label: 'Defending', key: 'defending', icon: 'DEF' },
      { label: 'Physical', key: 'physical', icon: 'PHY' },
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

  renderStarRating = (count, label) => {
    return (
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400 uppercase mb-1">{label}</span>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className={`w-4 h-4 ${i < count ? 'text-accent-gold' : 'text-gray-600'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>
    );
  };

  renderStreakProgress = () => {
    const { player } = this.props;
    const streak = player.streak || { current: 0, threshold: 5, recentIncrease: false };
    const overall = this.calculateOverall(player.stats, player.position);
    const threshold = streak.threshold || (overall >= 90 ? 10 : overall >= 85 ? 8 : overall >= 80 ? 7 : overall >= 75 ? 6 : 5);
    const progressPercent = Math.min((streak.current / threshold) * 100, 100);

    return (
      <div className="bg-surface-dark rounded-lg p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-display text-accent-gold uppercase tracking-wider">
            Performance Streak
          </h4>
          {streak.recentIncrease && (
            <span className="text-green-400 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Rating Up!
            </span>
          )}
        </div>

        <div className="relative h-3 bg-surface-dark-elevated rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              streak.current >= 3 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-accent-gold'
            }`}
          />
          {streak.current >= 3 && (
            <motion.span
              className="absolute right-1 top-1/2 -translate-y-1/2 text-xs"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
            >
              {'\uD83D\uDD25'}
            </motion.span>
          )}
        </div>

        <div className="flex justify-between text-xs text-gray-400">
          <span>{streak.current} good performances</span>
          <span>{threshold - streak.current} more to rating increase</span>
        </div>
      </div>
    );
  };

  render() {
    const { player, isOpen, onClose } = this.props;

    if (!player) return null;

    const overall = this.calculateOverall(player.stats, player.position);
    const statConfig = this.getStatConfig();
    const skillMoves = player.skill_moves || 3;
    const weakFoot = player.weak_foot || 3;

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={this.handleBackdropClick}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              ref={this.modalRef}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-4xl max-h-[95vh] overflow-y-auto bg-surface-dark-elevated rounded-xl sm:rounded-2xl border border-accent-gold/20"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-accent-gold hover:text-black transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Left Side - Player Card */}
                <div className="flex-shrink-0 p-4 sm:p-8 flex items-center justify-center bg-gradient-to-br from-surface-dark to-surface-dark-elevated">
                  <PlayerFIFACard
                    player={player}
                    size="lg"
                    showStats={!player.isOwner}
                    showSkillsAndWF={!player.isOwner}
                    isIcon={player.isOwner}
                  />
                </div>

                {/* Right Side - Details */}
                <div className="flex-grow p-4 sm:p-8">
                  {/* Header */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                      {!player.isOwner && (
                        <span className="text-4xl sm:text-5xl font-display font-bold text-accent-gold">
                          {overall}
                        </span>
                      )}
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                          {player.name}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-400">
                          {player.isOwner ? 'Team Owner' : `${player.position} | #${player.number}${player.foot ? ` | ${player.foot.charAt(0).toUpperCase() + player.foot.slice(1)} Foot` : ''}`}
                        </p>
                      </div>
                    </div>
                    {player.country && (
                      <div className="flex items-center gap-2 mt-2">
                        <img
                          src={`https://flagcdn.com/w40/${player.country.toLowerCase()}.png`}
                          alt={player.country}
                          className="w-6 sm:w-8 h-4 sm:h-5 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="text-sm text-gray-400">{player.countryName || player.country}</span>
                      </div>
                    )}
                  </div>

                  {/* Skill Moves & Weak Foot - Not shown for owners */}
                  {!player.isOwner && (
                    <div className="flex justify-around mb-4 sm:mb-6 p-3 sm:p-4 bg-surface-dark rounded-lg">
                      {this.renderStarRating(skillMoves, 'Skill Moves')}
                      <div className="w-px bg-gray-700" />
                      {this.renderStarRating(weakFoot, 'Weak Foot')}
                    </div>
                  )}

                  {/* Streak Progress - Not shown for owners */}
                  {!player.isOwner && player.streak && this.renderStreakProgress()}

                  {/* Stats Grid - Not shown for owners */}
                  {!player.isOwner && player.stats && (
                    <div className="mb-4 sm:mb-6 mt-4">
                      <h3 className="text-base sm:text-lg font-display text-accent-gold mb-3 sm:mb-4 uppercase tracking-wider">
                        Attributes
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {statConfig.map((stat) => {
                          const value = player.stats?.[stat.key] || 70;
                          return (
                            <div key={stat.key} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs sm:text-sm text-gray-400">{stat.label}</span>
                                <span className={`text-base sm:text-lg font-bold ${this.getStatColor(value)}`}>
                                  {value}
                                </span>
                              </div>
                              <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${value}%` }}
                                  transition={{ delay: 0.2, duration: 0.5 }}
                                  className={`h-full ${this.getStatBarColor(value)}`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Owner Role Description */}
                  {player.isOwner && (
                    <div className="mb-4 sm:mb-6 p-4 bg-surface-dark rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <svg className="w-6 h-6 text-accent-gold" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.5 19h19v2h-19v-2zm1.75-6.5l3.75 3.75L12 12l4 4.25 3.75-3.75L21 15l-1.5 3h-15L3 15l1.25-2.5zM12 2l4.5 7.5H7.5L12 2z" />
                        </svg>
                        <span className="text-lg font-display font-bold text-accent-gold">Team Owner</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Founder and owner of Kaboona FC
                      </p>
                    </div>
                  )}

                  {/* Bio */}
                  {player.bio && (
                    <div className="mb-4 sm:mb-6">
                      <h3 className="text-base sm:text-lg font-display text-accent-gold mb-2 uppercase tracking-wider">
                        Biography
                      </h3>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                        {player.bio}
                      </p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                    {player.position && (
                      <div className="text-center p-2 sm:p-3 bg-surface-dark rounded-lg">
                        <span className="block text-xl sm:text-2xl font-display font-bold text-accent-gold">
                          {player.position}
                        </span>
                        {player.alternate_positions && player.alternate_positions.length > 0 && (
                          <span className="block text-xs text-gray-500 mt-0.5">
                            {player.alternate_positions.join(', ')}
                          </span>
                        )}
                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase">Position</span>
                      </div>
                    )}
                    <div className="text-center p-2 sm:p-3 bg-surface-dark rounded-lg">
                      <span className="block text-xl sm:text-2xl font-display font-bold text-accent-gold">
                        {player.foot ? (player.foot.charAt(0).toUpperCase() + player.foot.slice(1)) : 'Right'}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase">Foot</span>
                    </div>
                    {player.height && (
                      <div className="text-center p-2 sm:p-3 bg-surface-dark rounded-lg">
                        <span className="block text-xl sm:text-2xl font-display font-bold text-accent-gold">
                          {player.height}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase">Height</span>
                      </div>
                    )}
                    {player.age && (
                      <div className="text-center p-2 sm:p-3 bg-surface-dark rounded-lg">
                        <span className="block text-xl sm:text-2xl font-display font-bold text-accent-gold">
                          {player.age}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase">Age</span>
                      </div>
                    )}
                  </div>

                  {/* Alumni Info */}
                  {player.yearsActive && (
                    <div className="mt-4 p-3 bg-surface-dark rounded-lg text-center">
                      <span className="text-gray-400 text-sm">Years Active: </span>
                      <span className="text-accent-gold font-display font-bold">{player.yearsActive}</span>
                    </div>
                  )}

                  {/* Profile Actions */}
                  {this.renderProfileActions()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  renderProfileActions = () => {
    const { player, currentUser, onClose } = this.props;

    // Check if this player is the currently logged in user
    const isOwnProfile = currentUser && player && (
      player.user_id === currentUser.id ||
      player.id === currentUser.id ||
      player.email === currentUser.email
    );

    // Don't show profile actions for placeholder players
    if (player?.isPlaceholder) return null;

    return (
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {/* View Profile Button - Always shown for real players/members */}
        <Link
          to={player.isOwner ? `/member/${player.id}` : `/player/${player.id}`}
          onClick={onClose}
          className="flex-1 py-3 px-6 bg-accent-gold text-black font-bold rounded-lg text-center hover:bg-accent-gold/90 transition-colors"
        >
          View Profile
        </Link>

        {/* Edit Profile - Only shown if it's the user's own profile */}
        {isOwnProfile && (
          <Link
            to="/profile/edit"
            onClick={onClose}
            className="flex-1 py-3 px-6 bg-surface-dark border border-accent-gold/50 text-accent-gold font-bold rounded-lg text-center hover:bg-accent-gold/10 transition-colors"
          >
            Edit Profile
          </Link>
        )}
      </div>
    );
  };
}

const mapStateToProps = (state) => ({
  currentUser: state.auth?.user,
});

export default connect(mapStateToProps)(PlayerModal);

import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from './PlayerCard';

/**
 * Player detail modal with full stats and bio
 */
class PlayerModal extends Component {
  constructor(props) {
    super(props);
    this.modalRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.body.style.overflow = 'hidden';
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

  calculateOverall = () => {
    const { player } = this.props;
    const { position } = player;

    if (position === 'GK') {
      const { diving, handling, kicking, reflexes, gk_speed, gk_positioning } = player.stats;
      return Math.round((diving + handling + kicking + reflexes + gk_speed + gk_positioning) / 6);
    } else {
      const { pace, shooting, passing, dribbling, defending, physical } = player.stats;
      return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
    }
  };

  getStatConfig = () => {
    const { player } = this.props;
    if (player.position === 'GK') {
      return [
        { label: 'Diving', key: 'diving', icon: 'DIV' },
        { label: 'Handling', key: 'handling', icon: 'HAN' },
        { label: 'Kicking', key: 'kicking', icon: 'KIC' },
        { label: 'Reflexes', key: 'reflexes', icon: 'REF' },
        { label: 'Speed', key: 'gk_speed', icon: 'SPD' },
        { label: 'Positioning', key: 'gk_positioning', icon: 'POS' },
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

  render() {
    const { player, isOpen, onClose } = this.props;

    if (!player) return null;

    const overall = this.calculateOverall();
    const statConfig = this.getStatConfig();

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              className="relative w-full max-w-4xl bg-surface-dark-elevated rounded-2xl overflow-hidden border border-accent-gold/20"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-accent-gold hover:text-black transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col md:flex-row">
                {/* Left Side - Player Card */}
                <div className="flex-shrink-0 p-8 flex items-center justify-center bg-gradient-to-br from-surface-dark to-surface-dark-elevated">
                  <PlayerCard player={player} size="large" />
                </div>

                {/* Right Side - Details */}
                <div className="flex-grow p-8">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-5xl font-display font-bold text-accent-gold">
                        {overall}
                      </span>
                      <div>
                        <h2 className="text-3xl font-display font-bold text-white">
                          {player.name}
                        </h2>
                        <p className="text-gray-400">
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
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <span className="text-gray-400">{player.countryName || player.country}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="mb-6">
                    <h3 className="text-lg font-display text-accent-gold mb-4 uppercase tracking-wider">
                      Attributes
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {statConfig.map((stat) => {
                        const value = player.stats[stat.key];
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
                                transition={{ delay: 0.2, duration: 0.5 }}
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
                    <div className="mb-6">
                      <h3 className="text-lg font-display text-accent-gold mb-2 uppercase tracking-wider">
                        Biography
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {player.bio}
                      </p>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {player.age && (
                      <div className="text-center p-3 bg-surface-dark rounded-lg">
                        <span className="block text-2xl font-display font-bold text-accent-gold">
                          {player.age}
                        </span>
                        <span className="text-xs text-gray-400 uppercase">Age</span>
                      </div>
                    )}
                    {player.height && (
                      <div className="text-center p-3 bg-surface-dark rounded-lg">
                        <span className="block text-2xl font-display font-bold text-accent-gold">
                          {player.height}
                        </span>
                        <span className="text-xs text-gray-400 uppercase">Height</span>
                      </div>
                    )}
                    {player.weight && (
                      <div className="text-center p-3 bg-surface-dark rounded-lg">
                        <span className="block text-2xl font-display font-bold text-accent-gold">
                          {player.weight}
                        </span>
                        <span className="text-xs text-gray-400 uppercase">Weight</span>
                      </div>
                    )}
                    {player.foot && (
                      <div className="text-center p-3 bg-surface-dark rounded-lg">
                        <span className="block text-2xl font-display font-bold text-accent-gold capitalize">
                          {player.foot}
                        </span>
                        <span className="text-xs text-gray-400 uppercase">Foot</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
}

export default PlayerModal;

import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Large FIFA Ultimate Team style player card for Profile page
 * Features action photo background, overall rating, position badge, 6 stats
 */
class PlayerFIFACard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
    };
  }

  calculateOverall = () => {
    const { stats, position } = this.props;

    if (position === 'GK') {
      const { diving, handling, kicking, reflexes, speed, positioning } = stats;
      return Math.round((diving + handling + kicking + reflexes + speed + positioning) / 6);
    } else {
      const { pace, shooting, passing, dribbling, defending, physical } = stats;
      return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
    }
  };

  getStatLabels = () => {
    const { position } = this.props;
    if (position === 'GK') {
      return ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'];
    }
    return ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  };

  getStatValues = () => {
    const { stats, position } = this.props;
    if (position === 'GK') {
      const { diving, handling, kicking, reflexes, speed, positioning } = stats;
      return [diving, handling, kicking, reflexes, speed, positioning];
    }
    const { pace, shooting, passing, dribbling, defending, physical } = stats;
    return [pace, shooting, passing, dribbling, defending, physical];
  };

  getStatColor = (value) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  render() {
    const {
      name = 'Player Name',
      position = 'ST',
      number = 10,
      country = 'gb',
      image = null,
      className = '',
    } = this.props;
    const { isHovered } = this.state;
    const overall = this.calculateOverall();
    const statLabels = this.getStatLabels();
    const statValues = this.getStatValues();

    return (
      <motion.div
        className={`relative w-72 h-[420px] ${className}`}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Card Background with Gold Gradient Border */}
        <div
          className={`absolute inset-0 rounded-xl transition-all duration-500 ${
            isHovered
              ? 'shadow-[0_0_60px_rgba(212,175,55,0.8)]'
              : 'shadow-[0_0_30px_rgba(212,175,55,0.4)]'
          }`}
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8972E 50%, #D4AF37 100%)',
            padding: '3px',
          }}
        >
          <div
            className="w-full h-full rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
            }}
          >
            {/* Player Image Background */}
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="w-full h-full object-cover object-top opacity-50"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-surface-dark-elevated to-surface-dark flex items-center justify-center">
                  <span className="text-accent-gold/20 text-9xl font-display">
                    {number}
                  </span>
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            </div>

            {/* Card Content */}
            <div className="relative h-full flex flex-col p-4">
              {/* Top Section - Rating & Position */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center">
                  <motion.span
                    className="text-6xl font-display font-bold text-accent-gold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    {overall}
                  </motion.span>
                  <span className="text-lg font-bold text-white tracking-wider mt-1">
                    {position}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {/* Country Flag */}
                  {country && (
                    <div className="w-10 h-7 overflow-hidden rounded-sm shadow-md">
                      <img
                        src={`https://flagcdn.com/w80/${country.toLowerCase()}.png`}
                        alt={country}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {/* Jersey Number */}
                  <span className="text-3xl font-display font-bold text-accent-gold">
                    #{number}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-grow" />

              {/* Player Name */}
              <div className="text-center mb-4">
                <motion.h2
                  className="text-2xl font-display font-bold text-white uppercase tracking-widest"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {name}
                </motion.h2>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-accent-gold to-transparent mb-4" />

              {/* Stats Grid - 2 columns */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {statLabels.map((label, index) => (
                  <motion.div
                    key={label}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <span className="text-sm text-accent-gold font-bold tracking-wide">
                      {label}
                    </span>
                    <span className={`text-lg font-bold ${this.getStatColor(statValues[index])}`}>
                      {statValues[index]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Animated Glow Ring */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: 'transparent',
              boxShadow: '0 0 80px 20px rgba(212, 175, 55, 0.3)',
            }}
          />
        )}
      </motion.div>
    );
  }
}

export default PlayerFIFACard;

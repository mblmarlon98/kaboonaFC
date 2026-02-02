import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * FIFA Ultimate Team style player card
 * Features action photo background, overall rating, position badge, 6 stats
 */
class PlayerCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
    };
  }

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

  getStatLabels = () => {
    const { player } = this.props;
    if (player.position === 'GK') {
      return ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'];
    }
    return ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  };

  getStatValues = () => {
    const { player } = this.props;
    if (player.position === 'GK') {
      const { diving, handling, kicking, reflexes, gk_speed, gk_positioning } = player.stats;
      return [diving, handling, kicking, reflexes, gk_speed, gk_positioning];
    }
    const { pace, shooting, passing, dribbling, defending, physical } = player.stats;
    return [pace, shooting, passing, dribbling, defending, physical];
  };

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  render() {
    const { player, onClick, size = 'normal', className = '' } = this.props;
    const { isHovered } = this.state;
    const overall = this.calculateOverall();
    const statLabels = this.getStatLabels();
    const statValues = this.getStatValues();

    // Size variants
    const sizeClasses = {
      small: 'w-24 h-36',
      normal: 'w-40 h-56',
      large: 'w-56 h-80',
    };

    const fontSizes = {
      small: {
        overall: 'text-xl',
        position: 'text-[8px]',
        name: 'text-[8px]',
        stat: 'text-[6px]',
        number: 'text-sm',
      },
      normal: {
        overall: 'text-3xl',
        position: 'text-xs',
        name: 'text-xs',
        stat: 'text-[8px]',
        number: 'text-lg',
      },
      large: {
        overall: 'text-5xl',
        position: 'text-sm',
        name: 'text-base',
        stat: 'text-xs',
        number: 'text-2xl',
      },
    };

    const fonts = fontSizes[size];

    return (
      <motion.div
        className={`relative cursor-pointer ${sizeClasses[size]} ${className}`}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onClick={() => onClick && onClick(player)}
        whileHover={{ scale: 1.05, y: -5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Card Background with Gold Gradient Border */}
        <div
          className={`absolute inset-0 rounded-lg transition-all duration-300 ${
            isHovered
              ? 'shadow-[0_0_30px_rgba(212,175,55,0.6)]'
              : 'shadow-[0_0_15px_rgba(212,175,55,0.2)]'
          }`}
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8972E 50%, #D4AF37 100%)',
            padding: '2px',
          }}
        >
          <div
            className="w-full h-full rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
            }}
          >
            {/* Player Image Background */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              {player.image ? (
                <img
                  src={player.image}
                  alt={player.name}
                  className="w-full h-full object-cover object-top opacity-40"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-surface-dark-elevated to-surface-dark flex items-center justify-center">
                  <span className="text-accent-gold/20 text-6xl font-display">
                    {player.number}
                  </span>
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Card Content */}
            <div className="relative h-full flex flex-col p-2">
              {/* Top Section - Rating & Position */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center">
                  <span className={`${fonts.overall} font-display font-bold text-accent-gold`}>
                    {overall}
                  </span>
                  <span className={`${fonts.position} font-bold text-white tracking-wider`}>
                    {player.position}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {/* Country Flag */}
                  {player.country && (
                    <div className={`${size === 'small' ? 'w-4 h-3' : 'w-6 h-4'} overflow-hidden rounded-sm`}>
                      <img
                        src={`https://flagcdn.com/w40/${player.country.toLowerCase()}.png`}
                        alt={player.country}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {/* Jersey Number */}
                  <span className={`${fonts.number} font-display font-bold text-accent-gold`}>
                    #{player.number}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-grow" />

              {/* Player Name */}
              <div className="text-center mb-1">
                <h3 className={`${fonts.name} font-display font-bold text-white uppercase tracking-wider truncate`}>
                  {player.name}
                </h3>
              </div>

              {/* Stats Grid - 2 columns */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                {statLabels.map((label, index) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className={`${fonts.stat} text-accent-gold font-bold`}>
                      {label}
                    </span>
                    <span className={`${fonts.stat} text-white font-semibold`}>
                      {statValues[index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
}

export default PlayerCard;

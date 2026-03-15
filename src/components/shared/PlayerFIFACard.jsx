import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { PlayerModalContext } from './PlayerModalContext';

/**
 * Reusable FIFA Ultimate Team style player card
 * Supports multiple sizes: 'sm', 'md', 'lg'
 * Supports player prop (object) OR individual props
 * Automatically opens player modal on click when no onClick prop is provided
 */
class PlayerFIFACard extends Component {
  static contextType = PlayerModalContext;
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
    };
  }

  // Get prop value, checking player object first then direct props
  getProp = (key, defaultValue) => {
    const { player } = this.props;
    if (player && player[key] !== undefined) return player[key];
    if (this.props[key] !== undefined) return this.props[key];
    return defaultValue;
  };

  calculateOverall = () => {
    const stats = this.getProp('stats', null);
    const position = this.getProp('position', 'ST');
    const overall = this.getProp('overall', null);

    // If overall is directly provided, use it
    if (overall) return overall;

    // Otherwise calculate from stats
    if (!stats) return 70;

    if (position === 'GK') {
      const { diving = 70, handling = 70, kicking = 70, reflexes = 70, speed = 70, positioning = 70 } = stats;
      return Math.round((diving + handling + kicking + reflexes + speed + positioning) / 6);
    } else {
      const { pace = 70, shooting = 70, passing = 70, dribbling = 70, defending = 70, physical = 70 } = stats;
      return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
    }
  };

  getStatLabels = () => {
    const position = this.getProp('position', 'ST');
    if (position === 'GK') {
      return ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'];
    }
    return ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  };

  getStatValues = () => {
    const stats = this.getProp('stats', null);
    const position = this.getProp('position', 'ST');
    if (!stats) return [70, 70, 70, 70, 70, 70];

    if (position === 'GK') {
      const { diving = 70, handling = 70, kicking = 70, reflexes = 70, speed = 70, positioning = 70 } = stats;
      return [diving, handling, kicking, reflexes, speed, positioning];
    }
    const { pace = 70, shooting = 70, passing = 70, dribbling = 70, defending = 70, physical = 70 } = stats;
    return [pace, shooting, passing, dribbling, defending, physical];
  };

  renderStarRating = (count, maxStars = 5) => {
    const tier = this.getTier(this.calculateOverall());
    const tierColors = this.getTierColors(tier);

    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => (
          <svg
            key={i}
            className={`w-2 h-2 ${i < count ? '' : 'opacity-30'}`}
            style={{ color: tierColors.accent }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  getStatColor = (value) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  getTier = (overall, isIcon = false) => {
    if (isIcon) return 'icon';
    if (overall >= 75) return 'gold';
    if (overall >= 64) return 'silver';
    return 'bronze';
  };

  getTierColors = (tier) => {
    const colors = {
      gold: {
        gradient: 'linear-gradient(135deg, #D4AF37 0%, #B8972E 50%, #D4AF37 100%)',
        text: 'text-yellow-400',
        glow: 'rgba(212, 175, 55, 0.8)',
        glowLight: 'rgba(212, 175, 55, 0.4)',
        accent: '#D4AF37',
      },
      silver: {
        gradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 50%, #C0C0C0 100%)',
        text: 'text-gray-300',
        glow: 'rgba(192, 192, 192, 0.8)',
        glowLight: 'rgba(192, 192, 192, 0.4)',
        accent: '#C0C0C0',
      },
      bronze: {
        gradient: 'linear-gradient(135deg, #CD7F32 0%, #A56729 50%, #CD7F32 100%)',
        text: 'text-amber-600',
        glow: 'rgba(205, 127, 50, 0.8)',
        glowLight: 'rgba(205, 127, 50, 0.4)',
        accent: '#CD7F32',
      },
      icon: {
        gradient: 'linear-gradient(135deg, #F5F5DC 0%, #E8E4C9 25%, #FFFEF0 50%, #E8E4C9 75%, #F5F5DC 100%)',
        text: 'text-amber-100',
        glow: 'rgba(255, 254, 240, 0.8)',
        glowLight: 'rgba(255, 254, 240, 0.5)',
        accent: '#E8E4C9',
      },
    };
    return colors[tier] || colors.gold;
  };

  getSizeClasses = () => {
    const { size = 'lg' } = this.props;
    const sizes = {
      xs: {
        container: 'w-14 h-20 md:w-16 md:h-24',
        overall: 'text-[10px] md:text-xs',
        position: 'text-[8px] md:text-[10px]',
        number: 'text-[8px]',
        name: 'text-[7px] md:text-[9px]',
        flag: 'w-5 h-3 md:w-6 md:h-4',
        statLabel: 'text-[6px]',
        statValue: 'text-[7px]',
        padding: 'p-1',
        gap: 'gap-0',
      },
      sm: {
        container: 'w-40 h-56',
        overall: 'text-3xl',
        position: 'text-xs',
        number: 'text-lg',
        name: 'text-sm',
        flag: 'w-6 h-4',
        statLabel: 'text-[10px]',
        statValue: 'text-xs',
        padding: 'p-2',
        gap: 'gap-y-1 gap-x-3',
      },
      md: {
        container: 'w-56 h-80',
        overall: 'text-5xl',
        position: 'text-sm',
        number: 'text-2xl',
        name: 'text-lg',
        flag: 'w-8 h-5',
        statLabel: 'text-xs',
        statValue: 'text-sm',
        padding: 'p-3',
        gap: 'gap-y-1 gap-x-4',
      },
      lg: {
        container: 'w-72 h-[420px]',
        overall: 'text-6xl',
        position: 'text-lg',
        number: 'text-3xl',
        name: 'text-2xl',
        flag: 'w-10 h-7',
        statLabel: 'text-sm',
        statValue: 'text-lg',
        padding: 'p-4',
        gap: 'gap-y-2 gap-x-6',
      },
    };
    return sizes[size] || sizes.lg;
  };

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  handleCardClick = () => {
    const { onClick, player } = this.props;
    const playerData = player || this.props;

    // If onClick prop is provided, use it
    if (onClick) {
      onClick(playerData);
      return;
    }

    // Otherwise, use the global modal context
    const { openPlayerModal } = this.context || {};
    if (openPlayerModal && playerData) {
      openPlayerModal(playerData);
    }
  };

  renderIconPattern = () => {
    // FIFA Icon card decorative swirl pattern
    return (
      <svg
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
        viewBox="0 0 100 140"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8E4C9" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D4CEB8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E8E4C9" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {/* Decorative swirls */}
        <path
          d="M-10,70 Q30,30 50,70 T110,70"
          fill="none"
          stroke="url(#iconGradient)"
          strokeWidth="0.5"
        />
        <path
          d="M-10,80 Q30,40 50,80 T110,80"
          fill="none"
          stroke="url(#iconGradient)"
          strokeWidth="0.3"
        />
        <path
          d="M-10,60 Q30,20 50,60 T110,60"
          fill="none"
          stroke="url(#iconGradient)"
          strokeWidth="0.3"
        />
        {/* Corner flourishes */}
        <circle cx="10" cy="10" r="8" fill="none" stroke="url(#iconGradient)" strokeWidth="0.3" />
        <circle cx="90" cy="10" r="8" fill="none" stroke="url(#iconGradient)" strokeWidth="0.3" />
        <circle cx="10" cy="130" r="8" fill="none" stroke="url(#iconGradient)" strokeWidth="0.3" />
        <circle cx="90" cy="130" r="8" fill="none" stroke="url(#iconGradient)" strokeWidth="0.3" />
      </svg>
    );
  };

  render() {
    const { className = '', onClick, player, isIcon = false } = this.props;

    // Get props from either player object or direct props
    const name = this.getProp('name', 'Player Name');
    const mainPosition = this.getProp('position', 'ST');
    const alternatePositions = this.getProp('alternate_positions', []) || [];
    const activePosition = this.props.activePosition; // When placed in formation on alternate position
    const number = this.getProp('number', 10);
    const country = this.getProp('country', 'gb');
    const image = this.getProp('image', null);
    const size = this.props.size || 'lg';
    const showStats = this.props.showStats !== false;
    const badge = this.props.badge || null;
    const skillMoves = this.getProp('skill_moves', 3);
    const weakFoot = this.getProp('weak_foot', 3);
    const streak = this.getProp('streak', { current: 0, recentIncrease: false });
    const showSkillsAndWF = this.props.showSkillsAndWF !== false;
    const chemistry = this.props.chemistry; // undefined, or number 1-10

    // Determine display position - activePosition overrides if set
    const displayPosition = activePosition || mainPosition;
    // For display: if activePosition is set and different from main, show main in alternates
    const displayAlternates = activePosition && activePosition !== mainPosition
      ? [mainPosition, ...alternatePositions.filter(p => p !== activePosition)]
      : alternatePositions;
    // Use original position for stats calculation (GK vs outfield)
    const position = mainPosition;

    const { isHovered } = this.state;
    const overall = this.calculateOverall();
    const statLabels = this.getStatLabels();
    const statValues = this.getStatValues();
    const tier = this.getTier(overall, isIcon);
    const tierColors = this.getTierColors(tier);
    const sizeClasses = this.getSizeClasses();

    // Streak indicators (not shown for icons)
    const hasActiveStreak = !isIcon && streak && streak.current >= 3;
    const hasRecentIncrease = !isIcon && streak && streak.recentIncrease;
    const isXsSize = size === 'xs';

    // Simplified render for xs size (formation view)
    if (isXsSize) {
      const isClickable = onClick || this.context?.openPlayerModal;
      return (
        <motion.div
          className={`relative ${sizeClasses.container} ${className} ${isClickable ? 'cursor-pointer' : ''}`}
          onClick={this.handleCardClick}
          whileHover={{ scale: 1.1, y: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Chemistry Indicator - centered on top */}
          {chemistry !== undefined && (
            <div
              className={`absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-lg ${
                chemistry >= 7 ? 'bg-green-500' : chemistry >= 4 ? 'bg-orange-500' : 'bg-red-500'
              }`}
            >
              <span className="text-[8px] md:text-[10px] font-bold text-white">{chemistry}</span>
            </div>
          )}

          {/* Card */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{
              background: tierColors.gradient,
              padding: '1px',
            }}
          >
            <div
              className="w-full h-full rounded-lg overflow-hidden relative"
              style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)' }}
            >
              {/* Number as background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl md:text-4xl font-display font-bold text-white/10">
                  {number}
                </span>
              </div>

              {/* Content */}
              <div className="relative h-full flex flex-col justify-between p-1">
                {/* Position */}
                <div className="flex flex-col items-start">
                  <span
                    className="text-[8px] md:text-[10px] font-bold"
                    style={{ color: tierColors.accent }}
                  >
                    {displayPosition}
                  </span>
                  {displayAlternates.length > 0 && (
                    <div className="flex flex-col">
                      {displayAlternates.slice(0, 2).map((altPos, idx) => (
                        <span
                          key={idx}
                          className="text-[6px] md:text-[7px] text-gray-500"
                        >
                          {altPos}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Country flag */}
                <div className="flex justify-center flex-shrink-0">
                  {country && (
                    <img
                      src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
                      alt={country}
                      className="w-5 h-3 md:w-6 md:h-4 object-cover rounded-sm shadow flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>

                {/* Name */}
                <div className="text-center">
                  <span className="text-[7px] md:text-[9px] font-bold text-white uppercase tracking-tight truncate block">
                    {name.split(' ').pop()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Jersey number badge */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-bold text-white border border-white/20">
            #{number}
          </div>
        </motion.div>
      );
    }

    const isClickable = onClick || this.context?.openPlayerModal;
    return (
      <motion.div
        className={`relative ${sizeClasses.container} ${className} ${isClickable ? 'cursor-pointer' : ''}`}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onClick={this.handleCardClick}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Badge (e.g., "Top Scorer", "Clean Sheet") */}
        {badge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-accent-gold text-black text-xs font-bold rounded-full whitespace-nowrap">
            {badge}
          </div>
        )}

        {/* Chemistry Indicator (for formation view) */}
        {chemistry !== undefined && (
          <div
            className={`absolute -top-1 -right-1 z-20 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shadow-lg ${
              chemistry >= 7 ? 'bg-green-500' : chemistry >= 4 ? 'bg-orange-500' : 'bg-red-500'
            }`}
          >
            <span className="text-[8px] md:text-[10px] font-bold text-white">{chemistry}</span>
          </div>
        )}

        {/* Streak Indicator (top-right) */}
        {(hasRecentIncrease || hasActiveStreak) && (
          <div className="absolute top-2 right-2 z-20">
            {hasRecentIncrease ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-green-400"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </motion.div>
            ) : (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="text-orange-500 text-lg"
              >
                🔥
              </motion.span>
            )}
          </div>
        )}

        {/* Card Background with Tier Gradient Border */}
        <div
          className="absolute inset-0 rounded-xl transition-all duration-500"
          style={{
            background: tierColors.gradient,
            padding: '2px',
            boxShadow: isHovered
              ? `0 0 40px ${tierColors.glow}`
              : `0 0 20px ${tierColors.glowLight}`,
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
                  className="w-full h-full object-cover object-top opacity-70"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-surface-dark-elevated to-surface-dark flex items-center justify-center">
                  <span className="font-display opacity-20" style={{ color: tierColors.accent, fontSize: size === 'sm' ? '4rem' : size === 'md' ? '6rem' : '8rem' }}>
                    {number}
                  </span>
                </div>
              )}
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              {/* Icon Pattern for Legends */}
              {isIcon && this.renderIconPattern()}
            </div>

            {/* Icon Badge (top-right for legend cards) */}
            {isIcon && (
              <div className="absolute top-2 right-2 z-20">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Card Content */}
            <div className={`relative h-full flex flex-col ${sizeClasses.padding}`}>
              {/* Top Section - Rating & Position */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center">
                  <motion.span
                    className={`${sizeClasses.overall} font-display font-bold`}
                    style={{ color: tierColors.accent }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    {overall}
                  </motion.span>
                  <span className={`${sizeClasses.position} font-bold text-white tracking-wider`}>
                    {displayPosition}
                  </span>
                  {/* Alternate Positions */}
                  {displayAlternates.length > 0 && (
                    <div className="flex flex-col items-center mt-0.5">
                      {displayAlternates.slice(0, 3).map((altPos, idx) => (
                        <span
                          key={idx}
                          className="text-[8px] sm:text-[9px] text-gray-500 font-medium leading-tight"
                        >
                          {altPos}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  {/* Country Flag */}
                  {country && (
                    <div className={`${sizeClasses.flag} overflow-hidden rounded-sm shadow-md flex-shrink-0`}>
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
                  <span className={`${sizeClasses.number} font-display font-bold`} style={{ color: tierColors.accent }}>
                    #{number}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-grow" />

              {/* Player Name */}
              <div className="text-center mb-2">
                <motion.h2
                  className={`${sizeClasses.name} font-display font-bold text-white uppercase tracking-wider`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {name}
                </motion.h2>
              </div>

              {/* Stats Section */}
              {showStats && (
                <>
                  {/* Divider */}
                  <div
                    className="w-full h-px mb-2"
                    style={{ background: `linear-gradient(to right, transparent, ${tierColors.accent}, transparent)` }}
                  />

                  {/* Stats Grid - 2 columns */}
                  <div className={`grid grid-cols-2 ${sizeClasses.gap}`}>
                    {statLabels.map((label, index) => (
                      <motion.div
                        key={label}
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, x: index % 2 === 0 ? -10 : 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.03 }}
                      >
                        <span className={`${sizeClasses.statLabel} font-bold tracking-wide text-white/50`}>
                          {label}
                        </span>
                        <span className={`${sizeClasses.statValue} font-bold ${this.getStatColor(statValues[index])}`}>
                          {statValues[index]}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}

              {/* Skill Moves & Weak Foot */}
              {showSkillsAndWF && (
                <div
                  className="flex justify-between items-center mt-2 pt-2"
                  style={{ borderTop: `1px solid ${tierColors.accent}33` }}
                >
                  <div className="flex flex-col items-center">
                    <span className={`${sizeClasses.statLabel} font-bold text-white/50`}>SM</span>
                    {this.renderStarRating(skillMoves)}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`${sizeClasses.statLabel} font-bold text-white/50`}>WF</span>
                    {this.renderStarRating(weakFoot)}
                  </div>
                </div>
              )}
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
              boxShadow: `0 0 60px 15px ${tierColors.glowLight}`,
            }}
          />
        )}
      </motion.div>
    );
  }
}

export default PlayerFIFACard;

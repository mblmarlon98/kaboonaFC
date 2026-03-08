/**
 * Card tier utilities for FIFA-style player cards
 * Tiers: Bronze (55-63), Silver (64-74), Gold (75-99), Icon (Legends)
 */

export const CARD_TIERS = {
  BRONZE: { min: 55, max: 63, name: 'Bronze' },
  SILVER: { min: 64, max: 74, name: 'Silver' },
  GOLD: { min: 75, max: 99, name: 'Gold' },
  ICON: { min: 0, max: 99, name: 'Icon' }, // Special tier for legends
};

/**
 * Determine card tier based on overall rating
 * @param {number} overall - Player's overall rating
 * @returns {'gold' | 'silver' | 'bronze'}
 */
export const getCardTier = (overall) => {
  if (overall >= CARD_TIERS.GOLD.min) return 'gold';
  if (overall >= CARD_TIERS.SILVER.min) return 'silver';
  return 'bronze';
};

/**
 * Get Tailwind gradient classes for card background based on tier
 * @param {'gold' | 'silver' | 'bronze' | 'icon'} tier
 * @returns {string} Tailwind gradient classes
 */
export const getCardGradient = (tier) => {
  const gradients = {
    bronze: 'from-amber-700 via-amber-600 to-amber-800',
    silver: 'from-slate-400 via-slate-300 to-slate-500',
    gold: 'from-yellow-500 via-yellow-400 to-yellow-600',
    icon: 'from-neutral-900 via-neutral-800 to-neutral-900', // Dark prestigious look
  };
  return gradients[tier] || gradients.bronze;
};

/**
 * Get border color class for card based on tier
 * @param {'gold' | 'silver' | 'bronze' | 'icon'} tier
 * @returns {string} Tailwind border color class
 */
export const getCardBorderColor = (tier) => {
  const borders = {
    bronze: 'border-amber-900',
    silver: 'border-slate-600',
    gold: 'border-yellow-700',
    icon: 'border-amber-500', // Gold border for icons
  };
  return borders[tier] || borders.bronze;
};

/**
 * Get text color class for card based on tier
 * @param {'gold' | 'silver' | 'bronze' | 'icon'} tier
 * @returns {string} Tailwind text color class
 */
export const getCardTextColor = (tier) => {
  const colors = {
    bronze: 'text-amber-950',
    silver: 'text-slate-800',
    gold: 'text-yellow-900',
    icon: 'text-amber-400', // Gold text on dark background
  };
  return colors[tier] || colors.bronze;
};

/**
 * Get accent color class for highlights based on tier
 * @param {'gold' | 'silver' | 'bronze' | 'icon'} tier
 * @returns {string} Tailwind text color class
 */
export const getCardAccentColor = (tier) => {
  const colors = {
    bronze: 'text-amber-200',
    silver: 'text-slate-100',
    gold: 'text-yellow-200',
    icon: 'text-amber-300', // Lighter gold accent
  };
  return colors[tier] || colors.bronze;
};

/**
 * Get number of consecutive good performances needed for rating increase
 * Higher rated players need more games to increase
 * @param {number} overall - Player's current overall rating
 * @returns {number} Number of games needed
 */
export const getStreakThreshold = (overall) => {
  if (overall >= 90) return 10;
  if (overall >= 85) return 8;
  if (overall >= 80) return 7;
  if (overall >= 75) return 6;
  return 5;
};

/**
 * Generate star array for skill moves or weak foot display
 * @param {number} count - Number of filled stars (1-5)
 * @param {number} maxStars - Maximum stars to display (default 5)
 * @returns {Array<{filled: boolean, index: number}>}
 */
export const renderStars = (count, maxStars = 5) => {
  return Array.from({ length: maxStars }, (_, i) => ({
    filled: i < count,
    index: i,
  }));
};

/**
 * Calculate overall rating from player stats
 * @param {Object} stats - Player stats object
 * @param {string} position - Player position (for GK special handling)
 * @returns {number} Calculated overall rating
 */
export const calculateOverall = (stats, position) => {
  if (!stats) return 50;

  if (position === 'GK') {
    const { diving = 50, handling = 50, kicking = 50, reflexes = 50, gk_speed = 50, gk_positioning = 50 } = stats;
    return Math.round((diving + handling + kicking + reflexes + gk_speed + gk_positioning) / 6);
  }

  const { pace = 50, shooting = 50, passing = 50, dribbling = 50, defending = 50, physical = 50 } = stats;
  return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
};

/**
 * Get stat abbreviations for display on cards
 * @param {string} position - Player position
 * @returns {Array<{key: string, abbr: string, label: string}>}
 */
export const getStatAbbreviations = (position) => {
  if (position === 'GK') {
    return [
      { key: 'diving', abbr: 'DIV', label: 'Diving' },
      { key: 'handling', abbr: 'HAN', label: 'Handling' },
      { key: 'kicking', abbr: 'KIC', label: 'Kicking' },
      { key: 'reflexes', abbr: 'REF', label: 'Reflexes' },
      { key: 'gk_speed', abbr: 'SPD', label: 'Speed' },
      { key: 'gk_positioning', abbr: 'POS', label: 'Positioning' },
    ];
  }

  return [
    { key: 'pace', abbr: 'PAC', label: 'Pace' },
    { key: 'shooting', abbr: 'SHO', label: 'Shooting' },
    { key: 'passing', abbr: 'PAS', label: 'Passing' },
    { key: 'dribbling', abbr: 'DRI', label: 'Dribbling' },
    { key: 'defending', abbr: 'DEF', label: 'Defending' },
    { key: 'physical', abbr: 'PHY', label: 'Physical' },
  ];
};

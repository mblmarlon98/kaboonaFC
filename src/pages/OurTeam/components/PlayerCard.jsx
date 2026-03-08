import React from 'react';
import PlayerFIFACard from '../../../components/shared/PlayerFIFACard';

/**
 * Wrapper for OurTeam page that maps size prop and player object
 * to the shared PlayerFIFACard component
 */
const PlayerCard = ({ player, onClick, size = 'normal', className = '', isIcon = false }) => {
  // Map OurTeam size names to shared component sizes
  const sizeMap = {
    small: 'sm',
    normal: 'md',
    large: 'lg',
  };

  return (
    <PlayerFIFACard
      player={player}
      onClick={onClick}
      size={sizeMap[size] || 'md'}
      className={className}
      showStats={size !== 'small'}
      showSkillsAndWF={size !== 'small'}
      isIcon={isIcon}
    />
  );
};

export default PlayerCard;

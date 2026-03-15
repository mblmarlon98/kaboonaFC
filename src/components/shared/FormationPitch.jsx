import React, { Component } from 'react';
import { motion } from 'framer-motion';
import PlayerFIFACard from './PlayerFIFACard';

/**
 * Formation configurations with x,y percentages for each position
 */
const FORMATIONS = {
  '4-4-2': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    LM: { x: 15, y: 45 },
    CM1: { x: 35, y: 50 },
    CM2: { x: 65, y: 50 },
    RM: { x: 85, y: 45 },
    ST1: { x: 35, y: 20 },
    ST2: { x: 65, y: 20 },
  },
  '4-3-3': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    CM1: { x: 30, y: 50 },
    CM: { x: 50, y: 50 },
    CM2: { x: 70, y: 50 },
    LW: { x: 15, y: 20 },
    ST: { x: 50, y: 15 },
    RW: { x: 85, y: 20 },
  },
  '4-3-3 Attack': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    CDM: { x: 50, y: 55 },
    CM1: { x: 30, y: 42 },
    CM2: { x: 70, y: 42 },
    LW: { x: 15, y: 20 },
    ST: { x: 50, y: 15 },
    RW: { x: 85, y: 20 },
  },
  '4-2-3-1': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    CDM1: { x: 35, y: 55 },
    CDM2: { x: 65, y: 55 },
    LM: { x: 15, y: 35 },
    CAM: { x: 50, y: 35 },
    RM: { x: 85, y: 35 },
    ST: { x: 50, y: 15 },
  },
  '4-1-4-1': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    CDM: { x: 50, y: 55 },
    LM: { x: 15, y: 40 },
    CM1: { x: 38, y: 40 },
    CM2: { x: 62, y: 40 },
    RM: { x: 85, y: 40 },
    ST: { x: 50, y: 15 },
  },
  '4-5-1': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    LM: { x: 15, y: 45 },
    CM1: { x: 32, y: 48 },
    CM: { x: 50, y: 45 },
    CM2: { x: 68, y: 48 },
    RM: { x: 85, y: 45 },
    ST: { x: 50, y: 15 },
  },
  '4-4-1-1': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    LM: { x: 15, y: 46 },
    CM1: { x: 38, y: 48 },
    CM2: { x: 62, y: 48 },
    RM: { x: 85, y: 46 },
    CAM: { x: 50, y: 30 },
    ST: { x: 50, y: 14 },
  },
  '3-5-2': {
    GK: { x: 50, y: 90 },
    CB1: { x: 25, y: 75 },
    CB2: { x: 50, y: 78 },
    CB3: { x: 75, y: 75 },
    LWB: { x: 10, y: 50 },
    CM1: { x: 30, y: 50 },
    CDM: { x: 50, y: 55 },
    CM2: { x: 70, y: 50 },
    RWB: { x: 90, y: 50 },
    ST1: { x: 35, y: 20 },
    ST2: { x: 65, y: 20 },
  },
  '3-4-3': {
    GK: { x: 50, y: 90 },
    CB1: { x: 25, y: 75 },
    CB2: { x: 50, y: 78 },
    CB3: { x: 75, y: 75 },
    LM: { x: 15, y: 46 },
    CM1: { x: 38, y: 50 },
    CM2: { x: 62, y: 50 },
    RM: { x: 85, y: 46 },
    LW: { x: 22, y: 20 },
    ST: { x: 50, y: 16 },
    RW: { x: 78, y: 20 },
  },
  '5-3-2': {
    GK: { x: 50, y: 90 },
    LWB: { x: 10, y: 65 },
    CB1: { x: 28, y: 72 },
    CB2: { x: 50, y: 74 },
    CB3: { x: 72, y: 72 },
    RWB: { x: 90, y: 65 },
    CM1: { x: 30, y: 46 },
    CM: { x: 50, y: 46 },
    CM2: { x: 70, y: 46 },
    ST1: { x: 38, y: 18 },
    ST2: { x: 62, y: 18 },
  },
  '5-4-1': {
    GK: { x: 50, y: 90 },
    LWB: { x: 10, y: 65 },
    CB1: { x: 28, y: 72 },
    CB2: { x: 50, y: 74 },
    CB3: { x: 72, y: 72 },
    RWB: { x: 90, y: 65 },
    LM: { x: 18, y: 44 },
    CM1: { x: 40, y: 46 },
    CM2: { x: 60, y: 46 },
    RM: { x: 82, y: 44 },
    ST: { x: 50, y: 16 },
  },
  '4-3-2-1': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    CM1: { x: 30, y: 50 },
    CM: { x: 50, y: 50 },
    CM2: { x: 70, y: 50 },
    CAM1: { x: 35, y: 32 },
    CAM2: { x: 65, y: 32 },
    ST: { x: 50, y: 14 },
  },
  '4-1-2-1-2': {
    GK: { x: 50, y: 90 },
    LB: { x: 15, y: 70 },
    CB1: { x: 35, y: 75 },
    CB2: { x: 65, y: 75 },
    RB: { x: 85, y: 70 },
    CDM: { x: 50, y: 58 },
    CM1: { x: 30, y: 44 },
    CM2: { x: 70, y: 44 },
    CAM: { x: 50, y: 32 },
    ST1: { x: 38, y: 16 },
    ST2: { x: 62, y: 16 },
  },
};

/**
 * Map slot names to valid positions for that slot
 */
const SLOT_POSITIONS = {
  GK: ['GK'],
  LB: ['LB', 'LWB'],
  CB1: ['CB'], CB2: ['CB'], CB3: ['CB'],
  RB: ['RB', 'RWB'],
  LWB: ['LWB', 'LB', 'LM'],
  RWB: ['RWB', 'RB', 'RM'],
  CDM: ['CDM', 'CM'], CDM1: ['CDM', 'CM'], CDM2: ['CDM', 'CM'],
  CM: ['CM', 'CDM', 'CAM'], CM1: ['CM', 'CDM', 'CAM'], CM2: ['CM', 'CDM', 'CAM'],
  LM: ['LM', 'LW', 'CM'],
  RM: ['RM', 'RW', 'CM'],
  CAM: ['CAM', 'CM', 'CF'], CAM1: ['CAM', 'CM', 'LW'], CAM2: ['CAM', 'CM', 'RW'],
  LW: ['LW', 'LM', 'ST'],
  RW: ['RW', 'RM', 'ST'],
  ST: ['ST', 'CF', 'CAM'],
  ST1: ['ST', 'CF'], ST2: ['ST', 'CF'],
};

const getSlotDisplayPosition = (slotName) => slotName.replace(/[0-9]/g, '');

// Card dimensions for position offset calculation (matches PlayerFIFACard xs size on desktop)
const CARD_WIDTH = 64; // md:w-16 = 64px
const CARD_HEIGHT = 96; // md:h-24 = 96px

/**
 * FormationPitch - Displays a football pitch with draggable/droppable player positions
 */
class FormationPitch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dragOverSlot: null,
    };
    this.pitchRef = React.createRef();
  }

  isPlayerCompatible = (player, slotName) => {
    if (!player) return false;
    const validPositions = SLOT_POSITIONS[slotName] || [getSlotDisplayPosition(slotName)];
    const playerPositions = [player.position, ...(player.alternate_positions || [])];
    return validPositions.some(pos => playerPositions.includes(pos));
  };

  getActivePosition = (player, slotName) => {
    if (!player) return null;
    const validPositions = SLOT_POSITIONS[slotName] || [getSlotDisplayPosition(slotName)];
    const playerPositions = [player.position, ...(player.alternate_positions || [])];

    for (const validPos of validPositions) {
      if (playerPositions.includes(validPos)) {
        if (player.position === validPos) return null;
        return validPos;
      }
    }
    return getSlotDisplayPosition(slotName);
  };

  handleDragOver = (e, slotName) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.setState({ dragOverSlot: slotName });
  };

  handleDragLeave = (e) => {
    const relatedTarget = e.relatedTarget;
    if (!e.currentTarget.contains(relatedTarget)) {
      this.setState({ dragOverSlot: null });
    }
  };

  handleDrop = (e, slotName) => {
    e.preventDefault();
    const { onPlayerPlaced, players } = this.props;

    let draggedPlayer = this.props.draggedPlayer;

    if (!draggedPlayer && players) {
      const playerId = e.dataTransfer.getData('playerId');
      if (playerId) {
        draggedPlayer = players.find(p => p.id === playerId);
      }
    }

    if (draggedPlayer) {
      const activePosition = this.getActivePosition(draggedPlayer, slotName);
      onPlayerPlaced?.(slotName, draggedPlayer, activePosition);
    }

    this.setState({ dragOverSlot: null });
  };

  handleRemovePlayer = (e, slotName) => {
    e.stopPropagation();
    const { onPlayerRemoved } = this.props;
    onPlayerRemoved?.(slotName);
  };

  handleSlotClick = (slotName) => {
    const { onSlotClick } = this.props;
    onSlotClick?.(slotName);
  };

  renderPositionSlot = (slotName, position, pitchWidth, pitchHeight) => {
    const { placedPlayers, readOnly, draggedPlayer } = this.props;
    const { dragOverSlot } = this.state;

    const placedPlayer = placedPlayers?.[slotName];
    const hasDraggedPlayer = !!draggedPlayer;
    const isDragOver = dragOverSlot === slotName;
    const displayPosition = getSlotDisplayPosition(slotName);
    const isCompatible = placedPlayer ? this.isPlayerCompatible(placedPlayer.player, slotName) : true;

    // Calculate position with offset (center the card on the position)
    const halfCardWidth = CARD_WIDTH / 2;
    const halfCardHeight = CARD_HEIGHT / 2;

    // Convert percentage to pixels and subtract half card size
    const leftPx = (position.x / 100) * pitchWidth - halfCardWidth;
    const topPx = (position.y / 100) * pitchHeight - halfCardHeight;

    return (
      <motion.div
        key={slotName}
        className="absolute"
        style={{
          left: `${leftPx}px`,
          top: `${topPx}px`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        {placedPlayer ? (
          <div
            className="relative cursor-pointer group"
            onClick={() => this.handleSlotClick(slotName)}
          >
            <PlayerFIFACard
              player={placedPlayer.player}
              activePosition={placedPlayer.activePosition}
              size="xs"
              showStats={false}
              showSkillsAndWF={false}
            />
            {isCompatible ? (
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center z-10">
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10">
                <span className="text-white text-[10px] font-bold">✕</span>
              </div>
            )}
            {!readOnly && (
              <button
                onClick={(e) => this.handleRemovePlayer(e, slotName)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center z-10 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div
            className={`
              w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 border-dashed
              flex flex-col items-center justify-center
              transition-all duration-200 cursor-pointer
              ${isDragOver
                ? 'border-green-400 bg-green-400/30 scale-110'
                : hasDraggedPlayer
                  ? 'border-accent-gold/50 bg-accent-gold/20'
                  : 'border-white/30 bg-black/30 hover:border-accent-gold/50 active:scale-95'
              }
            `}
            onClick={() => this.handleSlotClick(slotName)}
            onDragOver={(e) => !readOnly && this.handleDragOver(e, slotName)}
            onDragLeave={(e) => !readOnly && this.handleDragLeave(e)}
            onDrop={(e) => !readOnly && this.handleDrop(e, slotName)}
          >
            <span className={`text-[10px] font-bold ${isDragOver ? 'text-green-400' : 'text-white/60'}`}>
              {displayPosition}
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  render() {
    const { formation = '4-4-2', className = '' } = this.props;
    const formationConfig = FORMATIONS[formation] || FORMATIONS['4-4-2'];

    // Get pitch dimensions for position calculations
    const pitchWidth = this.pitchRef.current?.offsetWidth || 300;
    const pitchHeight = this.pitchRef.current?.offsetHeight || 400;

    return (
      <div className={`relative ${className}`}>
        {/* Football Pitch */}
        <div
          ref={this.pitchRef}
          className="relative w-full aspect-[3/4]"
        >
          {/* Pitch Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-800 to-green-900 rounded-xl overflow-hidden">
            {/* Pitch Markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="none">
              <rect x="5" y="5" width="90" height="123" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              <line x1="5" y1="66.5" x2="95" y2="66.5" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              <circle cx="50" cy="66.5" r="12" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              <circle cx="50" cy="66.5" r="1" fill="white" fillOpacity="0.4" />
              <rect x="20" y="5" width="60" height="22" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              <rect x="32" y="5" width="36" height="8" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              <circle cx="50" cy="18" r="1" fill="white" fillOpacity="0.4" />
              <rect x="20" y="106" width="60" height="22" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              <rect x="32" y="120" width="36" height="8" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              <circle cx="50" cy="115" r="1" fill="white" fillOpacity="0.4" />
            </svg>
          </div>

          {/* Position Slots */}
          {Object.entries(formationConfig).map(([slotName, position]) =>
            this.renderPositionSlot(slotName, position, pitchWidth, pitchHeight)
          )}
        </div>
      </div>
    );
  }

  componentDidMount() {
    // Force re-render after mount to get correct pitch dimensions
    this.forceUpdate();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.forceUpdate();
  };
}

export default FormationPitch;

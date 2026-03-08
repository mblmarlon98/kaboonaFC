import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { connect } from 'react-redux';
import PlayerFIFACard from '../../../components/shared/PlayerFIFACard';
import PlayerBench from '../../../components/shared/PlayerBench';

/**
 * Position compatibility map for chemistry
 * Maps slot positions to compatible player positions
 */
const POSITION_COMPATIBILITY = {
  GK: ['GK'],
  LB: ['LB', 'LWB'],
  'CB-L': ['CB'],
  'CB-R': ['CB'],
  CB: ['CB'],
  RB: ['RB', 'RWB'],
  LWB: ['LWB', 'LB', 'LM'],
  RWB: ['RWB', 'RB', 'RM'],
  LM: ['LM', 'LW', 'LWB'],
  'CM-L': ['CM', 'CDM', 'CAM'],
  'CM-R': ['CM', 'CDM', 'CAM'],
  CM: ['CM', 'CDM', 'CAM'],
  CDM: ['CDM', 'CM'],
  'CDM-L': ['CDM', 'CM'],
  'CDM-R': ['CDM', 'CM'],
  CAM: ['CAM', 'CM', 'CF'],
  'CAM-L': ['CAM', 'CM', 'LM', 'LW'],
  'CAM-R': ['CAM', 'CM', 'RM', 'RW'],
  RM: ['RM', 'RW', 'RWB'],
  LW: ['LW', 'LM', 'ST'],
  RW: ['RW', 'RM', 'ST'],
  'ST-L': ['ST', 'CF', 'LW'],
  'ST-R': ['ST', 'CF', 'RW'],
  ST: ['ST', 'CF'],
};

/**
 * Formation configurations with position coordinates
 */
const FORMATIONS = {
  '4-4-2': {
    name: '4-4-2',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      LM: { top: '44%', left: '14%' },
      'CM-L': { top: '46%', left: '35%' },
      'CM-R': { top: '46%', left: '65%' },
      RM: { top: '44%', left: '86%' },
      'ST-L': { top: '18%', left: '40%' },
      'ST-R': { top: '18%', left: '60%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'LM', 'CM-L', 'CM-R', 'RM', 'ST-L', 'ST-R'],
  },
  '4-3-3': {
    name: '4-3-3',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      'CM-L': { top: '46%', left: '30%' },
      CM: { top: '46%', left: '50%' },
      'CM-R': { top: '46%', left: '70%' },
      LW: { top: '20%', left: '18%' },
      ST: { top: '16%', left: '50%' },
      RW: { top: '20%', left: '82%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'CM-L', 'CM', 'CM-R', 'LW', 'ST', 'RW'],
  },
  '4-3-3 Attack': {
    name: '4-3-3 Attack',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      CDM: { top: '55%', left: '50%' },
      'CM-L': { top: '42%', left: '30%' },
      'CM-R': { top: '42%', left: '70%' },
      LW: { top: '20%', left: '18%' },
      ST: { top: '16%', left: '50%' },
      RW: { top: '20%', left: '82%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'CDM', 'CM-L', 'CM-R', 'LW', 'ST', 'RW'],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      'CDM-L': { top: '54%', left: '40%' },
      'CDM-R': { top: '54%', left: '60%' },
      LM: { top: '34%', left: '18%' },
      CAM: { top: '34%', left: '50%' },
      RM: { top: '34%', left: '82%' },
      ST: { top: '14%', left: '50%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'CDM-L', 'CDM-R', 'LM', 'CAM', 'RM', 'ST'],
  },
  '4-1-4-1': {
    name: '4-1-4-1',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      CDM: { top: '55%', left: '50%' },
      LM: { top: '40%', left: '14%' },
      'CM-L': { top: '40%', left: '38%' },
      'CM-R': { top: '40%', left: '62%' },
      RM: { top: '40%', left: '86%' },
      ST: { top: '16%', left: '50%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'CDM', 'LM', 'CM-L', 'CM-R', 'RM', 'ST'],
  },
  '4-5-1': {
    name: '4-5-1',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      LM: { top: '44%', left: '14%' },
      'CM-L': { top: '48%', left: '32%' },
      CM: { top: '44%', left: '50%' },
      'CM-R': { top: '48%', left: '68%' },
      RM: { top: '44%', left: '86%' },
      ST: { top: '16%', left: '50%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'LM', 'CM-L', 'CM', 'CM-R', 'RM', 'ST'],
  },
  '4-4-1-1': {
    name: '4-4-1-1',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      LM: { top: '46%', left: '14%' },
      'CM-L': { top: '48%', left: '38%' },
      'CM-R': { top: '48%', left: '62%' },
      RM: { top: '46%', left: '86%' },
      CAM: { top: '30%', left: '50%' },
      ST: { top: '14%', left: '50%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'LM', 'CM-L', 'CM-R', 'RM', 'CAM', 'ST'],
  },
  '3-5-2': {
    name: '3-5-2',
    positions: {
      GK: { top: '87%', left: '50%' },
      'CB-L': { top: '70%', left: '30%' },
      CB: { top: '70%', left: '50%' },
      'CB-R': { top: '70%', left: '70%' },
      LWB: { top: '48%', left: '12%' },
      'CM-L': { top: '48%', left: '32%' },
      CM: { top: '46%', left: '50%' },
      'CM-R': { top: '48%', left: '68%' },
      RWB: { top: '48%', left: '88%' },
      'ST-L': { top: '18%', left: '40%' },
      'ST-R': { top: '18%', left: '60%' },
    },
    slots: ['GK', 'CB-L', 'CB', 'CB-R', 'LWB', 'CM-L', 'CM', 'CM-R', 'RWB', 'ST-L', 'ST-R'],
  },
  '3-4-3': {
    name: '3-4-3',
    positions: {
      GK: { top: '87%', left: '50%' },
      'CB-L': { top: '70%', left: '30%' },
      CB: { top: '70%', left: '50%' },
      'CB-R': { top: '70%', left: '70%' },
      LM: { top: '46%', left: '15%' },
      'CM-L': { top: '48%', left: '38%' },
      'CM-R': { top: '48%', left: '62%' },
      RM: { top: '46%', left: '85%' },
      LW: { top: '20%', left: '22%' },
      ST: { top: '16%', left: '50%' },
      RW: { top: '20%', left: '78%' },
    },
    slots: ['GK', 'CB-L', 'CB', 'CB-R', 'LM', 'CM-L', 'CM-R', 'RM', 'LW', 'ST', 'RW'],
  },
  '5-3-2': {
    name: '5-3-2',
    positions: {
      GK: { top: '87%', left: '50%' },
      LWB: { top: '65%', left: '10%' },
      'CB-L': { top: '72%', left: '28%' },
      CB: { top: '74%', left: '50%' },
      'CB-R': { top: '72%', left: '72%' },
      RWB: { top: '65%', left: '90%' },
      'CM-L': { top: '46%', left: '30%' },
      CM: { top: '46%', left: '50%' },
      'CM-R': { top: '46%', left: '70%' },
      'ST-L': { top: '18%', left: '40%' },
      'ST-R': { top: '18%', left: '60%' },
    },
    slots: ['GK', 'LWB', 'CB-L', 'CB', 'CB-R', 'RWB', 'CM-L', 'CM', 'CM-R', 'ST-L', 'ST-R'],
  },
  '5-4-1': {
    name: '5-4-1',
    positions: {
      GK: { top: '87%', left: '50%' },
      LWB: { top: '65%', left: '10%' },
      'CB-L': { top: '72%', left: '28%' },
      CB: { top: '74%', left: '50%' },
      'CB-R': { top: '72%', left: '72%' },
      RWB: { top: '65%', left: '90%' },
      LM: { top: '44%', left: '18%' },
      'CM-L': { top: '46%', left: '40%' },
      'CM-R': { top: '46%', left: '60%' },
      RM: { top: '44%', left: '82%' },
      ST: { top: '16%', left: '50%' },
    },
    slots: ['GK', 'LWB', 'CB-L', 'CB', 'CB-R', 'RWB', 'LM', 'CM-L', 'CM-R', 'RM', 'ST'],
  },
  '4-3-2-1': {
    name: '4-3-2-1',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      'CM-L': { top: '50%', left: '30%' },
      CM: { top: '50%', left: '50%' },
      'CM-R': { top: '50%', left: '70%' },
      'CAM-L': { top: '32%', left: '35%' },
      'CAM-R': { top: '32%', left: '65%' },
      ST: { top: '14%', left: '50%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'CM-L', 'CM', 'CM-R', 'CAM-L', 'CAM-R', 'ST'],
  },
  '4-1-2-1-2': {
    name: '4-1-2-1-2',
    positions: {
      GK: { top: '87%', left: '50%' },
      LB: { top: '68%', left: '14%' },
      'CB-L': { top: '70%', left: '35%' },
      'CB-R': { top: '70%', left: '65%' },
      RB: { top: '68%', left: '86%' },
      CDM: { top: '58%', left: '50%' },
      'CM-L': { top: '44%', left: '30%' },
      'CM-R': { top: '44%', left: '70%' },
      CAM: { top: '32%', left: '50%' },
      'ST-L': { top: '16%', left: '38%' },
      'ST-R': { top: '16%', left: '62%' },
    },
    slots: ['GK', 'LB', 'CB-L', 'CB-R', 'RB', 'CDM', 'CM-L', 'CM-R', 'CAM', 'ST-L', 'ST-R'],
  },
};

/**
 * Empty position slot
 */
const EmptySlot = ({ position }) => (
  <div className="w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center bg-black/20">
    <span className="text-white/40 text-xs font-bold">{position}</span>
  </div>
);

/**
 * Interactive football field with formations
 * Shows one player per position with chemistry indicators
 * Supports drag and drop in edit mode (for coaches)
 */
class FootballField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFormation: '4-4-2',
      placedPlayers: {}, // Manual placements: { slotKey: { player, isCompatible } }
      draggedPlayer: null,
      dragSourceSlot: null, // Track which slot the drag started from
      dragOverSlot: null,
      initialized: false,
      // Mobile player selection
      selectingForSlot: null, // Which slot is being filled
      showAllPlayers: false, // Show all players vs just suggestions
    };
  }

  componentDidMount() {
    this.initializePlacedPlayers();
  }

  componentDidUpdate(prevProps) {
    // Re-initialize if players change
    if (prevProps.players !== this.props.players && this.props.players.length > 0) {
      this.initializePlacedPlayers();
    }
  }

  initializePlacedPlayers = () => {
    const { players } = this.props;
    const { selectedFormation } = this.state;

    if (players && players.length > 0) {
      const autoMapped = this.mapPlayersToFormation(players, selectedFormation);
      this.setState({ placedPlayers: autoMapped, initialized: true });
    }
  };

  // Check if player is compatible with a slot
  isPlayerCompatible = (player, slotKey) => {
    if (!player) return false;
    const compatiblePositions = POSITION_COMPATIBILITY[slotKey] || [];
    const playerPositions = [player.position, ...(player.alternate_positions || [])];
    return compatiblePositions.some(pos => playerPositions.includes(pos));
  };

  // Get active position override if player is playing out of main position
  getActivePosition = (player, slotKey) => {
    if (!player) return null;
    const compatiblePositions = POSITION_COMPATIBILITY[slotKey] || [];
    const playerPositions = [player.position, ...(player.alternate_positions || [])];

    for (const validPos of compatiblePositions) {
      if (playerPositions.includes(validPos)) {
        if (player.position === validPos) return null;
        return validPos;
      }
    }
    // If not compatible at all, show the slot's position
    return this.getDisplayPosition(slotKey);
  };

  // Map players to formation slots - one player per slot (auto mode)
  mapPlayersToFormation = (players, formation) => {
    const config = FORMATIONS[formation];
    const positionMap = {};
    const usedPlayers = new Set();

    config.slots.forEach(slot => {
      positionMap[slot] = null;
    });

    // First pass: exact matches
    config.slots.forEach(slot => {
      const compatiblePositions = POSITION_COMPATIBILITY[slot] || [];
      const exactMatch = players.find(p =>
        !usedPlayers.has(p.id) &&
        compatiblePositions[0] === p.position
      );

      if (exactMatch) {
        positionMap[slot] = { player: exactMatch, isCompatible: true };
        usedPlayers.add(exactMatch.id);
      }
    });

    // Second pass: compatible players
    config.slots.forEach(slot => {
      if (positionMap[slot]) return;
      const compatiblePositions = POSITION_COMPATIBILITY[slot] || [];
      const compatibleMatch = players.find(p =>
        !usedPlayers.has(p.id) &&
        compatiblePositions.includes(p.position)
      );

      if (compatibleMatch) {
        positionMap[slot] = { player: compatibleMatch, isCompatible: true };
        usedPlayers.add(compatibleMatch.id);
      }
    });

    // Third pass: any available player
    config.slots.forEach(slot => {
      if (positionMap[slot]) return;
      const anyPlayer = players.find(p => !usedPlayers.has(p.id));

      if (anyPlayer) {
        const isCompatible = this.isPlayerCompatible(anyPlayer, slot);
        positionMap[slot] = { player: anyPlayer, isCompatible };
        usedPlayers.add(anyPlayer.id);
      }
    });

    return positionMap;
  };

  getDisplayPosition = (slotKey) => {
    const displayMap = {
      GK: 'GK', LB: 'LB', 'CB-L': 'CB', 'CB-R': 'CB', CB: 'CB', RB: 'RB',
      LWB: 'LWB', RWB: 'RWB', LM: 'LM', 'CM-L': 'CM', 'CM-R': 'CM', CM: 'CM',
      CDM: 'CDM', 'CDM-L': 'CDM', 'CDM-R': 'CDM',
      CAM: 'CAM', 'CAM-L': 'CAM', 'CAM-R': 'CAM',
      RM: 'RM', LW: 'LW', RW: 'RW',
      'ST-L': 'ST', 'ST-R': 'ST', ST: 'ST',
    };
    return displayMap[slotKey] || slotKey;
  };

  handleFormationChange = (formation) => {
    const { players } = this.props;
    const autoMapped = this.mapPlayersToFormation(players, formation);
    this.setState({
      selectedFormation: formation,
      placedPlayers: autoMapped,
    });
  };

  // Drag from bench
  handleDragStartFromBench = (player) => {
    this.setState({
      draggedPlayer: player,
      dragSourceSlot: null,
    });
  };

  // Drag from existing slot on field
  handleDragStartFromSlot = (e, player, slotKey) => {
    e.dataTransfer.setData('playerId', player.id);
    e.dataTransfer.effectAllowed = 'move';
    this.setState({
      draggedPlayer: player,
      dragSourceSlot: slotKey,
    });
  };

  handleDragEnd = () => {
    this.setState({
      draggedPlayer: null,
      dragSourceSlot: null,
      dragOverSlot: null,
    });
  };

  handleDragOver = (e, slotKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.setState({ dragOverSlot: slotKey });
  };

  handleDragLeave = () => {
    this.setState({ dragOverSlot: null });
  };

  handleDrop = (e, slotKey) => {
    e.preventDefault();
    const { draggedPlayer, dragSourceSlot, placedPlayers } = this.state;

    if (draggedPlayer) {
      const isCompatible = this.isPlayerCompatible(draggedPlayer, slotKey);

      this.setState(prevState => {
        const newPlacedPlayers = { ...prevState.placedPlayers };

        // If dragged from another slot, remove from source
        if (dragSourceSlot && dragSourceSlot !== slotKey) {
          delete newPlacedPlayers[dragSourceSlot];
        }

        // Place in new slot
        newPlacedPlayers[slotKey] = {
          player: draggedPlayer,
          isCompatible,
        };

        return {
          placedPlayers: newPlacedPlayers,
          draggedPlayer: null,
          dragSourceSlot: null,
          dragOverSlot: null,
        };
      });
    }
  };

  handleRemovePlayer = (slotKey) => {
    this.setState(prevState => {
      const newPlacedPlayers = { ...prevState.placedPlayers };
      delete newPlacedPlayers[slotKey];
      return { placedPlayers: newPlacedPlayers };
    });
  };

  getPlacedPlayerIds = () => {
    const { placedPlayers } = this.state;
    return Object.values(placedPlayers).filter(Boolean).map(data => data.player.id);
  };

  // Mobile: Open player selection for a slot
  handleSlotClick = (slotKey) => {
    this.setState({
      selectingForSlot: slotKey,
      showAllPlayers: false,
    });
  };

  // Mobile: Select a player for the current slot
  handleSelectPlayer = (player) => {
    const { selectingForSlot } = this.state;
    if (!selectingForSlot) return;

    const isCompatible = this.isPlayerCompatible(player, selectingForSlot);

    this.setState(prevState => ({
      placedPlayers: {
        ...prevState.placedPlayers,
        [selectingForSlot]: { player, isCompatible },
      },
      selectingForSlot: null,
      showAllPlayers: false,
    }));
  };

  // Mobile: Close player selection modal
  handleCloseSelection = () => {
    this.setState({
      selectingForSlot: null,
      showAllPlayers: false,
    });
  };

  // Get suggested players for a slot (compatible positions)
  getSuggestedPlayers = (slotKey) => {
    const { players } = this.props;
    const placedIds = this.getPlacedPlayerIds();

    return players.filter(player => {
      if (placedIds.includes(player.id)) return false;
      return this.isPlayerCompatible(player, slotKey);
    });
  };

  // Get all available (unplaced) players
  getAvailablePlayers = () => {
    const { players } = this.props;
    const placedIds = this.getPlacedPlayerIds();
    return players.filter(player => !placedIds.includes(player.id));
  };

  renderPositionSlot = (slotKey, autoSlotData, coords, isEditMode) => {
    const { placedPlayers, dragOverSlot } = this.state;
    const displayPos = this.getDisplayPosition(slotKey);

    // In edit mode, use placedPlayers; in view mode, use auto-mapped
    const slotData = isEditMode ? placedPlayers[slotKey] : autoSlotData;
    const isDragOver = dragOverSlot === slotKey;

    return (
      <motion.div
        key={slotKey}
        className="absolute"
        style={{
          top: coords.top,
          left: coords.left,
        }}
        initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        transition={{ duration: 0.3 }}
      >
        {slotData ? (
          <div
            className="relative cursor-pointer"
            draggable={isEditMode}
            onDragStart={(e) => isEditMode && this.handleDragStartFromSlot(e, slotData.player, slotKey)}
            onDragEnd={this.handleDragEnd}
            onDragOver={(e) => isEditMode && this.handleDragOver(e, slotKey)}
            onDrop={(e) => isEditMode && this.handleDrop(e, slotKey)}
            onClick={() => this.handleSlotClick(slotKey)}
          >
            <PlayerFIFACard
              player={slotData.player}
              activePosition={this.getActivePosition(slotData.player, slotKey)}
              size="xs"
              showStats={false}
              showSkillsAndWF={false}
            />
            {/* Red X for incompatible position */}
            {!slotData.isCompatible && (
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-10">
                <span className="text-white text-xs font-bold">✕</span>
              </div>
            )}
            {/* Remove button - always visible */}
            {isEditMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  this.handleRemovePlayer(slotKey);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center z-10 shadow-md"
              >
                ×
              </button>
            )}
            {/* Drag indicator overlay */}
            {isDragOver && isEditMode && (
              <div className="absolute inset-0 bg-green-400/30 rounded-lg border-2 border-green-400" />
            )}
          </div>
        ) : isEditMode ? (
          <div
            className={`w-14 h-20 md:w-16 md:h-24 rounded-lg border-2 border-dashed flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isDragOver
                ? 'border-green-400 bg-green-400/30 scale-110'
                : 'border-accent-gold/50 bg-accent-gold/20 hover:border-accent-gold active:scale-95'
            }`}
            onClick={() => this.handleSlotClick(slotKey)}
            onDragOver={(e) => this.handleDragOver(e, slotKey)}
            onDragLeave={this.handleDragLeave}
            onDrop={(e) => this.handleDrop(e, slotKey)}
          >
            <span className={`text-xs font-bold ${isDragOver ? 'text-green-400' : 'text-accent-gold/70'}`}>
              {displayPos}
            </span>
          </div>
        ) : (
          <EmptySlot position={displayPos} />
        )}
      </motion.div>
    );
  };

  // Render player selection modal for mobile
  renderPlayerSelectionModal = () => {
    const { selectingForSlot, showAllPlayers, placedPlayers } = this.state;
    if (!selectingForSlot) return null;

    const displayPos = this.getDisplayPosition(selectingForSlot);
    const suggestedPlayers = this.getSuggestedPlayers(selectingForSlot);
    const allAvailable = this.getAvailablePlayers();
    const currentPlayer = placedPlayers[selectingForSlot]?.player;

    const playersToShow = showAllPlayers ? allAvailable : suggestedPlayers;

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-dark-elevated rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Select Player</h3>
              <p className="text-sm text-gray-400">Position: {displayPos}</p>
            </div>
            <button
              onClick={this.handleCloseSelection}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              ×
            </button>
          </div>

          {/* Current player (if any) */}
          {currentPlayer && (
            <div className="p-3 border-b border-white/10 bg-white/5">
              <p className="text-xs text-gray-400 mb-2">Current Player</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold font-bold text-xs">
                    {currentPlayer.position}
                  </div>
                  <span className="text-white font-medium">{currentPlayer.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleRemovePlayer(selectingForSlot);
                    this.handleCloseSelection();
                  }}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Toggle buttons */}
          <div className="p-3 flex gap-2">
            <button
              onClick={() => this.setState({ showAllPlayers: false })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                !showAllPlayers
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Suggested ({suggestedPlayers.length})
            </button>
            <button
              onClick={() => this.setState({ showAllPlayers: true })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                showAllPlayers
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              All Players ({allAvailable.length})
            </button>
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {playersToShow.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                {showAllPlayers ? 'All players are on the field' : 'No suggested players available'}
              </p>
            ) : (
              playersToShow.map(player => {
                const isCompatible = this.isPlayerCompatible(player, selectingForSlot);
                return (
                  <button
                    key={player.id}
                    onClick={() => this.handleSelectPlayer(player)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isCompatible ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {player.position}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{player.name}</p>
                      <p className="text-xs text-gray-400">#{player.number}</p>
                    </div>
                    {!isCompatible && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                        Out of position
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  render() {
    const { players } = this.props;
    const { selectedFormation, placedPlayers } = this.state;
    const currentFormation = FORMATIONS[selectedFormation];

    // Calculate stats from placed players
    const filledSlots = Object.values(placedPlayers).filter(Boolean);
    const compatibleCount = filledSlots.filter(slot => slot.isCompatible).length;
    const incompatibleCount = filledSlots.filter(slot => !slot.isCompatible).length;
    const placedCount = filledSlots.length;

    return (
      <section className="py-12 px-4 relative overflow-hidden bg-surface-dark">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
            Formation
          </h2>

          {/* Formation Selector - Compact Grid */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4 max-w-md mx-auto">
            {Object.keys(FORMATIONS).map((formation) => (
              <motion.button
                key={formation}
                onClick={() => this.handleFormationChange(formation)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  selectedFormation === formation
                    ? 'bg-accent-gold text-black shadow-md'
                    : 'bg-surface-dark-elevated text-gray-400 hover:text-white hover:bg-surface-dark-hover border border-white/10'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {formation}
              </motion.button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-gray-400 text-sm">{currentFormation.name}</span>
            <div className="flex items-center gap-2 bg-surface-dark-elevated px-3 py-1 rounded-full">
              <span className="text-green-400 text-xs font-medium">{compatibleCount} in position</span>
              {incompatibleCount > 0 && (
                <>
                  <span className="text-gray-500">|</span>
                  <span className="text-red-400 text-xs font-medium">{incompatibleCount} out of position</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Football Field Container - Slightly smaller */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-lg mx-auto"
        >
          {/* Field Background */}
          <div className="relative aspect-[3/4] md:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
            {/* Grass Gradient */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, #2d5a2d 0%, #1a4a1a 50%, #0d3a0d 100%)',
              }}
            />

            {/* Field Pattern (stripes) */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 60px)',
              }}
            />

            {/* Field Lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 500"
              preserveAspectRatio="none"
            >
              <rect x="20" y="20" width="360" height="460" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <line x1="20" y1="250" x2="380" y2="250" stroke="white" strokeWidth="2" opacity="0.4" />
              <circle cx="200" cy="250" r="50" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <circle cx="200" cy="250" r="4" fill="white" opacity="0.4" />
              <rect x="100" y="20" width="200" height="80" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <rect x="140" y="20" width="120" height="35" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <rect x="100" y="400" width="200" height="80" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <rect x="140" y="445" width="120" height="35" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <path d="M 20 30 Q 30 20 40 20" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <path d="M 360 20 Q 370 20 380 30" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <path d="M 20 470 Q 30 480 40 480" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
              <path d="M 360 480 Q 370 480 380 470" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />
            </svg>

            {/* Position Slots - always draggable */}
            <AnimatePresence mode="wait">
              {currentFormation.slots.map((slotKey) =>
                this.renderPositionSlot(
                  slotKey,
                  null, // Not used anymore
                  currentFormation.positions[slotKey],
                  true // Always editable
                )
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Player Bench - Below the field (hidden on mobile, use tap-to-select instead) */}
        <div className="hidden md:block max-w-lg mx-auto mt-6">
          <PlayerBench
            players={players}
            placedPlayerIds={this.getPlacedPlayerIds()}
            onDragStart={this.handleDragStartFromBench}
            onDragEnd={this.handleDragEnd}
            title="Available Players"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-gray-400">In Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">✕</span>
            </div>
            <span className="text-gray-400">Out of Position</span>
          </div>
        </div>

        {/* Instruction */}
        <p className="text-center text-gray-500 text-xs mt-4">
          Tap a position to change player • Drag to swap (desktop)
        </p>

        {/* Player Selection Modal (Mobile) */}
        {this.renderPlayerSelectionModal()}
      </section>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  userRole: state.auth?.userRole,
});

export default connect(mapStateToProps)(FootballField);

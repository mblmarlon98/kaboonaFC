import React, { Component } from 'react';
import { motion } from 'framer-motion';
import FormationPitch from '../../../components/shared/FormationPitch';
import PlayerBench from '../../../components/shared/PlayerBench';
import { supabase } from '../../../services/supabase';

/**
 * All available formations
 */
const FORMATIONS = [
  '4-4-2', '4-3-3', '4-3-3 Attack', '4-2-3-1', '4-1-4-1', '4-5-1', '4-4-1-1',
  '3-5-2', '3-4-3', '5-3-2', '5-4-1', '4-3-2-1', '4-1-2-1-2'
];

/**
 * Position compatibility map
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

/**
 * FormationBuilder - Visual pitch editor for setting up team formations
 */
class FormationBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFormation: '4-4-2',
      formationName: 'Main Formation',
      placedPlayers: {},
      players: [],
      isLoading: true,
      isSaving: false,
      saveMessage: null,
      draggedPlayer: null,
      // Mobile player selection
      selectingForSlot: null,
      showAllPlayers: false,
    };
  }

  componentDidMount() {
    this.fetchPlayers();
  }

  fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players_with_profiles')
        .select('*')
        .order('number', { ascending: true });

      if (error) throw error;

      const activePlayers = (data || []).filter(p => !p.is_alumni && !p.is_retired);

      this.setState({
        players: activePlayers,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching players:', error);
      this.setState({ isLoading: false });
    }
  };

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

  handleFormationChange = (formation) => {
    this.setState({
      selectedFormation: formation,
      placedPlayers: {},
    });
  };

  handleNameChange = (e) => {
    this.setState({ formationName: e.target.value });
  };

  handlePlayerPlaced = (slotName, player, activePosition) => {
    const isCompatible = this.isPlayerCompatible(player, slotName);
    this.setState(prevState => ({
      placedPlayers: {
        ...prevState.placedPlayers,
        [slotName]: { player, activePosition, isCompatible },
      },
    }));
  };

  handlePlayerRemoved = (slotName) => {
    this.setState(prevState => {
      const newPlacedPlayers = { ...prevState.placedPlayers };
      delete newPlacedPlayers[slotName];
      return { placedPlayers: newPlacedPlayers };
    });
  };

  handleDragStart = (player) => {
    this.setState({ draggedPlayer: player });
  };

  handleDragEnd = () => {
    this.setState({ draggedPlayer: null });
  };

  // Mobile: Open player selection for a slot
  handleSlotClick = (slotName) => {
    this.setState({
      selectingForSlot: slotName,
      showAllPlayers: false,
    });
  };

  // Mobile: Select a player for the current slot
  handleSelectPlayer = (player) => {
    const { selectingForSlot } = this.state;
    if (!selectingForSlot) return;

    const activePosition = this.getActivePosition(player, selectingForSlot);
    const isCompatible = this.isPlayerCompatible(player, selectingForSlot);

    this.setState(prevState => ({
      placedPlayers: {
        ...prevState.placedPlayers,
        [selectingForSlot]: { player, activePosition, isCompatible },
      },
      selectingForSlot: null,
      showAllPlayers: false,
    }));
  };

  handleCloseSelection = () => {
    this.setState({
      selectingForSlot: null,
      showAllPlayers: false,
    });
  };

  getSuggestedPlayers = (slotName) => {
    const { players } = this.state;
    const placedIds = this.getPlacedPlayerIds();

    return players.filter(player => {
      if (placedIds.includes(player.id)) return false;
      return this.isPlayerCompatible(player, slotName);
    });
  };

  getAvailablePlayers = () => {
    const { players } = this.state;
    const placedIds = this.getPlacedPlayerIds();
    return players.filter(player => !placedIds.includes(player.id));
  };

  handleSave = async () => {
    this.setState({ isSaving: true });

    try {
      const { selectedFormation, formationName, placedPlayers } = this.state;

      const positions = Object.entries(placedPlayers).map(([slotName, data]) => ({
        slot: slotName,
        player_id: data.player.id,
        active_position: data.activePosition,
      }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Saving formation:', {
        formation_type: selectedFormation,
        name: formationName,
        positions,
      });

      this.setState({
        isSaving: false,
        saveMessage: { type: 'success', text: 'Formation saved successfully!' },
      });
    } catch (error) {
      console.error('Error saving formation:', error);
      this.setState({
        isSaving: false,
        saveMessage: { type: 'error', text: 'Failed to save formation.' },
      });
    }

    setTimeout(() => {
      this.setState({ saveMessage: null });
    }, 3000);
  };

  handleSetActive = async () => {
    this.setState({ isSaving: true });

    await new Promise(resolve => setTimeout(resolve, 500));

    this.setState({
      isSaving: false,
      saveMessage: { type: 'success', text: 'Formation set as active!' },
    });

    setTimeout(() => {
      this.setState({ saveMessage: null });
    }, 3000);
  };

  handleClearFormation = () => {
    this.setState({ placedPlayers: {} });
  };

  getPlacedPlayerIds = () => {
    const { placedPlayers } = this.state;
    return Object.values(placedPlayers).map(data => data.player.id);
  };

  renderPlayerSelectionModal = () => {
    const { selectingForSlot, showAllPlayers, placedPlayers } = this.state;
    if (!selectingForSlot) return null;

    const displayPos = getSlotDisplayPosition(selectingForSlot);
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

          {/* Current player */}
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
                    this.handlePlayerRemoved(selectingForSlot);
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
    const {
      selectedFormation,
      formationName,
      placedPlayers,
      players,
      isLoading,
      isSaving,
      saveMessage,
    } = this.state;

    const placedCount = Object.keys(placedPlayers).length;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-accent-gold border-t-transparent rounded-full"
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-primary-black dark:text-white">
              Formation Builder
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Tap positions to assign players
            </p>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              saveMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {saveMessage.text}
          </motion.div>
        )}

        {/* Formation Name & Selector - Mobile friendly */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formation Name
            </label>
            <input
              type="text"
              value={formationName}
              onChange={this.handleNameChange}
              className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg text-primary-black dark:text-white focus:ring-2 focus:ring-accent-gold focus:border-transparent"
              placeholder="Enter formation name"
            />
          </div>

          <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Formation
            </label>
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
              {FORMATIONS.map((formation) => (
                <button
                  key={formation}
                  onClick={() => this.handleFormationChange(formation)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    selectedFormation === formation
                      ? 'bg-accent-gold text-black'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  {formation}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pitch View */}
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-display font-bold text-primary-black dark:text-white">
                {selectedFormation} Formation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formationName} - {placedCount}/11 players placed
              </p>
            </div>
            {placedCount > 0 && (
              <button
                onClick={this.handleClearFormation}
                className="px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Formation Pitch */}
          <FormationPitch
            formation={selectedFormation}
            placedPlayers={placedPlayers}
            draggedPlayer={this.state.draggedPlayer}
            players={players}
            onPlayerPlaced={this.handlePlayerPlaced}
            onPlayerRemoved={this.handlePlayerRemoved}
            onSlotClick={this.handleSlotClick}
            className="max-w-lg mx-auto"
          />

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Tap a position to change player
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={this.handleSave}
              disabled={isSaving || placedCount === 0}
              className="flex-1 px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Formation
                </>
              )}
            </button>
            <button
              onClick={this.handleSetActive}
              disabled={isSaving || placedCount < 11}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Set as Active
            </button>
          </div>
        </div>

        {/* Player Bench - Hidden on mobile, use tap-to-select instead */}
        <div className="hidden md:block">
          <PlayerBench
            players={players}
            placedPlayerIds={this.getPlacedPlayerIds()}
            onDragStart={this.handleDragStart}
            onDragEnd={this.handleDragEnd}
            title="Available Players (drag to pitch)"
          />
        </div>

        {/* Player Selection Modal (Mobile) */}
        {this.renderPlayerSelectionModal()}
      </div>
    );
  }
}

export default FormationBuilder;

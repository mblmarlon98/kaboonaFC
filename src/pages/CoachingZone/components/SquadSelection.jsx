import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Mock player data for squad selection
 */
const MOCK_SQUAD = [
  { id: 'player-1', name: 'Erik Blackwood', number: 1, position: 'GK', rating: 81 },
  { id: 'player-2', name: 'Lucas Mendes', number: 2, position: 'RB', rating: 75 },
  { id: 'player-3', name: 'Viktor Kozlov', number: 4, position: 'CB', rating: 67 },
  { id: 'player-4', name: 'Marco Rossi', number: 5, position: 'CB', rating: 68 },
  { id: 'player-5', name: 'Andre Williams', number: 3, position: 'LB', rating: 73 },
  { id: 'player-6', name: 'Kenji Tanaka', number: 7, position: 'RM', rating: 71 },
  { id: 'player-7', name: 'Samuel Okonkwo', number: 8, position: 'CM', rating: 76 },
  { id: 'player-8', name: 'Pierre Dubois', number: 6, position: 'CM', rating: 74 },
  { id: 'player-9', name: 'Ryan O\'Brien', number: 11, position: 'LM', rating: 70 },
  { id: 'player-10', name: 'Carlos Rodriguez', number: 9, position: 'ST', rating: 71 },
  { id: 'player-11', name: 'Jamal Sterling', number: 10, position: 'ST', rating: 70 },
  { id: 'player-12', name: 'Tom Wilson', number: 12, position: 'GK', rating: 65 },
  { id: 'player-13', name: 'James Park', number: 13, position: 'CB', rating: 63 },
  { id: 'player-14', name: 'David Kim', number: 14, position: 'CM', rating: 68 },
  { id: 'player-15', name: 'Alex Costa', number: 15, position: 'ST', rating: 67 },
];

/**
 * SquadSelection - Select starting 11 and bench players
 */
class SquadSelection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      startingEleven: MOCK_SQUAD.slice(0, 11).map(p => p.id),
      bench: MOCK_SQUAD.slice(11).map(p => p.id),
      isSaving: false,
      saveMessage: null,
    };
  }

  togglePlayerSelection = (playerId) => {
    const { startingEleven, bench } = this.state;

    if (startingEleven.includes(playerId)) {
      // Move from starting to bench
      this.setState({
        startingEleven: startingEleven.filter(id => id !== playerId),
        bench: [...bench, playerId],
      });
    } else if (bench.includes(playerId)) {
      // Move from bench to starting (if space available)
      if (startingEleven.length < 11) {
        this.setState({
          bench: bench.filter(id => id !== playerId),
          startingEleven: [...startingEleven, playerId],
        });
      }
    }
  };

  handleSave = async () => {
    this.setState({ isSaving: true });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.setState({
      isSaving: false,
      saveMessage: { type: 'success', text: 'Squad selection saved!' },
    });

    setTimeout(() => {
      this.setState({ saveMessage: null });
    }, 3000);
  };

  getPlayerById = (id) => {
    return MOCK_SQUAD.find(p => p.id === id);
  };

  getPositionColor = (position) => {
    const colors = {
      GK: 'bg-yellow-500',
      CB: 'bg-blue-500',
      RB: 'bg-blue-400',
      LB: 'bg-blue-400',
      CDM: 'bg-green-600',
      CM: 'bg-green-500',
      RM: 'bg-green-400',
      LM: 'bg-green-400',
      CAM: 'bg-purple-500',
      RW: 'bg-red-400',
      LW: 'bg-red-400',
      ST: 'bg-red-500',
    };
    return colors[position] || 'bg-gray-500';
  };

  renderPlayerCard = (playerId, isStarting = true) => {
    const player = this.getPlayerById(playerId);
    if (!player) return null;

    return (
      <motion.div
        key={player.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={() => this.togglePlayerSelection(player.id)}
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
          isStarting
            ? 'bg-accent-gold/10 hover:bg-accent-gold/20 border border-accent-gold/30'
            : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'
        }`}
      >
        {/* Position Badge */}
        <div className={`w-10 h-10 ${this.getPositionColor(player.position)} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
          {player.position}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-primary-black dark:text-white truncate">
            {player.name}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            #{player.number}
          </p>
        </div>

        {/* Rating */}
        <div className="text-right">
          <span className={`text-lg font-bold ${
            player.rating >= 75 ? 'text-green-500' :
            player.rating >= 65 ? 'text-yellow-500' : 'text-orange-500'
          }`}>
            {player.rating}
          </span>
        </div>

        {/* Action Icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isStarting ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
        }`}>
          {isStarting ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>
      </motion.div>
    );
  };

  render() {
    const { startingEleven, bench, isSaving, saveMessage } = this.state;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-primary-black dark:text-white">
              Squad Selection
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Select your starting 11 and bench players
            </p>
          </div>
          <button
            onClick={this.handleSave}
            disabled={isSaving || startingEleven.length !== 11}
            className="px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Selection
              </>
            )}
          </button>
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

        {/* Warning if not 11 players */}
        {startingEleven.length !== 11 && (
          <div className="p-4 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You need exactly 11 players in the starting lineup. Currently: {startingEleven.length}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Starting Eleven */}
          <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-primary-black dark:text-white">
                Starting XI
              </h3>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                startingEleven.length === 11
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {startingEleven.length}/11
              </span>
            </div>
            <div className="space-y-2">
              {startingEleven.map(playerId => this.renderPlayerCard(playerId, true))}
              {startingEleven.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No players selected. Click on bench players to add them.
                </p>
              )}
            </div>
          </div>

          {/* Bench */}
          <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-primary-black dark:text-white">
                Bench & Reserves
              </h3>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-500/20 text-gray-400">
                {bench.length} players
              </span>
            </div>
            <div className="space-y-2">
              {bench.map(playerId => this.renderPlayerCard(playerId, false))}
              {bench.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No players on bench.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl p-4">
          <h4 className="font-medium text-primary-black dark:text-white mb-2">
            How to use
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Click on a starting player to move them to the bench</li>
            <li>Click on a bench player to add them to the starting XI (if space available)</li>
            <li>You must have exactly 11 players in the starting lineup to save</li>
          </ul>
        </div>
      </div>
    );
  }
}

export default SquadSelection;

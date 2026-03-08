import React, { Component } from 'react';
import { motion } from 'framer-motion';
import PlayerFIFACard from './PlayerFIFACard';

/**
 * PlayerBench - Shows available players that can be dragged onto the formation
 */
class PlayerBench extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: 'all', // 'all', 'GK', 'DEF', 'MID', 'ATT'
      searchQuery: '',
    };
  }

  getPositionCategory = (position) => {
    if (position === 'GK') return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(position)) return 'DEF';
    if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(position)) return 'MID';
    return 'ATT';
  };

  filterPlayers = () => {
    const { players, placedPlayerIds = [] } = this.props;
    const { filter, searchQuery } = this.state;

    if (!players) return [];

    return players.filter(player => {
      // Exclude already placed players
      if (placedPlayerIds.includes(player.id)) return false;

      // Filter by category
      if (filter !== 'all' && this.getPositionCategory(player.position) !== filter) {
        return false;
      }

      // Filter by search query
      if (searchQuery && !player.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  };

  handleDragStart = (e, player) => {
    const { onDragStart } = this.props;
    e.dataTransfer.setData('playerId', player.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(player);

    // Set drag image
    const card = e.target.closest('.player-card-wrapper');
    if (card) {
      e.dataTransfer.setDragImage(card, 30, 40);
    }
  };

  handleDragEnd = () => {
    const { onDragEnd } = this.props;
    onDragEnd?.();
  };

  render() {
    const { className = '', title = 'Available Players', compact = false } = this.props;
    const { filter, searchQuery } = this.state;
    const filteredPlayers = this.filterPlayers();

    const categories = [
      { id: 'all', label: 'All' },
      { id: 'GK', label: 'GK' },
      { id: 'DEF', label: 'DEF' },
      { id: 'MID', label: 'MID' },
      { id: 'ATT', label: 'ATT' },
    ];

    return (
      <div className={`bg-surface-dark-elevated rounded-xl border border-white/10 ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-display font-bold text-white mb-3">{title}</h3>

          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => this.setState({ searchQuery: e.target.value })}
              className="w-full px-4 py-2 pl-10 bg-surface-dark border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-accent-gold"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => this.setState({ filter: cat.id })}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === cat.id
                    ? 'bg-accent-gold text-black'
                    : 'bg-surface-dark text-white/60 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Players Grid */}
        <div className={`p-4 overflow-y-auto ${compact ? 'max-h-[300px]' : 'max-h-[500px]'}`}>
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">No players available</p>
            </div>
          ) : (
            <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
              {filteredPlayers.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="player-card-wrapper"
                  draggable
                  onDragStart={(e) => this.handleDragStart(e, player)}
                  onDragEnd={this.handleDragEnd}
                >
                  <div className="cursor-grab active:cursor-grabbing">
                    <PlayerFIFACard
                      player={player}
                      size="xs"
                    />
                  </div>
                  {/* Player name below card */}
                  <p className="text-[10px] text-white/60 text-center mt-1 truncate">
                    {player.name?.split(' ').pop()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with count */}
        <div className="px-4 py-2 border-t border-white/10 text-xs text-white/40">
          {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''} available
        </div>
      </div>
    );
  }
}

export default PlayerBench;

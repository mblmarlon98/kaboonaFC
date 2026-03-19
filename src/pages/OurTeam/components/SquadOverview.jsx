import React, { Component } from 'react';
import { motion } from 'framer-motion';
import PlayerFIFACard from '../../../components/shared/PlayerFIFACard';

/**
 * Position group configurations
 */
const POSITION_GROUPS = [
  {
    id: 'goalkeepers',
    title: 'Goalkeepers',
    positions: ['GK'],
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'defenders',
    title: 'Defenders',
    positions: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'midfielders',
    title: 'Midfielders',
    positions: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'attackers',
    title: 'Attackers',
    positions: ['ST', 'CF', 'LW', 'RW'],
    color: 'from-red-500 to-red-600',
  },
];


/**
 * Squad Overview - Shows all players grouped by position
 * Similar to FIFA Ultimate Team club view
 */
class SquadOverview extends Component {
  groupPlayersByPosition = () => {
    const { players } = this.props;
    const grouped = {};

    POSITION_GROUPS.forEach((group) => {
      grouped[group.id] = (players || []).filter((player) =>
        group.positions.includes(player.position)
      );
    });

    return grouped;
  };

  // Check if all players are placeholders
  hasOnlyPlaceholders = () => {
    const { players } = this.props;
    return players && players.length > 0 && players.every(p => p.isPlaceholder);
  };

  renderPositionGroup = (group, players, index) => {
    if (players.length === 0) return null;

    return (
      <motion.div
        key={group.id}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="mb-10"
      >
        {/* Group Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${group.color}`} />
          <h3 className="text-xl md:text-2xl font-display font-bold text-white">
            {group.title}
          </h3>
          <span className="text-gray-500 text-sm">({players.length})</span>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {players.map((player, playerIndex) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: playerIndex * 0.03 }}
              className={player.isPlaceholder ? 'opacity-60' : ''}
            >
              <PlayerFIFACard
                player={player}
                size="sm"
                showStats={false}
                showSkillsAndWF={false}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  render() {
    const groupedPlayers = this.groupPlayersByPosition();
    const isPlaceholderSquad = this.hasOnlyPlaceholders();

    return (
      <section className="py-12 px-4 bg-surface-dark">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
              The Squad
            </h2>
            <p className="text-gray-400 text-sm">
              {isPlaceholderSquad
                ? 'Placeholder squad - Add real players in the admin panel'
                : 'Our complete roster organized by position'
              }
            </p>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mt-3" />
          </motion.div>

          {/* Position Groups */}
          {POSITION_GROUPS.map((group, index) =>
            this.renderPositionGroup(group, groupedPlayers[group.id], index)
          )}
        </div>
      </section>
    );
  }
}

export default SquadOverview;

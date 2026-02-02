import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from './PlayerCard';

/**
 * Interactive football field with 4-4-2 formation
 * Hover on position reveals stacked player cards that spread apart
 */
class FootballField extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoveredPosition: null,
    };
  }

  // Position coordinates for 4-4-2 formation (percentages)
  positionCoords = {
    GK: { top: '85%', left: '50%' },
    LB: { top: '68%', left: '15%' },
    'CB-L': { top: '70%', left: '35%' },
    'CB-R': { top: '70%', left: '65%' },
    RB: { top: '68%', left: '85%' },
    LM: { top: '45%', left: '15%' },
    'CM-L': { top: '48%', left: '35%' },
    'CM-R': { top: '48%', left: '65%' },
    RM: { top: '45%', left: '85%' },
    'ST-L': { top: '18%', left: '35%' },
    'ST-R': { top: '18%', left: '65%' },
  };

  // Map database positions to formation slots
  mapPlayersToPositions = (players) => {
    const positionMap = {
      GK: [],
      LB: [],
      'CB-L': [],
      'CB-R': [],
      RB: [],
      LM: [],
      'CM-L': [],
      'CM-R': [],
      RM: [],
      'ST-L': [],
      'ST-R': [],
    };

    players.forEach((player) => {
      const pos = player.position;

      // Map player positions to formation slots
      if (pos === 'GK') {
        positionMap.GK.push(player);
      } else if (pos === 'LB' || pos === 'LWB') {
        positionMap.LB.push(player);
      } else if (pos === 'CB') {
        // Distribute CBs between left and right
        if (positionMap['CB-L'].length <= positionMap['CB-R'].length) {
          positionMap['CB-L'].push(player);
        } else {
          positionMap['CB-R'].push(player);
        }
      } else if (pos === 'RB' || pos === 'RWB') {
        positionMap.RB.push(player);
      } else if (pos === 'LM' || pos === 'LW') {
        positionMap.LM.push(player);
      } else if (pos === 'CM' || pos === 'CDM' || pos === 'CAM') {
        // Distribute CMs between left and right
        if (positionMap['CM-L'].length <= positionMap['CM-R'].length) {
          positionMap['CM-L'].push(player);
        } else {
          positionMap['CM-R'].push(player);
        }
      } else if (pos === 'RM' || pos === 'RW') {
        positionMap.RM.push(player);
      } else if (pos === 'ST' || pos === 'CF' || pos === 'LW' || pos === 'RW') {
        // Distribute strikers between left and right
        if (positionMap['ST-L'].length <= positionMap['ST-R'].length) {
          positionMap['ST-L'].push(player);
        } else {
          positionMap['ST-R'].push(player);
        }
      }
    });

    return positionMap;
  };

  handlePositionHover = (position) => {
    this.setState({ hoveredPosition: position });
  };

  handlePositionLeave = () => {
    this.setState({ hoveredPosition: null });
  };

  getDisplayPosition = (slotKey) => {
    // Convert formation slot keys to display positions
    const displayMap = {
      GK: 'GK',
      LB: 'LB',
      'CB-L': 'CB',
      'CB-R': 'CB',
      RB: 'RB',
      LM: 'LM',
      'CM-L': 'CM',
      'CM-R': 'CM',
      RM: 'RM',
      'ST-L': 'ST',
      'ST-R': 'ST',
    };
    return displayMap[slotKey] || slotKey;
  };

  renderPositionSlot = (slotKey, players) => {
    const { hoveredPosition } = this.state;
    const { onPlayerClick } = this.props;
    const coords = this.positionCoords[slotKey];
    const isHovered = hoveredPosition === slotKey;
    const hasPlayers = players && players.length > 0;
    const displayPos = this.getDisplayPosition(slotKey);

    return (
      <div
        key={slotKey}
        className="absolute transform -translate-x-1/2 -translate-y-1/2"
        style={{ top: coords.top, left: coords.left }}
        onMouseEnter={() => this.handlePositionHover(slotKey)}
        onMouseLeave={this.handlePositionLeave}
      >
        {/* Position marker when no players or not hovered */}
        {!hasPlayers && (
          <div className="w-12 h-12 rounded-full border-2 border-white/30 bg-black/30 flex items-center justify-center">
            <span className="text-white/50 text-xs font-bold">{displayPos}</span>
          </div>
        )}

        {/* Stacked cards that spread on hover */}
        {hasPlayers && (
          <div className="relative">
            <AnimatePresence>
              {players.map((player, index) => {
                // Calculate spread positions when hovered
                const spreadX = isHovered
                  ? (index - (players.length - 1) / 2) * 100
                  : index * 4;
                const spreadY = isHovered ? 0 : index * 2;
                const zIndex = isHovered ? players.length - index : index;

                return (
                  <motion.div
                    key={player.id}
                    className="absolute"
                    initial={false}
                    animate={{
                      x: spreadX,
                      y: spreadY,
                      scale: isHovered ? 1 : 0.9 - index * 0.05,
                      opacity: isHovered ? 1 : 1 - index * 0.1,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                    }}
                    style={{
                      zIndex,
                      transformOrigin: 'center center',
                    }}
                  >
                    <PlayerCard
                      player={player}
                      size="small"
                      onClick={onPlayerClick}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Position label below cards */}
            <motion.div
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
              animate={{ opacity: isHovered ? 0 : 1 }}
            >
              <span className="text-white/70 text-xs font-semibold bg-black/50 px-2 py-0.5 rounded">
                {displayPos} ({players.length})
              </span>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  render() {
    const { players } = this.props;
    const { hoveredPosition } = this.state;
    const positionMap = this.mapPlayersToPositions(players);

    return (
      <section className="py-16 px-4 relative overflow-hidden">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            The Squad
          </h2>
          <p className="text-gray-400">4-4-2 Formation</p>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mt-4" />
        </motion.div>

        {/* Football Field Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto"
        >
          {/* Field Background with hover darkening */}
          <div
            className={`relative aspect-[3/4] md:aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-300 ${
              hoveredPosition ? 'shadow-[0_0_50px_rgba(0,0,0,0.5)]' : ''
            }`}
          >
            {/* Grass Gradient */}
            <div
              className={`absolute inset-0 transition-all duration-300`}
              style={{
                background: hoveredPosition
                  ? 'linear-gradient(180deg, #1a3a1a 0%, #0d2a0d 100%)'
                  : 'linear-gradient(180deg, #2d5a2d 0%, #1a4a1a 50%, #0d3a0d 100%)',
              }}
            />

            {/* Field Pattern (stripes) */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 80px)',
              }}
            />

            {/* Field Lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 500"
              preserveAspectRatio="none"
            >
              {/* Outer boundary */}
              <rect
                x="20"
                y="20"
                width="360"
                height="460"
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Center line */}
              <line
                x1="20"
                y1="250"
                x2="380"
                y2="250"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Center circle */}
              <circle
                cx="200"
                cy="250"
                r="50"
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Center spot */}
              <circle
                cx="200"
                cy="250"
                r="4"
                fill="white"
                opacity="0.6"
              />

              {/* Top penalty area */}
              <rect
                x="100"
                y="20"
                width="200"
                height="80"
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Top goal area */}
              <rect
                x="140"
                y="20"
                width="120"
                height="35"
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Top penalty spot */}
              <circle
                cx="200"
                cy="65"
                r="3"
                fill="white"
                opacity="0.6"
              />

              {/* Top penalty arc */}
              <path
                d="M 140 100 Q 200 130 260 100"
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Bottom penalty area */}
              <rect
                x="100"
                y="400"
                width="200"
                height="80"
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Bottom goal area */}
              <rect
                x="140"
                y="445"
                width="120"
                height="35"
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Bottom penalty spot */}
              <circle
                cx="200"
                cy="435"
                r="3"
                fill="white"
                opacity="0.6"
              />

              {/* Bottom penalty arc */}
              <path
                d="M 140 400 Q 200 370 260 400"
                fill="none"
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />

              {/* Corner arcs */}
              <path d="M 20 30 Q 30 20 40 20" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
              <path d="M 360 20 Q 370 20 380 30" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
              <path d="M 20 470 Q 30 480 40 480" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
              <path d="M 360 480 Q 370 480 380 470" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
            </svg>

            {/* Position Slots */}
            {Object.entries(positionMap).map(([slotKey, slotPlayers]) =>
              this.renderPositionSlot(slotKey, slotPlayers)
            )}
          </div>
        </motion.div>

        {/* Hover instruction */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Hover over positions to see players. Click on a card for details.
        </p>
      </section>
    );
  }
}

export default FootballField;

import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Position grouping constants
 */
const POSITION_GROUPS = {
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
  FWD: ['ST', 'CF', 'LW', 'RW'],
};

/**
 * Classify a position string into a group
 */
const classifyPosition = (pos) => {
  if (!pos) return null;
  const upper = pos.toUpperCase();
  for (const [group, positions] of Object.entries(POSITION_GROUPS)) {
    if (positions.includes(upper)) return group;
  }
  return null;
};

/**
 * Rondo / Passing Drill SVG Animation
 */
class RondoAnimation extends Component {
  render() {
    const outerDots = [0, 1, 2, 3, 4].map((i) => {
      const angle = (i * 72 - 90) * (Math.PI / 180);
      return {
        cx: 90 + 50 * Math.cos(angle),
        cy: 70 + 45 * Math.sin(angle),
      };
    });

    const ballCx = outerDots.map((d) => d.cx);
    ballCx.push(outerDots[0].cx);
    const ballCy = outerDots.map((d) => d.cy);
    ballCy.push(outerDots[0].cy);

    return (
      <svg width="180" height="140" viewBox="0 0 180 140">
        {/* Pitch circle marking */}
        <circle cx={90} cy={70} r={55} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        {/* Outer player dots */}
        {outerDots.map((dot, i) => (
          <circle key={i} cx={dot.cx} cy={dot.cy} r={6} fill="#4ade80" opacity={0.8} />
        ))}
        {/* Middle defender dot */}
        <motion.circle
          cx={90}
          cy={70}
          r={6}
          fill="#f87171"
          opacity={0.7}
          animate={{ cx: [85, 95, 88, 92, 85] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Ball */}
        <motion.circle
          r={4}
          fill="#d4af37"
          animate={{ cx: ballCx, cy: ballCy }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    );
  }
}

/**
 * Shooting Drill SVG Animation
 */
class ShootingAnimation extends Component {
  render() {
    const attackers = [
      { cx: 50, cy: 110 },
      { cx: 90, cy: 120 },
      { cx: 130, cy: 110 },
    ];

    const goalCenter = { cx: 90, cy: 25 };

    // Ball sequence: attacker 0 -> goal, attacker 1 -> goal, attacker 2 -> goal
    const ballCx = [];
    const ballCy = [];
    attackers.forEach((a) => {
      ballCx.push(a.cx, goalCenter.cx);
      ballCy.push(a.cy, goalCenter.cy);
    });
    ballCx.push(attackers[0].cx);
    ballCy.push(attackers[0].cy);

    return (
      <svg width="180" height="140" viewBox="0 0 180 140">
        {/* Goal */}
        <rect x={55} y={10} width={70} height={25} rx={3} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} />
        {/* Goal net lines */}
        <line x1={60} y1={10} x2={60} y2={35} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        <line x1={75} y1={10} x2={75} y2={35} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        <line x1={90} y1={10} x2={90} y2={35} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        <line x1={105} y1={10} x2={105} y2={35} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        <line x1={120} y1={10} x2={120} y2={35} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        {/* GK */}
        <motion.circle
          cx={90}
          cy={27}
          r={6}
          fill="#facc15"
          opacity={0.8}
          animate={{ cx: [82, 98, 85, 95, 82] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Attackers */}
        {attackers.map((a, i) => (
          <circle key={i} cx={a.cx} cy={a.cy} r={6} fill="#4ade80" opacity={0.8} />
        ))}
        {/* Ball shooting */}
        <motion.circle
          r={4}
          fill="#d4af37"
          animate={{ cx: ballCx, cy: ballCy }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    );
  }
}

/**
 * Defensive Shape SVG Animation
 */
class DefensiveShapeAnimation extends Component {
  render() {
    const baseY = 90;
    const defPositions = [
      { base: 30 },
      { base: 65 },
      { base: 115 },
      { base: 150 },
    ];

    return (
      <svg width="180" height="140" viewBox="0 0 180 140">
        {/* Pitch lines */}
        <line x1={0} y1={70} x2={180} y2={70} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        <rect x={10} y={5} width={160} height={130} rx={4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        {/* Defensive line - 4 dots shifting in unison */}
        {defPositions.map((def, i) => (
          <motion.circle
            key={i}
            cy={baseY}
            r={6}
            fill="#4ade80"
            opacity={0.8}
            animate={{ cx: [def.base, def.base + 20, def.base - 10, def.base + 15, def.base] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {/* Connecting line between defenders */}
        <motion.line
          y1={baseY}
          y2={baseY}
          stroke="rgba(74,222,128,0.3)"
          strokeWidth={1}
          strokeDasharray="4 3"
          animate={{
            x1: [30, 50, 20, 45, 30],
            x2: [150, 170, 140, 165, 150],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Attacking ball moving above the defense */}
        <motion.circle
          r={4}
          fill="#d4af37"
          animate={{
            cx: [40, 140, 70, 120, 40],
            cy: [45, 50, 55, 40, 45],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Opposing attacker dots */}
        <motion.circle
          r={5}
          fill="#f87171"
          opacity={0.6}
          animate={{
            cx: [50, 130, 80, 110, 50],
            cy: [50, 55, 60, 45, 50],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          r={5}
          fill="#f87171"
          opacity={0.6}
          animate={{
            cx: [120, 60, 100, 70, 120],
            cy: [40, 48, 52, 42, 40],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    );
  }
}

/**
 * Small-Sided Game SVG Animation
 */
class SmallSidedGameAnimation extends Component {
  render() {
    // Team A (green) positions
    const teamA = [
      { cx: [35, 55, 40, 50, 35], cy: [40, 50, 65, 35, 40] },
      { cx: [60, 45, 70, 50, 60], cy: [80, 70, 90, 75, 80] },
      { cx: [40, 60, 35, 55, 40], cy: [110, 100, 105, 115, 110] },
      { cx: [70, 50, 65, 55, 70], cy: [55, 60, 50, 70, 55] },
    ];

    // Team B (red) positions
    const teamB = [
      { cx: [140, 120, 135, 125, 140], cy: [40, 50, 45, 55, 40] },
      { cx: [115, 135, 110, 130, 115], cy: [80, 75, 85, 70, 80] },
      { cx: [145, 125, 140, 130, 145], cy: [110, 105, 115, 100, 110] },
      { cx: [120, 140, 125, 135, 120], cy: [55, 60, 65, 50, 55] },
    ];

    return (
      <svg width="180" height="140" viewBox="0 0 180 140">
        {/* Mini pitch */}
        <rect x={10} y={10} width={160} height={120} rx={4} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
        {/* Centre line */}
        <line x1={90} y1={10} x2={90} y2={130} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        {/* Centre circle */}
        <circle cx={90} cy={70} r={20} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        {/* Goals */}
        <rect x={2} y={50} width={8} height={40} rx={2} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <rect x={170} y={50} width={8} height={40} rx={2} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        {/* Team A */}
        {teamA.map((p, i) => (
          <motion.circle
            key={`a-${i}`}
            r={5}
            fill="#4ade80"
            opacity={0.8}
            animate={{ cx: p.cx, cy: p.cy }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {/* Team B */}
        {teamB.map((p, i) => (
          <motion.circle
            key={`b-${i}`}
            r={5}
            fill="#f87171"
            opacity={0.7}
            animate={{ cx: p.cx, cy: p.cy }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {/* Ball */}
        <motion.circle
          r={3.5}
          fill="#d4af37"
          animate={{
            cx: [50, 80, 130, 100, 60, 110, 50],
            cy: [60, 90, 50, 70, 100, 80, 60],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    );
  }
}

/**
 * Fitness / Running SVG Animation
 */
class FitnessAnimation extends Component {
  render() {
    // Oval track path
    const trackPath = 'M 50,35 A 45,30 0 1,1 49.99,35';
    // Positions around the oval for 4 runners (parametric)
    const runners = [0, 1, 2, 3];

    return (
      <svg width="180" height="140" viewBox="0 0 180 140">
        {/* Track oval */}
        <ellipse cx={90} cy={70} rx={65} ry={45} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
        <ellipse cx={90} cy={70} rx={55} ry={35} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        {/* Lane markers */}
        <line x1={25} y1={70} x2={35} y2={70} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        <line x1={145} y1={70} x2={155} y2={70} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        {/* Runners moving around the oval */}
        {runners.map((i) => {
          const offset = i * 90; // degrees offset
          const points = 8;
          const cx = [];
          const cy = [];
          for (let p = 0; p <= points; p++) {
            const angle = ((p * (360 / points)) + offset) * (Math.PI / 180);
            cx.push(90 + 60 * Math.cos(angle));
            cy.push(70 + 40 * Math.sin(angle));
          }
          return (
            <motion.circle
              key={i}
              r={5}
              fill="#4ade80"
              opacity={0.8}
              animate={{ cx, cy }}
              transition={{
                duration: 4 + i * 0.3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          );
        })}
        {/* Direction arrow indicator */}
        <motion.polygon
          points="155,62 162,70 155,78"
          fill="rgba(212,175,55,0.4)"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    );
  }
}

/**
 * Drill definitions
 */
const DRILLS = [
  {
    id: 'rondo',
    name: 'Rondo / Passing Drill',
    description: 'Keep possession in tight spaces. Improve first touch and quick passing.',
    minPlayers: 6,
    requirement: null, // No position requirement
    AnimationComponent: RondoAnimation,
  },
  {
    id: 'shooting',
    name: 'Shooting Drill',
    description: 'Practice finishing from various angles. Build confidence in front of goal.',
    minPlayers: 4,
    requirement: { GK: 1, FWD: 1 },
    AnimationComponent: ShootingAnimation,
  },
  {
    id: 'defensive-shape',
    name: 'Defensive Shape',
    description: 'Maintain a compact defensive line. Practice shifting and covering.',
    minPlayers: 4,
    requirement: { DEF: 4 },
    AnimationComponent: DefensiveShapeAnimation,
  },
  {
    id: 'small-sided',
    name: 'Small-Sided Game',
    description: 'Game-like scenarios in tight spaces. Improve decision-making and transitions.',
    minPlayers: 8,
    requirement: null,
    AnimationComponent: SmallSidedGameAnimation,
  },
  {
    id: 'fitness',
    name: 'Fitness / Running',
    description: 'Build endurance and stamina. Interval sprints and recovery runs.',
    minPlayers: 1,
    requirement: null,
    AnimationComponent: FitnessAnimation,
  },
];

/**
 * DrillSuggestions - Analyzes accepted players and suggests appropriate training drills
 * with animated SVG previews.
 *
 * Props:
 *   acceptedPlayers - array of objects with `position` field (e.g. 'GK', 'CB', 'ST')
 */
class DrillSuggestions extends Component {
  /**
   * Count players in each position group from the accepted players list
   */
  getGroupCounts() {
    const { acceptedPlayers } = this.props;
    const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

    (acceptedPlayers || []).forEach((player) => {
      const group = classifyPosition(player.position);
      if (group && counts.hasOwnProperty(group)) {
        counts[group]++;
      }
    });

    return counts;
  }

  /**
   * Check if a drill's requirements are met
   */
  isDrillAvailable(drill, totalPlayers, groupCounts) {
    if (totalPlayers < drill.minPlayers) return false;

    if (drill.requirement) {
      for (const [group, minCount] of Object.entries(drill.requirement)) {
        if ((groupCounts[group] || 0) < minCount) return false;
      }
    }

    return true;
  }

  /**
   * Get how many more players are needed
   */
  getDeficit(drill, totalPlayers, groupCounts) {
    const deficits = [];

    if (totalPlayers < drill.minPlayers) {
      deficits.push(`${drill.minPlayers - totalPlayers} more player${drill.minPlayers - totalPlayers > 1 ? 's' : ''}`);
    }

    if (drill.requirement) {
      for (const [group, minCount] of Object.entries(drill.requirement)) {
        const current = groupCounts[group] || 0;
        if (current < minCount) {
          deficits.push(`${minCount - current} more ${group}`);
        }
      }
    }

    return deficits.join(', ');
  }

  renderDrillCard(drill, isAvailable, deficit) {
    const { AnimationComponent } = drill;

    return (
      <motion.div
        key={drill.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl border transition-all ${
          isAvailable
            ? 'bg-white/[0.03] border-white/10 hover:border-accent-gold/30'
            : 'bg-white/[0.01] border-white/5 opacity-50'
        }`}
      >
        {/* Animated SVG preview */}
        <div className="flex-shrink-0 rounded-lg bg-black/30 border border-white/5 overflow-hidden">
          <AnimationComponent />
        </div>

        {/* Drill info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h4 className="text-white font-bold text-sm">{drill.name}</h4>
            {isAvailable ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/20">
                Recommended
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                Need {deficit}
              </span>
            )}
          </div>

          <p className="text-gray-400 text-xs leading-relaxed mb-2">
            {drill.description}
          </p>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-gray-500 border border-white/5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Min {drill.minPlayers} players
            {drill.requirement && (
              <span>
                {' '}({Object.entries(drill.requirement).map(([g, c]) => `${c} ${g}`).join(', ')})
              </span>
            )}
          </span>
        </div>
      </motion.div>
    );
  }

  render() {
    const { acceptedPlayers } = this.props;
    const totalPlayers = (acceptedPlayers || []).length;
    const groupCounts = this.getGroupCounts();

    return (
      <div className="space-y-3">
        {DRILLS.map((drill) => {
          const isAvailable = this.isDrillAvailable(drill, totalPlayers, groupCounts);
          const deficit = !isAvailable ? this.getDeficit(drill, totalPlayers, groupCounts) : '';
          return this.renderDrillCard(drill, isAvailable, deficit);
        })}
      </div>
    );
  }
}

export default DrillSuggestions;

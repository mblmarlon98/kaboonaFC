import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Live FIFA-style card preview showing player stats
 */
class FIFACardPreview extends Component {
  calculateOverall = () => {
    const { stats, position } = this.props;

    if (position === 'GK') {
      const { diving, handling, kicking, reflexes, speed, positioning } = stats;
      return Math.round((diving + handling + kicking + reflexes + speed + positioning) / 6);
    } else {
      const { pace, shooting, passing, dribbling, defending, physical } = stats;
      return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
    }
  };

  getStatLabels = () => {
    const { position } = this.props;
    if (position === 'GK') {
      return ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'];
    }
    return ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];
  };

  getStatValues = () => {
    const { stats, position } = this.props;
    if (position === 'GK') {
      const { diving, handling, kicking, reflexes, speed, positioning } = stats;
      return [diving, handling, kicking, reflexes, speed, positioning];
    }
    const { pace, shooting, passing, dribbling, defending, physical } = stats;
    return [pace, shooting, passing, dribbling, defending, physical];
  };

  getStatColor = (value) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    if (value >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  render() {
    const { name, position, jerseyNumber, country = 'MY' } = this.props;
    const overall = this.calculateOverall();
    const statLabels = this.getStatLabels();
    const statValues = this.getStatValues();

    return (
      <motion.div
        className="relative w-56 h-80 mx-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Card Background with Gold Gradient Border */}
        <div
          className="absolute inset-0 rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.4)]"
          style={{
            background: 'linear-gradient(135deg, #D4AF37 0%, #B8972E 50%, #D4AF37 100%)',
            padding: '3px',
          }}
        >
          <div
            className="w-full h-full rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
            }}
          >
            {/* Player Silhouette Background */}
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              <div className="w-full h-full bg-gradient-to-b from-surface-dark-elevated to-surface-dark flex items-center justify-center">
                <svg
                  className="w-32 h-32 text-accent-gold/10"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
            </div>

            {/* Card Content */}
            <div className="relative h-full flex flex-col p-4">
              {/* Top Section - Rating & Position */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-center">
                  <motion.span
                    key={overall}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-display font-bold text-accent-gold"
                  >
                    {overall}
                  </motion.span>
                  <span className="text-sm font-bold text-white tracking-wider">
                    {position || 'ST'}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {/* Country Flag */}
                  <div className="w-8 h-5 overflow-hidden rounded-sm bg-white/10">
                    <img
                      src={`https://flagcdn.com/w40/${country.toLowerCase()}.png`}
                      alt={country}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  {/* Jersey Number */}
                  <span className="text-2xl font-display font-bold text-accent-gold">
                    #{jerseyNumber || '10'}
                  </span>
                </div>
              </div>

              {/* Spacer */}
              <div className="flex-grow" />

              {/* Player Name */}
              <div className="text-center mb-3">
                <h3 className="text-base font-display font-bold text-white uppercase tracking-wider truncate">
                  {name || 'PLAYER NAME'}
                </h3>
              </div>

              {/* Stats Grid - 2 columns */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-black/30 rounded-lg p-3">
                {statLabels.map((label, index) => (
                  <motion.div
                    key={label}
                    className="flex items-center justify-between"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <span className="text-xs text-accent-gold font-bold">
                      {label}
                    </span>
                    <motion.span
                      key={statValues[index]}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className={`text-sm font-semibold ${this.getStatColor(statValues[index])}`}
                    >
                      {statValues[index]}
                    </motion.span>
                  </motion.div>
                ))}
              </div>

              {/* Card Footer - Kaboona FC Badge */}
              <div className="mt-3 text-center">
                <span className="text-[10px] text-accent-gold/60 uppercase tracking-widest">
                  Kaboona FC
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
}

export default FIFACardPreview;

import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Step 3: Player Information
 */
class PlayerInfoStep extends Component {
  render() {
    const { data, onChange, errors } = this.props;

    const positions = [
      { value: 'GK', label: 'Goalkeeper', icon: 'GK' },
      { value: 'CB', label: 'Center Back', icon: 'CB' },
      { value: 'LB', label: 'Left Back', icon: 'LB' },
      { value: 'RB', label: 'Right Back', icon: 'RB' },
      { value: 'CDM', label: 'Defensive Mid', icon: 'CDM' },
      { value: 'CM', label: 'Center Mid', icon: 'CM' },
      { value: 'CAM', label: 'Attacking Mid', icon: 'CAM' },
      { value: 'LW', label: 'Left Wing', icon: 'LW' },
      { value: 'RW', label: 'Right Wing', icon: 'RW' },
      { value: 'ST', label: 'Striker', icon: 'ST' },
    ];

    const preferredFeet = [
      { value: 'right', label: 'Right', icon: 'R' },
      { value: 'left', label: 'Left', icon: 'L' },
      { value: 'both', label: 'Both', icon: 'B' },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-white mb-2">
            Player Information
          </h2>
          <p className="text-white/60">
            Tell us about your playing style
          </p>
        </div>

        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-3">
            Preferred Position
          </label>
          <div className="grid grid-cols-5 gap-2">
            {positions.map((pos) => (
              <motion.button
                key={pos.value}
                type="button"
                onClick={() => onChange({ target: { name: 'position', value: pos.value } })}
                className={`relative p-3 rounded-lg border transition-all ${
                  data.position === pos.value
                    ? 'bg-accent-gold/10 border-accent-gold'
                    : 'bg-background-dark border-white/20 hover:border-white/40'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span
                  className={`text-lg font-display font-bold ${
                    data.position === pos.value ? 'text-accent-gold' : 'text-white/60'
                  }`}
                >
                  {pos.icon}
                </span>
                <span
                  className={`block text-[10px] mt-1 ${
                    data.position === pos.value ? 'text-accent-gold' : 'text-white/40'
                  }`}
                >
                  {pos.label}
                </span>
              </motion.button>
            ))}
          </div>
          {errors.position && (
            <p className="mt-2 text-sm text-red-400">{errors.position}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jersey Number */}
          <div>
            <label
              htmlFor="jerseyNumber"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Preferred Jersey Number
            </label>
            <input
              type="number"
              id="jerseyNumber"
              name="jerseyNumber"
              min="1"
              max="99"
              value={data.jerseyNumber}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.jerseyNumber ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="1-99"
            />
            {errors.jerseyNumber && (
              <p className="mt-1 text-sm text-red-400">{errors.jerseyNumber}</p>
            )}
          </div>

          {/* Preferred Foot */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Preferred Foot
            </label>
            <div className="flex gap-3">
              {preferredFeet.map((foot) => (
                <button
                  key={foot.value}
                  type="button"
                  onClick={() => onChange({ target: { name: 'preferredFoot', value: foot.value } })}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                    data.preferredFoot === foot.value
                      ? 'bg-accent-gold/10 border-accent-gold text-accent-gold'
                      : 'bg-background-dark border-white/20 text-white/60 hover:border-white/40'
                  }`}
                >
                  <span className="font-bold">{foot.icon}</span>
                  <span className="block text-xs mt-1">{foot.label}</span>
                </button>
              ))}
            </div>
            {errors.preferredFoot && (
              <p className="mt-1 text-sm text-red-400">{errors.preferredFoot}</p>
            )}
          </div>

          {/* Height */}
          <div>
            <label
              htmlFor="height"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Height (cm)
            </label>
            <input
              type="number"
              id="height"
              name="height"
              min="100"
              max="250"
              value={data.height}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.height ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="175"
            />
            {errors.height && (
              <p className="mt-1 text-sm text-red-400">{errors.height}</p>
            )}
          </div>

          {/* Weight */}
          <div>
            <label
              htmlFor="weight"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Weight (kg)
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              min="30"
              max="200"
              value={data.weight}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-background-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.weight ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="70"
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-red-400">{errors.weight}</p>
            )}
          </div>
        </div>

        {/* Weak Foot Rating */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-3">
            Weak Foot Rating
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <motion.button
                key={rating}
                type="button"
                onClick={() => onChange({ target: { name: 'weakFoot', value: rating } })}
                className={`w-12 h-12 rounded-lg border transition-all flex items-center justify-center ${
                  data.weakFoot >= rating
                    ? 'bg-accent-gold border-accent-gold'
                    : 'bg-background-dark border-white/20 hover:border-white/40'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className={`w-6 h-6 ${data.weakFoot >= rating ? 'text-black' : 'text-white/40'}`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </motion.button>
            ))}
            <span className="ml-3 text-white/60 text-sm">
              {data.weakFoot === 1 && 'Very Weak'}
              {data.weakFoot === 2 && 'Weak'}
              {data.weakFoot === 3 && 'Average'}
              {data.weakFoot === 4 && 'Strong'}
              {data.weakFoot === 5 && 'Very Strong'}
            </span>
          </div>
          {errors.weakFoot && (
            <p className="mt-1 text-sm text-red-400">{errors.weakFoot}</p>
          )}
        </div>
      </motion.div>
    );
  }
}

export default PlayerInfoStep;

import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock taken jersey numbers - in production, fetch from database
const TAKEN_NUMBERS = [1, 7, 9, 10, 11, 14, 23];

/**
 * Step 3: Player Information
 */
class PlayerInfoStep extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showJerseySelector: false,
    };
  }

  toggleJerseySelector = () => {
    this.setState((prev) => ({ showJerseySelector: !prev.showJerseySelector }));
  };

  selectJerseyNumber = (number) => {
    const { onChange } = this.props;
    onChange({ target: { name: 'jerseyNumber', value: number.toString() } });
    this.setState({ showJerseySelector: false });
  };

  clearJerseyNumber = () => {
    const { onChange } = this.props;
    onChange({ target: { name: 'jerseyNumber', value: '' } });
    this.setState({ showJerseySelector: false });
  };

  render() {
    const { data, onChange, errors } = this.props;
    const { showJerseySelector } = this.state;

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
                    : 'bg-surface-dark border-white/20 hover:border-white/40'
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
          {/* Jersey Number - Collapsible Selector */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Preferred Jersey Number
            </label>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={this.toggleJerseySelector}
              className={`w-full px-4 py-3 bg-surface-dark border rounded-lg text-left flex items-center justify-between transition-colors ${
                errors.jerseyNumber ? 'border-red-500' : 'border-white/20 hover:border-white/30'
              } ${showJerseySelector ? 'border-accent-gold' : ''}`}
            >
              {data.jerseyNumber ? (
                <span className="text-white flex items-center gap-3">
                  <span className="w-10 h-10 bg-accent-gold/20 rounded-lg flex items-center justify-center text-accent-gold font-display font-bold text-lg">
                    {data.jerseyNumber}
                  </span>
                  <span>Number {data.jerseyNumber}</span>
                </span>
              ) : (
                <span className="text-white/40">Click to select a number (1-99)</span>
              )}
              <motion.svg
                animate={{ rotate: showJerseySelector ? 180 : 0 }}
                className="w-5 h-5 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>

            {/* Collapsible Number Grid */}
            <AnimatePresence>
              {showJerseySelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 bg-surface-dark border border-white/20 rounded-lg overflow-hidden">
                    {/* Legend */}
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <p className="text-xs text-white/50">
                        <span className="inline-block w-3 h-3 bg-red-500/30 rounded mr-1 align-middle"></span>
                        <span className="text-red-400">Taken</span>
                        <span className="mx-2">•</span>
                        <span className="inline-block w-3 h-3 bg-white/10 rounded mr-1 align-middle"></span>
                        Available
                      </p>
                      {data.jerseyNumber && (
                        <button
                          type="button"
                          onClick={this.clearJerseyNumber}
                          className="text-xs text-white/50 hover:text-white transition-colors"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>

                    {/* Number Grid */}
                    <div className="p-4 max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-10 gap-1.5">
                        {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => {
                          const isTaken = TAKEN_NUMBERS.includes(num);
                          const isSelected = data.jerseyNumber === num.toString();

                          return (
                            <motion.button
                              key={num}
                              type="button"
                              disabled={isTaken}
                              onClick={() => this.selectJerseyNumber(num)}
                              whileHover={!isTaken ? { scale: 1.1 } : {}}
                              whileTap={!isTaken ? { scale: 0.95 } : {}}
                              className={`aspect-square rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'bg-accent-gold text-black ring-2 ring-accent-gold ring-offset-2 ring-offset-surface-dark'
                                  : isTaken
                                  ? 'bg-red-500/20 text-red-400/60 cursor-not-allowed'
                                  : 'bg-white/5 text-white/70 hover:bg-accent-gold/20 hover:text-accent-gold'
                              }`}
                            >
                              {num}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Select - Popular Numbers */}
                    <div className="px-4 py-3 border-t border-white/10 bg-white/5">
                      <p className="text-xs text-white/40 mb-2">Popular available numbers:</p>
                      <div className="flex gap-2 flex-wrap">
                        {[2, 3, 4, 5, 6, 8, 12, 15, 17, 19, 21, 22].filter(n => !TAKEN_NUMBERS.includes(n)).slice(0, 6).map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => this.selectJerseyNumber(num)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              data.jerseyNumber === num.toString()
                                ? 'bg-accent-gold text-black'
                                : 'bg-white/10 text-white/70 hover:bg-accent-gold/20 hover:text-accent-gold'
                            }`}
                          >
                            #{num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {errors.jerseyNumber && (
              <p className="mt-2 text-sm text-red-400">{errors.jerseyNumber}</p>
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
                      : 'bg-surface-dark border-white/20 text-white/60 hover:border-white/40'
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

          {/* Weak Foot Rating */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Weak Foot Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button
                  key={rating}
                  type="button"
                  onClick={() => onChange({ target: { name: 'weakFoot', value: rating } })}
                  className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center ${
                    data.weakFoot >= rating
                      ? 'bg-accent-gold border-accent-gold'
                      : 'bg-surface-dark border-white/20 hover:border-white/40'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg
                    className={`w-5 h-5 ${data.weakFoot >= rating ? 'text-black' : 'text-white/40'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </motion.button>
              ))}
              <span className="ml-2 text-white/60 text-xs">
                {data.weakFoot === 1 && 'Very Weak'}
                {data.weakFoot === 2 && 'Weak'}
                {data.weakFoot === 3 && 'Average'}
                {data.weakFoot === 4 && 'Strong'}
                {data.weakFoot === 5 && 'Very Strong'}
              </span>
            </div>
          </div>

          {/* Height */}
          <div>
            <label
              htmlFor="height"
              className="block text-sm font-medium text-white/80 mb-2"
            >
              Height (cm) <span className="text-white/40 text-xs">Optional</span>
            </label>
            <input
              type="number"
              id="height"
              name="height"
              min="100"
              max="250"
              value={data.height}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-surface-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
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
              Weight (kg) <span className="text-white/40 text-xs">Optional</span>
            </label>
            <input
              type="number"
              id="weight"
              name="weight"
              min="30"
              max="200"
              value={data.weight}
              onChange={onChange}
              className={`w-full px-4 py-3 bg-surface-dark border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors ${
                errors.weight ? 'border-red-500' : 'border-white/20'
              }`}
              placeholder="70"
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-red-400">{errors.weight}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
}

export default PlayerInfoStep;

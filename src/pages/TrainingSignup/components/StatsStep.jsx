import React, { Component } from 'react';
import { motion } from 'framer-motion';
import FIFACardPreview from './FIFACardPreview';

/**
 * Step 4: Self-rated player stats with live FIFA card preview
 */
class StatsStep extends Component {
  getStatConfig = () => {
    const { data } = this.props;
    const isGoalkeeper = data.position === 'GK';

    if (isGoalkeeper) {
      return [
        { key: 'diving', label: 'Diving', description: 'Ability to make diving saves' },
        { key: 'handling', label: 'Handling', description: 'Ball control and catching' },
        { key: 'kicking', label: 'Kicking', description: 'Distribution and goal kicks' },
        { key: 'reflexes', label: 'Reflexes', description: 'Reaction speed to shots' },
        { key: 'speed', label: 'Speed', description: 'Movement speed off the line' },
        { key: 'positioning', label: 'Positioning', description: 'Reading the game and positioning' },
      ];
    }

    return [
      { key: 'pace', label: 'Pace', description: 'Sprint speed and acceleration' },
      { key: 'shooting', label: 'Shooting', description: 'Finishing and shot power' },
      { key: 'passing', label: 'Passing', description: 'Short and long passing accuracy' },
      { key: 'dribbling', label: 'Dribbling', description: 'Ball control and agility' },
      { key: 'defending', label: 'Defending', description: 'Tackling and interceptions' },
      { key: 'physical', label: 'Physical', description: 'Strength and stamina' },
    ];
  };

  handleStatChange = (key, value) => {
    const { onChange } = this.props;
    onChange({
      target: {
        name: `stats.${key}`,
        value: parseInt(value, 10),
      },
    });
  };

  getSliderBackground = (value) => {
    const percentage = ((value - 1) / 98) * 100;
    return `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`;
  };

  render() {
    const { data, errors } = this.props;
    const statConfig = this.getStatConfig();

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
            Rate Your Skills
          </h2>
          <p className="text-white/60">
            Honestly rate your abilities (1-99) - these will be verified during trials
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stats Sliders */}
          <div className="space-y-6">
            {statConfig.map((stat, index) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-white">
                      {stat.label}
                    </label>
                    <p className="text-xs text-white/40">{stat.description}</p>
                  </div>
                  <motion.span
                    key={data.stats[stat.key]}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`text-xl font-display font-bold ${
                      data.stats[stat.key] >= 80
                        ? 'text-green-400'
                        : data.stats[stat.key] >= 60
                        ? 'text-yellow-400'
                        : data.stats[stat.key] >= 40
                        ? 'text-orange-400'
                        : 'text-red-400'
                    }`}
                  >
                    {data.stats[stat.key]}
                  </motion.span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={data.stats[stat.key]}
                    onChange={(e) => this.handleStatChange(stat.key, e.target.value)}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: this.getSliderBackground(data.stats[stat.key]),
                    }}
                  />
                </div>
              </motion.div>
            ))}

            {errors.stats && (
              <p className="text-sm text-red-400">{errors.stats}</p>
            )}

            {/* Tips */}
            <div className="mt-6 p-4 bg-accent-gold/5 border border-accent-gold/20 rounded-lg">
              <h4 className="text-sm font-semibold text-accent-gold mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Rating Guide
              </h4>
              <ul className="text-xs text-white/60 space-y-1">
                <li><span className="text-red-400 font-semibold">1-39:</span> Beginner level</li>
                <li><span className="text-orange-400 font-semibold">40-59:</span> Amateur level</li>
                <li><span className="text-yellow-400 font-semibold">60-79:</span> Experienced player</li>
                <li><span className="text-green-400 font-semibold">80-99:</span> Professional level</li>
              </ul>
            </div>
          </div>

          {/* FIFA Card Preview */}
          <div className="flex flex-col items-center justify-start">
            <div className="sticky top-4">
              <h3 className="text-center text-sm text-white/60 mb-4">
                Live Card Preview
              </h3>
              <FIFACardPreview
                name={data.fullName}
                position={data.position}
                jerseyNumber={data.jerseyNumber}
                stats={data.stats}
              />
              <p className="text-center text-xs text-white/40 mt-4">
                This is how your player card will look
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
}

export default StatsStep;

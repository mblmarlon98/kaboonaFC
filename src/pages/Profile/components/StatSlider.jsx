import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Slider component for editing player stats (1-99 range)
 */
class StatSlider extends Component {
  getStatColor = (value) => {
    if (value >= 80) return { track: 'bg-green-500', thumb: 'border-green-400', text: 'text-green-400' };
    if (value >= 60) return { track: 'bg-lime-500', thumb: 'border-lime-400', text: 'text-lime-400' };
    if (value >= 40) return { track: 'bg-yellow-500', thumb: 'border-yellow-400', text: 'text-yellow-400' };
    if (value >= 20) return { track: 'bg-orange-500', thumb: 'border-orange-400', text: 'text-orange-400' };
    return { track: 'bg-red-500', thumb: 'border-red-400', text: 'text-red-400' };
  };

  handleChange = (e) => {
    const { onChange, name } = this.props;
    const value = parseInt(e.target.value, 10);
    onChange(name, value);
  };

  render() {
    const { name, label, value, description } = this.props;
    const colors = this.getStatColor(value);

    return (
      <motion.div
        className="bg-surface-dark rounded-lg p-4 border border-white/10 hover:border-accent-gold/30 transition-colors"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-white font-display font-bold uppercase tracking-wider">
              {label}
            </h4>
            {description && (
              <p className="text-white/40 text-xs mt-0.5">{description}</p>
            )}
          </div>
          <div className={`text-3xl font-display font-bold ${colors.text}`}>
            {value}
          </div>
        </div>

        {/* Slider */}
        <div className="relative">
          {/* Background Track */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-white/10 rounded-full -translate-y-1/2" />

          {/* Filled Track */}
          <div
            className={`absolute top-1/2 left-0 h-2 ${colors.track} rounded-full -translate-y-1/2 transition-all duration-150`}
            style={{ width: `${value}%` }}
          />

          {/* Input Range */}
          <input
            type="range"
            name={name}
            min="1"
            max="99"
            value={value}
            onChange={this.handleChange}
            className="relative w-full h-6 appearance-none bg-transparent cursor-pointer z-10"
            style={{
              '--thumb-color': colors.track.replace('bg-', ''),
            }}
          />
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between mt-2 text-xs text-white/30">
          <span>1</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>99</span>
        </div>
      </motion.div>
    );
  }
}

export default StatSlider;

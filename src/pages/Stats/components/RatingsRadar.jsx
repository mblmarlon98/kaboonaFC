import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * RatingsRadar - Placeholder for future coach ratings feature
 */
class RatingsRadar extends Component {
  render() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Coach Ratings
          </h3>
          <p className="text-white/50 text-sm mt-1">Team performance analysis</p>
        </div>

        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-accent-gold/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <p className="text-white/40">Coach ratings coming soon.</p>
          <p className="text-white/30 text-xs mt-2">Player performance ratings will appear here once coaches start submitting match reviews.</p>
        </div>
      </motion.div>
    );
  }
}

export default RatingsRadar;

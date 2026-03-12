import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

class PhotoLightbox extends Component {
  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape') this.props.onClose();
    if (e.key === 'ArrowLeft') this.props.onPrev?.();
    if (e.key === 'ArrowRight') this.props.onNext?.();
  };

  render() {
    const { photo, onClose, onPrev, onNext } = this.props;
    if (!photo) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Nav Arrows */}
          {onPrev && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {onNext && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="max-w-5xl max-h-[85vh] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photo.image_url}
              alt={photo.caption || ''}
              className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto"
            />
            {(photo.caption || photo.profiles?.full_name) && (
              <div className="text-center mt-3">
                {photo.caption && <p className="text-white text-sm">{photo.caption}</p>}
                {photo.profiles?.full_name && (
                  <p className="text-gray-500 text-xs mt-1">by {photo.profiles.full_name}</p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
}

export default PhotoLightbox;

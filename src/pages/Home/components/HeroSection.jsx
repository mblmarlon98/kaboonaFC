import React, { Component, createRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

class HeroSection extends Component {
  constructor(props) {
    super(props);
    this.heroRef = createRef();
    this.tigerRef = createRef();
  }

  componentDidMount() {
    // GSAP animation for the tiger logo
    if (this.tigerRef.current) {
      gsap.to(this.tigerRef.current, {
        scale: 1.05,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    }
  }

  render() {
    return (
      <section
        ref={this.heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-surface-dark via-surface-dark-elevated to-surface-dark"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 35px,
                rgba(212, 175, 55, 0.1) 35px,
                rgba(212, 175, 55, 0.1) 70px
              )`,
            }}
          />
        </div>

        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-gold/10 rounded-full blur-[120px]" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {/* Tiger Logo */}
          <motion.div
            ref={this.tigerRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-8"
          >
            <div className="w-32 h-32 md:w-48 md:h-48 mx-auto relative">
              {/* Tiger SVG Placeholder - Stylized Tiger Face */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-accent-gold"
                fill="currentColor"
              >
                {/* Tiger Face Outline */}
                <ellipse cx="50" cy="50" rx="45" ry="40" fill="none" stroke="currentColor" strokeWidth="2" />
                {/* Ears */}
                <path d="M15 30 Q10 10 25 20 Q30 25 25 35 Z" fill="currentColor" />
                <path d="M85 30 Q90 10 75 20 Q70 25 75 35 Z" fill="currentColor" />
                {/* Eyes */}
                <ellipse cx="35" cy="45" rx="8" ry="6" fill="currentColor" />
                <ellipse cx="65" cy="45" rx="8" ry="6" fill="currentColor" />
                <circle cx="35" cy="45" r="3" fill="#0A0A0A" />
                <circle cx="65" cy="45" r="3" fill="#0A0A0A" />
                {/* Nose */}
                <path d="M50 55 L45 65 L55 65 Z" fill="currentColor" />
                {/* Stripes */}
                <path d="M30 25 Q35 35 30 45" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M70 25 Q65 35 70 45" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M25 35 Q30 40 25 50" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M75 35 Q70 40 75 50" stroke="currentColor" strokeWidth="2" fill="none" />
                {/* Whiskers */}
                <line x1="25" y1="60" x2="40" y2="58" stroke="currentColor" strokeWidth="1" />
                <line x1="25" y1="65" x2="40" y2="65" stroke="currentColor" strokeWidth="1" />
                <line x1="75" y1="60" x2="60" y2="58" stroke="currentColor" strokeWidth="1" />
                <line x1="75" y1="65" x2="60" y2="65" stroke="currentColor" strokeWidth="1" />
                {/* Mouth */}
                <path d="M50 65 Q50 75 45 80" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M50 65 Q50 75 55 80" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              {/* Glow ring */}
              <div className="absolute inset-0 animate-glow rounded-full" />
            </div>
          </motion.div>

          {/* Club Name */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-wider text-white mb-4"
          >
            KABOONA
            <span className="block text-accent-gold">FC</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl text-white/70 font-light tracking-wide mb-12"
          >
            Pride of Sunway University
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/training-signup"
              className="px-8 py-4 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-gold/30"
            >
              Join Training
            </a>
            <a
              href="/fan-portal"
              className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:border-accent-gold hover:text-accent-gold transition-all duration-300"
            >
              Become a Fan
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-3 bg-accent-gold rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>
    );
  }
}

export default HeroSection;

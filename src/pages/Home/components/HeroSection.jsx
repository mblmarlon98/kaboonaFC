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
              <img src={`${import.meta.env.BASE_URL}kaboona-logo.png`} alt="Kaboona FC" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]" />
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
            Rise to Glory
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

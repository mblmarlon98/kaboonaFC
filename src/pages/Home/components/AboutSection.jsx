import React, { Component, createRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

class AboutSection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.contentRef = createRef();
  }

  componentDidMount() {
    if (this.contentRef.current) {
      gsap.fromTo(
        this.contentRef.current.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  }

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  render() {
    return (
      <section
        ref={this.sectionRef}
        className="py-20 md:py-32 bg-surface-dark-elevated relative overflow-hidden"
      >
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
          <div className="absolute inset-0 bg-gradient-to-l from-accent-gold to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div ref={this.contentRef} className="text-center">
            {/* Section Label */}
            <span className="inline-block px-4 py-1 bg-accent-gold/10 text-accent-gold text-sm font-semibold tracking-wider rounded-full mb-6">
              ABOUT THE CLUB
            </span>

            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
              Home of{' '}
              <span className="text-accent-gold">Kaboona FC</span>
            </h2>

            {/* Location */}
            <p className="text-xl md:text-2xl text-white/70 mb-8 font-light">
              Shah Alam, Malaysia
            </p>

            {/* Description */}
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-white/60 leading-relaxed mb-8">
                Kaboona FC represents the spirit and passion of our football community.
                Founded with purpose and driven by excellence, we embody the values of teamwork, dedication,
                and the relentless pursuit of greatness on and off the pitch.
              </p>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                {[
                  { value: '2019', label: 'Founded' },
                  { value: '25+', label: 'Players' },
                  { value: '3', label: 'Seasons' },
                  { value: '1', label: 'Family' },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="p-6 bg-surface-dark rounded-xl border border-white/5 hover:border-accent-gold/30 transition-colors duration-300"
                  >
                    <div className="text-3xl md:text-4xl font-display font-bold text-accent-gold mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-white/50 uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default AboutSection;

import React, { Component, createRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SPONSORS = [
  {
    name: 'AudioGuide',
    logo: '/sponsors/audioguide-logo.png',
    url: 'https://worldwideaudioguide.com',
    tagline: 'Free Audio Guides & Self-Guided Walking Tours Worldwide',
    description:
      'Explore 1,000+ cities with free audio guides for landmarks, museums, and hidden gems. Self-guided walking tours on your phone — no download needed.',
    tier: 'gold',
  },
];

class SponsorsSection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.cardsRef = createRef();
  }

  componentDidMount() {
    if (this.cardsRef.current) {
      gsap.fromTo(
        this.cardsRef.current.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.15,
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }
  }

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((t) => t.kill());
  }

  renderSponsorCard = (sponsor, index) => {
    return (
      <a
        key={index}
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <div className="relative bg-surface-dark-elevated rounded-2xl border border-white/10 hover:border-accent-gold/40 transition-all duration-500 overflow-hidden">
          {/* Tier badge */}
          <div className="absolute top-4 right-4 z-10">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-accent-gold/20 text-accent-gold rounded-full border border-accent-gold/30">
              Gold Sponsor
            </span>
          </div>

          {/* Main content */}
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-4 group-hover:border-accent-gold/30 transition-colors duration-300">
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2 group-hover:text-accent-gold transition-colors duration-300">
                {sponsor.name}
              </h3>
              <p className="text-accent-gold/80 text-sm font-semibold uppercase tracking-wider mb-4">
                {sponsor.tagline}
              </p>
              <p className="text-white/50 leading-relaxed mb-6 max-w-xl">
                {sponsor.description}
              </p>
              <span className="inline-flex items-center gap-2 text-accent-gold font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                Visit Website
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
            </div>
          </div>

          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.05) 0%, transparent 70%)',
            }}
          />
        </div>
      </a>
    );
  };

  render() {
    return (
      <section
        ref={this.sectionRef}
        className="py-20 md:py-28 bg-surface-dark relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section header */}
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-accent-gold/10 text-accent-gold text-xs font-semibold tracking-widest uppercase rounded-full mb-6">
              Our Partners
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Proudly Supported By
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto">
              We are grateful to the partners and sponsors who believe in our mission and help Kaboona FC grow.
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mt-6" />
          </div>

          {/* Sponsor cards */}
          <div ref={this.cardsRef} className="space-y-6">
            {SPONSORS.map((sponsor, i) => this.renderSponsorCard(sponsor, i))}
          </div>

          {/* Become a sponsor CTA */}
          <div className="text-center mt-14">
            <p className="text-white/30 text-sm mb-4">
              Interested in partnering with Kaboona FC?
            </p>
            <a
              href="/investors"
              className="inline-flex items-center gap-2 px-6 py-3 border border-accent-gold/30 text-accent-gold rounded-lg hover:bg-accent-gold/10 transition-colors duration-300 text-sm font-semibold"
            >
              Become a Sponsor
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    );
  }
}

export default SponsorsSection;

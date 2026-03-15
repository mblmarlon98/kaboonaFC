import React, { Component, createRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SPONSORS = [
  {
    name: 'World Wide AudioGuide',
    logo: '/sponsors/audioguide-logo.png',
    preview: '/sponsors/audioguide-og.jpg',
    url: 'https://www.worldwideaudioguide.com',
    tagline: 'Free Audio Guides & Self-Guided Walking Tours Worldwide',
    description:
      'Explore 1,000+ cities with free audio guides for landmarks, museums, and hidden gems. Self-guided walking tours on your phone — no download needed.',
    tier: 'gold',
    features: ['1,000+ Cities', 'AI-Powered Narration', 'Free to Use', 'No Download'],
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
        <div className="relative rounded-2xl overflow-hidden transition-all duration-500"
          style={{
            background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0f2e 50%, #0f0a1a 100%)',
            border: '1px solid rgba(147, 51, 234, 0.2)',
          }}
        >
          {/* Tier badge */}
          <div className="absolute top-4 right-4 z-20">
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full"
              style={{
                background: 'rgba(147, 51, 234, 0.2)',
                color: '#a855f7',
                border: '1px solid rgba(147, 51, 234, 0.3)',
              }}
            >
              Gold Sponsor
            </span>
          </div>

          {/* App preview image */}
          <div className="relative w-full overflow-hidden" style={{ maxHeight: '280px' }}>
            <img
              src={sponsor.preview}
              alt={`${sponsor.name} — app preview`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              style={{ minHeight: '200px' }}
            />
            {/* Gradient overlay bottom */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, #0f0a1a 0%, rgba(15,10,26,0.6) 40%, transparent 100%)',
              }}
            />
            {/* Purple tint overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: 'linear-gradient(135deg, rgba(147,51,234,0.3) 0%, transparent 60%)',
              }}
            />
          </div>

          {/* Content area */}
          <div className="relative p-6 md:p-8 -mt-12 z-10">
            <div className="flex items-start gap-5">
              {/* Mascot logo */}
              <div
                className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center p-2 transition-all duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #1a0f2e, #2d1b4e)',
                  border: '2px solid rgba(147, 51, 234, 0.4)',
                  boxShadow: '0 8px 32px rgba(147, 51, 234, 0.2)',
                }}
              >
                <img
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-xl md:text-2xl font-bold mb-1 transition-colors duration-300"
                  style={{ color: '#e9d5ff' }}
                >
                  <span className="group-hover:text-white transition-colors duration-300">
                    {sponsor.name}
                  </span>
                </h3>
                <p
                  className="text-xs md:text-sm font-semibold uppercase tracking-wider mb-3"
                  style={{ color: '#a855f7' }}
                >
                  {sponsor.tagline}
                </p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(233, 213, 255, 0.5)' }}>
                  {sponsor.description}
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mt-4 mb-5">
              {sponsor.features.map((feature, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: 'rgba(147, 51, 234, 0.1)',
                    color: '#c084fc',
                    border: '1px solid rgba(147, 51, 234, 0.2)',
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex items-center justify-between pt-4"
              style={{ borderTop: '1px solid rgba(147, 51, 234, 0.15)' }}
            >
              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(168, 85, 247, 0.6)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                worldwideaudioguide.com
              </div>
              <span
                className="inline-flex items-center gap-2 font-semibold text-sm group-hover:gap-3 transition-all duration-300"
                style={{ color: '#a855f7' }}
              >
                Explore App
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
            </div>
          </div>

          {/* Ambient purple glow on hover */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(147,51,234,0.08) 0%, transparent 70%)',
            }}
          />
          {/* Border glow on hover */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              boxShadow: '0 0 40px rgba(147, 51, 234, 0.15), inset 0 0 40px rgba(147, 51, 234, 0.05)',
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
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #9333ea 1px, transparent 1px)',
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

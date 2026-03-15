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
    features: ['1,000+ Cities', 'AI-Powered Narration', 'Free to Use'],
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

          {/* OG image — contains all branding */}
          <div className="relative w-full overflow-hidden rounded-2xl">
            <img
              src={sponsor.preview}
              alt={`${sponsor.name} — app preview`}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
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

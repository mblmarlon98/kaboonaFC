import React, { Component, createRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SPONSORS = {
  gold: [
    {
      name: 'World Wide AudioGuide',
      preview: '/sponsors/audioguide-og.jpg',
      url: 'https://www.worldwideaudioguide.com',
    },
  ],
  silver: [
    {
      name: 'MBL — Marlon Berdefy',
      preview: '/sponsors/mblmarlon-og.jpg',
      url: 'https://mblmarlon.com',
    },
  ],
  bronze: [
    {
      name: 'MBL',
      logo: '/sponsors/mbl-logo.png',
      url: 'https://mblmarlon.com',
    },
  ],
};

const TIER_CONFIG = {
  gold: { label: 'Gold Sponsor', color: '#D4AF37' },
  silver: { label: 'Silver Sponsor', color: '#C0C0C0' },
  bronze: { label: 'Bronze Sponsor', color: '#CD7F32' },
};

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

  renderTierBadge = (tier) => {
    const config = TIER_CONFIG[tier];
    return (
      <div className="absolute top-4 right-4 z-20">
        <span
          className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full"
          style={{
            background: `${config.color}20`,
            color: config.color,
            border: `1px solid ${config.color}40`,
          }}
        >
          {config.label}
        </span>
      </div>
    );
  };

  renderGoldSponsor = (sponsor, index) => {
    return (
      <a
        key={`gold-${index}`}
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <div
          className="relative rounded-2xl overflow-hidden transition-all duration-500"
          style={{
            background: 'linear-gradient(135deg, #0f0a1a 0%, #1a1005 50%, #0f0a1a 100%)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          }}
        >
          {this.renderTierBadge('gold')}

          <div className="relative w-full overflow-hidden rounded-2xl">
            <img
              src={sponsor.preview}
              alt={`${sponsor.name} — app preview`}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>

          {/* Gold glow on hover */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.15), inset 0 0 40px rgba(212, 175, 55, 0.05)',
            }}
          />
        </div>
      </a>
    );
  };

  renderSilverSponsor = (sponsor, index) => {
    return (
      <a
        key={`silver-${index}`}
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <div
          className="relative rounded-2xl overflow-hidden transition-all duration-500"
          style={{
            background: 'linear-gradient(135deg, #0f0a1a 0%, #151520 50%, #0f0a1a 100%)',
            border: '1px solid rgba(192, 192, 192, 0.2)',
          }}
        >
          {this.renderTierBadge('silver')}

          <div className="relative w-full overflow-hidden rounded-2xl">
            <img
              src={sponsor.preview}
              alt={`${sponsor.name} — app preview`}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>

          {/* Silver glow on hover */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(192,192,192,0.06) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              boxShadow: '0 0 30px rgba(192, 192, 192, 0.1), inset 0 0 30px rgba(192, 192, 192, 0.03)',
            }}
          />
        </div>
      </a>
    );
  };

  renderBronzeRow = (sponsors) => {
    return (
      <div className="flex items-center justify-center gap-6">
        {/* Left line */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />

        {/* Logos */}
        <div className="flex items-center gap-8">
          {sponsors.map((sponsor, index) => (
            <a
              key={`bronze-${index}`}
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-8 w-auto opacity-40 group-hover:opacity-80 transition-opacity duration-300"
              />
            </a>
          ))}
        </div>

        {/* Right line */}
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
      </div>
    );
  };

  render() {
    const goldSponsors = SPONSORS.gold || [];
    const silverSponsors = SPONSORS.silver || [];
    const bronzeSponsors = SPONSORS.bronze || [];

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

          {/* Tiered sponsor display */}
          <div ref={this.cardsRef} className="space-y-8">
            {/* Gold Tier — full width */}
            {goldSponsors.length > 0 && (
              <div className="space-y-4">
                {goldSponsors.map((s, i) => this.renderGoldSponsor(s, i))}
              </div>
            )}

            {/* Silver Tier — 2-col grid, centered if only one */}
            {silverSponsors.length > 0 && (
              <div
                className={`grid gap-4 ${
                  silverSponsors.length === 1
                    ? 'grid-cols-1 max-w-lg mx-auto'
                    : 'grid-cols-1 md:grid-cols-2'
                }`}
              >
                {silverSponsors.map((s, i) => this.renderSilverSponsor(s, i))}
              </div>
            )}

            {/* Bronze Tier — clean logo with lines */}
            {bronzeSponsors.length > 0 && (
              <div className="pt-4">
                {this.renderBronzeRow(bronzeSponsors)}
              </div>
            )}
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

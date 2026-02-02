import React, { Component } from 'react';
import { motion } from 'framer-motion';

const tiers = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 500,
    period: 'year',
    color: '#CD7F32',
    gradient: 'from-[#CD7F32] to-[#8B4513]',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    perks: [
      'Logo displayed on club website',
      'Mention in monthly newsletter',
      'Certificate of appreciation',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 1500,
    period: 'year',
    color: '#C0C0C0',
    gradient: 'from-[#C0C0C0] to-[#808080]',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    perks: [
      'All Bronze benefits',
      'Social media shoutout',
      'Logo on match day materials',
      'Quarterly progress reports',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    price: 5000,
    period: 'year',
    color: '#D4AF37',
    gradient: 'from-accent-gold to-[#B8972E]',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    ),
    popular: true,
    perks: [
      'All Silver benefits',
      'Small logo on team jersey',
      'Meet & greet with players',
      'Priority event invitations',
      '2 season passes',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: 15000,
    period: 'year',
    color: '#E5E4E2',
    gradient: 'from-[#E5E4E2] to-[#B8B8B8]',
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
      </svg>
    ),
    perks: [
      'All Gold benefits',
      'Match day pitch-side banner',
      'VIP access to all events',
      'Private team dinner annually',
      '4 season passes',
      'Sponsor recognition speech',
    ],
  },
];

class SponsorshipTiers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hoveredTier: null,
      selectedTier: null,
    };
  }

  handleTierHover = (tierId) => {
    this.setState({ hoveredTier: tierId });
  };

  handleTierLeave = () => {
    this.setState({ hoveredTier: null });
  };

  handleTierSelect = (tier) => {
    this.setState({ selectedTier: tier.id });
    // In production, this would open a sponsorship form or contact modal
    if (this.props.onSelectTier) {
      this.props.onSelectTier(tier);
    }
  };

  render() {
    const { hoveredTier } = this.state;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onMouseEnter={() => this.handleTierHover(tier.id)}
            onMouseLeave={this.handleTierLeave}
            className="relative"
          >
            {/* Popular Badge */}
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-4 py-1 bg-accent-gold text-black text-xs font-bold rounded-full uppercase tracking-wide">
                  Most Popular
                </span>
              </div>
            )}

            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`h-full bg-surface-dark-elevated rounded-xl border overflow-hidden transition-all duration-300 ${
                tier.popular
                  ? 'border-accent-gold shadow-lg shadow-accent-gold/20'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Tier Header */}
              <div
                className={`p-6 bg-gradient-to-br ${tier.gradient} relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="text-white">
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white">
                    {tier.name}
                  </h3>
                </div>
              </div>

              {/* Price */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-white/60">RM</span>
                  <span className="text-4xl font-display font-bold text-white">
                    {tier.price.toLocaleString()}
                  </span>
                  <span className="text-white/60">/{tier.period}</span>
                </div>
              </div>

              {/* Perks */}
              <div className="p-6">
                <ul className="space-y-3">
                  {tier.perks.map((perk, perkIndex) => (
                    <motion.li
                      key={perkIndex}
                      initial={{ opacity: 0.7 }}
                      animate={{
                        opacity: hoveredTier === tier.id ? 1 : 0.7,
                      }}
                      transition={{ duration: 0.2, delay: perkIndex * 0.05 }}
                      className="flex items-start gap-3 text-white/80"
                    >
                      <svg
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        style={{ color: tier.color }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm">{perk}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="p-6 pt-0">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => this.handleTierSelect(tier)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-accent-gold text-black hover:bg-accent-gold-light'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                  }`}
                >
                  Become a {tier.name} Sponsor
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    );
  }
}

export default SponsorshipTiers;

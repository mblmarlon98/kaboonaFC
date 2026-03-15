import React, { Component } from 'react';
import { motion } from 'framer-motion';
import DonationForm from './components/DonationForm';
import SponsorshipTiers from './components/SponsorshipTiers';
import CampaignCard from './components/CampaignCard';
import SupportersWall from './components/SupportersWall';

// Mock campaigns data
const mockCampaigns = [
  {
    id: 1,
    title: 'New Team Jerseys for 2024 Season',
    description: 'Help us get professional-grade jerseys for the upcoming tournament season. Every player deserves to look and feel their best on the pitch.',
    goalAmount: 8000,
    currentAmount: 5600,
    backers: 47,
    endDate: '2024-03-15',
    category: 'Equipment',
    image: null,
  },
  {
    id: 2,
    title: 'Training Equipment Upgrade',
    description: 'We need new training cones, balls, goal posts, and agility equipment to elevate our training sessions to the next level.',
    goalAmount: 5000,
    currentAmount: 2100,
    backers: 23,
    endDate: '2024-04-01',
    category: 'Training',
    image: null,
  },
  {
    id: 3,
    title: 'Away Tournament Fund',
    description: 'Support our team travel expenses for the Inter-University Championship in Penang. Includes transport, accommodation, and meals.',
    goalAmount: 12000,
    currentAmount: 9800,
    backers: 89,
    endDate: '2024-02-28',
    category: 'Travel',
    image: null,
  },
];

class Investors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      campaigns: mockCampaigns,
      isLoaded: false,
    };
  }

  componentDidMount() {
    this.setState({ isLoaded: true });
    window.scrollTo(0, 0);
  }

  handleSupportCampaign = (campaign) => {
    // In production, this would open a donation modal for the specific campaign
    console.log('Supporting campaign:', campaign.title);
  };

  handleSelectTier = (tier) => {
    // In production, this would open a sponsorship application form
    console.log('Selected tier:', tier.name);
  };

  render() {
    const { campaigns } = this.state;

    return (
      <div className="bg-surface-dark min-h-screen">
        {/* Hero Section */}
        <section className="relative py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-accent-gold/5 via-transparent to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-gold/5 rounded-full blur-[120px]" />
          </div>

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

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 mx-auto mb-8 bg-accent-gold/20 rounded-full flex items-center justify-center"
              >
                <svg
                  className="w-10 h-10 text-accent-gold"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </motion.div>

              <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6">
                Support{' '}
                <span className="text-accent-gold">Kaboona FC</span>
              </h1>
              <p className="text-xl text-white/60 max-w-3xl mx-auto mb-8">
                Join our community of supporters and help shape the future of Kaboona FC.
                Every contribution, big or small, makes a difference in our players' journey.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center gap-8 mt-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <div className="text-4xl font-display font-bold text-accent-gold">
                    RM 45K+
                  </div>
                  <div className="text-white/60 text-sm mt-1">Raised This Year</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center"
                >
                  <div className="text-4xl font-display font-bold text-accent-gold">
                    120+
                  </div>
                  <div className="text-white/60 text-sm mt-1">Proud Supporters</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-center"
                >
                  <div className="text-4xl font-display font-bold text-accent-gold">
                    15
                  </div>
                  <div className="text-white/60 text-sm mt-1">Corporate Sponsors</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Donation Section */}
        <section className="py-20 bg-surface-dark-elevated/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left - Info */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                  Make a <span className="text-accent-gold">Donation</span>
                </h2>
                <p className="text-white/60 mb-8">
                  Your one-time donation directly supports our players' development,
                  equipment needs, and tournament participation. Every contribution
                  helps us build a stronger team.
                </p>

                {/* Impact Cards */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-12 h-12 bg-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-accent-gold"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">RM 20</h4>
                      <p className="text-white/60 text-sm">
                        Provides a training ball for practice sessions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-12 h-12 bg-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-accent-gold"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">RM 100</h4>
                      <p className="text-white/60 text-sm">
                        Sponsors protective gear for one player
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="w-12 h-12 bg-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-accent-gold"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">RM 500</h4>
                      <p className="text-white/60 text-sm">
                        Covers tournament registration and travel
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right - Form */}
              <DonationForm />
            </div>
          </div>
        </section>

        {/* Sponsorship Tiers Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Sponsorship <span className="text-accent-gold">Tiers</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Become an official sponsor of Kaboona FC and enjoy exclusive benefits
                while supporting the next generation of football talent.
              </p>
            </motion.div>

            <SponsorshipTiers onSelectTier={this.handleSelectTier} />

            {/* Tier Benefits Explainer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-16"
            >
              <h3 className="text-2xl font-display font-bold text-white text-center mb-8">
                How Your <span className="text-accent-gold">Sponsorship</span> Appears
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Gold placement */}
                <div className="p-6 bg-surface-dark-elevated rounded-xl border border-accent-gold/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-accent-gold" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-accent-gold">Gold & Platinum</h4>
                  </div>
                  <p className="text-white/60 text-sm">
                    Full-width OG preview card on the homepage sponsors section with premium placement,
                    gold border accents, and maximum brand visibility.
                  </p>
                </div>

                {/* Silver placement */}
                <div className="p-6 bg-surface-dark-elevated rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#C0C0C0]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#C0C0C0]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-[#C0C0C0]">Silver</h4>
                  </div>
                  <p className="text-white/60 text-sm">
                    Half-width OG preview card in a 2-column grid below gold sponsors.
                    Your brand gets a rich visual card with hover effects.
                  </p>
                </div>

                {/* Bronze placement */}
                <div className="p-6 bg-surface-dark-elevated rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#CD7F32]/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#CD7F32]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-[#CD7F32]">Bronze</h4>
                  </div>
                  <p className="text-white/60 text-sm">
                    Logo displayed in the sponsors section footer row. Clean, professional
                    logo-only placement linking to your website.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sponsor Perks: Traffic Analytics Preview */}
        <section className="py-20 bg-surface-dark-elevated/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-1.5 bg-accent-gold/10 text-accent-gold text-xs font-semibold tracking-widest uppercase rounded-full mb-6">
                Exclusive Perk
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Site Traffic <span className="text-accent-gold">Insights</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Silver sponsors and above receive access to real-time site traffic analytics.
                See exactly how your sponsorship drives visibility and engagement.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Left — Feature cards */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Monthly Traffic Overview</h4>
                    <p className="text-white/50 text-sm">
                      See page views, unique visitors, and engagement metrics across the entire site.
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#C0C0C0]/10 text-[#C0C0C0] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#C0C0C0]/20">Silver+</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Full Analytics Dashboard</h4>
                    <p className="text-white/50 text-sm">
                      Detailed breakdowns by page, referrer, device, and location with trend graphs.
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-accent-gold/10 text-accent-gold text-[10px] font-bold uppercase tracking-wider rounded-full border border-accent-gold/20">Gold+</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Sponsor Click Tracking</h4>
                    <p className="text-white/50 text-sm">
                      Track how many visitors click your sponsor card and visit your website.
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-accent-gold/10 text-accent-gold text-[10px] font-bold uppercase tracking-wider rounded-full border border-accent-gold/20">Gold+</span>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-12 h-12 bg-accent-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Real-Time Insights</h4>
                    <p className="text-white/50 text-sm">
                      Live visitor counts, real-time click-through rates, and instant conversion data.
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-[#E5E4E2]/10 text-[#E5E4E2] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[#E5E4E2]/20">Platinum</span>
                  </div>
                </div>
              </motion.div>

              {/* Right — Graph preview mockup */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-surface-dark-elevated rounded-2xl border border-white/10 p-6 overflow-hidden"
              >
                {/* Dashboard header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-white font-semibold">Traffic Overview</h4>
                    <p className="text-white/40 text-xs mt-1">Last 30 days</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-xs font-medium">Live</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-accent-gold text-xl font-bold">12.4K</div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mt-1">Page Views</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-accent-gold text-xl font-bold">3.2K</div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mt-1">Visitors</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg">
                    <div className="text-accent-gold text-xl font-bold">847</div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mt-1">Sponsor Clicks</div>
                  </div>
                </div>

                {/* Chart mockup — SVG area graph */}
                <div className="relative h-40 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                    {/* Area fill */}
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,90 C30,85 60,70 100,60 C140,50 170,55 200,40 C230,25 260,30 300,20 C340,10 370,15 400,5 L400,120 L0,120 Z"
                      fill="url(#goldGrad)"
                    />
                    {/* Line */}
                    <path
                      d="M0,90 C30,85 60,70 100,60 C140,50 170,55 200,40 C230,25 260,30 300,20 C340,10 370,15 400,5"
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="2"
                    />
                    {/* Dots */}
                    <circle cx="100" cy="60" r="3" fill="#D4AF37" />
                    <circle cx="200" cy="40" r="3" fill="#D4AF37" />
                    <circle cx="300" cy="20" r="3" fill="#D4AF37" />
                  </svg>
                  {/* Y-axis labels */}
                  <div className="absolute top-0 left-0 h-full flex flex-col justify-between py-1">
                    <span className="text-[10px] text-white/20">500</span>
                    <span className="text-[10px] text-white/20">250</span>
                    <span className="text-[10px] text-white/20">0</span>
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between px-2">
                  <span className="text-[10px] text-white/20">Mar 1</span>
                  <span className="text-[10px] text-white/20">Mar 8</span>
                  <span className="text-[10px] text-white/20">Mar 15</span>
                  <span className="text-[10px] text-white/20">Mar 22</span>
                  <span className="text-[10px] text-white/20">Mar 30</span>
                </div>

                {/* Second mini chart — bar chart */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/60 text-xs font-medium">Top Pages</span>
                    <span className="text-white/30 text-[10px]">This month</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/60">Homepage</span>
                        <span className="text-white/40">4,230</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-gold rounded-full" style={{ width: '85%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/60">Our Team</span>
                        <span className="text-white/40">2,890</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-gold/70 rounded-full" style={{ width: '62%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/60">Sponsors</span>
                        <span className="text-white/40">1,740</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-gold/50 rounded-full" style={{ width: '42%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white/60">Fan Portal</span>
                        <span className="text-white/40">1,120</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-gold/30 rounded-full" style={{ width: '28%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blur overlay */}
                <div className="absolute inset-0 flex items-end justify-center rounded-2xl" style={{ background: 'linear-gradient(to top, rgba(15,10,26,0.95) 0%, rgba(15,10,26,0.7) 30%, transparent 60%)' }}>
                  <div className="text-center pb-8">
                    <svg className="w-8 h-8 text-accent-gold mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-white/80 font-semibold text-sm mb-1">Sponsor-Only Dashboard</p>
                    <p className="text-white/40 text-xs">Available for Silver tier and above</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Investor roles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-12 p-6 bg-surface-dark-elevated rounded-2xl border border-accent-gold/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-lg mb-2">
                    Exclusive <span className="text-accent-gold">Investor Role</span>
                  </h4>
                  <p className="text-white/50 text-sm leading-relaxed">
                    All sponsors receive a verified Investor role on their Kaboona FC profile, granting access to
                    exclusive investor channels, behind-the-scenes updates, and priority communication with club management.
                    Higher tiers unlock additional privileges including the traffic analytics dashboard, sponsor click tracking,
                    and real-time site performance insights.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Crowdfunding Campaigns Section */}
        <section className="py-20 bg-surface-dark-elevated/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Active <span className="text-accent-gold">Campaigns</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Support specific initiatives and see exactly how your contribution
                makes an impact on our team.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign, index) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  index={index}
                  onSupport={this.handleSupportCampaign}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Wall of Supporters Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Wall of <span className="text-accent-gold">Supporters</span>
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Meet the amazing individuals and organizations who believe in our mission
                and support our journey.
              </p>
            </motion.div>

            <SupportersWall />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-t from-accent-gold/10 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Ready to Make a <span className="text-accent-gold">Difference</span>?
              </h2>
              <p className="text-white/60 mb-8">
                Whether you donate RM 20 or become a Platinum sponsor, you are part of our story.
                Join the Kaboona FC family today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a
                  href="#donate"
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-all duration-300 hover:shadow-lg hover:shadow-accent-gold/30"
                >
                  Donate Now
                </motion.a>
                <motion.a
                  href="mailto:sponsors@kaboona.com"
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:border-accent-gold hover:text-accent-gold transition-all duration-300"
                >
                  Contact for Sponsorship
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }
}

export default Investors;

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

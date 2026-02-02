import React, { Component } from 'react';
import { motion } from 'framer-motion';

class CampaignCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
    };
  }

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  calculateProgress = () => {
    const { campaign } = this.props;
    return Math.min((campaign.currentAmount / campaign.goalAmount) * 100, 100);
  };

  formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  calculateDaysLeft = () => {
    const { campaign } = this.props;
    const endDate = new Date(campaign.endDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  render() {
    const { campaign, index = 0, onSupport } = this.props;
    const { isHovered } = this.state;
    const progress = this.calculateProgress();
    const daysLeft = this.calculateDaysLeft();

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        className="group"
      >
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="bg-surface-dark-elevated rounded-xl overflow-hidden border border-white/10 hover:border-accent-gold/30 transition-all duration-300"
        >
          {/* Campaign Image */}
          <div className="relative h-48 overflow-hidden">
            {campaign.image ? (
              <img
                src={campaign.image}
                alt={campaign.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent-gold/20 to-surface-dark flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-accent-gold/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Days Left Badge */}
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  daysLeft <= 7
                    ? 'bg-red-500/90 text-white'
                    : daysLeft <= 14
                    ? 'bg-yellow-500/90 text-black'
                    : 'bg-accent-gold/90 text-black'
                }`}
              >
                {daysLeft === 0 ? 'Ends Today' : `${daysLeft} days left`}
              </span>
            </div>

            {/* Category Badge */}
            {campaign.category && (
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                  {campaign.category}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-display font-bold text-white mb-2 line-clamp-2">
              {campaign.title}
            </h3>
            <p className="text-white/60 text-sm mb-4 line-clamp-2">
              {campaign.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-accent-gold font-bold">
                  {this.formatCurrency(campaign.currentAmount)}
                </span>
                <span className="text-white/40 text-sm">
                  of {this.formatCurrency(campaign.goalAmount)}
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-accent-gold to-accent-gold-light rounded-full"
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-white/60 text-xs">
                  {Math.round(progress)}% funded
                </span>
                <span className="text-white/60 text-xs">
                  {campaign.backers} backers
                </span>
              </div>
            </div>

            {/* Support Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onSupport && onSupport(campaign)}
              className="w-full py-3 px-4 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors"
            >
              Support This Campaign
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
}

export default CampaignCard;

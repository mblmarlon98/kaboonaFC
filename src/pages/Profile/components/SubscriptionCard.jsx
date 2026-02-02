import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Subscription status card showing plan type, billing info, and manage options
 */
class SubscriptionCard extends Component {
  getPlanDetails = () => {
    const { plan } = this.props;

    const plans = {
      free: {
        name: 'Free Tier',
        price: 0,
        features: ['Basic profile', 'View team stats', 'Limited features'],
        color: 'from-gray-500 to-gray-600',
        badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      },
      basic: {
        name: 'Basic Player',
        price: 9.99,
        features: ['Full profile', 'Training signup', 'Match notifications', 'Basic stats'],
        color: 'from-blue-500 to-blue-600',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      },
      pro: {
        name: 'Pro Player',
        price: 19.99,
        features: ['Everything in Basic', 'Priority training slots', 'Video analysis', 'Performance reports'],
        color: 'from-purple-500 to-purple-600',
        badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      },
      elite: {
        name: 'Elite Member',
        price: 49.99,
        features: ['Everything in Pro', '1-on-1 coaching', 'Exclusive events', 'Premium merchandise', 'VIP support'],
        color: 'from-accent-gold to-accent-gold-dark',
        badge: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30',
      },
    };

    return plans[plan] || plans.basic;
  };

  formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  render() {
    const {
      plan = 'basic',
      nextBillingDate = '2024-02-15',
      onManageSubscription,
    } = this.props;

    const planDetails = this.getPlanDetails();

    return (
      <motion.div
        className="w-full bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Header with gradient */}
        <div className={`h-2 bg-gradient-to-r ${planDetails.color}`} />

        <div className="p-6">
          {/* Plan Info */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                  Subscription
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${planDetails.badge}`}>
                  {planDetails.name}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-white">
                  ${planDetails.price.toFixed(2)}
                </span>
                <span className="text-white/50">/month</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Active</span>
            </div>
          </div>

          {/* Features */}
          <div className="mb-6">
            <h4 className="text-sm text-white/50 uppercase tracking-wider mb-3">Plan Features</h4>
            <ul className="space-y-2">
              {planDetails.features.map((feature, index) => (
                <motion.li
                  key={feature}
                  className="flex items-center gap-2 text-white/80"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                >
                  <svg className="w-4 h-4 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Billing Info */}
          <div className="p-4 bg-surface-dark rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Next billing date</p>
                <p className="text-white font-medium">{this.formatDate(nextBillingDate)}</p>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 text-white/40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                <span className="text-white/60 text-sm">**** 4242</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={onManageSubscription}
              className="flex-1 px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Manage Subscription
            </motion.button>
            <motion.button
              className="px-6 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Invoices
            </motion.button>
          </div>

          {/* Upgrade Prompt (if not elite) */}
          {plan !== 'elite' && (
            <motion.div
              className="mt-6 p-4 bg-accent-gold/10 border border-accent-gold/30 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-accent-gold font-medium">Upgrade to Elite</p>
                  <p className="text-white/60 text-sm">Get exclusive 1-on-1 coaching and VIP benefits</p>
                </div>
                <button className="text-accent-gold hover:text-accent-gold-light font-medium text-sm">
                  Learn More
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }
}

export default SubscriptionCard;

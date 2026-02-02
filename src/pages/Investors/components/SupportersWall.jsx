import React, { Component } from 'react';
import { motion } from 'framer-motion';

// Mock supporters data
const mockSupporters = [
  { id: 1, name: 'Ahmad Razak', tier: 'platinum', avatar: null, amount: 15000 },
  { id: 2, name: 'Sarah Lim', tier: 'gold', avatar: null, amount: 5000 },
  { id: 3, name: 'Tech Solutions Sdn Bhd', tier: 'gold', avatar: null, amount: 5000 },
  { id: 4, name: 'Muhammad Ali', tier: 'silver', avatar: null, amount: 1500 },
  { id: 5, name: 'Mei Ling Wong', tier: 'silver', avatar: null, amount: 1500 },
  { id: 6, name: 'Sunrise Cafe', tier: 'silver', avatar: null, amount: 1500 },
  { id: 7, name: 'Raj Kumar', tier: 'bronze', avatar: null, amount: 500 },
  { id: 8, name: 'Lisa Tan', tier: 'bronze', avatar: null, amount: 500 },
  { id: 9, name: 'David Chen', tier: 'bronze', avatar: null, amount: 500 },
  { id: 10, name: 'Aisha Ibrahim', tier: 'bronze', avatar: null, amount: 500 },
  { id: 11, name: 'SportGear MY', tier: 'gold', avatar: null, amount: 5000 },
  { id: 12, name: 'Anonymous', tier: 'bronze', avatar: null, amount: 500 },
  { id: 13, name: 'John Doe', tier: 'silver', avatar: null, amount: 1500 },
  { id: 14, name: 'Maria Santos', tier: 'bronze', avatar: null, amount: 500 },
  { id: 15, name: 'Fitness First KL', tier: 'platinum', avatar: null, amount: 15000 },
  { id: 16, name: 'Kevin Lee', tier: 'bronze', avatar: null, amount: 500 },
];

const tierConfig = {
  platinum: {
    color: '#E5E4E2',
    gradient: 'from-[#E5E4E2] to-[#B8B8B8]',
    bgColor: 'bg-[#E5E4E2]/10',
    borderColor: 'border-[#E5E4E2]/30',
    label: 'Platinum',
    order: 1,
  },
  gold: {
    color: '#D4AF37',
    gradient: 'from-accent-gold to-[#B8972E]',
    bgColor: 'bg-accent-gold/10',
    borderColor: 'border-accent-gold/30',
    label: 'Gold',
    order: 2,
  },
  silver: {
    color: '#C0C0C0',
    gradient: 'from-[#C0C0C0] to-[#808080]',
    bgColor: 'bg-[#C0C0C0]/10',
    borderColor: 'border-[#C0C0C0]/30',
    label: 'Silver',
    order: 3,
  },
  bronze: {
    color: '#CD7F32',
    gradient: 'from-[#CD7F32] to-[#8B4513]',
    bgColor: 'bg-[#CD7F32]/10',
    borderColor: 'border-[#CD7F32]/30',
    label: 'Bronze',
    order: 4,
  },
};

class SupportersWall extends Component {
  constructor(props) {
    super(props);
    this.state = {
      supporters: [],
      filterTier: 'all',
      isLoading: true,
    };
  }

  componentDidMount() {
    // Simulate loading supporters
    setTimeout(() => {
      this.setState({
        supporters: mockSupporters,
        isLoading: false,
      });
    }, 500);
  }

  getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  getSortedSupporters = () => {
    const { supporters, filterTier } = this.state;
    let filtered = supporters;

    if (filterTier !== 'all') {
      filtered = supporters.filter((s) => s.tier === filterTier);
    }

    return filtered.sort((a, b) => {
      return tierConfig[a.tier].order - tierConfig[b.tier].order;
    });
  };

  handleFilterChange = (tier) => {
    this.setState({ filterTier: tier });
  };

  render() {
    const { filterTier, isLoading } = this.state;
    const sortedSupporters = this.getSortedSupporters();

    return (
      <div>
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => this.handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              filterTier === 'all'
                ? 'bg-accent-gold text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            All Supporters
          </motion.button>
          {Object.entries(tierConfig).map(([key, config]) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.95 }}
              onClick={() => this.handleFilterChange(key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterTier === key
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              style={{
                borderColor: filterTier === key ? config.color : 'transparent',
                borderWidth: '1px',
              }}
            >
              {config.label}
            </motion.button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-dark-elevated rounded-xl p-4 border border-white/10 animate-pulse"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-white/10 mb-3" />
                <div className="h-4 bg-white/10 rounded mb-2" />
                <div className="h-3 bg-white/5 rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          /* Supporters Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedSupporters.map((supporter, index) => {
              const config = tierConfig[supporter.tier];
              return (
                <motion.div
                  key={supporter.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className={`bg-surface-dark-elevated rounded-xl p-4 border ${config.borderColor} hover:shadow-lg transition-all duration-300 text-center group cursor-pointer`}
                >
                  {/* Avatar */}
                  <div className="relative mx-auto mb-3">
                    {supporter.avatar ? (
                      <img
                        src={supporter.avatar}
                        alt={supporter.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${config.bgColor}`}
                        style={{ color: config.color }}
                      >
                        {this.getInitials(supporter.name)}
                      </div>
                    )}
                    {/* Tier Badge */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Name */}
                  <h4 className="text-sm font-medium text-white truncate mb-1 group-hover:text-accent-gold transition-colors">
                    {supporter.name}
                  </h4>

                  {/* Tier Label */}
                  <span
                    className="text-xs font-medium"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Stats Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {Object.entries(tierConfig).map(([key, config]) => {
            const count = mockSupporters.filter((s) => s.tier === key).length;
            const total = mockSupporters
              .filter((s) => s.tier === key)
              .reduce((sum, s) => sum + s.amount, 0);
            return (
              <div
                key={key}
                className={`${config.bgColor} rounded-xl p-4 border ${config.borderColor} text-center`}
              >
                <div
                  className="text-2xl font-display font-bold"
                  style={{ color: config.color }}
                >
                  {count}
                </div>
                <div className="text-white/60 text-sm">{config.label} Sponsors</div>
                <div className="text-white/40 text-xs mt-1">
                  RM {total.toLocaleString()}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    );
  }
}

export default SupportersWall;

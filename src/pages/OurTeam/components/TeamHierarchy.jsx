import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { PlayerModalContext } from '../../../components/shared/PlayerModalContext';

/**
 * Team Hierarchy section showing Owner and Coaches
 * Owner at top with crown icon and FIFA icon-style card (white/cream like legends)
 * Coaches below connected with tree lines
 */
class TeamHierarchy extends Component {
  static contextType = PlayerModalContext;
  constructor(props) {
    super(props);
    this.state = {
      hoveredId: null,
    };
  }

  handleMouseEnter = (id) => {
    this.setState({ hoveredId: id });
  };

  handleMouseLeave = () => {
    this.setState({ hoveredId: null });
  };

  handleOwnerClick = (owner) => {
    if (owner.isPlaceholder) return;

    const { openPlayerModal } = this.context || {};
    if (openPlayerModal) {
      // Convert owner to player-like format for modal
      const ownerAsPlayer = {
        ...owner,
        position: 'Owner',
        number: '',
        isOwner: true,
      };
      openPlayerModal(ownerAsPlayer);
    }
  };

  renderOwnerCard = (owner) => {
    const { hoveredId } = this.state;
    const isHovered = hoveredId === owner.id;
    const isClickable = !owner.isPlaceholder;

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <motion.div
          className={`relative mx-auto max-w-md ${isClickable ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => this.handleMouseEnter(owner.id)}
          onMouseLeave={this.handleMouseLeave}
          onClick={() => this.handleOwnerClick(owner)}
          whileHover={{ y: -5 }}
        >
          {/* FIFA Icon-style Card - Cream/White like Legends */}
          <div
            className={`relative p-1 rounded-2xl transition-all duration-300 ${
              isHovered
                ? 'shadow-[0_0_40px_rgba(255,254,240,0.6)]'
                : 'shadow-[0_0_20px_rgba(255,254,240,0.3)]'
            }`}
            style={{
              background: 'linear-gradient(135deg, #F5F5DC 0%, #E8E4C9 25%, #FFFEF0 50%, #E8E4C9 75%, #F5F5DC 100%)',
            }}
          >
            <div className="bg-surface-dark-elevated rounded-xl overflow-hidden relative">
              {/* Decorative Icon Pattern */}
              <svg
                className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
                viewBox="0 0 100 140"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="ownerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E8E4C9" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#D4CEB8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#E8E4C9" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <path d="M-10,70 Q30,30 50,70 T110,70" fill="none" stroke="url(#ownerGradient)" strokeWidth="0.5" />
                <path d="M-10,80 Q30,40 50,80 T110,80" fill="none" stroke="url(#ownerGradient)" strokeWidth="0.3" />
                <circle cx="10" cy="10" r="8" fill="none" stroke="url(#ownerGradient)" strokeWidth="0.3" />
                <circle cx="90" cy="10" r="8" fill="none" stroke="url(#ownerGradient)" strokeWidth="0.3" />
              </svg>

              {/* Crown Icon */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-full shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F5F5DC 0%, #E8E4C9 100%)' }}
                >
                  <svg className="w-7 h-7 text-surface-dark" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.5 19h19v2h-19v-2zm1.75-6.5l3.75 3.75L12 12l4 4.25 3.75-3.75L21 15l-1.5 3h-15L3 15l1.25-2.5zM12 2l4.5 7.5H7.5L12 2z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="pt-8 pb-6 px-6 text-center relative">
                {/* Avatar */}
                <div
                  className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4"
                  style={{ borderColor: '#E8E4C9' }}
                >
                  {owner.image ? (
                    <img
                      src={owner.image}
                      alt={owner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #F5F5DC 0%, #E8E4C9 100%)' }}
                    >
                      <span className="text-4xl font-display font-bold text-surface-dark">
                        {owner.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <span
                  className="inline-block px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider rounded-full"
                  style={{ background: 'rgba(232, 228, 201, 0.2)', color: '#E8E4C9' }}
                >
                  Team Owner
                </span>
                <h3 className="text-2xl font-display font-bold text-white mb-2">
                  {owner.name}
                </h3>
                {owner.bio && (
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {owner.bio}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  renderCoachCard = (coach, index, total) => {
    const { hoveredId } = this.state;
    const isHovered = hoveredId === coach.id;

    return (
      <motion.div
        key={coach.id}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 * index }}
        className="relative"
        onMouseEnter={() => this.handleMouseEnter(coach.id)}
        onMouseLeave={this.handleMouseLeave}
      >
        <motion.div
          className={`relative bg-surface-dark-elevated rounded-xl overflow-hidden border transition-all duration-300 ${
            isHovered
              ? 'border-accent-gold shadow-[0_0_25px_rgba(212,175,55,0.4)]'
              : 'border-surface-dark-hover'
          }`}
          whileHover={{ y: -5 }}
        >
          {/* Content */}
          <div className="p-5">
            {/* Avatar */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-2 border-accent-gold/50">
              {coach.image ? (
                <img
                  src={coach.image}
                  alt={coach.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-dark to-surface-dark-elevated flex items-center justify-center">
                  <span className="text-2xl font-display font-bold text-accent-gold">
                    {coach.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center">
              <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-semibold uppercase tracking-wider bg-accent-gold/10 text-accent-gold rounded-full">
                {coach.role || 'Coach'}
              </span>
              <h4 className="text-lg font-display font-bold text-white mb-1">
                {coach.name}
              </h4>
              {coach.specialization && (
                <p className="text-gray-500 text-xs">
                  {coach.specialization}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  renderTreeLines = (coachCount) => {
    // SVG tree lines connecting owner to coaches
    return (
      <div className="relative h-16 flex justify-center">
        <svg
          className="absolute top-0 w-full max-w-3xl h-16"
          viewBox="0 0 600 60"
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Vertical line from owner */}
          <motion.line
            x1="300"
            y1="0"
            x2="300"
            y2="30"
            stroke="#D4AF37"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          />

          {/* Horizontal line */}
          <motion.line
            x1={coachCount === 1 ? 300 : 100}
            y1="30"
            x2={coachCount === 1 ? 300 : 500}
            y2="30"
            stroke="#D4AF37"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />

          {/* Vertical lines to coaches */}
          {coachCount >= 1 && (
            <motion.line
              x1={coachCount === 1 ? 300 : 100}
              y1="30"
              x2={coachCount === 1 ? 300 : 100}
              y2="60"
              stroke="#D4AF37"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.6 }}
            />
          )}
          {coachCount >= 2 && (
            <motion.line
              x1="300"
              y1="30"
              x2="300"
              y2="60"
              stroke="#D4AF37"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.7 }}
            />
          )}
          {coachCount >= 3 && (
            <motion.line
              x1="500"
              y1="30"
              x2="500"
              y2="60"
              stroke="#D4AF37"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.8 }}
            />
          )}
        </svg>
      </div>
    );
  };

  render() {
    const { owner, coaches } = this.props;

    return (
      <section className="py-16 px-4 relative bg-surface-dark">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #D4AF37 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Club Leadership
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto" />
          </motion.div>

          {/* Owner Card */}
          {owner && this.renderOwnerCard(owner)}

          {/* Tree Lines */}
          {coaches && coaches.length > 0 && this.renderTreeLines(coaches.length)}

          {/* Coaches Row */}
          {coaches && coaches.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {coaches.map((coach, index) =>
                this.renderCoachCard(coach, index, coaches.length)
              )}
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default TeamHierarchy;

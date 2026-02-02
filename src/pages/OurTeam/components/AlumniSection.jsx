import React, { Component } from 'react';
import { motion } from 'framer-motion';
import PlayerCard from './PlayerCard';

/**
 * Alumni/Legends section with horizontal carousel
 * Features greyscale/sepia tint on cards
 */
class AlumniSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scrollPosition: 0,
      canScrollLeft: false,
      canScrollRight: true,
    };
    this.carouselRef = React.createRef();
  }

  componentDidMount() {
    this.checkScrollButtons();
    if (this.carouselRef.current) {
      this.carouselRef.current.addEventListener('scroll', this.handleScroll);
    }
  }

  componentWillUnmount() {
    if (this.carouselRef.current) {
      this.carouselRef.current.removeEventListener('scroll', this.handleScroll);
    }
  }

  handleScroll = () => {
    this.checkScrollButtons();
  };

  checkScrollButtons = () => {
    if (this.carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = this.carouselRef.current;
      this.setState({
        canScrollLeft: scrollLeft > 0,
        canScrollRight: scrollLeft < scrollWidth - clientWidth - 10,
      });
    }
  };

  scroll = (direction) => {
    if (this.carouselRef.current) {
      const scrollAmount = 300;
      const newPosition = this.carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      this.carouselRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
    }
  };

  calculateOverall = (player) => {
    const { position } = player;

    if (position === 'GK') {
      const { diving, handling, kicking, reflexes, gk_speed, gk_positioning } = player.stats;
      return Math.round((diving + handling + kicking + reflexes + gk_speed + gk_positioning) / 6);
    } else {
      const { pace, shooting, passing, dribbling, defending, physical } = player.stats;
      return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
    }
  };

  renderAlumniCard = (player, index) => {
    const { onPlayerClick } = this.props;

    return (
      <motion.div
        key={player.id}
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="flex-shrink-0"
      >
        {/* Sepia/Greyscale wrapper */}
        <div className="relative group">
          {/* Sepia overlay */}
          <div className="filter sepia brightness-75 grayscale-[30%] group-hover:sepia-0 group-hover:brightness-100 group-hover:grayscale-0 transition-all duration-500">
            <PlayerCard
              player={player}
              size="normal"
              onClick={onPlayerClick}
            />
          </div>

          {/* "Legend" badge */}
          <div className="absolute -top-2 -right-2 z-10">
            <div className="w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>

          {/* Years active badge */}
          {player.yearsActive && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] bg-black/80 text-accent-gold px-2 py-1 rounded-full whitespace-nowrap">
                {player.yearsActive}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  render() {
    const { alumni } = this.props;
    const { canScrollLeft, canScrollRight } = this.state;

    if (!alumni || alumni.length === 0) {
      return null;
    }

    return (
      <section className="py-16 px-4 relative overflow-hidden bg-gradient-to-b from-surface-dark to-surface-dark-elevated">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-accent-gold" />
              <svg className="w-8 h-8 text-accent-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-accent-gold" />
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
              Legends of Kaboona
            </h2>
            <p className="text-gray-400">
              The players who wrote our history
            </p>
          </motion.div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Scroll Buttons */}
            {canScrollLeft && (
              <button
                onClick={() => this.scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-surface-dark-elevated/90 rounded-full border border-accent-gold/30 text-accent-gold hover:bg-accent-gold hover:text-black transition-all shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {canScrollRight && (
              <button
                onClick={() => this.scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-surface-dark-elevated/90 rounded-full border border-accent-gold/30 text-accent-gold hover:bg-accent-gold hover:text-black transition-all shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Gradient Fade Edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-surface-dark to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-surface-dark-elevated to-transparent z-10 pointer-events-none" />

            {/* Carousel */}
            <div
              ref={this.carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-8"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {alumni.map((player, index) => this.renderAlumniCard(player, index))}
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default AlumniSection;

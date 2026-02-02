import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Product card for affiliate products
 * Links to external affiliate sites
 */
class ProductCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
      imageLoaded: false,
      imageError: false,
    };
  }

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  handleImageLoad = () => {
    this.setState({ imageLoaded: true });
  };

  handleImageError = () => {
    this.setState({ imageError: true });
  };

  getBrandColor = (brand) => {
    const brandColors = {
      Nike: '#F97316',
      Adidas: '#3B82F6',
      Puma: '#EF4444',
      Amazon: '#F59E0B',
      'Under Armour': '#DC2626',
      Mitre: '#22C55E',
    };
    return brandColors[brand] || '#D4AF37';
  };

  render() {
    const { product, index = 0 } = this.props;
    const { isHovered, imageLoaded, imageError } = this.state;
    const { name, brand, image, price, affiliateUrl, category } = product;
    const brandColor = this.getBrandColor(brand);

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        whileHover={{ y: -8 }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        className="group relative"
      >
        {/* Card Container */}
        <div
          className={`
            relative bg-surface-dark-elevated rounded-xl overflow-hidden
            border border-gray-800 transition-all duration-300
            ${isHovered ? 'border-accent-gold/50 shadow-[0_0_30px_rgba(212,175,55,0.2)]' : ''}
          `}
        >
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Loading Skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 animate-pulse bg-surface-dark-hover" />
            )}

            {/* Product Image */}
            {!imageError ? (
              <img
                src={image}
                alt={name}
                className={`
                  w-full h-full object-cover transition-transform duration-500
                  ${isHovered ? 'scale-110' : 'scale-100'}
                  ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                `}
                onLoad={this.handleImageLoad}
                onError={this.handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-dark-hover">
                <span className="text-4xl text-gray-600">
                  {category === 'boots' && '👟'}
                  {category === 'training' && '🏃'}
                  {category === 'footballs' && '⚽'}
                  {category === 'goalkeeper' && '🧤'}
                  {category === 'accessories' && '🎒'}
                  {!['boots', 'training', 'footballs', 'goalkeeper', 'accessories'].includes(category) && '📦'}
                </span>
              </div>
            )}

            {/* Brand Badge */}
            <div
              className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {brand}
            </div>

            {/* Hover Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            />
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Category Tag */}
            <span className="text-xs text-accent-gold uppercase tracking-wider">
              {category}
            </span>

            {/* Product Name */}
            <h3 className="mt-1 text-lg font-semibold text-white line-clamp-2 min-h-[3.5rem]">
              {name}
            </h3>

            {/* Price */}
            {price && (
              <p className="mt-2 text-xl font-display font-bold text-accent-gold">
                ${price.toFixed(2)}
              </p>
            )}

            {/* Shop Now Button */}
            <motion.a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                mt-4 w-full flex items-center justify-center gap-2
                px-4 py-3 rounded-lg font-semibold
                transition-all duration-300
                ${
                  isHovered
                    ? 'bg-accent-gold text-black'
                    : 'bg-surface-dark-hover text-white border border-gray-700'
                }
              `}
            >
              <span>Shop Now</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </motion.a>
          </div>
        </div>
      </motion.div>
    );
  }
}

export default ProductCard;

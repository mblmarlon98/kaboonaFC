import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Merchandise card for Kaboona FC products
 * Includes size selector, jersey customization (number + name), and add to cart
 */
class MerchCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false,
      selectedSize: null,
      imageLoaded: false,
      imageError: false,
      showSizeError: false,
      jerseyNumber: '',
      jerseyName: '',
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

  handleSizeSelect = (size) => {
    this.setState({ selectedSize: size, showSizeError: false });
  };

  handleJerseyNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    this.setState({ jerseyNumber: val });
  };

  handleJerseyNameChange = (e) => {
    const val = e.target.value.toUpperCase().slice(0, 15);
    this.setState({ jerseyName: val });
  };

  handleAddToCart = () => {
    const { product, onAddToCart } = this.props;
    const { selectedSize, jerseyNumber, jerseyName } = this.state;

    if (!selectedSize) {
      this.setState({ showSizeError: true });
      return;
    }

    onAddToCart({
      ...product,
      size: selectedSize,
      jerseyNumber: jerseyNumber || null,
      jerseyName: jerseyName || null,
    });

    this.setState({ selectedSize: null, jerseyNumber: '', jerseyName: '' });
  };

  render() {
    const { product, index = 0 } = this.props;
    const { isHovered, selectedSize, imageLoaded, imageError, showSizeError, jerseyNumber, jerseyName } = this.state;
    const { name, price, currency, image, sizes, category, badge, customizable } = product;

    const currencySymbol = currency === 'RM' ? 'RM' : '$';

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
            border transition-all duration-300
            ${
              isHovered
                ? 'border-accent-gold shadow-[0_0_30px_rgba(212,175,55,0.3)]'
                : 'border-gray-800'
            }
          `}
        >
          {/* Badge */}
          {badge && (
            <div className="absolute top-3 right-3 z-10 px-3 py-1 bg-accent-gold text-black text-xs font-bold rounded-full">
              {badge}
            </div>
          )}

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
              <div className="w-full h-full flex flex-col items-center justify-center bg-surface-dark-hover">
                <span className="text-5xl text-accent-gold/30 font-display">KFC</span>
                <span className="text-sm text-gray-500 mt-2">{category}</span>
              </div>
            )}

            {/* Hover Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            />
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Category */}
            <span className="text-xs text-accent-gold uppercase tracking-wider">
              {category}
            </span>

            {/* Product Name */}
            <h3 className="mt-1 text-lg font-semibold text-white line-clamp-2 min-h-[3.5rem]">
              {name}
            </h3>

            {/* Price */}
            <p className="mt-2 text-2xl font-display font-bold text-accent-gold">
              {currencySymbol} {price.toFixed(2)}
            </p>

            {/* Size Selector */}
            {sizes && sizes.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Select Size</span>
                  {showSizeError && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-500"
                    >
                      Please select a size
                    </motion.span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => this.handleSizeSelect(size)}
                      className={`
                        px-3 py-1.5 text-sm rounded-lg transition-all duration-200
                        ${
                          selectedSize === size
                            ? 'bg-accent-gold text-black font-semibold'
                            : 'bg-surface-dark-hover text-gray-300 hover:bg-surface-dark hover:text-white border border-gray-700'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Jersey Customization */}
            {customizable && (
              <div className="mt-4 space-y-3">
                <span className="text-sm text-gray-400">Customize Your Jersey</span>
                <div className="flex gap-3">
                  <div className="w-20">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="#"
                      value={jerseyNumber}
                      onChange={this.handleJerseyNumberChange}
                      maxLength={2}
                      className="w-full px-3 py-2 bg-surface-dark-hover border border-gray-700 rounded-lg text-white text-center text-lg font-bold placeholder-gray-600 focus:outline-none focus:border-accent-gold transition-colors"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block text-center">Number</span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="NAME ON JERSEY"
                      value={jerseyName}
                      onChange={this.handleJerseyNameChange}
                      maxLength={15}
                      className="w-full px-3 py-2 bg-surface-dark-hover border border-gray-700 rounded-lg text-white uppercase tracking-wider placeholder-gray-600 focus:outline-none focus:border-accent-gold transition-colors"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">Name on back</span>
                  </div>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={this.handleAddToCart}
              className={`
                mt-4 w-full flex items-center justify-center gap-2
                px-4 py-3 rounded-lg font-semibold
                transition-all duration-300
                ${
                  isHovered || selectedSize
                    ? 'bg-accent-gold text-black'
                    : 'bg-surface-dark-hover text-white border border-gray-700'
                }
              `}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Add to Cart</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }
}

export default MerchCard;

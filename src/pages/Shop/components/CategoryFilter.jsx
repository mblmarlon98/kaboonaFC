import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Category filter component for the affiliate shop
 * Displays clickable category buttons with active state
 */
class CategoryFilter extends Component {
  render() {
    const { categories, activeCategory, onCategoryChange } = this.props;

    return (
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map((category, index) => {
          const isActive = activeCategory === category.id;

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(category.id)}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-300
                ${
                  isActive
                    ? 'bg-accent-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                    : 'bg-surface-dark-elevated text-gray-300 hover:bg-surface-dark-hover hover:text-white border border-gray-700 hover:border-accent-gold/50'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {category.icon && <span className="text-lg">{category.icon}</span>}
                {category.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }
}

export default CategoryFilter;

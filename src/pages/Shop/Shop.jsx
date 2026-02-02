import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';

/**
 * Mock affiliate products data
 */
const AFFILIATE_PRODUCTS = [
  // Football Boots
  {
    id: 'boot-1',
    name: 'Nike Mercurial Superfly 9 Elite FG',
    brand: 'Nike',
    category: 'boots',
    price: 274.99,
    image: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.nike.com',
  },
  {
    id: 'boot-2',
    name: 'Adidas Predator Accuracy+ FG',
    brand: 'Adidas',
    category: 'boots',
    price: 249.99,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.adidas.com',
  },
  {
    id: 'boot-3',
    name: 'Puma Future Ultimate FG/AG',
    brand: 'Puma',
    category: 'boots',
    price: 229.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.puma.com',
  },
  {
    id: 'boot-4',
    name: 'Nike Phantom GX Elite FG',
    brand: 'Nike',
    category: 'boots',
    price: 259.99,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.nike.com',
  },
  // Training Gear
  {
    id: 'training-1',
    name: 'Nike Dri-FIT Academy Training Top',
    brand: 'Nike',
    category: 'training',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.nike.com',
  },
  {
    id: 'training-2',
    name: 'Adidas Tiro 23 Training Pants',
    brand: 'Adidas',
    category: 'training',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.adidas.com',
  },
  {
    id: 'training-3',
    name: 'Under Armour Tech 2.0 Tee',
    brand: 'Under Armour',
    category: 'training',
    price: 25.00,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.amazon.com',
  },
  {
    id: 'training-4',
    name: 'Puma teamFINAL Training Vest',
    brand: 'Puma',
    category: 'training',
    price: 35.00,
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.puma.com',
  },
  // Footballs
  {
    id: 'ball-1',
    name: 'Nike Flight Official Match Ball',
    brand: 'Nike',
    category: 'footballs',
    price: 149.99,
    image: 'https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.nike.com',
  },
  {
    id: 'ball-2',
    name: 'Adidas UCL Pro Ball',
    brand: 'Adidas',
    category: 'footballs',
    price: 165.00,
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.adidas.com',
  },
  {
    id: 'ball-3',
    name: 'Mitre Delta Professional Ball',
    brand: 'Mitre',
    category: 'footballs',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1552667466-07770ae110d0?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.amazon.com',
  },
  // Goalkeeper Gear
  {
    id: 'gk-1',
    name: 'Nike Goalkeeper Vapor Grip3 Gloves',
    brand: 'Nike',
    category: 'goalkeeper',
    price: 110.00,
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.nike.com',
  },
  {
    id: 'gk-2',
    name: 'Adidas Predator Pro Goalkeeper Gloves',
    brand: 'Adidas',
    category: 'goalkeeper',
    price: 130.00,
    image: 'https://images.unsplash.com/photo-1626248801379-51a0748a5f96?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.adidas.com',
  },
  {
    id: 'gk-3',
    name: 'Puma ULTRA Ultimate 1 NC Gloves',
    brand: 'Puma',
    category: 'goalkeeper',
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.puma.com',
  },
  // Accessories
  {
    id: 'acc-1',
    name: 'Nike Elite Crew Football Socks',
    brand: 'Nike',
    category: 'accessories',
    price: 22.00,
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.nike.com',
  },
  {
    id: 'acc-2',
    name: 'Adidas Stadium III Backpack',
    brand: 'Adidas',
    category: 'accessories',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.adidas.com',
  },
  {
    id: 'acc-3',
    name: 'Nike Mercurial Shin Guards',
    brand: 'Nike',
    category: 'accessories',
    price: 30.00,
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.nike.com',
  },
  {
    id: 'acc-4',
    name: 'Puma Pro Training Large Bag',
    brand: 'Puma',
    category: 'accessories',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=400&fit=crop',
    affiliateUrl: 'https://www.puma.com',
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: '🛒' },
  { id: 'boots', name: 'Football Boots', icon: '👟' },
  { id: 'training', name: 'Training Gear', icon: '🏃' },
  { id: 'footballs', name: 'Footballs', icon: '⚽' },
  { id: 'goalkeeper', name: 'Goalkeeper Gear', icon: '🧤' },
  { id: 'accessories', name: 'Accessories', icon: '🎒' },
];

/**
 * Shop page - Affiliate products
 * Links to external stores for football equipment
 */
class Shop extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
      activeCategory: 'all',
      isLoading: false,
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  handleCategoryChange = (categoryId) => {
    this.setState({ activeCategory: categoryId });
  };

  getFilteredProducts = () => {
    const { searchQuery, activeCategory } = this.state;
    let filtered = AFFILIATE_PRODUCTS;

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  render() {
    const { searchQuery, activeCategory } = this.state;
    const filteredProducts = this.getFilteredProducts();

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated via-surface-dark to-surface-dark" />

          {/* Decorative Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4">
                The Shop
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                Premium football gear from top brands. Equip yourself like a pro with our curated selection.
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto" />
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-12 max-w-xl mx-auto"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={this.handleSearchChange}
                  className="w-full px-6 py-4 pl-14 bg-surface-dark-elevated border border-gray-700 rounded-xl
                           text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold
                           transition-colors duration-300"
                />
                <svg
                  className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </motion.div>

            {/* Category Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-10"
            >
              <CategoryFilter
                categories={CATEGORIES}
                activeCategory={activeCategory}
                onCategoryChange={this.handleCategoryChange}
              />
            </motion.div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Results Count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 text-gray-400"
            >
              Showing <span className="text-accent-gold font-semibold">{filteredProducts.length}</span> products
              {activeCategory !== 'all' && (
                <span>
                  {' '}in <span className="text-white">{CATEGORIES.find((c) => c.id === activeCategory)?.name}</span>
                </span>
              )}
            </motion.div>

            {/* Products Grid */}
            <AnimatePresence mode="wait">
              {filteredProducts.length > 0 ? (
                <motion.div
                  key={`${activeCategory}-${searchQuery}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {filteredProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-display text-white mb-2">No products found</h3>
                  <p className="text-gray-400">
                    Try adjusting your search or filter to find what you're looking for.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Affiliate Disclaimer */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-surface-dark-elevated rounded-xl p-6 border border-gray-800"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-accent-gold"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-accent-gold font-semibold">Affiliate Disclosure</span>
              </div>
              <p className="text-gray-400 text-sm">
                Kaboona FC is a participant in various affiliate advertising programs. When you purchase products
                through links on this page, we may earn a commission at no additional cost to you. These commissions
                help support our club and youth development programs. Thank you for your support!
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }
}

export default Shop;

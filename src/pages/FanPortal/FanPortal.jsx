import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import MerchCard from './components/MerchCard';
import CartSidebar from './components/CartSidebar';
import { addItem, removeItem, updateQuantity, clearCart } from '../../redux/slices/cartSlice';

/**
 * Mock merchandise data for Kaboona FC
 */
const MERCHANDISE = [
  // Jerseys
  {
    id: 'jersey-1',
    name: 'Kaboona FC Home Jersey 2024/25',
    category: 'jerseys',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1577212017184-80cc0da11082?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    badge: 'New Season',
  },
  {
    id: 'jersey-2',
    name: 'Kaboona FC Away Jersey 2024/25',
    category: 'jerseys',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    badge: 'New Season',
  },
  {
    id: 'jersey-3',
    name: 'Kaboona FC Third Jersey 2024/25',
    category: 'jerseys',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    badge: 'Limited Edition',
  },
  {
    id: 'jersey-4',
    name: 'Kaboona FC Goalkeeper Jersey',
    category: 'jerseys',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=400&fit=crop',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'jersey-5',
    name: 'Kaboona FC Retro Jersey 2019',
    category: 'jerseys',
    price: 69.99,
    image: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?w=400&h=400&fit=crop',
    sizes: ['S', 'M', 'L', 'XL'],
    badge: 'Classic',
  },
  // Training Kit
  {
    id: 'training-1',
    name: 'Kaboona FC Training Jersey',
    category: 'training',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'training-2',
    name: 'Kaboona FC Training Pants',
    category: 'training',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'training-3',
    name: 'Kaboona FC Tracksuit Jacket',
    category: 'training',
    price: 74.99,
    image: 'https://images.unsplash.com/photo-1542327897-d73f4005b533?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'training-4',
    name: 'Kaboona FC Rain Jacket',
    category: 'training',
    price: 64.99,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  // Shorts
  {
    id: 'shorts-1',
    name: 'Kaboona FC Home Shorts',
    category: 'shorts',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'shorts-2',
    name: 'Kaboona FC Away Shorts',
    category: 'shorts',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'shorts-3',
    name: 'Kaboona FC Training Shorts',
    category: 'shorts',
    price: 34.99,
    image: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  // Accessories
  {
    id: 'acc-1',
    name: 'Kaboona FC Snapback Cap',
    category: 'accessories',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop',
    sizes: ['One Size'],
    badge: 'Best Seller',
  },
  {
    id: 'acc-2',
    name: 'Kaboona FC Beanie',
    category: 'accessories',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=400&fit=crop',
    sizes: ['One Size'],
  },
  {
    id: 'acc-3',
    name: 'Kaboona FC Scarf',
    category: 'accessories',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop',
    sizes: ['One Size'],
  },
  {
    id: 'acc-4',
    name: 'Kaboona FC Gym Bag',
    category: 'accessories',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    sizes: ['One Size'],
  },
  {
    id: 'acc-5',
    name: 'Kaboona FC Water Bottle',
    category: 'accessories',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
    sizes: ['One Size'],
  },
  {
    id: 'acc-6',
    name: 'Kaboona FC Phone Case',
    category: 'accessories',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop',
    sizes: ['iPhone 14', 'iPhone 15', 'Samsung S24'],
  },
];

const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: '🛍️' },
  { id: 'jerseys', name: 'Jerseys', icon: '👕' },
  { id: 'training', name: 'Training Kit', icon: '🏃' },
  { id: 'shorts', name: 'Shorts', icon: '🩳' },
  { id: 'accessories', name: 'Accessories', icon: '🎒' },
];

/**
 * Fan Portal - Official Kaboona FC Merchandise Shop
 */
class FanPortal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeCategory: 'all',
      searchQuery: '',
      isCartOpen: false,
      notification: null,
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  handleCategoryChange = (categoryId) => {
    this.setState({ activeCategory: categoryId });
  };

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  handleAddToCart = (product) => {
    const { addItem } = this.props;
    addItem(product);

    // Show notification
    this.setState({
      notification: {
        message: `${product.name} (${product.size}) added to cart`,
        type: 'success',
      },
    });

    // Clear notification after 3 seconds
    setTimeout(() => {
      this.setState({ notification: null });
    }, 3000);
  };

  handleRemoveItem = (id, size) => {
    const { removeItem } = this.props;
    removeItem({ id, size });
  };

  handleUpdateQuantity = (id, size, quantity) => {
    const { updateQuantity } = this.props;
    updateQuantity({ id, size, quantity });
  };

  handleClearCart = () => {
    const { clearCart } = this.props;
    clearCart();
  };

  toggleCart = () => {
    this.setState((prevState) => ({ isCartOpen: !prevState.isCartOpen }));
  };

  getFilteredProducts = () => {
    const { searchQuery, activeCategory } = this.state;
    let filtered = MERCHANDISE;

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
          product.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  render() {
    const { cartItems, cartTotal } = this.props;
    const { activeCategory, searchQuery, isCartOpen, notification } = this.state;
    const filteredProducts = this.getFilteredProducts();
    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">{notification.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Cart Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={this.toggleCart}
          className="fixed bottom-8 right-8 z-30 w-16 h-16 bg-accent-gold rounded-full shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center"
        >
          <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartItemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {cartItemCount}
            </motion.span>
          )}
        </motion.button>

        {/* Cart Sidebar */}
        <CartSidebar
          isOpen={isCartOpen}
          onClose={this.toggleCart}
          items={cartItems}
          total={cartTotal}
          onRemoveItem={this.handleRemoveItem}
          onUpdateQuantity={this.handleUpdateQuantity}
          onClearCart={this.handleClearCart}
        />

        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated via-surface-dark to-surface-dark" />

          {/* Gold Accent Lines */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-accent-gold/20 to-transparent"
            />
            <div
              className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-accent-gold/20 to-transparent"
            />
          </div>

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
              <div className="inline-block mb-4">
                <span className="bg-accent-gold/10 text-accent-gold px-4 py-2 rounded-full text-sm font-semibold border border-accent-gold/30">
                  Official Merchandise
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4">
                Fan Portal
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                Show your pride. Wear the gold. Official Kaboona FC merchandise for true supporters.
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
                  placeholder="Search merchandise..."
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
              className="mt-10 flex flex-wrap gap-3 justify-center"
            >
              {CATEGORIES.map((category, index) => {
                const isActive = activeCategory === category.id;

                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => this.handleCategoryChange(category.id)}
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
                      <span className="text-lg">{category.icon}</span>
                      {category.name}
                    </span>
                  </motion.button>
                );
              })}
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
                    <MerchCard
                      key={product.id}
                      product={product}
                      index={index}
                      onAddToCart={this.handleAddToCart}
                    />
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

        {/* Club Benefits Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-white mb-4">
                Why Shop With Us
              </h2>
              <p className="text-gray-400">
                Every purchase supports the club and our youth development programs.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🏆',
                  title: 'Authentic Merchandise',
                  description: 'Official Kaboona FC licensed products with premium quality materials.',
                },
                {
                  icon: '💛',
                  title: 'Support the Club',
                  description: 'All proceeds go directly to supporting our players and youth programs.',
                },
                {
                  icon: '🚚',
                  title: 'Fast Shipping',
                  description: 'Free shipping on orders over $50. Worldwide delivery available.',
                },
              ].map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-surface-dark-elevated rounded-xl p-6 border border-gray-800 text-center"
                >
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-display font-bold text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  cartItems: state.cart?.items || [],
  cartTotal: state.cart?.total || 0,
});

const mapDispatchToProps = {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
};

export default connect(mapStateToProps, mapDispatchToProps)(FanPortal);

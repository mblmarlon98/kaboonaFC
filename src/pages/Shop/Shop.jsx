import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import MerchCard from './components/MerchCard';
import CartSidebar from './components/CartSidebar';
import { addItem, removeItem, updateQuantity, clearCart } from '../../redux/slices/cartSlice';

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

const GEAR_CATEGORIES = [
  { id: 'all', name: 'All Products', icon: '🛒' },
  { id: 'boots', name: 'Football Boots', icon: '👟' },
  { id: 'training', name: 'Training Gear', icon: '🏃' },
  { id: 'footballs', name: 'Footballs', icon: '⚽' },
  { id: 'goalkeeper', name: 'Goalkeeper Gear', icon: '🧤' },
  { id: 'accessories', name: 'Accessories', icon: '🎒' },
];

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
    id: 'merch-training-1',
    name: 'Kaboona FC Training Jersey',
    category: 'training',
    price: 54.99,
    image: 'https://images.unsplash.com/photo-1580087256394-dc596e1c8f4f?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'merch-training-2',
    name: 'Kaboona FC Training Pants',
    category: 'training',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'merch-training-3',
    name: 'Kaboona FC Tracksuit Jacket',
    category: 'training',
    price: 74.99,
    image: 'https://images.unsplash.com/photo-1542327897-d73f4005b533?w=400&h=400&fit=crop',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    id: 'merch-training-4',
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
    id: 'merch-acc-1',
    name: 'Kaboona FC Snapback Cap',
    category: 'accessories',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop',
    sizes: ['One Size'],
    badge: 'Best Seller',
  },
  {
    id: 'merch-acc-2',
    name: 'Kaboona FC Beanie',
    category: 'accessories',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=400&fit=crop',
    sizes: ['One Size'],
  },
  {
    id: 'merch-acc-3',
    name: 'Kaboona FC Scarf',
    category: 'accessories',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop',
    sizes: ['One Size'],
  },
  {
    id: 'merch-acc-4',
    name: 'Kaboona FC Gym Bag',
    category: 'accessories',
    price: 44.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    sizes: ['One Size'],
  },
  {
    id: 'merch-acc-5',
    name: 'Kaboona FC Water Bottle',
    category: 'accessories',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
    sizes: ['One Size'],
  },
  {
    id: 'merch-acc-6',
    name: 'Kaboona FC Phone Case',
    category: 'accessories',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=400&h=400&fit=crop',
    sizes: ['iPhone 14', 'iPhone 15', 'Samsung S24'],
  },
];

const MERCH_CATEGORIES = [
  { id: 'all', name: 'All Products', icon: '🛍️' },
  { id: 'jerseys', name: 'Jerseys', icon: '👕' },
  { id: 'training', name: 'Training Kit', icon: '🏃' },
  { id: 'shorts', name: 'Shorts', icon: '🩳' },
  { id: 'accessories', name: 'Accessories', icon: '🎒' },
];

/**
 * Shop page - Official Merch + Affiliate Football Gear
 * Two-section tabbed layout with Redux cart for merch
 */
class Shop extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeSection: 'merch',
      // Gear section state
      searchQuery: '',
      activeCategory: 'all',
      isLoading: false,
      // Merch section state
      merchCategory: 'all',
      merchSearch: '',
      isCartOpen: false,
      notification: null,
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  // --- Section switching ---
  handleSectionChange = (section) => {
    this.setState({ activeSection: section });
  };

  // --- Gear section handlers ---
  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  handleCategoryChange = (categoryId) => {
    this.setState({ activeCategory: categoryId });
  };

  getFilteredProducts = () => {
    const { searchQuery, activeCategory } = this.state;
    let filtered = AFFILIATE_PRODUCTS;

    if (activeCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === activeCategory);
    }

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

  // --- Merch section handlers ---
  handleMerchCategoryChange = (categoryId) => {
    this.setState({ merchCategory: categoryId });
  };

  handleMerchSearchChange = (e) => {
    this.setState({ merchSearch: e.target.value });
  };

  handleAddToCart = (product) => {
    const { addItem } = this.props;
    addItem(product);

    this.setState({
      notification: {
        message: `${product.name} (${product.size}) added to cart`,
        type: 'success',
      },
    });

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

  getFilteredMerch = () => {
    const { merchSearch, merchCategory } = this.state;
    let filtered = MERCHANDISE;

    if (merchCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === merchCategory);
    }

    if (merchSearch.trim()) {
      const query = merchSearch.toLowerCase();
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
    const { activeSection, searchQuery, activeCategory, merchCategory, merchSearch, isCartOpen, notification } = this.state;
    const filteredProducts = this.getFilteredProducts();
    const filteredMerch = this.getFilteredMerch();
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

        {/* Floating Cart Button (merch section only) */}
        {activeSection === 'merch' && (
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
        )}

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
                Official merch and premium football gear.
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto" />
            </motion.div>

            {/* Section Tab Switcher */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-10 flex justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => this.handleSectionChange('merch')}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300
                  ${
                    activeSection === 'merch'
                      ? 'bg-accent-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                      : 'bg-surface-dark-elevated text-gray-300 hover:bg-surface-dark-hover hover:text-white border border-gray-700 hover:border-accent-gold/50'
                  }
                `}
              >
                Official Merch
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => this.handleSectionChange('gear')}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300
                  ${
                    activeSection === 'gear'
                      ? 'bg-accent-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                      : 'bg-surface-dark-elevated text-gray-300 hover:bg-surface-dark-hover hover:text-white border border-gray-700 hover:border-accent-gold/50'
                  }
                `}
              >
                Football Gear
              </motion.button>
            </motion.div>
          </div>
        </section>

        {/* ===== MERCH SECTION ===== */}
        {activeSection === 'merch' && (
          <>
            {/* Merch Search + Category Filters */}
            <section className="pt-8 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                {/* Search Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-xl mx-auto"
                >
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search merchandise..."
                      value={merchSearch}
                      onChange={this.handleMerchSearchChange}
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
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="mt-8 flex flex-wrap gap-3 justify-center"
                >
                  {MERCH_CATEGORIES.map((category, index) => {
                    const isActive = merchCategory === category.id;

                    return (
                      <motion.button
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => this.handleMerchCategoryChange(category.id)}
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

            {/* Merch Products Grid */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                {/* Results Count */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-8 text-gray-400"
                >
                  Showing <span className="text-accent-gold font-semibold">{filteredMerch.length}</span> products
                  {merchCategory !== 'all' && (
                    <span>
                      {' '}in <span className="text-white">{MERCH_CATEGORIES.find((c) => c.id === merchCategory)?.name}</span>
                    </span>
                  )}
                </motion.div>

                {/* Products Grid */}
                <AnimatePresence mode="wait">
                  {filteredMerch.length > 0 ? (
                    <motion.div
                      key={`merch-${merchCategory}-${merchSearch}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                      {filteredMerch.map((product, index) => (
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
          </>
        )}

        {/* ===== GEAR SECTION ===== */}
        {activeSection === 'gear' && (
          <>
            {/* Gear Search + Category Filters */}
            <section className="pt-8 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                {/* Search Bar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-xl mx-auto"
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
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="mt-8"
                >
                  <CategoryFilter
                    categories={GEAR_CATEGORIES}
                    activeCategory={activeCategory}
                    onCategoryChange={this.handleCategoryChange}
                  />
                </motion.div>
              </div>
            </section>

            {/* Gear Products Grid */}
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
                      {' '}in <span className="text-white">{GEAR_CATEGORIES.find((c) => c.id === activeCategory)?.name}</span>
                    </span>
                  )}
                </motion.div>

                {/* Products Grid */}
                <AnimatePresence mode="wait">
                  {filteredProducts.length > 0 ? (
                    <motion.div
                      key={`gear-${activeCategory}-${searchQuery}`}
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
          </>
        )}
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

export default connect(mapStateToProps, mapDispatchToProps)(Shop);

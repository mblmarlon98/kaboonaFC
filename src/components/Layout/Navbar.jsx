import React, { Component } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isScrolled: false,
      isMobileMenuOpen: false,
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const isScrolled = window.scrollY > 20;
    if (isScrolled !== this.state.isScrolled) {
      this.setState({ isScrolled });
    }
  };

  toggleMobileMenu = () => {
    this.setState((prevState) => ({
      isMobileMenuOpen: !prevState.isMobileMenuOpen,
    }));
  };

  closeMobileMenu = () => {
    this.setState({ isMobileMenuOpen: false });
  };

  render() {
    const { darkMode, toggleDarkMode, user } = this.props;
    const { isScrolled, isMobileMenuOpen } = this.state;

    const navLinks = [
      { to: '/', label: 'Home' },
      { to: '/our-team', label: 'Our Team' },
      { to: '/stats', label: 'Stats' },
      { to: '/shop', label: 'Shop' },
      { to: '/fan-portal', label: 'Fan Portal' },
      { to: '/investors', label: 'Investors' },
    ];

    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-surface-dark/90 dark:bg-surface-dark/90 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl md:text-3xl font-display font-bold text-accent-gold tracking-wider">
                KABOONA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'text-accent-gold'
                        : 'text-white/80 hover:text-white'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Right Side - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <motion.button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle dark mode"
              >
                <motion.div
                  animate={{ rotate: darkMode ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {darkMode ? (
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
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ) : (
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
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  )}
                </motion.div>
              </motion.button>

              {/* Auth Buttons or User Avatar */}
              {user ? (
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center">
                    <span className="text-sm font-medium text-black">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium bg-accent-gold text-black rounded-md hover:bg-accent-gold-light transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Dark Mode Toggle - Mobile */}
              <motion.button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                whileTap={{ scale: 0.95 }}
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
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
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
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
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </motion.button>

              {/* Hamburger Button */}
              <button
                onClick={this.toggleMobileMenu}
                className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-surface-dark/95 backdrop-blur-md border-t border-white/10"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={this.closeMobileMenu}
                    className={({ isActive }) =>
                      `block px-4 py-3 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? 'text-accent-gold bg-white/5'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                {/* Mobile Auth Section */}
                <div className="pt-4 mt-4 border-t border-white/10">
                  {user ? (
                    <Link
                      to="/profile"
                      onClick={this.closeMobileMenu}
                      className="flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center">
                        <span className="text-sm font-medium text-black">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <span>Profile</span>
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={this.closeMobileMenu}
                        className="block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={this.closeMobileMenu}
                        className="block px-4 py-3 text-base font-medium bg-accent-gold text-black rounded-md hover:bg-accent-gold-light text-center transition-colors"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    );
  }
}

export default Navbar;

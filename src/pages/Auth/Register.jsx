import React, { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { signUp } from '../../services/auth';
import { setUser, setSession, setError } from '../../redux/slices/authSlice';

/**
 * Register page - role selection (Player / Fan) with signup form
 */
class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRole: 'player',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      isSubmitting: false,
      formError: null,
      successMessage: null,
      redirectTo: null,
    };
  }

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState({
      [name]: type === 'checkbox' ? checked : value,
      formError: null,
    });
  };

  handleRoleSelect = (role) => {
    this.setState({ selectedRole: role, formError: null });
  };

  validateForm = () => {
    const { fullName, email, password, confirmPassword, acceptTerms } = this.state;

    if (!fullName.trim()) {
      this.setState({ formError: 'Please enter your full name' });
      return false;
    }

    if (!email) {
      this.setState({ formError: 'Please enter your email address' });
      return false;
    }

    if (!password) {
      this.setState({ formError: 'Please enter a password' });
      return false;
    }

    if (password.length < 6) {
      this.setState({ formError: 'Password must be at least 6 characters' });
      return false;
    }

    if (password !== confirmPassword) {
      this.setState({ formError: 'Passwords do not match' });
      return false;
    }

    if (!acceptTerms) {
      this.setState({ formError: 'Please accept the terms and conditions' });
      return false;
    }

    return true;
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    if (!this.validateForm()) return;

    const { fullName, email, password, selectedRole } = this.state;
    const { setUser, setSession, setError } = this.props;

    this.setState({ isSubmitting: true, formError: null });

    try {
      const { data, error } = await signUp(email, password, {
        full_name: fullName,
        role: selectedRole,
      });

      if (error) {
        this.setState({ formError: error.message, isSubmitting: false });
        setError(error.message);
        return;
      }

      if (data?.user) {
        setUser(data.user);
        if (data.session) {
          setSession(data.session);
        }

        // If player, redirect to profile edit wizard; otherwise go to profile
        if (selectedRole === 'player') {
          this.setState({
            isSubmitting: false,
            redirectTo: '/profile/edit?setup=true',
          });
        } else {
          this.setState({
            isSubmitting: false,
            successMessage: 'Welcome to Kaboona FC! Check your email to confirm your account.',
          });
        }
      }
    } catch (err) {
      this.setState({ formError: 'An unexpected error occurred', isSubmitting: false });
      setError('An unexpected error occurred');
    }
  };

  render() {
    const {
      selectedRole,
      fullName,
      email,
      password,
      confirmPassword,
      acceptTerms,
      isSubmitting,
      formError,
      successMessage,
      redirectTo,
    } = this.state;
    const { user, error } = this.props;

    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }

    // If already logged in and no redirect pending, go to profile
    if (user && !redirectTo && !successMessage) {
      return <Navigate to="/profile" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-dark">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="bg-surface-dark-elevated rounded-xl shadow-2xl p-8 border border-white/10">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display font-bold text-accent-gold mb-1">
                Create Account
              </h1>
              <p className="text-white/60 text-sm">
                Join Kaboona FC today
              </p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-400 text-sm">{successMessage}</p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {(formError || error) && !successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{formError || error}</p>
              </motion.div>
            )}

            {!successMessage && (
              <form onSubmit={this.handleSubmit} className="space-y-5">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Player Card */}
                    <motion.button
                      type="button"
                      onClick={() => this.handleRoleSelect('player')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        selectedRole === 'player'
                          ? 'border-accent-gold bg-accent-gold/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedRole === 'player' ? 'bg-accent-gold/20' : 'bg-white/10'
                        }`}>
                          <svg
                            className={`w-6 h-6 ${selectedRole === 'player' ? 'text-accent-gold' : 'text-white/50'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className={`text-sm font-bold ${
                          selectedRole === 'player' ? 'text-accent-gold' : 'text-white/70'
                        }`}>
                          Player
                        </span>
                        <span className="text-xs text-white/40 text-center">
                          Join training & matches
                        </span>
                      </div>
                      {selectedRole === 'player' && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-accent-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </motion.button>

                    {/* Fan Card */}
                    <motion.button
                      type="button"
                      onClick={() => this.handleRoleSelect('fan')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        selectedRole === 'fan'
                          ? 'border-accent-gold bg-accent-gold/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedRole === 'fan' ? 'bg-accent-gold/20' : 'bg-white/10'
                        }`}>
                          <svg
                            className={`w-6 h-6 ${selectedRole === 'fan' ? 'text-accent-gold' : 'text-white/50'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <span className={`text-sm font-bold ${
                          selectedRole === 'fan' ? 'text-accent-gold' : 'text-white/70'
                        }`}>
                          Fan
                        </span>
                        <span className="text-xs text-white/40 text-center">
                          Support the team
                        </span>
                      </div>
                      {selectedRole === 'fan' && (
                        <div className="absolute top-2 right-2">
                          <svg className="w-5 h-5 text-accent-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-white/80 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={fullName}
                    onChange={this.handleChange}
                    className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={this.handleChange}
                    className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={this.handleChange}
                    className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                    placeholder="Create a password (min 6 chars)"
                    autoComplete="new-password"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={this.handleChange}
                    className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={acceptTerms}
                      onChange={this.handleChange}
                      className="w-4 h-4 bg-surface-dark border-white/20 rounded text-accent-gold focus:ring-accent-gold"
                    />
                  </div>
                  <label htmlFor="acceptTerms" className="ml-3 text-sm text-white/60">
                    I agree to the{' '}
                    <Link to="/terms" className="text-accent-gold hover:text-accent-gold-light">
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-accent-gold hover:text-accent-gold-light">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-dark focus:ring-accent-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    `Sign Up as ${selectedRole === 'player' ? 'Player' : 'Fan'}`
                  )}
                </motion.button>

                {/* Already have an account */}
                <div className="pt-4 border-t border-white/10 text-center">
                  <p className="text-sm text-white/50">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent-gold hover:text-accent-gold-light font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  error: state.auth?.error,
});

const mapDispatchToProps = {
  setUser,
  setSession,
  setError,
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);

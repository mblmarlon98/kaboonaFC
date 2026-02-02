import React, { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { signUp } from '../../services/auth';
import { setUser, setSession, setLoading, setError } from '../../redux/slices/authSlice';

class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'fan',
      acceptTerms: false,
      isSubmitting: false,
      formError: null,
      successMessage: null,
    };
  }

  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState({
      [name]: type === 'checkbox' ? checked : value,
      formError: null,
    });
  };

  validateForm = () => {
    const { fullName, email, password, confirmPassword, acceptTerms } = this.state;

    if (!fullName || !email || !password || !confirmPassword) {
      this.setState({ formError: 'Please fill in all fields' });
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
    const { fullName, email, password, role } = this.state;
    const { setError } = this.props;

    if (!this.validateForm()) {
      return;
    }

    this.setState({ isSubmitting: true, formError: null });

    try {
      const { data, error } = await signUp(email, password, {
        full_name: fullName,
        role: role,
      });

      if (error) {
        this.setState({ formError: error.message, isSubmitting: false });
        setError(error.message);
        return;
      }

      if (data?.user) {
        // Show success message - user needs to confirm email
        this.setState({
          isSubmitting: false,
          successMessage: 'Registration successful! Please check your email to confirm your account.',
        });
      }
    } catch (err) {
      this.setState({ formError: 'An unexpected error occurred', isSubmitting: false });
      setError('An unexpected error occurred');
    }
  };

  render() {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      role,
      acceptTerms,
      isSubmitting,
      formError,
      successMessage,
    } = this.state;
    const { user, error } = this.props;

    // Redirect if already logged in
    if (user) {
      return <Navigate to="/profile" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background-dark">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Card Container */}
          <div className="bg-surface-dark rounded-xl shadow-2xl p-8 border border-white/10">
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-accent-gold mb-2">
                Join Kaboona FC
              </h1>
              <p className="text-white/60">Create your account to get started</p>
            </div>

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <p className="text-green-400 text-sm">{successMessage}</p>
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

            {/* Registration Form */}
            {!successMessage && (
              <form onSubmit={this.handleSubmit} className="space-y-5">
                {/* Full Name Field */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={fullName}
                    onChange={this.handleChange}
                    className="w-full px-4 py-3 bg-background-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={this.handleChange}
                    className="w-full px-4 py-3 bg-background-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={this.handleChange}
                    className="w-full px-4 py-3 bg-background-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-white/80 mb-2"
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={this.handleChange}
                    className="w-full px-4 py-3 bg-background-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex items-center justify-center px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                        role === 'fan'
                          ? 'bg-accent-gold/10 border-accent-gold text-accent-gold'
                          : 'bg-background-dark border-white/20 text-white/60 hover:border-white/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="fan"
                        checked={role === 'fan'}
                        onChange={this.handleChange}
                        className="sr-only"
                      />
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      Fan
                    </label>
                    <label
                      className={`flex items-center justify-center px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                        role === 'player'
                          ? 'bg-accent-gold/10 border-accent-gold text-accent-gold'
                          : 'bg-background-dark border-white/20 text-white/60 hover:border-white/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value="player"
                        checked={role === 'player'}
                        onChange={this.handleChange}
                        className="sr-only"
                      />
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Player
                    </label>
                  </div>
                </div>

                {/* Terms Acceptance */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      name="acceptTerms"
                      checked={acceptTerms}
                      onChange={this.handleChange}
                      className="w-4 h-4 bg-background-dark border-white/20 rounded text-accent-gold focus:ring-accent-gold focus:ring-offset-surface-dark"
                    />
                  </div>
                  <label
                    htmlFor="acceptTerms"
                    className="ml-3 text-sm text-white/60"
                  >
                    I agree to the{' '}
                    <Link
                      to="/terms"
                      className="text-accent-gold hover:text-accent-gold-light"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      to="/privacy"
                      className="text-accent-gold hover:text-accent-gold-light"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 px-4 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>
              </form>
            )}

            {/* Divider */}
            {!successMessage && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-surface-dark text-white/40">Or sign up with</span>
                  </div>
                </div>

                {/* Social Signup Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Google Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </motion.button>

                  {/* Apple Button */}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Apple
                  </motion.button>
                </div>
              </>
            )}

            {/* Login Link */}
            <p className="mt-8 text-center text-white/60">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-accent-gold hover:text-accent-gold-light font-medium transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  error: state.auth?.error,
  loading: state.auth?.loading,
});

const mapDispatchToProps = {
  setUser,
  setSession,
  setLoading,
  setError,
};

export default connect(mapStateToProps, mapDispatchToProps)(Register);

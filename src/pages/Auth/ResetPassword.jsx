import React, { Component } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';

class ResetPassword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      password: '',
      confirmPassword: '',
      isSubmitting: false,
      formError: null,
      success: false,
    };
  }

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value, formError: null });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { password, confirmPassword } = this.state;

    if (!password) {
      this.setState({ formError: 'Please enter a new password' });
      return;
    }
    if (password.length < 6) {
      this.setState({ formError: 'Password must be at least 6 characters' });
      return;
    }
    if (password !== confirmPassword) {
      this.setState({ formError: 'Passwords do not match' });
      return;
    }

    this.setState({ isSubmitting: true, formError: null });

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        this.setState({
          formError: error.message.includes('session')
            ? 'This reset link has expired. Please request a new one.'
            : error.message,
          isSubmitting: false,
        });
        return;
      }
      await supabase.auth.signOut();
      this.setState({ success: true, isSubmitting: false });
    } catch (err) {
      this.setState({ formError: 'An unexpected error occurred', isSubmitting: false });
    }
  };

  render() {
    const { password, confirmPassword, isSubmitting, formError, success } = this.state;

    if (success) {
      return <Navigate to="/login?reset=success" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-surface-dark">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-surface-dark-elevated rounded-xl shadow-2xl p-8 border border-white/10">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display font-bold text-accent-gold mb-1">
                Set New Password
              </h1>
              <p className="text-white/60 text-sm">
                Enter your new password below
              </p>
            </div>

            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{formError}</p>
                {formError.includes('expired') && (
                  <Link
                    to="/forgot-password"
                    className="text-accent-gold hover:text-accent-gold-light text-sm mt-2 inline-block"
                  >
                    Request a new reset link
                  </Link>
                )}
              </motion.div>
            )}

            <form onSubmit={this.handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={this.handleChange}
                  className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="Enter new password (min 6 chars)"
                  autoComplete="new-password"
                />
              </div>

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
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

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
                    Updating...
                  </span>
                ) : (
                  'Update Password'
                )}
              </motion.button>

              <div className="text-center pt-4 border-t border-white/10">
                <Link to="/login" className="text-sm text-accent-gold hover:text-accent-gold-light">
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }
}

export default ResetPassword;

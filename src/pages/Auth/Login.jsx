import React, { Component } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { signIn, signInWithOAuth } from '../../services/auth';
import { setUser, setSession, setLoading, setError } from '../../redux/slices/authSlice';

// Wrapper to get URL search params
function withSearchParams(Component) {
  return function WrappedComponent(props) {
    const [searchParams] = useSearchParams();
    return <Component {...props} searchParams={searchParams} />;
  };
}

class Login extends Component {
  constructor(props) {
    super(props);
    const resetSuccess = props.searchParams?.get('reset') === 'success';

    this.state = {
      resetSuccess,
      email: '',
      password: '',
      isSubmitting: false,
      formError: null,
      oauthLoading: null,
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, formError: null });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = this.state;
    const { setUser, setSession, setError } = this.props;

    if (!email || !password) {
      this.setState({ formError: 'Please fill in all required fields' });
      return;
    }

    this.setState({ isSubmitting: true, formError: null });

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        this.setState({ formError: error.message, isSubmitting: false });
        setError(error.message);
        return;
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
      }
    } catch (err) {
      this.setState({ formError: 'An unexpected error occurred', isSubmitting: false });
      setError('An unexpected error occurred');
    }
  };

  getDefaultRoute = (user) => {
    const checkRole = (role) => {
      if (user.hasRole) return user.hasRole(role);
      if (user.roles) return user.roles.includes(role);
      return user.role === role;
    };

    if (checkRole('admin') || checkRole('super_admin') || checkRole('owner')) return '/dashboard';
    if (checkRole('manager') || checkRole('coach')) return '/dashboard';
    if (checkRole('editor') || checkRole('marketing')) return '/dashboard/content';
    return '/profile';
  };

  handleOAuthLogin = async (provider) => {
    this.setState({ oauthLoading: provider, formError: null });
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        this.setState({ formError: error.message, oauthLoading: null });
      }
    } catch (err) {
      this.setState({ formError: 'Failed to connect with ' + provider, oauthLoading: null });
    }
  };

  render() {
    const { email, password, isSubmitting, formError, oauthLoading } = this.state;
    const { user, error } = this.props;

    if (user) {
      return <Navigate to={this.getDefaultRoute(user)} replace />;
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
            {/* Navigation Links - Sign In / Create Account */}
            <div className="flex mb-6 bg-surface-dark rounded-lg p-1 gap-1">
              <span className="flex-1 py-2.5 text-sm font-medium rounded-md text-center bg-accent-gold text-black">
                Sign In
              </span>
              <Link
                to="/register"
                className="flex-1 py-2.5 text-sm font-medium rounded-md text-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                Create Account
              </Link>
            </div>

            {/* Password Reset Success Banner */}
            {this.state.resetSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-400 text-sm">Password updated successfully. Sign in with your new password.</p>
                </div>
              </motion.div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-display font-bold text-accent-gold mb-1">
                Welcome Back
              </h1>
              <p className="text-white/60 text-sm">
                Sign in to your Kaboona FC account
              </p>
            </div>

            {/* Error Message */}
            {(formError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">{formError || error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={this.handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
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
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={this.handleChange}
                  className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold focus:ring-1 focus:ring-accent-gold transition-colors"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-accent-gold hover:text-accent-gold-light transition-colors"
                >
                  Forgot password?
                </Link>
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
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </motion.button>

            </form>

            {/* OAuth Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-dark-elevated text-white/40">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                onClick={() => this.handleOAuthLogin('google')}
                disabled={oauthLoading}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {oauthLoading === 'google' ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => this.handleOAuthLogin('apple')}
                disabled={oauthLoading}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {oauthLoading === 'apple' ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Apple
                  </>
                )}
              </motion.button>
            </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(withSearchParams(Login));

import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { setUser, setSession, setError } from '../../redux/slices/authSlice';

/**
 * OAuth Callback Handler
 * Handles redirect from OAuth providers (Google, Apple)
 * Processes the auth response and redirects to profile
 */
class AuthCallback extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
    };
  }

  async componentDidMount() {
    try {
      // Get session from URL hash (Supabase returns auth data in URL)
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        this.setState({ error: error.message, loading: false });
        this.props.setError(error.message);
        return;
      }

      if (data?.session) {
        this.props.setUser(data.session.user);
        this.props.setSession(data.session);
        this.setState({ loading: false });
      } else {
        // No session found, might still be processing
        // Listen for auth state change
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            this.props.setUser(session.user);
            this.props.setSession(session);
            this.setState({ loading: false });
          }
        });

        // Set a timeout to prevent infinite loading
        setTimeout(() => {
          if (this.state.loading) {
            this.setState({ error: 'Authentication timeout. Please try again.', loading: false });
          }
        }, 10000);
      }
    } catch (err) {
      this.setState({ error: 'Authentication failed. Please try again.', loading: false });
      this.props.setError('Authentication failed');
    }
  }

  render() {
    const { loading, error } = this.state;
    const { user } = this.props;

    // Redirect to profile if authenticated
    if (user && !loading) {
      return <Navigate to="/profile" replace />;
    }

    // Redirect to login on error
    if (error) {
      return <Navigate to="/login" replace state={{ error }} />;
    }

    // Show loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4">
            <svg
              className="animate-spin w-full h-full text-accent-gold"
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
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-2">
            Completing sign in...
          </h2>
          <p className="text-white/60">Please wait while we authenticate you.</p>
        </motion.div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

const mapDispatchToProps = {
  setUser,
  setSession,
  setError,
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthCallback);

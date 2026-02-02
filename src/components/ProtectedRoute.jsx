import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';

class ProtectedRoute extends Component {
  render() {
    const { user, loading, children } = this.props;

    // Show loading spinner while checking authentication
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background-dark">
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
            <p className="text-white/60">Loading...</p>
          </motion.div>
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Render children if authenticated
    return children;
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  loading: state.auth?.loading,
});

export default connect(mapStateToProps)(ProtectedRoute);

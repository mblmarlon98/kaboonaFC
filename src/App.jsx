import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import OurTeam from './pages/OurTeam';
import Stats from './pages/Stats';
import { Login, Register, ForgotPassword } from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import { onAuthStateChange, getSession } from './services/auth';
import { setUser, setSession, setLoading } from './redux/slices/authSlice';

// Placeholder pages - will be implemented later
const Shop = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Shop</h1></div>;
const FanPortal = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Fan Portal</h1></div>;
const Investors = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Investors</h1></div>;
const TrainingSignup = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Training Signup</h1></div>;
const Profile = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Profile</h1></div>;
const Admin = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Admin Dashboard</h1></div>;
const NotFound = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">404 - Not Found</h1></div>;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      darkMode: true, // Default to dark mode (Netflix style)
    };
    this.authSubscription = null;
  }

  componentDidMount() {
    // Check for saved preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      this.setState({ darkMode: savedMode === 'true' });
    }
    // Apply dark mode class
    this.applyDarkMode(savedMode === 'true' || savedMode === null);

    // Initialize auth state
    this.initializeAuth();
  }

  componentWillUnmount() {
    // Clean up auth subscription
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  initializeAuth = async () => {
    const { setUser, setSession, setLoading } = this.props;

    // Get initial session
    const { session } = await getSession();
    if (session) {
      setUser(session.user);
      setSession(session);
    }
    setLoading(false);

    // Subscribe to auth changes
    this.authSubscription = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setSession(session);
      }
    });
  }

  applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  toggleDarkMode = () => {
    this.setState(
      (prevState) => ({ darkMode: !prevState.darkMode }),
      () => {
        localStorage.setItem('darkMode', this.state.darkMode);
        this.applyDarkMode(this.state.darkMode);
      }
    );
  };

  render() {
    const { darkMode } = this.state;
    const { user } = this.props;

    return (
      <Layout
        darkMode={darkMode}
        toggleDarkMode={this.toggleDarkMode}
        user={user}
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/our-team" element={<OurTeam />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/fan-portal" element={<FanPortal />} />
          <Route path="/investors" element={<Investors />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/training-signup" element={<TrainingSignup />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<Admin />} />

          {/* Legal Routes */}
          <Route path="/terms" element={<div className="min-h-screen p-8"><h1 className="text-2xl font-display">Terms & Conditions</h1></div>} />
          <Route path="/privacy" element={<div className="min-h-screen p-8"><h1 className="text-2xl font-display">Privacy Policy</h1></div>} />
          <Route path="/refund" element={<div className="min-h-screen p-8"><h1 className="text-2xl font-display">Refund Policy</h1></div>} />
          <Route path="/cookies" element={<div className="min-h-screen p-8"><h1 className="text-2xl font-display">Cookie Policy</h1></div>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  loading: state.auth?.loading,
});

const mapDispatchToProps = {
  setUser,
  setSession,
  setLoading,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

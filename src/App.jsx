import React, { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import OurTeam from './pages/OurTeam';
import Stats from './pages/Stats';
import Shop from './pages/Shop';
import FanPortal from './pages/FanPortal';
import Investors from './pages/Investors';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/Auth';
import AuthCallback from './pages/Auth/AuthCallback';
import { Profile, ProfileEdit } from './pages/Profile';
import Notifications from './pages/Notifications';
import PlayerProfile from './pages/PlayerProfile';
import MemberProfile from './pages/MemberProfile';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard/Dashboard';
import PlayerModalProvider from './components/shared/PlayerModalContext';
import Terms from './pages/Legal/Terms';
import Privacy from './pages/Legal/Privacy';
import Refund from './pages/Legal/Refund';
import Cookies from './pages/Legal/Cookies';
import { onAuthStateChange, getSession, getCurrentUser } from './services/auth';
import { setUser, setSession, setLoading } from './redux/slices/authSlice';
import { setNotifications, addNotification, setUnreadCount } from './redux/slices/notificationSlice';
import { getNotifications, getUnreadCount, subscribeToNotifications } from './services/notificationService';
import { checkUpcomingEventReminders } from './services/schedulingService';

// Placeholder pages
const NotFound = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">404 - Not Found</h1></div>;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      darkMode: true, // Default to dark mode (Netflix style)
    };
    this.authSubscription = null;
    this.notificationChannel = null;
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
    // Clean up notification subscription
    if (this.notificationChannel) {
      this.notificationChannel.unsubscribe();
      this.notificationChannel = null;
    }
  }

  initializeNotifications = async (user) => {
    const { setNotifications, setUnreadCount, addNotification } = this.props;

    try {
      const [notifications, unreadCount] = await Promise.all([
        getNotifications(user.id),
        getUnreadCount(user.id),
      ]);
      setNotifications(notifications || []);
      setUnreadCount(unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }

    // Unsubscribe from previous channel if any
    if (this.notificationChannel) {
      this.notificationChannel.unsubscribe();
    }

    // Subscribe to realtime notifications
    this.notificationChannel = subscribeToNotifications(user.id, (newNotification) => {
      addNotification(newNotification);
    });

    // Check for upcoming event reminders (24h) for player users
    const isPlayer =
      user.isPlayer ||
      (user.roles && user.roles.includes('player')) ||
      user.role === 'player';

    if (isPlayer) {
      checkUpcomingEventReminders(user.id).catch((err) =>
        console.warn('Reminder check failed:', err)
      );
    }
  };

  clearNotifications = () => {
    const { setNotifications, setUnreadCount } = this.props;
    setNotifications([]);
    setUnreadCount(0);
    if (this.notificationChannel) {
      this.notificationChannel.unsubscribe();
      this.notificationChannel = null;
    }
  };

  initializeAuth = async () => {
    const { setUser, setSession, setLoading } = this.props;

    // Get initial session
    const { session } = await getSession();
    if (session) {
      // Get fresh user data from server (includes latest metadata like avatar_url)
      const { user } = await getCurrentUser();
      const resolvedUser = user || session.user;
      setUser(resolvedUser);
      setSession(session);
      // Initialize notifications for the logged-in user
      this.initializeNotifications(resolvedUser);
    }
    setLoading(false);

    // Subscribe to auth changes
    this.authSubscription = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Get fresh user data on sign in
        const { user } = await getCurrentUser();
        const resolvedUser = user || session.user;
        setUser(resolvedUser);
        setSession(session);
        // Initialize notifications for the signed-in user
        this.initializeNotifications(resolvedUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        // Clear notifications on sign out
        this.clearNotifications();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Refresh user data when token refreshes
        const { user } = await getCurrentUser();
        setUser(user || session.user);
        setSession(session);
      } else if (event === 'USER_UPDATED' && session) {
        // Handle user metadata updates
        const { user } = await getCurrentUser();
        setUser(user || session.user);
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
      <PlayerModalProvider>
        <Routes>
          {/* Dashboard — renders OUTSIDE Layout with its own sidebar/header */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirects from old zone URLs to new dashboard */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/coaching-zone" element={<Navigate to="/dashboard/training" replace />} />
          <Route path="/content-zone" element={<Navigate to="/dashboard/content" replace />} />
          <Route path="/marketing-zone" element={<Navigate to="/dashboard/events" replace />} />

          {/* Everything else inside Layout */}
          <Route
            path="/*"
            element={
              <Layout
                darkMode={darkMode}
                toggleDarkMode={this.toggleDarkMode}
                user={user}
              >
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/our-team" element={<OurTeam />} />
                  <Route path="/player/:playerId" element={<PlayerProfile />} />
                  <Route path="/member/:profileId" element={<MemberProfile />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/fan-portal" element={<FanPortal />} />
                  <Route path="/investors" element={<Investors />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />

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
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/edit"
                    element={
                      <ProtectedRoute>
                        <ProfileEdit />
                      </ProtectedRoute>
                    }
                  />

                  {/* Legal Routes */}
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/refund" element={<Refund />} />
                  <Route path="/cookies" element={<Cookies />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </PlayerModalProvider>
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
  setNotifications,
  addNotification,
  setUnreadCount,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

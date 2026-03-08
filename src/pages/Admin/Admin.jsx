import React, { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import AdminSidebar from './components/AdminSidebar';
import DashboardOverview from './components/DashboardOverview';
import PlayersManagement from './components/PlayersManagement';
import ContentManagement from './components/ContentManagement';
import TrainingManagement from './components/TrainingManagement';
import PaymentsOverview from './components/PaymentsOverview';
import InvestorsManagement from './components/InvestorsManagement';
import UserAnalytics from './components/UserAnalytics';
import { getCurrentUser } from '../../services/auth';
import { setUser } from '../../redux/slices/authSlice';

/**
 * Admin Dashboard
 * Main admin layout with collapsible sidebar and nested routes
 * Only accessible to users with role='admin'
 */
class Admin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarCollapsed: false,
      notifications: [
        { id: 1, message: 'New player registration pending', type: 'info', time: '5m ago' },
        { id: 2, message: 'Payment received: RM 150', type: 'success', time: '1h ago' },
        { id: 3, message: 'Training session canceled', type: 'warning', time: '2h ago' },
      ],
      showNotifications: false,
    };
  }

  async componentDidMount() {
    window.scrollTo(0, 0);
    // Check sidebar preference from localStorage
    const savedSidebarState = localStorage.getItem('adminSidebarCollapsed');
    if (savedSidebarState !== null) {
      this.setState({ sidebarCollapsed: savedSidebarState === 'true' });
    }

    // Refresh user data from database to get latest roles
    try {
      const { user } = await getCurrentUser();
      if (user) {
        this.props.setUser(user);
        console.log('Admin page - Refreshed user data:', user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }

  toggleSidebar = () => {
    this.setState(
      (prevState) => ({ sidebarCollapsed: !prevState.sidebarCollapsed }),
      () => {
        localStorage.setItem('adminSidebarCollapsed', this.state.sidebarCollapsed);
      }
    );
  };

  toggleNotifications = () => {
    this.setState((prevState) => ({ showNotifications: !prevState.showNotifications }));
  };

  dismissNotification = (id) => {
    this.setState((prevState) => ({
      notifications: prevState.notifications.filter((n) => n.id !== id),
    }));
  };

  getAdminName = () => {
    const { user } = this.props;
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  renderLoadingState = () => (
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
        <p className="text-white/60">Loading admin dashboard...</p>
      </motion.div>
    </div>
  );

  renderAccessDenied = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-4"
      >
        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-4">
          Access Denied
        </h1>
        <p className="text-white/60 mb-8">
          You do not have permission to access the admin dashboard.
          Only administrators can view this page.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Home
        </a>
      </motion.div>
    </div>
  );

  render() {
    const { user, loading } = this.props;
    const { sidebarCollapsed, notifications, showNotifications } = this.state;

    // Show loading state
    if (loading) {
      return this.renderLoadingState();
    }

    // Debug logging for admin check
    console.log('Admin check - User:', user);
    console.log('Admin check - user.role:', user?.role);
    console.log('Admin check - user.roles:', user?.roles);
    console.log('Admin check - user.isAdmin:', user?.isAdmin);
    console.log('Admin check - user.user_metadata?.role:', user?.user_metadata?.role);

    // Check if user is admin (using isAdmin helper from auth service that checks roles array)
    const isAdmin = user && (
      user.isAdmin ||
      user.role === 'admin' ||
      user.hasRole?.('admin') ||
      user.roles?.includes('admin') ||
      user.user_metadata?.role === 'admin'
    );

    console.log('Admin check - isAdmin result:', isAdmin);

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
      return this.renderAccessDenied();
    }

    const adminName = this.getAdminName();

    return (
      <div className="min-h-screen bg-surface-dark flex">
        {/* Sidebar */}
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggle={this.toggleSidebar}
        />

        {/* Main Content */}
        <div
          className={`flex-1 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-surface-dark-elevated border-b border-white/10">
            <div className="flex items-center justify-between px-6 py-4">
              {/* Left side - Toggle and Breadcrumb */}
              <div className="flex items-center gap-4">
                <button
                  onClick={this.toggleSidebar}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-white/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="text-xl font-display font-bold text-white">
                  Admin Dashboard
                </h1>
              </div>

              {/* Right side - Notifications and User */}
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={this.toggleNotifications}
                    className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-white/70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-80 bg-surface-dark-elevated rounded-lg shadow-xl border border-white/10 overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/10">
                        <h3 className="text-white font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-white/50">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className="p-4 border-b border-white/5 hover:bg-white/5 flex items-start gap-3"
                            >
                              <div
                                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  notification.type === 'success'
                                    ? 'bg-green-400'
                                    : notification.type === 'warning'
                                    ? 'bg-yellow-400'
                                    : 'bg-blue-400'
                                }`}
                              />
                              <div className="flex-1">
                                <p className="text-white text-sm">{notification.message}</p>
                                <p className="text-white/50 text-xs mt-1">{notification.time}</p>
                              </div>
                              <button
                                onClick={() => this.dismissNotification(notification.id)}
                                className="text-white/50 hover:text-white"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                  <div className="w-10 h-10 bg-accent-gold/20 rounded-full flex items-center justify-center">
                    <span className="text-accent-gold font-bold">
                      {adminName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-medium text-sm">{adminName}</p>
                    <p className="text-white/50 text-xs">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            <Routes>
              <Route index element={<DashboardOverview />} />
              <Route path="players" element={<PlayersManagement />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="training" element={<TrainingManagement />} />
              <Route path="payments" element={<PaymentsOverview />} />
              <Route path="investors" element={<InvestorsManagement />} />
              <Route path="analytics" element={<UserAnalytics />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  loading: state.auth?.loading,
});

const mapDispatchToProps = {
  setUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(Admin);

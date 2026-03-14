import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { markRead, markAllRead } from '../../redux/slices/notificationSlice';
import { signOut } from '../../services/auth';
import { logout } from '../../redux/slices/authSlice';

/**
 * Dashboard Header
 * Sticky header with hamburger toggle, role title, notifications, and user info.
 * Connected to Redux for notification state.
 */
class DashboardHeader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showNotifications: false,
    };
    this.notificationRef = React.createRef();
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event) => {
    if (
      this.notificationRef.current &&
      !this.notificationRef.current.contains(event.target)
    ) {
      this.setState({ showNotifications: false });
    }
  };

  toggleNotifications = () => {
    this.setState((prevState) => ({
      showNotifications: !prevState.showNotifications,
    }));
  };

  handleLogout = async () => {
    await signOut();
    this.props.logout();
    window.location.href = '/';
  };

  getRoleTitle = () => {
    const { user } = this.props;
    if (!user) return 'Dashboard';

    const hasRole = (role) => {
      if (user.hasRole) return user.hasRole(role);
      if (user.roles) return user.roles.includes(role);
      return user.role === role;
    };

    if (hasRole('super_admin') || hasRole('admin')) return 'Admin Dashboard';
    if (hasRole('coach') || hasRole('owner') || hasRole('manager')) return 'Coaching Zone';
    if (hasRole('editor') || hasRole('marketing')) return 'Marketing Zone';
    return 'Dashboard';
  };

  getUserName = () => {
    const { user } = this.props;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.profile?.full_name) return user.profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  getPrimaryRoleLabel = () => {
    const { user } = this.props;
    if (!user) return 'Staff';

    const role = user.role || 'staff';
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      coach: 'Coach',
      owner: 'Owner',
      manager: 'Manager',
      editor: 'Editor',
      marketing: 'Marketing',
    };
    return labels[role] || 'Staff';
  };

  getRoleBadgeColor = () => {
    const { user } = this.props;
    if (!user) return 'bg-white/20 text-white/70';

    const hasRole = (role) => {
      if (user.hasRole) return user.hasRole(role);
      if (user.roles) return user.roles.includes(role);
      return user.role === role;
    };

    if (hasRole('super_admin')) return 'bg-red-500/20 text-red-400';
    if (hasRole('admin')) return 'bg-accent-gold/20 text-accent-gold';
    if (hasRole('coach') || hasRole('manager')) return 'bg-blue-500/20 text-blue-400';
    if (hasRole('owner')) return 'bg-purple-500/20 text-purple-400';
    if (hasRole('editor') || hasRole('marketing')) return 'bg-green-500/20 text-green-400';
    return 'bg-white/20 text-white/70';
  };

  getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  render() {
    const { user, sidebarCollapsed, onToggleSidebar, notifications, unreadCount, markAllRead } = this.props;
    const { showNotifications } = this.state;

    const userName = this.getUserName();
    const roleTitle = this.getRoleTitle();
    const roleLabel = this.getPrimaryRoleLabel();
    const roleBadgeColor = this.getRoleBadgeColor();
    const avatarUrl = user?.user_metadata?.avatar_url || user?.profile?.profile_image_url;

    return (
      <header className="sticky top-0 z-40 bg-surface-dark-elevated border-b border-white/10">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          {/* Left side - Hamburger, Logo, and Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
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
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img
                src={`${import.meta.env.BASE_URL}kaboona-logo.png`}
                alt="Kaboona FC"
                className="h-8 w-auto"
              />
            </Link>
            <h1 className="text-xl font-display font-bold text-white">
              {roleTitle}
            </h1>
          </div>

          {/* Right side - Notifications and User */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={this.notificationRef}>
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
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-surface-dark-elevated rounded-lg shadow-xl border border-white/10 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-white font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllRead()}
                          className="text-accent-gold text-xs hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="p-4 text-center text-white/50">
                          No new notifications
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-white/5 hover:bg-white/5 flex items-start gap-3 ${
                              !notification.read ? 'bg-white/[0.02]' : ''
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                notification.type === 'success'
                                  ? 'bg-green-400'
                                  : notification.type === 'warning'
                                  ? 'bg-yellow-400'
                                  : notification.type === 'error'
                                  ? 'bg-red-400'
                                  : 'bg-blue-400'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">
                                {notification.title || notification.message}
                              </p>
                              {notification.body && (
                                <p className="text-white/50 text-xs mt-0.5 truncate">
                                  {notification.body}
                                </p>
                              )}
                              <p className="text-white/40 text-xs mt-1">
                                {this.getTimeAgo(notification.created_at)}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-accent-gold flex-shrink-0 mt-2" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {notifications && notifications.length > 0 && (
                      <div className="p-3 border-t border-white/10 text-center">
                        <a
                          href="/notifications"
                          className="text-accent-gold text-sm hover:underline"
                        >
                          View all notifications
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-accent-gold/20">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-accent-gold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-white font-medium text-sm">{userName}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor}`}>
                    {roleLabel}
                  </span>
                </div>
              </Link>
              <button
                onClick={this.handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }
}

const mapStateToProps = (state) => ({
  notifications: state.notifications?.notifications || [],
  unreadCount: state.notifications?.unreadCount || 0,
});

const mapDispatchToProps = {
  markRead,
  markAllRead,
  logout,
};

export default connect(mapStateToProps, mapDispatchToProps)(DashboardHeader);

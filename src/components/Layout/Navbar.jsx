import React, { Component } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { connect } from 'react-redux';
import { signOut } from '../../services/auth';
import { logout } from '../../redux/slices/authSlice';
import { markRead, markAllRead, invitationResponded } from '../../redux/slices/notificationSlice';
import { markAsRead, markAllAsRead } from '../../services/notificationService';
import supabase from '../../services/supabase';
import { respondToInvitation } from '../../services/schedulingService';
import { approvePlayerRequest, declinePlayerRequest } from '../../services/playerRequestService';

function getRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationTypeIcon(type) {
  switch (type) {
    case 'training_invite':
      return { color: 'text-green-400', bg: 'bg-green-400/10', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )};
    case 'match_invite':
      return { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )};
    case 'formation_published':
      return { color: 'text-accent-gold', bg: 'bg-accent-gold/10', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
        </svg>
      )};
    case 'match_reminder':
      return { color: 'text-orange-400', bg: 'bg-orange-400/10', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )};
    case 'player_approved':
      return { color: 'text-green-400', bg: 'bg-green-400/10', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )};
    case 'player_request':
      return { color: 'text-purple-400', bg: 'bg-purple-400/10', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )};
    case 'player_declined':
      return { color: 'text-red-400', bg: 'bg-red-400/10', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )};
    default:
      return { color: 'text-gray-400', bg: 'bg-gray-400/10', icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )};
  }
}

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isScrolled: false,
      isMobileMenuOpen: false,
      isNotificationOpen: false,
      invitationMap: {},       // notification reference_id → invitation record
      respondingId: null,      // invitation id currently being responded to
      respondedIds: {},        // invitation id → 'accepted' | 'declined'
    };
    this.notificationRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event) => {
    if (
      this.notificationRef.current &&
      !this.notificationRef.current.contains(event.target)
    ) {
      this.setState({ isNotificationOpen: false });
    }
  };

  handleScroll = () => {
    const isScrolled = window.scrollY > 20;
    if (isScrolled !== this.state.isScrolled) {
      this.setState({ isScrolled });
    }
  };

  toggleMobileMenu = () => {
    this.setState((prevState) => ({
      isMobileMenuOpen: !prevState.isMobileMenuOpen,
    }));
  };

  closeMobileMenu = () => {
    this.setState({ isMobileMenuOpen: false });
  };

  toggleNotifications = () => {
    this.setState((prevState) => {
      const willOpen = !prevState.isNotificationOpen;
      if (willOpen) {
        this.loadInvitationsForNotifications();
      }
      return { isNotificationOpen: willOpen };
    });
  };

  handleNotificationClick = async (notification) => {
    if (!notification.read) {
      this.props.markRead(notification.id);
      try {
        await markAsRead(notification.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
  };

  loadInvitationsForNotifications = async () => {
    const { user } = this.props;
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('event_invitations')
        .select('*')
        .eq('player_id', user.id)
        .eq('status', 'pending');

      if (data) {
        const map = {};
        data.forEach((inv) => {
          map[inv.event_id] = inv;
        });
        this.setState({ invitationMap: map });
      }
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  handleInvitationRespond = async (invitation, status) => {
    this.setState({ respondingId: invitation.id });
    try {
      await respondToInvitation(invitation.id, status);
      this.setState((prev) => ({
        respondingId: null,
        respondedIds: { ...prev.respondedIds, [invitation.id]: status },
      }));
      // Signal UpcomingEvents to refresh
      this.props.invitationResponded();
    } catch (err) {
      console.error('Failed to respond to invitation:', err);
      this.setState({ respondingId: null });
    }
  };

  handleMarkAllRead = async () => {
    const { user } = this.props;
    if (!user) return;
    this.props.markAllRead();
    try {
      await markAllAsRead(user.id);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  handleLogout = async () => {
    const { logout } = this.props;
    await signOut();
    logout();
    this.closeMobileMenu();
  };

  renderNotificationBell() {
    const { unreadCount, user } = this.props;
    if (!user) return null;

    return (
      <div className="relative" ref={this.notificationRef}>
        <motion.button
          onClick={this.toggleNotifications}
          className="relative p-2 rounded-full text-primary-black/80 dark:text-white/80 hover:text-primary-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          whileTap={{ scale: 0.95 }}
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {this.state.isNotificationOpen && this.renderNotificationDropdown()}
        </AnimatePresence>
      </div>
    );
  }

  handlePlayerRequestAction = async (notification, action) => {
    const requesterId = notification.reference_id;
    const requesterName = notification.body?.split(' has ')[0] || 'User';

    try {
      if (action === 'approve') {
        await approvePlayerRequest(requesterId, requesterName);
      } else {
        await declinePlayerRequest(requesterId);
      }
      // Mark this notification as read
      this.handleNotificationClick(notification);
      // Store the action result for ALL notifications with the same reference_id
      // so other admins' notifications also show the resolved status
      this.setState((prev) => {
        const updated = { ...prev.playerRequestActions };
        const { notifications } = this.props;
        notifications.forEach((n) => {
          if (n.type === 'player_request' && n.reference_id === requesterId) {
            updated[n.id] = action;
          }
        });
        return { playerRequestActions: updated };
      });
    } catch (err) {
      console.error(`Failed to ${action} player request:`, err);
    }
  };

  renderNotificationItem(notification) {
    const { invitationMap, respondingId, respondedIds, playerRequestActions = {} } = this.state;
    const typeInfo = getNotificationTypeIcon(notification.type);
    const isInvitation = notification.type === 'event_invitation';
    const invitation = isInvitation ? invitationMap[notification.reference_id] : null;
    const responded = invitation ? respondedIds[invitation.id] : null;
    const isResponding = invitation && respondingId === invitation.id;
    const showActions = isInvitation && invitation && !responded;
    const isPlayerRequest = notification.type === 'player_request';
    const playerRequestAction = playerRequestActions[notification.id];
    const { user } = this.props;
    const canManagePlayerRequests = user?.isAdmin || user?.isCoach || user?.hasRole?.('admin') || user?.hasRole?.('coach');

    return (
      <div
        key={notification.id}
        onClick={() => this.handleNotificationClick(notification)}
        className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 cursor-pointer ${
          !notification.read ? 'bg-white/[0.03]' : ''
        }`}
      >
        <div className="flex items-start space-x-3">
          {/* Type Icon */}
          <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-full ${typeInfo.bg} ${typeInfo.color} flex items-center justify-center`}>
            {typeInfo.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <p className={`text-sm truncate ${!notification.read ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>
                {notification.title}
              </p>
              {!notification.read && (
                <span className="flex-shrink-0 ml-2 mt-1.5 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
            <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
              {notification.body}
            </p>
            <p className="text-[10px] text-white/30 mt-1">
              {getRelativeTime(notification.created_at)}
            </p>

            {/* Inline Accept/Decline for invitation notifications */}
            {showActions && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleInvitationRespond(invitation, 'accepted');
                  }}
                  disabled={isResponding}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isResponding ? '...' : 'Accept'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handleInvitationRespond(invitation, 'declined');
                  }}
                  disabled={isResponding}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  {isResponding ? '...' : 'Decline'}
                </button>
              </div>
            )}

            {/* Show responded status */}
            {isInvitation && responded && (
              <div className="mt-2">
                {responded === 'accepted' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    Accepted
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/50 border border-white/20">
                    Declined
                  </span>
                )}
              </div>
            )}

            {/* Player Request Accept/Decline — only show if not yet handled */}
            {isPlayerRequest && canManagePlayerRequests && !playerRequestAction && !notification.read && notification.title !== 'Player Request Handled' && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handlePlayerRequestAction(notification, 'approve');
                  }}
                  className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    this.handlePlayerRequestAction(notification, 'decline');
                  }}
                  className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}

            {/* Player Request Action Status */}
            {isPlayerRequest && (playerRequestAction || notification.read) && (
              <div className="mt-2">
                {(playerRequestAction === 'approve' || (notification.read && !playerRequestAction)) ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                    Handled
                  </span>
                ) : playerRequestAction === 'decline' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    Declined
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderNotificationDropdown() {
    const { notifications } = this.props;
    const displayNotifications = notifications.slice(0, 10);

    return (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 mt-2 w-80 md:w-96 max-h-[70vh] overflow-hidden rounded-xl bg-surface-dark-elevated border border-white/10 shadow-2xl z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {notifications.length > 0 && (
            <button
              onClick={this.handleMarkAllRead}
              className="text-xs text-accent-gold hover:text-accent-gold/80 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto max-h-[calc(70vh-96px)]">
          {displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <svg className="w-10 h-10 text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-sm text-white/40">No notifications yet</p>
            </div>
          ) : (
            displayNotifications.map((notification) => this.renderNotificationItem(notification))
          )}
        </div>

        {/* View All */}
        <div className="border-t border-white/10">
          <Link
            to="/notifications"
            onClick={() => this.setState({ isNotificationOpen: false })}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-accent-gold hover:bg-white/5 transition-colors font-medium"
          >
            View All Notifications
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </motion.div>
    );
  }

  renderMobileNotificationBell() {
    const { unreadCount, user } = this.props;
    if (!user) return null;

    return (
      <motion.button
        onClick={this.toggleNotifications}
        className="relative p-2 rounded-full text-primary-black/80 dark:text-white/80 hover:text-primary-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        whileTap={{ scale: 0.95 }}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>
    );
  }

  render() {
    const { darkMode, toggleDarkMode, user } = this.props;
    const { isScrolled, isMobileMenuOpen, isNotificationOpen } = this.state;

    const hasRole = user?.hasRole || (() => false);

    // Determine if user is staff (any role besides fan/player)
    const isStaff = user && (
      hasRole('admin') || hasRole('super_admin') || hasRole('coach') ||
      hasRole('owner') || hasRole('manager') || hasRole('editor') || hasRole('marketing')
    );

    // Public nav links — always shown
    let navLinks = [
      { to: '/', label: 'Home' },
      { to: '/our-team', label: 'Our Team' },
      { to: '/stats', label: 'Stats' },
      { to: '/shop', label: 'Shop' },
      { to: '/fan-portal', label: 'Fan Portal' },
      { to: '/investors', label: 'Investors' },
    ];

    // Staff users also get their role-based dashboard link
    if (isStaff) {
      if (hasRole('admin') || hasRole('super_admin')) {
        navLinks.push({ to: '/dashboard', label: 'Admin' });
      } else {
        if (hasRole('coach') || hasRole('owner') || hasRole('manager')) {
          navLinks.push({ to: '/dashboard', label: 'Coaching Zone' });
        }
        if (hasRole('editor') || hasRole('marketing')) {
          navLinks.push({ to: '/dashboard', label: 'Marketing Zone' });
        }
      }
    }

    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo + Desktop Navigation */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 mr-6">
                <img src={`${import.meta.env.BASE_URL}kaboona-logo.png`} alt="Kaboona FC" className="h-10 md:h-14 w-auto" />
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? 'text-accent-gold'
                          : 'text-primary-black/80 dark:text-white/80 hover:text-primary-black dark:hover:text-white'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right Side - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Notification Bell - Desktop */}
              {this.renderNotificationBell()}

              {/* Auth Buttons or User Avatar */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center">
                      <span className="text-sm font-medium text-black">
                        {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  </Link>
                  <motion.button
                    onClick={this.handleLogout}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white border border-white/20 rounded-md hover:border-white/40 transition-colors"
                  >
                    Logout
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-primary-black/80 dark:text-white/80 hover:text-primary-black dark:hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium bg-accent-gold text-black rounded-md hover:bg-accent-gold-light transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Notification Bell - Mobile */}
              {this.renderMobileNotificationBell()}

              {/* Hamburger Button */}
              <button
                onClick={this.toggleMobileMenu}
                className="p-2 rounded-md text-primary-black/80 dark:text-white/80 hover:text-primary-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Notification Dropdown */}
        <AnimatePresence>
          {isNotificationOpen && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-surface-dark-elevated border-t border-white/10"
            >
              {this.renderMobileNotificationPanel()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-black/10 dark:border-white/10"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={this.closeMobileMenu}
                    className={({ isActive }) =>
                      `block px-4 py-3 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? 'text-accent-gold bg-black/5 dark:bg-white/5'
                          : 'text-primary-black/80 dark:text-white/80 hover:text-primary-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}

                {/* Mobile Auth Section */}
                <div className="pt-4 mt-4 border-t border-white/10">
                  {user ? (
                    <div className="space-y-2">
                      <Link
                        to="/profile"
                        onClick={this.closeMobileMenu}
                        className="flex items-center space-x-3 px-4 py-3 text-white/80 hover:text-white transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-accent-gold flex items-center justify-center">
                          <span className="text-sm font-medium text-black">
                            {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={this.handleLogout}
                        className="block w-full px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-md text-left transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={this.closeMobileMenu}
                        className="block px-4 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={this.closeMobileMenu}
                        className="block px-4 py-3 text-base font-medium bg-accent-gold text-black rounded-md hover:bg-accent-gold-light text-center transition-colors"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    );
  }

  renderMobileNotificationPanel() {
    const { notifications } = this.props;
    const displayNotifications = notifications.slice(0, 10);

    return (
      <div className="max-h-[60vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          <div className="flex items-center space-x-3">
            {notifications.length > 0 && (
              <button
                onClick={this.handleMarkAllRead}
                className="text-xs text-accent-gold hover:text-accent-gold/80 transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={this.toggleNotifications}
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="overflow-y-auto max-h-[calc(60vh-48px)]">
          {displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <svg className="w-10 h-10 text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <p className="text-sm text-white/40">No notifications yet</p>
            </div>
          ) : (
            displayNotifications.map((notification) => this.renderNotificationItem(notification))
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  notifications: state.notifications?.notifications || [],
  unreadCount: state.notifications?.unreadCount || 0,
  user: state.auth?.user,
});

const mapDispatchToProps = {
  logout,
  markRead,
  markAllRead,
  invitationResponded,
};

export default connect(mapStateToProps, mapDispatchToProps)(Navbar);

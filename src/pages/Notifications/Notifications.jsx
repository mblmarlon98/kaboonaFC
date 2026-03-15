import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { markRead, markAllRead } from '../../redux/slices/notificationSlice';
import { markAsRead, markAllAsRead } from '../../services/notificationService';

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
      return { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Training' };
    case 'match_invite':
      return { color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Match' };
    case 'formation_published':
      return { color: 'text-accent-gold', bg: 'bg-accent-gold/10', label: 'Formation' };
    case 'match_reminder':
      return { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Reminder' };
    case 'player_approved':
      return { color: 'text-green-400', bg: 'bg-green-400/10', label: 'Approved' };
    case 'player_request':
      return { color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Request' };
    case 'player_declined':
      return { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Declined' };
    case 'injury_reported':
      return { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Injury' };
    case 'note_created':
      return { color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'Note' };
    case 'starting_11':
      return { color: 'text-accent-gold', bg: 'bg-accent-gold/10', label: 'Starting XI' };
    case 'event_cancellation':
      return { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Cancelled' };
    default:
      return { color: 'text-gray-400', bg: 'bg-gray-400/10', label: 'General' };
  }
}

class Notifications extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: 'all', // 'all', 'unread', 'read'
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  handleFilterChange = (filter) => {
    this.setState({ filter });
  };

  handleMarkAsRead = async (notification) => {
    if (!notification.read) {
      this.props.markRead(notification.id);
      try {
        await markAsRead(notification.id);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  handleMarkAllRead = async () => {
    const { user } = this.props;
    if (!user) return;
    this.props.markAllRead();
    try {
      await markAllAsRead(user.id);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  getFilteredNotifications = () => {
    const { notifications } = this.props;
    const { filter } = this.state;

    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'read') return notifications.filter((n) => n.read);
    return notifications;
  };

  render() {
    const { notifications, unreadCount } = this.props;
    const { filter } = this.state;
    const filtered = this.getFilteredNotifications();
    const readCount = notifications.filter((n) => n.read).length;

    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Notifications</h1>
              <p className="text-white/50 text-sm mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={this.handleMarkAllRead}
                className="mt-3 sm:mt-0 px-4 py-2 bg-accent-gold/10 text-accent-gold text-sm font-medium rounded-lg hover:bg-accent-gold/20 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </motion.div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: readCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => this.handleFilterChange(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === tab.key
                    ? 'bg-accent-gold text-black'
                    : 'bg-surface-dark-elevated text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {tab.label}
                <span className={`ml-2 ${filter === tab.key ? 'text-black/60' : 'text-white/40'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface-dark-elevated rounded-xl border border-white/10 p-12 text-center"
              >
                <svg className="w-12 h-12 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="text-white/40 text-sm">
                  {filter === 'unread'
                    ? 'No unread notifications'
                    : filter === 'read'
                    ? 'No read notifications'
                    : 'No notifications yet'}
                </p>
              </motion.div>
            ) : (
              filtered.map((notification, index) => {
                const typeInfo = getNotificationTypeIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => this.handleMarkAsRead(notification)}
                    className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      notification.read
                        ? 'bg-surface-dark-elevated border-white/5 hover:border-white/10'
                        : 'bg-surface-dark-elevated border-accent-gold/20 hover:border-accent-gold/30'
                    }`}
                  >
                    {/* Unread dot */}
                    {!notification.read && (
                      <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-accent-gold rounded-full" />
                    )}

                    {/* Type badge */}
                    <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`text-xs font-bold ${typeInfo.color}`}>
                        {typeInfo.label.charAt(0)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${notification.read ? 'text-white/70' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                      </div>
                      <p className={`text-sm mt-0.5 ${notification.read ? 'text-white/40' : 'text-white/60'}`}>
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs ${notification.read ? 'text-white/30' : 'text-white/50'}`}>
                          {getRelativeTime(notification.created_at)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeInfo.bg} ${typeInfo.color} border-current/20`}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
  notifications: state.notifications?.notifications || [],
  unreadCount: state.notifications?.unreadCount || 0,
});

const mapDispatchToProps = {
  markRead,
  markAllRead,
};

export default connect(mapStateToProps, mapDispatchToProps)(Notifications);

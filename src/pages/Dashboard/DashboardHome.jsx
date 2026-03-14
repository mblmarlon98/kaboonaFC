import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';
import Calendar from './components/Calendar';

/**
 * DashboardHome
 * Role-aware welcome page that serves as the dashboard index route.
 * Shows personalized stats and upcoming events based on user roles.
 */
class DashboardHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      stats: [],
      upcomingEvents: [],
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  /**
   * Determine which role categories the current user belongs to.
   */
  getUserRoleFlags = () => {
    const { user } = this.props;
    if (!user) return { isCoach: false, isMarketing: false, isAdmin: false };

    const checkRole = (role) => {
      if (user.hasRole) return user.hasRole(role);
      if (user.roles) return user.roles.includes(role);
      return user.role === role;
    };

    const isAdmin = checkRole('admin') || checkRole('super_admin');
    const isCoach = checkRole('coach') || checkRole('owner') || checkRole('manager');
    const isMarketing = checkRole('editor') || checkRole('marketing');

    return { isCoach: isCoach || isAdmin, isMarketing: isMarketing || isAdmin, isAdmin };
  };

  /**
   * Get the primary role for badge display.
   */
  getPrimaryRole = () => {
    const { user } = this.props;
    if (!user) return null;

    const checkRole = (role) => {
      if (user.hasRole) return user.hasRole(role);
      if (user.roles) return user.roles.includes(role);
      return user.role === role;
    };

    if (checkRole('admin') || checkRole('super_admin')) return 'admin';
    if (checkRole('coach') || checkRole('owner') || checkRole('manager')) return 'coach';
    if (checkRole('editor') || checkRole('marketing')) return 'marketing';
    return user.role || 'staff';
  };

  getRoleBadgeConfig = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', className: 'bg-accent-gold/20 text-accent-gold' };
      case 'coach':
        return { label: 'Coach', className: 'bg-blue-500/20 text-blue-400' };
      case 'marketing':
        return { label: 'Marketing', className: 'bg-green-500/20 text-green-400' };
      default:
        return { label: role.charAt(0).toUpperCase() + role.slice(1), className: 'bg-white/10 text-white/70' };
    }
  };

  fetchData = async () => {
    this.setState({ loading: true });
    try {
      await Promise.all([
        this.fetchStats(),
        this.fetchUpcomingEvents(),
      ]);
    } catch (err) {
      console.error('Error fetching dashboard home data:', err);
    } finally {
      this.setState({ loading: false });
    }
  };

  fetchStats = async () => {
    const { isCoach, isMarketing, isAdmin } = this.getUserRoleFlags();
    const stats = [];

    if (isCoach) {
      // Next Training
      const { data: trainings } = await supabase
        .from('training_sessions')
        .select('*')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date')
        .limit(1);

      const nextTraining = trainings && trainings.length > 0 ? trainings[0] : null;
      stats.push({
        title: 'Next Training',
        value: nextTraining
          ? new Date(nextTraining.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
          : 'None scheduled',
        icon: (
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        colorClass: 'bg-blue-400/20',
      });

      // Next Match
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .gte('match_date', new Date().toISOString().split('T')[0])
        .order('match_date')
        .limit(1);

      const nextMatch = matches && matches.length > 0 ? matches[0] : null;
      stats.push({
        title: 'Next Match',
        value: nextMatch
          ? `${nextMatch.opponent || 'TBD'} - ${new Date(nextMatch.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
          : 'None scheduled',
        icon: (
          <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        ),
        colorClass: 'bg-red-400/20',
      });

      // Total Players
      const { count: playerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .contains('roles', ['player']);

      stats.push({
        title: 'Total Players',
        value: playerCount || 0,
        icon: (
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        colorClass: 'bg-green-400/20',
      });
    }

    if (isMarketing) {
      // Upcoming Events
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('date', new Date().toISOString());

      stats.push({
        title: 'Upcoming Events',
        value: eventCount || 0,
        icon: (
          <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        colorClass: 'bg-purple-400/20',
      });

      // Published Articles
      const { count: publishedCount } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      stats.push({
        title: 'Published Articles',
        value: publishedCount || 0,
        icon: (
          <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        ),
        colorClass: 'bg-accent-gold/20',
      });

      // Draft Articles
      const { count: draftCount } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', false);

      stats.push({
        title: 'Draft Articles',
        value: draftCount || 0,
        icon: (
          <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ),
        colorClass: 'bg-orange-400/20',
      });
    }

    if (isAdmin) {
      // Total Users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      stats.push({
        title: 'Total Users',
        value: userCount || 0,
        icon: (
          <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        colorClass: 'bg-accent-gold/20',
      });

      // Pending Player Requests
      const { count: pendingCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('player_request_status', 'pending');

      stats.push({
        title: 'Pending Player Requests',
        value: pendingCount || 0,
        icon: (
          <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        colorClass: 'bg-yellow-400/20',
      });
    }

    this.setState({ stats });
  };

  fetchUpcomingEvents = async () => {
    const now = new Date().toISOString();
    const todayDate = new Date().toISOString().split('T')[0];
    const events = [];

    try {
      // Fetch upcoming trainings
      const { data: trainings } = await supabase
        .from('training_sessions')
        .select('id, session_date, session_time, location')
        .gte('session_date', todayDate)
        .order('session_date')
        .limit(5);

      (trainings || []).forEach((t) => {
        events.push({
          id: `training-${t.id}`,
          type: 'training',
          title: 'Training Session',
          date: t.session_date,
          location: t.location,
        });
      });

      // Fetch upcoming matches
      const { data: matches } = await supabase
        .from('matches')
        .select('id, opponent, match_date, match_time, location')
        .gte('match_date', todayDate)
        .order('match_date')
        .limit(5);

      (matches || []).forEach((m) => {
        events.push({
          id: `match-${m.id}`,
          type: 'match',
          title: `vs ${m.opponent || 'TBD'}`,
          date: m.match_date,
          location: m.location,
        });
      });

      // Fetch upcoming events
      const { data: clubEvents } = await supabase
        .from('events')
        .select('id, title, date, location')
        .gte('date', now)
        .order('date')
        .limit(5);

      (clubEvents || []).forEach((e) => {
        events.push({
          id: `event-${e.id}`,
          type: 'event',
          title: e.title || 'Club Event',
          date: e.date,
          location: e.location,
        });
      });
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
    }

    // Sort by date and take first 5
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.setState({ upcomingEvents: events.slice(0, 5) });
  };

  getTypeBadgeConfig = (type) => {
    switch (type) {
      case 'training':
        return { label: 'Training', className: 'bg-blue-500/20 text-blue-400' };
      case 'match':
        return { label: 'Match', className: 'bg-red-500/20 text-red-400' };
      case 'event':
        return { label: 'Event', className: 'bg-green-500/20 text-green-400' };
      default:
        return { label: type, className: 'bg-white/10 text-white/70' };
    }
  };

  formatEventDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  renderLoadingState = () => {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-64 mb-2" />
          <div className="h-5 bg-white/10 rounded w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10 animate-pulse"
            >
              <div className="h-4 bg-white/10 rounded w-24 mb-4" />
              <div className="h-8 bg-white/10 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  render() {
    const { user } = this.props;
    const { loading, stats, upcomingEvents } = this.state;

    if (loading) {
      return this.renderLoadingState();
    }

    const displayName = user?.user_metadata?.full_name || user?.email || 'User';
    const primaryRole = this.getPrimaryRole();
    const roleBadge = this.getRoleBadgeConfig(primaryRole);

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-white">
              Welcome back, {displayName}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
          </div>
          <p className="text-white/50 mt-1">Here is your dashboard overview.</p>
        </motion.div>

        {/* Stat Cards */}
        {stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.colorClass}`}>
                    {stat.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Calendar
            userRoles={user?.roles || (user?.role ? [user.role] : [])}
            user={user}
            readOnly={false}
            defaultViewMode="month"
          />
        </motion.div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(DashboardHome);

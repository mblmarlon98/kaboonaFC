import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { supabase } from '../../../services/supabase';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const REVENUE_COLORS = {
  subscription: '#D4AF37',
  donation: '#4A90A4',
  merchandise: '#6BA3B5',
  event: '#E5C158',
  other: '#9B59B6',
};

/**
 * Dashboard Overview Component
 * Displays overview cards, charts, and recent activity from Supabase data
 */
class DashboardOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      stats: {
        totalUsers: 0,
        activeSubscriptions: 0,
        revenueThisMonth: 0,
        attendanceRate: 0,
      },
      statsChange: {
        totalUsers: 0,
        activeSubscriptions: 0,
        revenueThisMonth: 0,
        attendanceRate: 0,
      },
      trafficData: [],
      subscriptionData: [],
      revenueBreakdown: [],
      recentActivity: [],
    };
  }

  componentDidMount() {
    this.fetchAllData();
  }

  fetchAllData = async () => {
    this.setState({ loading: true });
    try {
      await Promise.all([
        this.fetchStats(),
        this.fetchTrafficData(),
        this.fetchSubscriptionData(),
        this.fetchRevenueBreakdown(),
        this.fetchRecentActivity(),
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      this.setState({ loading: false });
    }
  };

  getMonthRange = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  fetchStats = async () => {
    const now = new Date();
    const thisMonth = this.getMonthRange(now);
    const lastMonth = this.getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Users last month (created before this month start)
    const { count: usersLastMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', thisMonth.start);

    // Active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Active subs last month - subscriptions created before this month that were active
    const { count: activeSubsLastMonth } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('created_at', thisMonth.start);

    // Revenue this month (payments)
    const { data: paymentsThisMonth } = await supabase
      .from('payments')
      .select('amount')
      .gte('created_at', thisMonth.start)
      .lte('created_at', thisMonth.end)
      .eq('status', 'completed');

    const revenueThisMonth = (paymentsThisMonth || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    // Revenue last month
    const { data: paymentsLastMonth } = await supabase
      .from('payments')
      .select('amount')
      .gte('created_at', lastMonth.start)
      .lte('created_at', lastMonth.end)
      .eq('status', 'completed');

    const revenueLastMonth = (paymentsLastMonth || []).reduce((sum, p) => sum + (p.amount || 0), 0);

    // Attendance this month
    const { count: attendanceThisMonth } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth.start)
      .lte('created_at', thisMonth.end);

    const { count: attendedThisMonth } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth.start)
      .lte('created_at', thisMonth.end)
      .eq('status', 'present');

    const attendanceRate = (attendanceThisMonth || 0) > 0
      ? Math.round(((attendedThisMonth || 0) / attendanceThisMonth) * 100)
      : 0;

    // Attendance last month
    const { count: attendanceLastMonth } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.start)
      .lte('created_at', lastMonth.end);

    const { count: attendedLastMonth } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonth.start)
      .lte('created_at', lastMonth.end)
      .eq('status', 'present');

    const attendanceRateLastMonth = (attendanceLastMonth || 0) > 0
      ? Math.round(((attendedLastMonth || 0) / attendanceLastMonth) * 100)
      : 0;

    // Calculate percentage changes
    const calcChange = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    this.setState({
      stats: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        revenueThisMonth,
        attendanceRate,
      },
      statsChange: {
        totalUsers: calcChange(totalUsers || 0, usersLastMonth || 0),
        activeSubscriptions: calcChange(activeSubscriptions || 0, activeSubsLastMonth || 0),
        revenueThisMonth: calcChange(revenueThisMonth, revenueLastMonth),
        attendanceRate: attendanceRate - attendanceRateLastMonth,
      },
    });
  };

  fetchTrafficData = async () => {
    // Traffic data: aggregate user registrations per month as a proxy for site traffic
    // (visitors = new users that month, pageViews approximated as attendance records per month)
    const now = new Date();
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d);
    }

    const trafficData = await Promise.all(
      months.map(async (monthDate) => {
        const range = this.getMonthRange(monthDate);
        const monthLabel = MONTH_NAMES[monthDate.getMonth()];

        const { count: visitors } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', range.start)
          .lte('created_at', range.end);

        const { count: pageViews } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', range.start)
          .lte('created_at', range.end);

        return {
          name: monthLabel,
          visitors: visitors || 0,
          pageViews: pageViews || 0,
        };
      })
    );

    this.setState({ trafficData });
  };

  fetchSubscriptionData = async () => {
    const now = new Date();
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d);
    }

    const subscriptionData = await Promise.all(
      months.map(async (monthDate) => {
        const range = this.getMonthRange(monthDate);
        const monthLabel = MONTH_NAMES[monthDate.getMonth()];

        // Fetch subscriptions created in this month grouped by plan_type
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('plan_type')
          .gte('created_at', range.start)
          .lte('created_at', range.end);

        const counts = { basic: 0, pro: 0, elite: 0 };
        (subs || []).forEach((s) => {
          const plan = (s.plan_type || '').toLowerCase();
          if (plan in counts) {
            counts[plan]++;
          } else {
            // Map unknown plans to basic
            counts.basic++;
          }
        });

        return {
          name: monthLabel,
          basic: counts.basic,
          pro: counts.pro,
          elite: counts.elite,
        };
      })
    );

    this.setState({ subscriptionData });
  };

  fetchRevenueBreakdown = async () => {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_type')
      .eq('status', 'completed');

    const grouped = {};
    (payments || []).forEach((p) => {
      const type = (p.payment_type || 'other').toLowerCase();
      if (!grouped[type]) {
        grouped[type] = 0;
      }
      grouped[type] += p.amount || 0;
    });

    // Also include donations as a separate category
    const { data: donations } = await supabase
      .from('donations')
      .select('amount');

    const donationTotal = (donations || []).reduce((sum, d) => sum + (d.amount || 0), 0);
    if (donationTotal > 0) {
      grouped['donation'] = (grouped['donation'] || 0) + donationTotal;
    }

    const revenueBreakdown = Object.entries(grouped).map(([type, value]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      color: REVENUE_COLORS[type] || REVENUE_COLORS.other,
    }));

    this.setState({ revenueBreakdown });
  };

  fetchRecentActivity = async () => {
    // Fetch real admin-relevant events from multiple tables
    const [signupsRes, paymentsRes, sessionsRes, donationsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('payments')
        .select('id, amount, currency, payment_type, status, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('training_sessions')
        .select('id, title, session_date, created_at')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('donations')
        .select('id, amount, created_at')
        .order('created_at', { ascending: false })
        .limit(3),
    ]);

    const events = [];

    (signupsRes.data || []).forEach((p) => {
      events.push({
        id: `signup-${p.id}`,
        type: 'registration',
        message: `New user registered: ${p.full_name || p.email || 'Unknown'}`,
        timestamp: p.created_at,
        time: this.formatTimeAgo(p.created_at),
        icon: 'user-plus',
      });
    });

    (paymentsRes.data || []).forEach((p) => {
      const currency = p.currency || 'MYR';
      events.push({
        id: `payment-${p.id}`,
        type: 'payment',
        message: `Payment received: ${currency} ${p.amount} (${(p.payment_type || 'general').replace('_', ' ')})`,
        timestamp: p.created_at,
        time: this.formatTimeAgo(p.created_at),
        icon: 'credit-card',
      });
    });

    (sessionsRes.data || []).forEach((s) => {
      events.push({
        id: `session-${s.id}`,
        type: 'training',
        message: `Training session created: ${s.title}`,
        timestamp: s.created_at,
        time: this.formatTimeAgo(s.created_at),
        icon: 'calendar',
      });
    });

    (donationsRes.data || []).forEach((d) => {
      events.push({
        id: `donation-${d.id}`,
        type: 'donation',
        message: `Donation received: MYR ${d.amount}`,
        timestamp: d.created_at,
        time: this.formatTimeAgo(d.created_at),
        icon: 'heart',
      });
    });

    // Sort all events by timestamp descending, take top 10
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = events.slice(0, 10);

    this.setState({ recentActivity });
  };

  mapTypeToIcon = (type) => {
    const mapping = {
      payment: 'credit-card',
      donation: 'heart',
      registration: 'user-plus',
      attendance: 'check-circle',
      training: 'calendar',
      event: 'calendar',
      content: 'edit',
    };
    return mapping[(type || '').toLowerCase()] || 'check-circle';
  };

  formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  formatCurrency = (value) => {
    return `RM ${value.toLocaleString()}`;
  };

  renderStatCard = (title, value, change, icon, color, index) => {
    const isPositive = change >= 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/50 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-display font-bold text-white mt-2">{value}</h3>
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-white/40 text-sm">vs last month</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
      </motion.div>
    );
  };

  renderActivityIcon = (iconType) => {
    const icons = {
      'user-plus': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      'credit-card': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      'check-circle': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      'heart': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      'calendar': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      'edit': (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    };
    return icons[iconType] || icons['check-circle'];
  };

  renderLoadingState = () => {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-display font-bold text-white">Overview</h1>
          <p className="text-white/50 mt-1">Loading dashboard data...</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10 animate-pulse"
            >
              <div className="h-4 bg-white/10 rounded w-24 mb-4" />
              <div className="h-8 bg-white/10 rounded w-16 mb-2" />
              <div className="h-3 bg-white/10 rounded w-32" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10 animate-pulse"
            >
              <div className="h-5 bg-white/10 rounded w-32 mb-4" />
              <div className="h-72 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  render() {
    const { loading, stats, statsChange, trafficData, subscriptionData, revenueBreakdown, recentActivity } = this.state;

    if (loading) {
      return this.renderLoadingState();
    }

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-display font-bold text-white">Overview</h1>
          <p className="text-white/50 mt-1">Welcome back! Here's what's happening with your club.</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {this.renderStatCard(
            'Total Users',
            stats.totalUsers,
            statsChange.totalUsers,
            <svg className="w-6 h-6 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>,
            'bg-accent-gold/20',
            0
          )}
          {/* Active Subscriptions stat card - commented out
          {this.renderStatCard(
            'Active Subscriptions',
            stats.activeSubscriptions,
            statsChange.activeSubscriptions,
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>,
            'bg-green-400/20',
            1
          )}
          */}
          {this.renderStatCard(
            'Revenue This Month',
            this.formatCurrency(stats.revenueThisMonth),
            statsChange.revenueThisMonth,
            <svg className="w-6 h-6 text-secondary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>,
            'bg-secondary-blue/20',
            2
          )}
          {this.renderStatCard(
            'Attendance Rate',
            `${stats.attendanceRate}%`,
            statsChange.attendanceRate,
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>,
            'bg-purple-400/20',
            3
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Traffic Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Site Traffic</h3>
            <div className="h-72">
              {trafficData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData}>
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4A90A4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4A90A4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141414',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#D4AF37"
                      fillOpacity={1}
                      fill="url(#colorVisitors)"
                      name="New Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="pageViews"
                      stroke="#4A90A4"
                      fillOpacity={1}
                      fill="url(#colorPageViews)"
                      name="Attendance Records"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/40">
                  No traffic data available
                </div>
              )}
            </div>
          </motion.div>

          {/* Subscription Growth - commented out
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Subscription Growth</h3>
            <div className="h-72">
              {subscriptionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subscriptionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141414',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Bar dataKey="basic" name="Basic" fill="#4A90A4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pro" name="Pro" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="elite" name="Elite" fill="#E5C158" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/40">
                  No subscription data available
                </div>
              )}
            </div>
          </motion.div>
          */}
        </div>

        {/* Revenue Breakdown and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Revenue Breakdown</h3>
            <div className="h-64">
              {revenueBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#141414',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => [`RM ${value.toLocaleString()}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-white/40">
                  No revenue data available
                </div>
              )}
            </div>
            {/* Legend */}
            {revenueBreakdown.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {revenueBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-white/70 text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2 bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-white">Recent Activity</h3>
              <span className="text-white/30 text-sm">Last 10 events</span>
            </div>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'payment' || activity.type === 'donation'
                        ? 'bg-green-400/20 text-green-400'
                        : activity.type === 'registration'
                        ? 'bg-accent-gold/20 text-accent-gold'
                        : 'bg-secondary-blue/20 text-secondary-blue'
                    }`}>
                      {this.renderActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.message}</p>
                      <p className="text-white/50 text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/40">
                  No recent activity
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
}

export default DashboardOverview;

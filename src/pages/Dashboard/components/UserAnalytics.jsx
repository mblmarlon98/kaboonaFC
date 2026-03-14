import React, { Component } from 'react';
import { connect } from 'react-redux';
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

/**
 * User Analytics Component
 * Displays user growth, active users, and demographic data for admin dashboard.
 * All data is fetched from Supabase — no mock/hardcoded arrays.
 */
class UserAnalytics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeRange: '30d',
      loading: true,
      realUsers: [],
      totalUsers: 0,
      playerCount: 0,
      fanCount: 0,
      coachCount: 0,
      adminCount: 0,
      pendingRequests: 0,
      userGrowthData: [],
      activeUsersData: [],
      userTypeDistribution: [],
      nationalityDistribution: [],
      prevPeriodStats: null,
      hasAnalyticsData: false,
    };
  }

  componentDidMount() {
    this.fetchAllData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.timeRange !== this.state.timeRange) {
      this.fetchActiveUsersData();
    }
  }

  fetchAllData = async () => {
    this.setState({ loading: true });
    await Promise.all([
      this.fetchProfilesData(),
      this.fetchNationalityData(),
      this.fetchActiveUsersData(),
    ]);
    this.setState({ loading: false });
  };

  fetchProfilesData = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, roles, created_at, player_request_status')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      const allProfiles = profiles || [];

      // Fetch emails from players table for cross-reference
      const { data: players } = await supabase.from('players').select('user_id, email');
      const emailMap = {};
      (players || []).forEach((p) => {
        if (p.user_id && p.email) emailMap[p.user_id] = p.email;
      });

      const profilesWithEmails = allProfiles.map((p) => ({
        ...p,
        email: p.email || emailMap[p.id] || null,
      }));

      // Compute role counts using both role and roles[] columns
      const hasRole = (p, r) => p.role === r || (p.roles && p.roles.includes(r));

      const playerCount = profilesWithEmails.filter((p) => hasRole(p, 'player')).length;
      const coachCount = profilesWithEmails.filter((p) => hasRole(p, 'coach')).length;
      const adminCount = profilesWithEmails.filter(
        (p) => hasRole(p, 'admin') || hasRole(p, 'super_admin')
      ).length;
      // Fans: anyone not a player, coach, or admin
      const fanCount = profilesWithEmails.filter(
        (p) => !hasRole(p, 'player') && !hasRole(p, 'coach') && !hasRole(p, 'admin') && !hasRole(p, 'super_admin')
      ).length;
      const pendingRequests = profilesWithEmails.filter(
        (p) => p.player_request_status === 'pending'
      ).length;

      // Build user growth data grouped by month (cumulative)
      const userGrowthData = this.computeUserGrowth(profilesWithEmails);

      // Build user type distribution for the pie chart
      const distEntries = [];
      if (playerCount > 0) distEntries.push({ name: 'Players', value: playerCount, color: '#D4AF37' });
      if (fanCount > 0) distEntries.push({ name: 'Fans', value: fanCount, color: '#4A90A4' });
      if (coachCount > 0) distEntries.push({ name: 'Coaches', value: coachCount, color: '#E5C158' });
      if (adminCount > 0) distEntries.push({ name: 'Admins', value: adminCount, color: '#6BA3B5' });

      // Compute period-over-period percentage changes
      const prevPeriodStats = this.computePeriodChange(profilesWithEmails);

      this.setState({
        realUsers: profilesWithEmails,
        totalUsers: profilesWithEmails.length,
        playerCount,
        fanCount,
        coachCount,
        adminCount,
        pendingRequests,
        userGrowthData,
        userTypeDistribution: distEntries,
        prevPeriodStats,
      });
    } catch (err) {
      console.error('Error fetching profiles data:', err);
    }
  };

  computeUserGrowth = (profiles) => {
    if (!profiles || profiles.length === 0) return [];

    // Sort profiles by created_at ascending
    const sorted = [...profiles].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const hasRole = (p, r) => p.role === r || (p.roles && p.roles.includes(r));

    // Group by year-month
    const monthMap = {};
    sorted.forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { total: 0, players: 0, fans: 0 };
      }
      monthMap[key].total += 1;
      if (hasRole(p, 'player')) {
        monthMap[key].players += 1;
      } else if (!hasRole(p, 'coach') && !hasRole(p, 'admin') && !hasRole(p, 'super_admin')) {
        monthMap[key].fans += 1;
      }
    });

    const monthKeys = Object.keys(monthMap).sort();

    // Build cumulative data
    let cumulativeTotal = 0;
    let cumulativePlayers = 0;
    let cumulativeFans = 0;

    return monthKeys.map((key) => {
      const newUsers = monthMap[key].total;
      cumulativeTotal += newUsers;
      cumulativePlayers += monthMap[key].players;
      cumulativeFans += monthMap[key].fans;

      const [year, month] = key.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('en-US', {
        month: 'short',
      });
      const label = monthKeys.length > 12 ? `${monthName} '${year.slice(2)}` : monthName;

      return {
        month: label,
        totalUsers: cumulativeTotal,
        players: cumulativePlayers,
        fans: cumulativeFans,
        newUsers,
      };
    });
  };

  computePeriodChange = (profiles) => {
    if (!profiles || profiles.length === 0) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const hasRole = (p, r) => p.role === r || (p.roles && p.roles.includes(r));

    const currentPeriod = profiles.filter(
      (p) => new Date(p.created_at) >= thirtyDaysAgo
    );
    const previousPeriod = profiles.filter(
      (p) => new Date(p.created_at) >= sixtyDaysAgo && new Date(p.created_at) < thirtyDaysAgo
    );

    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 10) / 10;
    };

    const curTotal = currentPeriod.length;
    const prevTotal = previousPeriod.length;

    const curPlayers = currentPeriod.filter((p) => hasRole(p, 'player')).length;
    const prevPlayers = previousPeriod.filter((p) => hasRole(p, 'player')).length;

    const curFans = currentPeriod.filter(
      (p) => !hasRole(p, 'player') && !hasRole(p, 'coach') && !hasRole(p, 'admin') && !hasRole(p, 'super_admin')
    ).length;
    const prevFans = previousPeriod.filter(
      (p) => !hasRole(p, 'player') && !hasRole(p, 'coach') && !hasRole(p, 'admin') && !hasRole(p, 'super_admin')
    ).length;

    // Only calculate if we have enough history (at least 60 days of data)
    const oldestProfile = profiles[profiles.length - 1];
    const hasEnoughHistory = oldestProfile && new Date(oldestProfile.created_at) <= sixtyDaysAgo;

    return {
      totalChange: hasEnoughHistory ? calcChange(curTotal, prevTotal) : null,
      playerChange: hasEnoughHistory ? calcChange(curPlayers, prevPlayers) : null,
      fanChange: hasEnoughHistory ? calcChange(curFans, prevFans) : null,
    };
  };

  fetchNationalityData = async () => {
    try {
      const { data: players, error } = await supabase
        .from('players')
        .select('country, country_name');

      if (error) {
        console.error('Error fetching nationality data:', error);
        return;
      }

      if (!players || players.length === 0) {
        this.setState({ nationalityDistribution: [] });
        return;
      }

      // Group by country code
      const countryMap = {};
      players.forEach((p) => {
        const code = (p.country || '').toLowerCase() || null;
        const name = p.country_name || (code ? code.toUpperCase() : 'Unknown');
        const key = code || 'unknown';
        if (!countryMap[key]) {
          countryMap[key] = { country: name, code, count: 0 };
        }
        countryMap[key].count += 1;
      });

      const sorted = Object.values(countryMap).sort((a, b) => b.count - a.count);
      const totalPlayers = players.length;

      // Take top 5 and group the rest as "Others"
      const top = sorted.slice(0, 5);
      const othersCount = sorted.slice(5).reduce((sum, item) => sum + item.count, 0);

      const distribution = top.map((item) => ({
        ...item,
        percentage: totalPlayers > 0 ? Math.round((item.count / totalPlayers) * 100) : 0,
      }));

      if (othersCount > 0) {
        distribution.push({
          country: 'Others',
          code: null,
          count: othersCount,
          percentage: Math.round((othersCount / totalPlayers) * 100),
        });
      }

      this.setState({ nationalityDistribution: distribution });
    } catch (err) {
      console.error('Error fetching nationality data:', err);
    }
  };

  fetchActiveUsersData = async () => {
    try {
      const { timeRange } = this.state;
      const now = new Date();
      let daysBack = 7;
      if (timeRange === '30d') daysBack = 30;
      else if (timeRange === '90d') daysBack = 90;
      else if (timeRange === '1y') daysBack = 365;

      const since = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('user_id, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching analytics events:', error);
        this.setState({ activeUsersData: [], hasAnalyticsData: false });
        return;
      }

      if (!events || events.length === 0) {
        this.setState({ activeUsersData: [], hasAnalyticsData: false });
        return;
      }

      // Group unique users per day
      const dayMap = {};
      events.forEach((e) => {
        const d = new Date(e.created_at);
        const dayKey = d.toISOString().slice(0, 10);
        if (!dayMap[dayKey]) {
          dayMap[dayKey] = new Set();
        }
        if (e.user_id) {
          dayMap[dayKey].add(e.user_id);
        }
      });

      const dayKeys = Object.keys(dayMap).sort();

      // For the chart: show last 7 data points (or fewer if less available)
      const displayDays = dayKeys.slice(-7);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      const activeUsersData = displayDays.map((dayKey) => {
        const d = new Date(dayKey + 'T00:00:00');
        const dayLabel = dayNames[d.getDay()];
        const count = dayMap[dayKey] ? dayMap[dayKey].size : 0;

        return {
          day: dayLabel,
          active: count,
        };
      });

      this.setState({ activeUsersData, hasAnalyticsData: true });
    } catch (err) {
      console.error('Error fetching active users data:', err);
      this.setState({ activeUsersData: [], hasAnalyticsData: false });
    }
  };

  formatNumber = (value) => {
    return value.toLocaleString();
  };

  renderStatCard = (title, value, change, subtitle, color, index) => {
    const hasChange = change !== null && change !== undefined;
    const isPositive = hasChange && change >= 0;

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
            <div className="flex items-center gap-2 mt-2">
              {hasChange ? (
                <span
                  className={`text-sm font-medium flex items-center ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {Math.abs(change)}%
                </span>
              ) : (
                <span className="text-sm text-white/30">N/A</span>
              )}
              <span className="text-white/40 text-sm">{subtitle}</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
        </div>
      </motion.div>
    );
  };

  renderEmptyState = (message) => (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <svg className="w-12 h-12 text-white/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p className="text-white/40 text-sm">{message}</p>
    </div>
  );

  render() {
    const {
      timeRange,
      loading,
      realUsers,
      totalUsers,
      playerCount,
      fanCount,
      pendingRequests,
      userGrowthData,
      activeUsersData,
      userTypeDistribution,
      nationalityDistribution,
      prevPeriodStats,
      hasAnalyticsData,
    } = this.state;
    const { user } = this.props;
    const isSuperAdmin =
      user?.isSuperAdmin || user?.hasRole?.('super_admin') || user?.roles?.includes('super_admin');

    const totalChange = prevPeriodStats?.totalChange ?? null;
    const playerChange = prevPeriodStats?.playerChange ?? null;
    const fanChange = prevPeriodStats?.fanChange ?? null;

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Loading user analytics...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Super Admin Badge */}
        {isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="text-purple-400 font-semibold text-sm">Super Admin Access</p>
              <p className="text-white/50 text-xs">
                Full access to all user data, emails, and detailed analytics
              </p>
            </div>
          </motion.div>
        )}

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-white">User Analytics</h1>
            <p className="text-white/50 mt-1">Track user growth, engagement, and demographics</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => this.setState({ timeRange: e.target.value })}
            className="px-4 py-2 bg-surface-dark-elevated border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-gold"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {this.renderStatCard(
            'Total Users',
            this.formatNumber(totalUsers),
            totalChange,
            'vs prev 30 days',
            'bg-accent-gold/20 text-accent-gold',
            0
          )}
          {this.renderStatCard(
            'Players',
            this.formatNumber(playerCount),
            playerChange,
            'vs prev 30 days',
            'bg-green-400/20 text-green-400',
            1
          )}
          {this.renderStatCard(
            'Fans',
            this.formatNumber(fanCount),
            fanChange,
            'vs prev 30 days',
            'bg-secondary-blue/20 text-secondary-blue',
            2
          )}
          {this.renderStatCard(
            'Pending Requests',
            this.formatNumber(pendingRequests),
            pendingRequests > 0 ? 100 : null,
            'awaiting review',
            'bg-purple-400/20 text-purple-400',
            3
          )}
        </div>

        {/* User Growth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-display font-bold text-white mb-4">User Growth</h3>
          <div className="h-80">
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPlayers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A90A4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4A90A4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
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
                    dataKey="totalUsers"
                    stroke="#D4AF37"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="players"
                    stroke="#4A90A4"
                    fillOpacity={1}
                    fill="url(#colorPlayers)"
                    name="Players"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              this.renderEmptyState('No user data available yet')
            )}
          </div>
        </motion.div>

        {/* Active Users & User Type Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Active Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Daily Active Users</h3>
            <div className="h-64">
              {hasAnalyticsData && activeUsersData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activeUsersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
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
                    <Bar
                      dataKey="active"
                      name="Active Users"
                      fill="#4A90A4"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                this.renderEmptyState(
                  'No analytics events recorded yet. Active user data will appear once users interact with the site.'
                )
              )}
            </div>
          </motion.div>

          {/* User Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">User Distribution</h3>
            <div className="h-64 flex items-center">
              {userTypeDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={userTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {userTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#141414',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="w-40 space-y-3">
                    {userTypeDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-white/70 text-sm">{item.name}</span>
                        </div>
                        <span className="text-white font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                this.renderEmptyState('No user data available yet')
              )}
            </div>
          </motion.div>
        </div>

        {/* Nationality Distribution & Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Nationality Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Top Nationalities</h3>
            <div className="space-y-4">
              {nationalityDistribution.length > 0 ? (
                nationalityDistribution.map((item, index) => (
                  <div key={item.country} className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-5">{index + 1}</span>
                    {item.code ? (
                      <img
                        src={`https://flagcdn.com/w40/${item.code}.png`}
                        alt={item.country}
                        className="w-6 h-4 object-cover rounded-sm"
                      />
                    ) : (
                      <div className="w-6 h-4 bg-white/10 rounded-sm flex items-center justify-center">
                        <span className="text-white/40 text-xs">+</span>
                      </div>
                    )}
                    <span className="text-white text-sm flex-1">{item.country}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-gold rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-white/60 text-sm w-8">{item.count}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-white/40 text-sm">
                    No player nationality data available yet
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Signups — Real data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2 bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-white">
                {isSuperAdmin ? 'All Users' : 'Recent Signups'}
              </h3>
              {isSuperAdmin && (
                <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
                  {realUsers.length} total
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              {realUsers.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-white/50 text-sm border-b border-white/10">
                      <th className="text-left pb-3 font-medium">User</th>
                      {isSuperAdmin && <th className="text-left pb-3 font-medium">Email</th>}
                      <th className="text-left pb-3 font-medium">Role</th>
                      <th className="text-left pb-3 font-medium">Status</th>
                      <th className="text-left pb-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {realUsers.slice(0, isSuperAdmin ? 20 : 5).map((u) => {
                      const name = u.full_name || 'Unknown';
                      const role = u.role || 'fan';
                      const joinDate = u.created_at
                        ? new Date(u.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '-';

                      const roleColors = {
                        player: 'bg-accent-gold/20 text-accent-gold',
                        fan: 'bg-secondary-blue/20 text-secondary-blue',
                        admin: 'bg-red-400/20 text-red-400',
                        coach: 'bg-green-400/20 text-green-400',
                        super_admin: 'bg-purple-400/20 text-purple-400',
                      };

                      return (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-accent-gold text-xs font-bold">
                                  {name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <p className="text-white font-medium">{name}</p>
                            </div>
                          </td>
                          {isSuperAdmin && (
                            <td className="py-3 text-white/60 text-xs">
                              {u.email || (
                                <span className="text-white/30 italic">via profile</span>
                              )}
                            </td>
                          )}
                          <td className="py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                roleColors[role] || 'bg-white/10 text-white/50'
                              }`}
                            >
                              {role}
                            </span>
                          </td>
                          <td className="py-3">
                            {u.player_request_status === 'pending' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-400">
                                pending
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-400/20 text-green-400">
                                active
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-white/60">{joinDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-white/40 text-sm">No users found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Registration Sources - Not available in DB */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-display font-bold text-white mb-4">Registration Sources</h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg
              className="w-10 h-10 text-white/15 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-white/40 text-sm">
              Source tracking is not configured. Add a registration source column to the profiles
              table to enable this feature.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(UserAnalytics);

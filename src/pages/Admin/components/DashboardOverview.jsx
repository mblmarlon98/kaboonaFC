import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
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

// Mock data for charts
const trafficData = [
  { name: 'Jan', visitors: 4000, pageViews: 6400 },
  { name: 'Feb', visitors: 3000, pageViews: 4398 },
  { name: 'Mar', visitors: 5000, pageViews: 7800 },
  { name: 'Apr', visitors: 4780, pageViews: 6908 },
  { name: 'May', visitors: 5890, pageViews: 8800 },
  { name: 'Jun', visitors: 6390, pageViews: 9300 },
  { name: 'Jul', visitors: 7490, pageViews: 10800 },
];

const subscriptionData = [
  { name: 'Jan', basic: 24, pro: 15, elite: 8 },
  { name: 'Feb', basic: 28, pro: 18, elite: 10 },
  { name: 'Mar', basic: 35, pro: 22, elite: 12 },
  { name: 'Apr', basic: 42, pro: 28, elite: 15 },
  { name: 'May', basic: 50, pro: 35, elite: 18 },
  { name: 'Jun', basic: 58, pro: 42, elite: 22 },
  { name: 'Jul', basic: 65, pro: 48, elite: 28 },
];

const revenueBreakdown = [
  { name: 'Subscriptions', value: 45000, color: '#D4AF37' },
  { name: 'Donations', value: 12000, color: '#4A90A4' },
  { name: 'Merchandise', value: 8500, color: '#6BA3B5' },
  { name: 'Events', value: 5500, color: '#E5C158' },
];

const recentActivity = [
  { id: 1, type: 'registration', message: 'John Smith registered for training', time: '5 minutes ago', icon: 'user-plus' },
  { id: 2, type: 'payment', message: 'Payment of RM 150 received from Ahmad', time: '15 minutes ago', icon: 'credit-card' },
  { id: 3, type: 'attendance', message: 'Sarah marked attendance for Morning Session', time: '1 hour ago', icon: 'check-circle' },
  { id: 4, type: 'donation', message: 'Anonymous donated RM 500 to Jersey Fund', time: '2 hours ago', icon: 'heart' },
  { id: 5, type: 'training', message: 'Evening training session created', time: '3 hours ago', icon: 'calendar' },
  { id: 6, type: 'content', message: 'Hero section content updated', time: '5 hours ago', icon: 'edit' },
];

/**
 * Dashboard Overview Component
 * Displays overview cards, charts, and recent activity
 */
class DashboardOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: {
        totalUsers: 248,
        activeSubscriptions: 186,
        revenueThisMonth: 71000,
        attendanceRate: 87,
      },
      statsChange: {
        totalUsers: 12,
        activeSubscriptions: 8,
        revenueThisMonth: 15,
        attendanceRate: 3,
      },
    };
  }

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

  render() {
    const { stats, statsChange } = this.state;

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Site Traffic</h3>
            <div className="h-72">
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
                    name="Visitors"
                  />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    stroke="#4A90A4"
                    fillOpacity={1}
                    fill="url(#colorPageViews)"
                    name="Page Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subscription Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Subscription Growth</h3>
            <div className="h-72">
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
            </div>
          </motion.div>
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
            </div>
            {/* Legend */}
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
              <button className="text-accent-gold text-sm hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
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
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
}

export default DashboardOverview;

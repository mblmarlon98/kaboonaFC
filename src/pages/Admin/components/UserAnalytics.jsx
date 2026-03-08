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

// Mock data - replace with real Supabase queries
const userGrowthData = [
  { month: 'Aug', totalUsers: 45, players: 20, fans: 25, newUsers: 45 },
  { month: 'Sep', totalUsers: 78, players: 35, fans: 43, newUsers: 33 },
  { month: 'Oct', totalUsers: 124, players: 58, fans: 66, newUsers: 46 },
  { month: 'Nov', totalUsers: 167, players: 82, fans: 85, newUsers: 43 },
  { month: 'Dec', totalUsers: 203, players: 98, fans: 105, newUsers: 36 },
  { month: 'Jan', totalUsers: 248, players: 118, fans: 130, newUsers: 45 },
  { month: 'Feb', totalUsers: 289, players: 142, fans: 147, newUsers: 41 },
];

const activeUsersData = [
  { day: 'Mon', active: 156, returning: 98, new: 12 },
  { day: 'Tue', active: 142, returning: 88, new: 8 },
  { day: 'Wed', active: 178, returning: 110, new: 15 },
  { day: 'Thu', active: 165, returning: 102, new: 11 },
  { day: 'Fri', active: 189, returning: 118, new: 18 },
  { day: 'Sat', active: 234, returning: 145, new: 24 },
  { day: 'Sun', active: 198, returning: 125, new: 16 },
];

const userTypeDistribution = [
  { name: 'Players', value: 142, color: '#D4AF37' },
  { name: 'Fans', value: 147, color: '#4A90A4' },
  { name: 'Coaches', value: 8, color: '#E5C158' },
  { name: 'Admins', value: 3, color: '#6BA3B5' },
];

const registrationSources = [
  { name: 'Direct', value: 120, color: '#D4AF37' },
  { name: 'Google OAuth', value: 85, color: '#EA4335' },
  { name: 'Apple OAuth', value: 42, color: '#1D1D1F' },
  { name: 'Referral', value: 32, color: '#4A90A4' },
  { name: 'Social Media', value: 10, color: '#E5C158' },
];

const recentUsers = [
  { id: 1, name: 'Ahmad Bin Hassan', email: 'ahmad@email.com', role: 'player', joinedAt: '2 hours ago', country: 'my' },
  { id: 2, name: 'Sarah Chen', email: 'sarah.chen@email.com', role: 'fan', joinedAt: '5 hours ago', country: 'sg' },
  { id: 3, name: 'John Williams', email: 'jwilliams@email.com', role: 'player', joinedAt: '1 day ago', country: 'gb' },
  { id: 4, name: 'Maria Santos', email: 'maria.s@email.com', role: 'fan', joinedAt: '1 day ago', country: 'br' },
  { id: 5, name: 'Kenji Tanaka', email: 'kenji.t@email.com', role: 'player', joinedAt: '2 days ago', country: 'jp' },
];

const nationalityDistribution = [
  { country: 'Malaysia', code: 'my', count: 98, percentage: 34 },
  { country: 'Singapore', code: 'sg', count: 45, percentage: 16 },
  { country: 'Indonesia', code: 'id', count: 38, percentage: 13 },
  { country: 'United Kingdom', code: 'gb', count: 28, percentage: 10 },
  { country: 'United States', code: 'us', count: 22, percentage: 8 },
  { country: 'Others', code: null, count: 58, percentage: 20 },
];

/**
 * User Analytics Component
 * Displays user growth, active users, and demographic data for admin dashboard
 */
class UserAnalytics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeRange: '30d',
      loading: false,
    };
  }

  formatNumber = (value) => {
    return value.toLocaleString();
  };

  renderStatCard = (title, value, change, subtitle, color, index) => {
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
            <div className="flex items-center gap-2 mt-2">
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

  render() {
    const { timeRange } = this.state;

    return (
      <div className="space-y-6">
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
          {this.renderStatCard('Total Users', '289', 16.5, 'vs last month', 'bg-accent-gold/20 text-accent-gold', 0)}
          {this.renderStatCard('Active Users', '198', 8.2, 'this week', 'bg-green-400/20 text-green-400', 1)}
          {this.renderStatCard('New Signups', '41', -5.3, 'vs last month', 'bg-secondary-blue/20 text-secondary-blue', 2)}
          {this.renderStatCard('Player Applications', '12', 24.0, 'pending review', 'bg-purple-400/20 text-purple-400', 3)}
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
                <Line type="monotone" dataKey="newUsers" stroke="#E5C158" name="New Users" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
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
                  <Bar dataKey="returning" name="Returning" fill="#4A90A4" radius={[4, 4, 0, 0]} stackId="active" />
                  <Bar dataKey="new" name="New" fill="#D4AF37" radius={[4, 4, 0, 0]} stackId="active" />
                </BarChart>
              </ResponsiveContainer>
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
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-white/70 text-sm">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
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
              {nationalityDistribution.map((item, index) => (
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
              ))}
            </div>
          </motion.div>

          {/* Recent Signups */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-2 bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-white">Recent Signups</h3>
              <button className="text-accent-gold text-sm hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-white/50 text-sm border-b border-white/10">
                    <th className="text-left pb-3 font-medium">User</th>
                    <th className="text-left pb-3 font-medium">Role</th>
                    <th className="text-left pb-3 font-medium">Country</th>
                    <th className="text-left pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-white/50 text-xs">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'player'
                              ? 'bg-accent-gold/20 text-accent-gold'
                              : 'bg-secondary-blue/20 text-secondary-blue'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <img
                          src={`https://flagcdn.com/w20/${user.country}.png`}
                          alt={user.country}
                          className="w-5 h-4 object-cover rounded-sm"
                        />
                      </td>
                      <td className="py-3 text-white/60">{user.joinedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Registration Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-display font-bold text-white mb-4">Registration Sources</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {registrationSources.map((source) => (
              <div key={source.name} className="text-center p-4 rounded-lg bg-white/5">
                <div
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${source.color}20` }}
                >
                  <span className="text-lg font-bold" style={{ color: source.color }}>
                    {source.value}
                  </span>
                </div>
                <p className="text-white/70 text-sm">{source.name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }
}

export default UserAnalytics;

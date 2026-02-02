import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
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

// Mock revenue data
const monthlyRevenue = [
  { month: 'Jan', revenue: 45000, subscriptions: 38000, donations: 5000, merchandise: 2000 },
  { month: 'Feb', revenue: 52000, subscriptions: 42000, donations: 6000, merchandise: 4000 },
  { month: 'Mar', revenue: 48000, subscriptions: 40000, donations: 4500, merchandise: 3500 },
  { month: 'Apr', revenue: 61000, subscriptions: 48000, donations: 8000, merchandise: 5000 },
  { month: 'May', revenue: 55000, subscriptions: 45000, donations: 6000, merchandise: 4000 },
  { month: 'Jun', revenue: 67000, subscriptions: 52000, donations: 9000, merchandise: 6000 },
  { month: 'Jul', revenue: 71000, subscriptions: 55000, donations: 10000, merchandise: 6000 },
];

// Mock subscription breakdown
const subscriptionBreakdown = [
  { name: 'Basic (RM 50/mo)', value: 65, color: '#4A90A4' },
  { name: 'Pro (RM 100/mo)', value: 48, color: '#D4AF37' },
  { name: 'Elite (RM 200/mo)', value: 28, color: '#E5C158' },
];

// Mock recent transactions
const recentTransactions = [
  { id: 1, user: 'Ahmad Rahman', type: 'subscription', plan: 'Pro', amount: 100, date: '2024-02-15', status: 'completed' },
  { id: 2, user: 'Sarah Lee', type: 'donation', campaign: 'Jersey Fund', amount: 250, date: '2024-02-15', status: 'completed' },
  { id: 3, user: 'John Smith', type: 'subscription', plan: 'Elite', amount: 200, date: '2024-02-14', status: 'completed' },
  { id: 4, user: 'Wei Chen', type: 'merchandise', item: 'Training Kit', amount: 85, date: '2024-02-14', status: 'completed' },
  { id: 5, user: 'Maria Garcia', type: 'subscription', plan: 'Basic', amount: 50, date: '2024-02-14', status: 'completed' },
  { id: 6, user: 'Anonymous', type: 'donation', campaign: 'Travel Fund', amount: 500, date: '2024-02-13', status: 'completed' },
  { id: 7, user: 'James Wilson', type: 'subscription', plan: 'Pro', amount: 100, date: '2024-02-13', status: 'failed' },
  { id: 8, user: 'Priya Patel', type: 'merchandise', item: 'Jersey', amount: 120, date: '2024-02-12', status: 'completed' },
];

/**
 * Payments Overview Component
 * Revenue charts, recent transactions, subscription breakdown, and export functionality
 */
class PaymentsOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dateRange: 'month',
      transactionFilter: 'all',
      stats: {
        totalRevenue: 71000,
        subscriptionRevenue: 55000,
        donationRevenue: 10000,
        merchandiseRevenue: 6000,
        mrr: 14100,
        activeSubscribers: 141,
      },
    };
  }

  handleDateRangeChange = (range) => {
    this.setState({ dateRange: range });
  };

  handleTransactionFilter = (filter) => {
    this.setState({ transactionFilter: filter });
  };

  formatCurrency = (value) => {
    return `RM ${value.toLocaleString()}`;
  };

  getFilteredTransactions = () => {
    const { transactionFilter } = this.state;
    if (transactionFilter === 'all') return recentTransactions;
    return recentTransactions.filter((t) => t.type === transactionFilter);
  };

  getTransactionIcon = (type) => {
    const icons = {
      subscription: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      donation: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      merchandise: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    };
    return icons[type];
  };

  handleExport = (format) => {
    // Visual only - in production would generate actual file
    alert(`Exporting data as ${format.toUpperCase()}...`);
  };

  render() {
    const { dateRange, transactionFilter, stats } = this.state;
    const filteredTransactions = this.getFilteredTransactions();

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Financial Overview</h1>
            <p className="text-white/50 mt-1">Track revenue, subscriptions, and transactions</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => this.handleExport('csv')}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
            <button
              onClick={() => this.handleExport('pdf')}
              className="px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">Total Revenue (This Month)</p>
            <h3 className="text-2xl font-display font-bold text-accent-gold mt-2">
              {this.formatCurrency(stats.totalRevenue)}
            </h3>
            <p className="text-green-400 text-sm mt-2">+15% vs last month</p>
          </div>
          <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">Subscription Revenue</p>
            <h3 className="text-2xl font-display font-bold text-white mt-2">
              {this.formatCurrency(stats.subscriptionRevenue)}
            </h3>
            <p className="text-white/50 text-sm mt-2">77% of total revenue</p>
          </div>
          <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">Monthly Recurring Revenue</p>
            <h3 className="text-2xl font-display font-bold text-secondary-blue mt-2">
              {this.formatCurrency(stats.mrr)}
            </h3>
            <p className="text-white/50 text-sm mt-2">{stats.activeSubscribers} active subscribers</p>
          </div>
          <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
            <p className="text-white/50 text-sm">Donations This Month</p>
            <h3 className="text-2xl font-display font-bold text-white mt-2">
              {this.formatCurrency(stats.donationRevenue)}
            </h3>
            <p className="text-green-400 text-sm mt-2">+25% vs last month</p>
          </div>
        </motion.div>

        {/* Date Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => this.handleDateRangeChange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                dateRange === range
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {range}
            </button>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Revenue Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(v) => `RM ${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`RM ${value.toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Total Revenue"
                    stroke="#D4AF37"
                    strokeWidth={3}
                    dot={{ fill: '#D4AF37', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="subscriptions"
                    name="Subscriptions"
                    stroke="#4A90A4"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="donations"
                    name="Donations"
                    stroke="#6BA3B5"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subscription Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Subscription Plans</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subscriptionBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subscriptionBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value} subscribers`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {subscriptionBreakdown.map((item) => (
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
          </motion.div>
        </div>

        {/* Revenue by Category Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-display font-bold text-white mb-4">Revenue by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(v) => `RM ${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141414',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`RM ${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Bar dataKey="subscriptions" name="Subscriptions" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                <Bar dataKey="donations" name="Donations" fill="#4A90A4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="merchandise" name="Merchandise" fill="#6BA3B5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-display font-bold text-white">Recent Transactions</h3>
            <div className="flex gap-2">
              {['all', 'subscription', 'donation', 'merchandise'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => this.handleTransactionFilter(filter)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                    transactionFilter === filter
                      ? 'bg-accent-gold text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center">
                          <span className="text-accent-gold font-bold text-sm">
                            {transaction.user.charAt(0)}
                          </span>
                        </div>
                        <span className="text-white">{transaction.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-2 ${
                        transaction.type === 'subscription'
                          ? 'text-accent-gold'
                          : transaction.type === 'donation'
                          ? 'text-secondary-blue'
                          : 'text-white/70'
                      }`}>
                        {this.getTransactionIcon(transaction.type)}
                        <span className="capitalize">{transaction.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white/70">
                        {transaction.plan || transaction.campaign || transaction.item}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-medium">
                        {this.formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white/70">{transaction.date}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed'
                          ? 'bg-green-400/20 text-green-400'
                          : 'bg-red-400/20 text-red-400'
                      }`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between">
            <p className="text-white/50 text-sm">
              Showing {filteredTransactions.length} transactions
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                Previous
              </button>
              <button className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm">
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
}

export default PaymentsOverview;

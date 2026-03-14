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
import { supabase } from '../../../services/supabase';

const PIE_COLORS = ['#4A90A4', '#D4AF37', '#E5C158', '#6BA3B5', '#9B59B6', '#E74C3C'];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
      loading: true,
      error: null,
      stats: {
        totalRevenue: 0,
        subscriptionRevenue: 0,
        donationRevenue: 0,
        merchandiseRevenue: 0,
        mrr: 0,
        activeSubscribers: 0,
        lastMonthRevenue: 0,
        lastMonthDonations: 0,
      },
      monthlyRevenue: [],
      subscriptionBreakdown: [],
      recentTransactions: [],
      transactionPage: 0,
      transactionCount: 0,
    };
  }

  componentDidMount() {
    this.fetchAllData();
  }

  componentDidUpdate(_, prevState) {
    if (
      prevState.transactionFilter !== this.state.transactionFilter ||
      prevState.transactionPage !== this.state.transactionPage
    ) {
      this.fetchRecentTransactions();
    }
  }

  fetchAllData = async () => {
    this.setState({ loading: true, error: null });
    try {
      await Promise.all([
        this.fetchStats(),
        this.fetchMonthlyRevenue(),
        this.fetchSubscriptionBreakdown(),
        this.fetchRecentTransactions(),
      ]);
    } catch (err) {
      console.error('PaymentsOverview fetch error:', err);
      this.setState({ error: 'Failed to load financial data. Please try again.' });
    } finally {
      this.setState({ loading: false });
    }
  };

  fetchStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Current month payments
    const { data: currentPayments, error: cpErr } = await supabase
      .from('payments')
      .select('amount, payment_type')
      .eq('status', 'completed')
      .gte('created_at', startOfMonth);
    if (cpErr) throw cpErr;

    // Last month payments (for comparison)
    const { data: lastMonthPayments, error: lmErr } = await supabase
      .from('payments')
      .select('amount, payment_type')
      .eq('status', 'completed')
      .gte('created_at', startOfLastMonth)
      .lte('created_at', endOfLastMonth);
    if (lmErr) throw lmErr;

    // Active subscribers count
    const { count: activeSubscribers, error: subErr } = await supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    if (subErr) throw subErr;

    // MRR: sum of amount for active subscriptions
    const { data: activeSubs, error: mrrErr } = await supabase
      .from('subscriptions')
      .select('amount')
      .eq('status', 'active');
    if (mrrErr) throw mrrErr;

    const totalRevenue = (currentPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const subscriptionRevenue = (currentPayments || [])
      .filter((p) => p.payment_type === 'subscription')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const donationRevenue = (currentPayments || [])
      .filter((p) => p.payment_type === 'donation')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const merchandiseRevenue = (currentPayments || [])
      .filter((p) => p.payment_type === 'merchandise')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const mrr = (activeSubs || []).reduce((sum, s) => sum + Number(s.amount || 0), 0);

    const lastMonthRevenue = (lastMonthPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const lastMonthDonations = (lastMonthPayments || [])
      .filter((p) => p.payment_type === 'donation')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    this.setState({
      stats: {
        totalRevenue,
        subscriptionRevenue,
        donationRevenue,
        merchandiseRevenue,
        mrr,
        activeSubscribers: activeSubscribers || 0,
        lastMonthRevenue,
        lastMonthDonations,
      },
    });
  };

  fetchMonthlyRevenue = async () => {
    // Fetch payments from the last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, payment_type, created_at')
      .eq('status', 'completed')
      .gte('created_at', twelveMonthsAgo)
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Aggregate by month
    const monthMap = {};
    // Pre-populate last 7 months to ensure continuous chart
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { month: MONTH_NAMES[d.getMonth()], revenue: 0, subscriptions: 0, donations: 0, merchandise: 0 };
    }

    (payments || []).forEach((p) => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { month: MONTH_NAMES[d.getMonth()], revenue: 0, subscriptions: 0, donations: 0, merchandise: 0 };
      }
      const amount = Number(p.amount || 0);
      monthMap[key].revenue += amount;
      if (p.payment_type === 'subscription') monthMap[key].subscriptions += amount;
      else if (p.payment_type === 'donation') monthMap[key].donations += amount;
      else if (p.payment_type === 'merchandise') monthMap[key].merchandise += amount;
    });

    // Sort by key (YYYY-MM) and take the last 7
    const sorted = Object.keys(monthMap)
      .sort()
      .slice(-7)
      .map((k) => monthMap[k]);

    this.setState({ monthlyRevenue: sorted });
  };

  fetchSubscriptionBreakdown = async () => {
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('plan_type')
      .eq('status', 'active');
    if (error) throw error;

    // Group by plan_type
    const countMap = {};
    (subs || []).forEach((s) => {
      const plan = s.plan_type || 'Unknown';
      countMap[plan] = (countMap[plan] || 0) + 1;
    });

    const breakdown = Object.entries(countMap).map(([name, value], idx) => ({
      name,
      value,
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));

    this.setState({ subscriptionBreakdown: breakdown });
  };

  fetchRecentTransactions = async () => {
    const { transactionFilter, transactionPage } = this.state;
    const pageSize = 10;
    const from = transactionPage * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('payments')
      .select('id, amount, payment_type, provider, status, created_at, user_id, profiles!payments_user_id_fkey(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (transactionFilter !== 'all') {
      query = query.eq('payment_type', transactionFilter);
    }

    const { data, count, error } = await query;

    if (error) {
      // If the foreign key join fails, retry without profile join
      console.warn('Payments join failed, retrying without profile join:', error.message);
      let fallbackQuery = supabase
        .from('payments')
        .select('id, amount, payment_type, provider, status, created_at, user_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (transactionFilter !== 'all') {
        fallbackQuery = fallbackQuery.eq('payment_type', transactionFilter);
      }

      const { data: fbData, count: fbCount, error: fbError } = await fallbackQuery;
      if (fbError) throw fbError;

      const transactions = (fbData || []).map((p) => ({
        id: p.id,
        user: 'User',
        type: p.payment_type || 'other',
        details: p.provider || p.payment_type || '-',
        amount: Number(p.amount || 0),
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : '-',
        status: p.status || 'unknown',
      }));

      this.setState({ recentTransactions: transactions, transactionCount: fbCount || 0 });
      return;
    }

    const transactions = (data || []).map((p) => {
      const profile = p.profiles;
      const userName = profile?.full_name || profile?.email || 'Unknown';
      return {
        id: p.id,
        user: userName,
        type: p.payment_type || 'other',
        details: p.provider || p.payment_type || '-',
        amount: Number(p.amount || 0),
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : '-',
        status: p.status || 'unknown',
      };
    });

    this.setState({ recentTransactions: transactions, transactionCount: count || 0 });
  };

  handleDateRangeChange = (range) => {
    this.setState({ dateRange: range });
  };

  handleTransactionFilter = (filter) => {
    this.setState({ transactionFilter: filter, transactionPage: 0 });
  };

  handlePrevPage = () => {
    this.setState((prev) => ({ transactionPage: Math.max(0, prev.transactionPage - 1) }));
  };

  handleNextPage = () => {
    const { transactionPage, transactionCount } = this.state;
    const pageSize = 10;
    if ((transactionPage + 1) * pageSize < transactionCount) {
      this.setState((prev) => ({ transactionPage: prev.transactionPage + 1 }));
    }
  };

  formatCurrency = (value) => {
    return `RM ${Number(value || 0).toLocaleString()}`;
  };

  getPercentChange = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(0)}%`;
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
    return icons[type] || null;
  };

  handleExport = (format) => {
    alert(`Exporting data as ${format.toUpperCase()}...`);
  };

  renderLoadingSpinner = () => (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
        <p className="text-white/50 text-sm">Loading financial data...</p>
      </div>
    </div>
  );

  renderError = () => (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-red-400">{this.state.error}</p>
        <button
          onClick={this.fetchAllData}
          className="px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  render() {
    const {
      dateRange,
      transactionFilter,
      stats,
      loading,
      error,
      monthlyRevenue,
      subscriptionBreakdown,
      recentTransactions,
      transactionPage,
      transactionCount,
    } = this.state;

    if (error) return this.renderError();

    const revenueChangePercent = this.getPercentChange(stats.totalRevenue, stats.lastMonthRevenue);
    const donationChangePercent = this.getPercentChange(stats.donationRevenue, stats.lastMonthDonations);
    const subPercent = stats.totalRevenue > 0 ? Math.round((stats.subscriptionRevenue / stats.totalRevenue) * 100) : 0;
    const pageSize = 10;

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

        {loading ? (
          this.renderLoadingSpinner()
        ) : (
          <>
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
                <p className={`text-sm mt-2 ${revenueChangePercent.startsWith('+') ? 'text-green-400' : revenueChangePercent.startsWith('-') ? 'text-red-400' : 'text-white/50'}`}>
                  {revenueChangePercent} vs last month
                </p>
              </div>
              <div className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10">
                <p className="text-white/50 text-sm">Subscription Revenue</p>
                <h3 className="text-2xl font-display font-bold text-white mt-2">
                  {this.formatCurrency(stats.subscriptionRevenue)}
                </h3>
                <p className="text-white/50 text-sm mt-2">{subPercent}% of total revenue</p>
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
                <p className={`text-sm mt-2 ${donationChangePercent.startsWith('+') ? 'text-green-400' : donationChangePercent.startsWith('-') ? 'text-red-400' : 'text-white/50'}`}>
                  {donationChangePercent} vs last month
                </p>
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
                {monthlyRevenue.length === 0 ? (
                  <div className="h-72 flex items-center justify-center">
                    <p className="text-white/40">No revenue data available yet</p>
                  </div>
                ) : (
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
                          formatter={(value) => [`RM ${Number(value).toLocaleString()}`, '']}
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
                )}
              </motion.div>

              {/* Subscription Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-surface-dark-elevated rounded-xl p-6 border border-white/10"
              >
                <h3 className="text-lg font-display font-bold text-white mb-4">Subscription Plans</h3>
                {subscriptionBreakdown.length === 0 ? (
                  <div className="h-48 flex items-center justify-center">
                    <p className="text-white/40">No active subscriptions yet</p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
              {monthlyRevenue.length === 0 ? (
                <div className="h-72 flex items-center justify-center">
                  <p className="text-white/40">No revenue data available yet</p>
                </div>
              ) : (
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
                        formatter={(value) => [`RM ${Number(value).toLocaleString()}`, '']}
                      />
                      <Legend />
                      <Bar dataKey="subscriptions" name="Subscriptions" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="donations" name="Donations" fill="#4A90A4" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="merchandise" name="Merchandise" fill="#6BA3B5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                    {recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                          No transactions yet
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center">
                                <span className="text-accent-gold font-bold text-sm">
                                  {transaction.user.charAt(0).toUpperCase()}
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
                              {transaction.details}
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <p className="text-white/50 text-sm">
                  {transactionCount === 0
                    ? 'No transactions'
                    : `Showing ${transactionPage * pageSize + 1}-${Math.min((transactionPage + 1) * pageSize, transactionCount)} of ${transactionCount} transactions`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={this.handlePrevPage}
                    disabled={transactionPage === 0}
                    className={`px-3 py-1 bg-white/10 text-white rounded-lg transition-colors text-sm ${
                      transactionPage === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/20'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={this.handleNextPage}
                    disabled={(transactionPage + 1) * pageSize >= transactionCount}
                    className={`px-3 py-1 bg-white/10 text-white rounded-lg transition-colors text-sm ${
                      (transactionPage + 1) * pageSize >= transactionCount ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/20'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    );
  }
}

export default PaymentsOverview;

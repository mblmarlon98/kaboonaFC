import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

/**
 * Super Admin Overview - Extra analytics and controls only for super admins
 */
class SuperAdminOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: null,
      recentSignups: [],
      roleCounts: {},
      loading: true,
    };
  }

  componentDidMount() {
    this.fetchStats();
  }

  fetchStats = async () => {
    try {
      const [profilesRes, playersRes, tasksRes, goalsRes] = await Promise.all([
        supabase.from('profiles').select('id, role, roles, created_at, email, full_name'),
        supabase.from('players').select('id'),
        supabase.from('content_tasks').select('id, status').then(r => r).catch(() => ({ data: [] })),
        supabase.from('marketing_goals').select('id').then(r => r).catch(() => ({ data: [] })),
      ]);

      const profiles = profilesRes.data || [];
      const players = playersRes.data || [];
      const tasks = tasksRes.data || [];
      const goals = goalsRes.data || [];

      // Count roles
      const roleCounts = {};
      profiles.forEach((p) => {
        const roles = p.roles || [p.role || 'fan'];
        roles.forEach((r) => {
          roleCounts[r] = (roleCounts[r] || 0) + 1;
        });
      });

      // Recent signups (last 10)
      const sorted = [...profiles].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const recentSignups = sorted.slice(0, 10);

      this.setState({
        stats: {
          totalUsers: profiles.length,
          totalPlayers: players.length,
          totalTasks: tasks.length,
          pendingTasks: tasks.filter((t) => t.status !== 'done').length,
          totalGoals: goals.length,
        },
        roleCounts,
        recentSignups,
        loading: false,
      });
    } catch (err) {
      console.error('SuperAdmin stats error:', err);
      this.setState({ loading: false });
    }
  };

  render() {
    const { stats, roleCounts, recentSignups, loading } = this.state;

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"
          />
        </div>
      );
    }

    const statCards = [
      { label: 'Total Users', value: stats?.totalUsers || 0, color: 'text-white', bg: 'bg-white/5', icon: (
        <svg className="w-6 h-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )},
      { label: 'Active Players', value: stats?.totalPlayers || 0, color: 'text-green-400', bg: 'bg-green-500/10', icon: (
        <svg className="w-6 h-6 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )},
      { label: 'Content Tasks', value: stats?.totalTasks || 0, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: (
        <svg className="w-6 h-6 text-purple-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )},
      { label: 'Marketing Goals', value: stats?.totalGoals || 0, color: 'text-pink-400', bg: 'bg-pink-500/10', icon: (
        <svg className="w-6 h-6 text-pink-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )},
    ];

    const roleOrder = ['fan', 'player', 'coach', 'manager', 'admin', 'editor', 'marketing', 'owner', 'super_admin'];
    const roleColors = {
      fan: 'bg-gray-500/20 text-gray-400',
      player: 'bg-green-500/20 text-green-400',
      coach: 'bg-blue-500/20 text-blue-400',
      manager: 'bg-cyan-500/20 text-cyan-400',
      admin: 'bg-accent-gold/20 text-accent-gold',
      editor: 'bg-purple-500/20 text-purple-400',
      marketing: 'bg-pink-500/20 text-pink-400',
      owner: 'bg-yellow-500/20 text-yellow-400',
      super_admin: 'bg-red-500/20 text-red-400',
    };

    return (
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-white">Super Admin Overview</h2>
              <p className="text-red-400/60 text-sm">Full system visibility and controls</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl border border-white/10 ${card.bg}`}
            >
              <div className="flex items-center justify-between mb-3">
                {card.icon}
              </div>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-white/40 text-xs mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Role Distribution */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Role Distribution
            </h3>
            <div className="space-y-3">
              {roleOrder.map((role) => {
                const count = roleCounts[role] || 0;
                if (count === 0) return null;
                const maxCount = Math.max(...Object.values(roleCounts), 1);
                const width = Math.max(8, (count / maxCount) * 100);
                const colors = roleColors[role] || 'bg-gray-500/20 text-gray-400';

                return (
                  <div key={role} className="flex items-center gap-3">
                    <span className={`inline-block w-24 text-xs font-semibold uppercase ${colors.split(' ')[1]}`}>
                      {role.replace('_', ' ')}
                    </span>
                    <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full flex items-center justify-end pr-2 ${colors.split(' ')[0]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ duration: 0.6 }}
                      >
                        <span className="text-[10px] font-bold text-white">{count}</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Signups */}
          <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Recent Signups
            </h3>
            <div className="space-y-2">
              {recentSignups.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-b-0">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white/60">
                      {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {user.full_name || 'No name'}
                    </p>
                    <p className="text-white/30 text-xs truncate">{user.email}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {(user.roles || [user.role || 'fan']).map((r) => (
                      <span key={r} className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${roleColors[r] || 'bg-gray-500/20 text-gray-400'}`}>
                        {r.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-surface-dark-elevated rounded-xl border border-red-500/20 p-6">
          <h3 className="text-red-400 font-semibold mb-4 text-sm uppercase tracking-wider">Super Admin Quick Actions</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <a
              href="/admin/users"
              className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-white/80 text-sm font-medium group-hover:text-white">Manage Users & Roles</span>
            </a>
            <a
              href="/admin/analytics"
              className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-white/80 text-sm font-medium group-hover:text-white">View Analytics</span>
            </a>
            <a
              href="/admin/players"
              className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <svg className="w-5 h-5 text-red-400 group-hover:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white/80 text-sm font-medium group-hover:text-white">Manage Players</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default SuperAdminOverview;

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../services/supabase';

const AVAILABLE_ROLES = ['fan', 'player', 'coach', 'admin', 'manager', 'owner', 'editor', 'marketing', 'super_admin'];

class UserManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      loading: true,
      error: null,
      searchQuery: '',
      roleFilter: 'all',
      editingUser: null,
      editRoles: [],
      editPrimaryRole: '',
      saving: false,
      successMessage: null,
    };
  }

  componentDidMount() {
    this.fetchUsers();
  }

  fetchUsers = async () => {
    this.setState({ loading: true, error: null });

    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, roles, profile_image_url, player_request_status, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch player data
      const { data: players } = await supabase
        .from('players')
        .select('user_id, position, number');

      const playerMap = {};
      if (players) {
        players.forEach((p) => {
          playerMap[p.user_id] = p;
        });
      }

      const users = (profiles || []).map((p) => ({
        ...p,
        player: playerMap[p.id] || null,
      }));

      this.setState({ users, loading: false });
    } catch (error) {
      console.error('Error fetching users:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  handleSearch = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  handleRoleFilter = (role) => {
    this.setState({ roleFilter: role });
  };

  openEditModal = (user) => {
    this.setState({
      editingUser: user,
      editRoles: [...(user.roles || ['fan'])],
      editPrimaryRole: user.role || 'fan',
    });
  };

  closeEditModal = () => {
    this.setState({ editingUser: null, editRoles: [], editPrimaryRole: '' });
  };

  toggleRole = (role) => {
    this.setState((prev) => {
      const roles = prev.editRoles.includes(role)
        ? prev.editRoles.filter((r) => r !== role)
        : [...prev.editRoles, role];

      // Ensure at least 'fan' is always present
      if (!roles.includes('fan')) roles.push('fan');

      // If primary role was removed, set to first role
      const primaryRole = roles.includes(prev.editPrimaryRole) ? prev.editPrimaryRole : roles[0];

      return { editRoles: roles, editPrimaryRole: primaryRole };
    });
  };

  setPrimaryRole = (role) => {
    this.setState({ editPrimaryRole: role });
  };

  saveUserRoles = async () => {
    const { editingUser, editRoles, editPrimaryRole } = this.state;
    if (!editingUser) return;

    this.setState({ saving: true });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editPrimaryRole,
          roles: editRoles,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      // If player role was added, ensure player record exists
      if (editRoles.includes('player')) {
        const { data: existingPlayer } = await supabase
          .from('players')
          .select('id')
          .eq('user_id', editingUser.id)
          .limit(1);

        if (!existingPlayer || existingPlayer.length === 0) {
          await supabase.from('players').insert({
            user_id: editingUser.id,
            name: editingUser.full_name || 'Unknown',
            position: 'CM',
            number: Math.floor(Math.random() * 99) + 1,
          });
        }
      }

      this.setState({
        saving: false,
        editingUser: null,
        successMessage: `Roles updated for ${editingUser.full_name || editingUser.email}`,
      });

      // Clear success message after 3s
      setTimeout(() => this.setState({ successMessage: null }), 3000);

      // Refresh
      this.fetchUsers();
    } catch (error) {
      console.error('Error saving roles:', error);
      this.setState({ saving: false, error: error.message });
    }
  };

  getFilteredUsers = () => {
    const { users, searchQuery, roleFilter } = this.state;
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === 'all' || (user.roles || []).includes(roleFilter);

      return matchesSearch && matchesRole;
    });
  };

  getRoleBadgeColor = (role) => {
    const colors = {
      super_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      coach: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      player: 'bg-green-500/20 text-green-400 border-green-500/30',
      manager: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      owner: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      editor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      fan: 'bg-white/10 text-white/60 border-white/20',
    };
    return colors[role] || colors.fan;
  };

  render() {
    const { loading, error, searchQuery, roleFilter, editingUser, editRoles, editPrimaryRole, saving, successMessage } = this.state;

    const filteredUsers = this.getFilteredUsers();

    // Count by role
    const roleCounts = {};
    this.state.users.forEach((u) => {
      (u.roles || []).forEach((r) => {
        roleCounts[r] = (roleCounts[r] || 0) + 1;
      });
    });

    return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">User Management</h2>
            <p className="text-white/50 text-sm mt-1">
              Manage all users, roles, and permissions — {this.state.users.length} total users
            </p>
          </div>
          <button
            onClick={this.fetchUsers}
            className="mt-3 sm:mt-0 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
            >
              <p className="text-green-400 text-sm">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <button
            onClick={() => this.handleRoleFilter('all')}
            className={`p-3 rounded-lg border text-center transition-all ${
              roleFilter === 'all'
                ? 'bg-accent-gold/20 border-accent-gold/30 text-accent-gold'
                : 'bg-surface-dark-elevated border-white/10 text-white/60 hover:border-white/20'
            }`}
          >
            <p className="text-lg font-bold">{this.state.users.length}</p>
            <p className="text-xs">All</p>
          </button>
          {AVAILABLE_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => this.handleRoleFilter(role)}
              className={`p-3 rounded-lg border text-center transition-all ${
                roleFilter === role
                  ? 'bg-accent-gold/20 border-accent-gold/30 text-accent-gold'
                  : 'bg-surface-dark-elevated border-white/10 text-white/60 hover:border-white/20'
              }`}
            >
              <p className="text-lg font-bold">{roleCounts[role] || 0}</p>
              <p className="text-xs capitalize">{role.replace('_', ' ')}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={this.handleSearch}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-surface-dark-elevated border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <svg className="animate-spin w-8 h-8 text-accent-gold mx-auto mb-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-white/50">Loading users...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Users Table */}
        {!loading && (
          <div className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">User</th>
                    <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Email</th>
                    <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Roles</th>
                    <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Player</th>
                    <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Status</th>
                    <th className="text-right px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {user.profile_image_url ? (
                              <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-accent-gold font-bold text-sm">
                                {(user.full_name || '?').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{user.full_name || 'Unnamed'}</p>
                            <p className="text-white/40 text-xs">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white/70 text-sm">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || ['fan']).map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${this.getRoleBadgeColor(role)}`}
                            >
                              {role === user.role ? '★ ' : ''}{role.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.player ? (
                          <span className="text-green-400 text-sm">{user.player.position} #{user.player.number}</span>
                        ) : user.player_request_status === 'pending' ? (
                          <span className="text-yellow-400 text-sm">Request pending</span>
                        ) : (
                          <span className="text-white/30 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(user.roles || []).includes('super_admin') ? (
                          <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Super Admin
                          </span>
                        ) : (
                          <span className="text-green-400 text-xs">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => this.openEditModal(user)}
                          className="px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        >
                          Edit Roles
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Roles Modal */}
        <AnimatePresence>
          {editingUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={this.closeEditModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-surface-dark-elevated rounded-xl border border-white/10 w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-display font-bold text-white">Edit User Roles</h3>
                    <p className="text-white/50 text-sm">{editingUser.full_name || editingUser.email}</p>
                  </div>
                  <button onClick={this.closeEditModal} className="text-white/50 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Role Toggles */}
                <div className="space-y-2 mb-6">
                  <p className="text-white/70 text-sm font-medium mb-3">Select roles:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_ROLES.map((role) => {
                      const isActive = editRoles.includes(role);
                      const isFan = role === 'fan';
                      return (
                        <button
                          key={role}
                          onClick={() => !isFan && this.toggleRole(role)}
                          disabled={isFan}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                            isActive
                              ? `${this.getRoleBadgeColor(role)} border-current`
                              : 'border-white/10 text-white/40 hover:border-white/20'
                          } ${isFan ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isActive ? 'bg-current border-current' : 'border-white/30'
                          }`}>
                            {isActive && (
                              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium capitalize">{role.replace('_', ' ')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Role */}
                <div className="mb-6">
                  <p className="text-white/70 text-sm font-medium mb-2">Primary role:</p>
                  <div className="flex flex-wrap gap-2">
                    {editRoles.map((role) => (
                      <button
                        key={role}
                        onClick={() => this.setPrimaryRole(role)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          editPrimaryRole === role
                            ? 'bg-accent-gold text-black'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {role.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={this.closeEditModal}
                    className="flex-1 py-2.5 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={this.saveUserRoles}
                    disabled={saving}
                    className="flex-1 py-2.5 px-4 bg-accent-gold text-black rounded-lg hover:bg-accent-gold-light transition-colors font-semibold disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(UserManagement);

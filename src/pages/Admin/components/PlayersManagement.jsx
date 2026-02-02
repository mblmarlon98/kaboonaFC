import React, { Component } from 'react';
import { motion } from 'framer-motion';

// Mock players data
const mockPlayers = [
  { id: 1, name: 'Ahmad Rahman', email: 'ahmad@email.com', position: 'ST', status: 'active', subscription: 'Pro', joinDate: '2024-01-15', attendance: 95 },
  { id: 2, name: 'Sarah Lee', email: 'sarah@email.com', position: 'CM', status: 'active', subscription: 'Elite', joinDate: '2023-11-20', attendance: 88 },
  { id: 3, name: 'John Smith', email: 'john@email.com', position: 'CB', status: 'pending', subscription: 'Basic', joinDate: '2024-02-01', attendance: 0 },
  { id: 4, name: 'Maria Garcia', email: 'maria@email.com', position: 'GK', status: 'active', subscription: 'Pro', joinDate: '2023-09-10', attendance: 92 },
  { id: 5, name: 'Wei Chen', email: 'wei@email.com', position: 'RW', status: 'active', subscription: 'Basic', joinDate: '2024-01-05', attendance: 78 },
  { id: 6, name: 'James Wilson', email: 'james@email.com', position: 'LB', status: 'inactive', subscription: 'Pro', joinDate: '2023-06-15', attendance: 45 },
  { id: 7, name: 'Priya Patel', email: 'priya@email.com', position: 'CAM', status: 'pending', subscription: 'Elite', joinDate: '2024-02-10', attendance: 0 },
  { id: 8, name: 'Michael Brown', email: 'michael@email.com', position: 'CDM', status: 'active', subscription: 'Pro', joinDate: '2023-08-22', attendance: 85 },
];

/**
 * Players Management Component
 * Table with all players, search, filters, and edit/delete actions
 */
class PlayersManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: mockPlayers,
      filteredPlayers: mockPlayers,
      searchTerm: '',
      statusFilter: 'all',
      subscriptionFilter: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      selectedPlayer: null,
      showModal: false,
      modalType: null,
    };
  }

  handleSearch = (e) => {
    const searchTerm = e.target.value;
    this.setState({ searchTerm }, this.filterPlayers);
  };

  handleStatusFilter = (e) => {
    this.setState({ statusFilter: e.target.value }, this.filterPlayers);
  };

  handleSubscriptionFilter = (e) => {
    this.setState({ subscriptionFilter: e.target.value }, this.filterPlayers);
  };

  handleSort = (field) => {
    this.setState((prevState) => ({
      sortBy: field,
      sortOrder: prevState.sortBy === field && prevState.sortOrder === 'asc' ? 'desc' : 'asc',
    }), this.filterPlayers);
  };

  filterPlayers = () => {
    const { players, searchTerm, statusFilter, subscriptionFilter, sortBy, sortOrder } = this.state;

    let filtered = players.filter((player) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
      const matchesSubscription = subscriptionFilter === 'all' || player.subscription === subscriptionFilter;

      return matchesSearch && matchesStatus && matchesSubscription;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    this.setState({ filteredPlayers: filtered });
  };

  openModal = (type, player = null) => {
    this.setState({ showModal: true, modalType: type, selectedPlayer: player });
  };

  closeModal = () => {
    this.setState({ showModal: false, modalType: null, selectedPlayer: null });
  };

  handleApprove = (playerId) => {
    this.setState((prevState) => ({
      players: prevState.players.map((p) =>
        p.id === playerId ? { ...p, status: 'active' } : p
      ),
    }), this.filterPlayers);
  };

  handleDelete = (playerId) => {
    this.setState((prevState) => ({
      players: prevState.players.filter((p) => p.id !== playerId),
    }), this.filterPlayers);
    this.closeModal();
  };

  getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-400/20 text-green-400',
      pending: 'bg-yellow-400/20 text-yellow-400',
      inactive: 'bg-red-400/20 text-red-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  getSubscriptionBadge = (subscription) => {
    const styles = {
      Basic: 'bg-white/10 text-white/70',
      Pro: 'bg-accent-gold/20 text-accent-gold',
      Elite: 'bg-purple-400/20 text-purple-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[subscription]}`}>
        {subscription}
      </span>
    );
  };

  renderSortIcon = (field) => {
    const { sortBy, sortOrder } = this.state;
    if (sortBy !== field) return null;
    return (
      <svg
        className={`w-4 h-4 ml-1 inline transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  render() {
    const {
      filteredPlayers,
      searchTerm,
      statusFilter,
      subscriptionFilter,
      showModal,
      modalType,
      selectedPlayer,
    } = this.state;

    const pendingCount = this.state.players.filter((p) => p.status === 'pending').length;

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Player Management</h1>
            <p className="text-white/50 mt-1">Manage players, approve registrations, and track attendance</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/20 rounded-lg">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-yellow-400 font-medium">{pendingCount} pending approval</span>
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-dark-elevated rounded-xl p-4 border border-white/10"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={this.handleSearch}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-accent-gold"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={this.handleStatusFilter}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Subscription Filter */}
            <div>
              <select
                value={subscriptionFilter}
                onChange={this.handleSubscriptionFilter}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold appearance-none cursor-pointer"
              >
                <option value="all">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Elite">Elite</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => this.handleSort('name')}
                  >
                    Player {this.renderSortIcon('name')}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => this.handleSort('position')}
                  >
                    Position {this.renderSortIcon('position')}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => this.handleSort('status')}
                  >
                    Status {this.renderSortIcon('status')}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => this.handleSort('subscription')}
                  >
                    Plan {this.renderSortIcon('subscription')}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-white/50 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => this.handleSort('attendance')}
                  >
                    Attendance {this.renderSortIcon('attendance')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-gold/20 rounded-full flex items-center justify-center">
                          <span className="text-accent-gold font-bold">
                            {player.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{player.name}</p>
                          <p className="text-white/50 text-sm">{player.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white">{player.position}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {this.getStatusBadge(player.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {this.getSubscriptionBadge(player.subscription)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              player.attendance >= 80
                                ? 'bg-green-400'
                                : player.attendance >= 60
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                            }`}
                            style={{ width: `${player.attendance}%` }}
                          />
                        </div>
                        <span className="text-white/70 text-sm">{player.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {player.status === 'pending' && (
                          <button
                            onClick={() => this.handleApprove(player.id)}
                            className="p-2 rounded-lg bg-green-400/20 text-green-400 hover:bg-green-400/30 transition-colors"
                            title="Approve"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => this.openModal('edit', player)}
                          className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => this.openModal('delete', player)}
                          className="p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredPlayers.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-white/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-white/50">No players found matching your criteria</p>
            </div>
          )}
        </motion.div>

        {/* Modal */}
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={this.closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-surface-dark-elevated rounded-xl p-6 max-w-md w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {modalType === 'delete' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-400/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white text-center mb-2">
                    Delete Player
                  </h3>
                  <p className="text-white/60 text-center mb-6">
                    Are you sure you want to delete <span className="text-white font-semibold">{selectedPlayer?.name}</span>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={this.closeModal}
                      className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => this.handleDelete(selectedPlayer?.id)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}

              {modalType === 'edit' && (
                <>
                  <h3 className="text-xl font-display font-bold text-white mb-4">
                    Edit Player
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Name</label>
                      <input
                        type="text"
                        defaultValue={selectedPlayer?.name}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Email</label>
                      <input
                        type="email"
                        defaultValue={selectedPlayer?.email}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Position</label>
                      <select
                        defaultValue={selectedPlayer?.position}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                      >
                        <option value="GK">GK - Goalkeeper</option>
                        <option value="CB">CB - Center Back</option>
                        <option value="LB">LB - Left Back</option>
                        <option value="RB">RB - Right Back</option>
                        <option value="CDM">CDM - Defensive Midfielder</option>
                        <option value="CM">CM - Central Midfielder</option>
                        <option value="CAM">CAM - Attacking Midfielder</option>
                        <option value="LW">LW - Left Wing</option>
                        <option value="RW">RW - Right Wing</option>
                        <option value="ST">ST - Striker</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Status</label>
                      <select
                        defaultValue={selectedPlayer?.status}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={this.closeModal}
                      className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={this.closeModal}
                      className="flex-1 px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    );
  }
}

export default PlayersManagement;

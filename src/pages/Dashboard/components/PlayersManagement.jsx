import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';
import { createNotification } from '../../../services/notificationService';
import { getAllActiveInjuries } from '../../../services/injuryService';

/**
 * Players Management Component
 * Table with all players, search, filters, and edit/delete actions
 * Fetches real data from Supabase (players + profiles)
 */
class PlayersManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
      filteredPlayers: [],
      isLoading: true,
      searchTerm: '',
      statusFilter: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      selectedPlayer: null,
      showModal: false,
      modalType: null,
      actionLoading: null,
      injuryMap: {},
    };
  }

  componentDidMount() {
    this.fetchPlayers();
  }

  fetchPlayers = async () => {
    this.setState({ isLoading: true });

    try {
      // Fetch profiles with role 'player' or who have 'player' in their roles array
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, roles, created_at')
        .or('role.in.(player,pending),roles.cs.{player}');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Fetch all player records
      const { data: playerRecords, error: playersError } = await supabase
        .from('players')
        .select('*');

      if (playersError) {
        console.error('Error fetching players:', playersError);
      }

      let injuryMap = {};
      try {
        const injuries = await getAllActiveInjuries();
        (injuries || []).forEach(inj => {
          injuryMap[inj.player_id] = inj;
        });
      } catch (err) {
        console.warn('Could not fetch injuries:', err);
      }

      // Also fetch profiles that have player records but may not have role='player'
      const playerUserIds = (playerRecords || []).map(p => p.user_id).filter(Boolean);

      let additionalProfiles = [];
      if (playerUserIds.length > 0) {
        const { data: extraProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, role, created_at')
          .in('id', playerUserIds);
        additionalProfiles = extraProfiles || [];
      }

      // Merge profiles - combine both queries, deduplicate by id
      const allProfilesMap = {};
      [...(profiles || []), ...additionalProfiles].forEach(p => {
        allProfilesMap[p.id] = p;
      });
      const allProfiles = Object.values(allProfilesMap);

      // Build player records map by user_id
      const playerMap = {};
      (playerRecords || []).forEach(p => {
        if (p.user_id) {
          playerMap[p.user_id] = p;
        }
      });

      // Fetch auth users' emails via profiles (we'll use Supabase auth admin or just show profile data)
      // Since we can't access auth.users from client, we'll use the profile data
      // Try to get emails from auth metadata if available
      const combinedPlayers = allProfiles.map(profile => {
        const player = playerMap[profile.id];

        // Determine status
        let status;
        if (!player) {
          status = 'pending';
        } else if (player.is_retired) {
          status = 'inactive';
        } else {
          status = 'active';
        }

        return {
          id: profile.id,
          playerId: player?.id || null,
          name: player?.name || profile.full_name || 'Unknown',
          email: player?.email || '',
          position: player?.position || '-',
          number: player?.number || '',
          status,
          joinDate: profile.created_at,
          profileRole: profile.role,
          pace: player?.pace,
          shooting: player?.shooting,
          passing: player?.passing,
          dribbling: player?.dribbling,
          defending: player?.defending,
          physical: player?.physical,
          diving: player?.diving,
          handling: player?.handling,
          kicking: player?.kicking,
          reflexes: player?.reflexes,
          gk_speed: player?.gk_speed,
          gk_positioning: player?.gk_positioning,
          image: player?.image,
        };
      });

      this.setState({
        players: combinedPlayers,
        filteredPlayers: combinedPlayers,
        injuryMap,
        isLoading: false,
      }, this.filterPlayers);
    } catch (error) {
      console.error('Error fetching players:', error);
      this.setState({ isLoading: false });
    }
  };

  handleSearch = (e) => {
    const searchTerm = e.target.value;
    this.setState({ searchTerm }, this.filterPlayers);
  };

  handleStatusFilter = (e) => {
    this.setState({ statusFilter: e.target.value }, this.filterPlayers);
  };

  handleSort = (field) => {
    this.setState((prevState) => ({
      sortBy: field,
      sortOrder: prevState.sortBy === field && prevState.sortOrder === 'asc' ? 'desc' : 'asc',
    }), this.filterPlayers);
  };

  filterPlayers = () => {
    const { players, searchTerm, statusFilter, sortBy, sortOrder } = this.state;

    let filtered = players.filter((player) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.email && player.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || player.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    this.setState({ filteredPlayers: filtered });
  };

  openModal = (type, player = null) => {
    this.setState({
      showModal: true,
      modalType: type,
      selectedPlayer: player,
      editForm: player ? {
        name: player.name || '',
        email: player.email || '',
        position: player.position || '-',
        status: player.status || 'active',
        number: player.number || '',
        photo: player.image || null,
        stat_pace: player.pace || 50,
        stat_shooting: player.shooting || 50,
        stat_passing: player.passing || 50,
        stat_dribbling: player.dribbling || 50,
        stat_defending: player.defending || 50,
        stat_physical: player.physical || 50,
        stat_diving: player.diving || 50,
        stat_handling: player.handling || 50,
        stat_kicking: player.kicking || 50,
        stat_reflexes: player.reflexes || 50,
        stat_gk_speed: player.gk_speed || 50,
        stat_gk_positioning: player.gk_positioning || 50,
      } : {},
    });
  };

  handleEditFormChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      editForm: { ...prev.editForm, [name]: value },
    }));
  };

  handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be under 5MB');
      return;
    }
    this.setState((prev) => ({
      editForm: { ...prev.editForm, photoFile: file, photo: URL.createObjectURL(file) },
    }));
  };

  closeModal = () => {
    this.setState({ showModal: false, modalType: null, selectedPlayer: null });
  };

  handleSaveEdit = async () => {
    const { selectedPlayer, editForm } = this.state;
    if (!selectedPlayer) return;

    this.setState({ actionLoading: selectedPlayer.id });

    try {
      // Upload photo if selected
      if (editForm.photoFile) {
        const ext = editForm.photoFile.name.split('.').pop();
        const path = `${selectedPlayer.id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, editForm.photoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          const imageUrl = urlData.publicUrl;
          await supabase.from('profiles').update({ profile_image_url: imageUrl }).eq('id', selectedPlayer.id);
          if (selectedPlayer.playerId) {
            await supabase.from('players').update({ image: imageUrl }).eq('id', selectedPlayer.playerId);
          }
        }
      }

      // Update player record if it exists
      if (selectedPlayer.playerId) {
        const playerUpdate = {
          name: editForm.name,
          position: editForm.position,
          pace: parseInt(editForm.stat_pace) || 50,
          shooting: parseInt(editForm.stat_shooting) || 50,
          passing: parseInt(editForm.stat_passing) || 50,
          dribbling: parseInt(editForm.stat_dribbling) || 50,
          defending: parseInt(editForm.stat_defending) || 50,
          physical: parseInt(editForm.stat_physical) || 50,
          diving: parseInt(editForm.stat_diving) || 50,
          handling: parseInt(editForm.stat_handling) || 50,
          kicking: parseInt(editForm.stat_kicking) || 50,
          reflexes: parseInt(editForm.stat_reflexes) || 50,
          gk_speed: parseInt(editForm.stat_gk_speed) || 50,
          gk_positioning: parseInt(editForm.stat_gk_positioning) || 50,
        };
        if (editForm.email) playerUpdate.email = editForm.email;
        if (editForm.number) playerUpdate.number = parseInt(editForm.number, 10);

        const { error: playerError } = await supabase
          .from('players')
          .update(playerUpdate)
          .eq('id', selectedPlayer.playerId);

        if (playerError) console.error('Error updating player:', playerError);
      }

      // Update profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: editForm.name })
        .eq('id', selectedPlayer.id);

      if (profileError) console.error('Error updating profile:', profileError);

      // Handle status changes
      if (editForm.status === 'inactive' && selectedPlayer.playerId) {
        await supabase.from('players').update({ is_retired: true, retired_at: new Date().toISOString() }).eq('id', selectedPlayer.playerId);
      } else if (editForm.status === 'active' && selectedPlayer.playerId) {
        await supabase.from('players').update({ is_retired: false, retired_at: null }).eq('id', selectedPlayer.playerId);
      }

      // Update local state
      this.setState((prevState) => ({
        players: prevState.players.map((p) =>
          p.id === selectedPlayer.id
            ? { ...p, name: editForm.name, email: editForm.email, position: editForm.position, status: editForm.status, number: editForm.number }
            : p
        ),
        actionLoading: null,
      }), () => {
        this.filterPlayers();
        this.closeModal();
      });
    } catch (error) {
      console.error('Error saving player edit:', error);
      this.setState({ actionLoading: null });
    }
  };

  handleApprove = async (player) => {
    this.setState({ actionLoading: player.id });

    try {
      // Use SECURITY DEFINER RPC to bypass RLS issues on players table
      const { data: result, error: rpcError } = await supabase.rpc(
        'approve_player_request',
        { target_user_id: player.id }
      );

      if (rpcError) {
        console.error('Error approving player:', rpcError);
        this.setState({ actionLoading: null });
        return;
      }

      if (result && !result.success) {
        console.error('Approval failed:', result.error);
        this.setState({ actionLoading: null });
        return;
      }

      // Send notification to the player
      try {
        await createNotification({
          userId: player.id,
          title: 'Profile Approved',
          body: 'Your profile has been approved! Welcome to the team.',
          type: 'success',
          referenceType: 'profile',
          referenceId: player.id,
        });
      } catch (notifError) {
        console.warn('Could not send approval notification:', notifError);
      }

      // Refresh from DB to get the new player record
      this.fetchPlayers();
    } catch (error) {
      console.error('Error approving player:', error);
      this.setState({ actionLoading: null });
    }
  };

  handleDelete = async (player) => {
    this.setState({ actionLoading: player.id });

    try {
      if (player.playerId) {
        // Soft delete: set is_retired = true
        const { error } = await supabase
          .from('players')
          .update({ is_retired: true, retired_at: new Date().toISOString() })
          .eq('id', player.playerId);

        if (error) {
          console.error('Error retiring player:', error);
        }
      }

      // Update local state
      this.setState((prevState) => ({
        players: prevState.players.map((p) =>
          p.id === player.id ? { ...p, status: 'inactive' } : p
        ),
        actionLoading: null,
      }), this.filterPlayers);

      this.closeModal();
    } catch (error) {
      console.error('Error deleting player:', error);
      this.setState({ actionLoading: null });
      this.closeModal();
    }
  };

  handleUnretire = async (player) => {
    this.setState({ actionLoading: player.id });
    try {
      if (player.playerId) {
        const { error } = await supabase
          .from('players')
          .update({ is_retired: false, retired_at: null })
          .eq('id', player.playerId);
        if (error) console.error('Error unretiring player:', error);
      }
      this.setState((prevState) => ({
        players: prevState.players.map((p) =>
          p.id === player.id ? { ...p, status: 'active' } : p
        ),
        actionLoading: null,
      }), this.filterPlayers);
    } catch (error) {
      console.error('Error unretiring player:', error);
      this.setState({ actionLoading: null });
    }
  };

  getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-400/20 text-green-400',
      pending: 'bg-yellow-400/20 text-yellow-400',
      inactive: 'bg-red-400/20 text-red-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-white/10 text-white/50'}`}>
        {status === 'inactive' ? 'Retired' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
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

  renderLoadingState = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg
            className="animate-spin w-10 h-10 mx-auto mb-4 text-accent-gold"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white/50">Loading players...</p>
        </div>
      </div>
    </div>
  );

  render() {
    const {
      filteredPlayers,
      searchTerm,
      statusFilter,
      showModal,
      modalType,
      selectedPlayer,
      isLoading,
      actionLoading,
    } = this.state;

    if (isLoading) {
      return this.renderLoadingState();
    }

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
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-400/20 rounded-lg">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-yellow-400 font-medium">{pendingCount} pending approval</span>
              </div>
            )}
            <motion.button
              onClick={this.fetchPlayers}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>
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
                <option value="inactive">Retired</option>
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
                    onClick={() => this.handleSort('joinDate')}
                  >
                    Join Date {this.renderSortIcon('joinDate')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlayers.map((player) => (
                  <tr key={player.id} className={`hover:bg-white/5 transition-colors ${this.state.injuryMap[player.id] ? 'bg-red-500/5' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent-gold/20 rounded-full flex items-center justify-center overflow-hidden">
                          {player.image ? (
                            <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-accent-gold font-bold">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{player.name}</p>
                          {this.state.injuryMap[player.id] && (
                            <span className="ml-2 inline-flex items-center gap-1 text-red-400 text-xs" title={`${this.state.injuryMap[player.id].injury_note || 'Injured'}${this.state.injuryMap[player.id].expected_return ? ` — Expected return: ${new Date(this.state.injuryMap[player.id].expected_return).toLocaleDateString()}` : ''}`}>
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Injured
                            </span>
                          )}
                          {player.email && (
                            <p className="text-white/50 text-sm">{player.email}</p>
                          )}
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
                      <span className="text-white/70 text-sm">{this.formatDate(player.joinDate)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {player.status === 'pending' && (
                          <button
                            onClick={() => this.handleApprove(player)}
                            disabled={actionLoading === player.id}
                            className="p-2 rounded-lg bg-green-400/20 text-green-400 hover:bg-green-400/30 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading === player.id ? (
                              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
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
                        {player.status !== 'inactive' && (
                          <button
                            onClick={() => this.openModal('delete', player)}
                            className="p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-colors"
                            title="Retire"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        {player.status === 'inactive' && (
                          <button
                            onClick={() => this.handleUnretire(player)}
                            disabled={actionLoading === player.id}
                            className="p-2 rounded-lg bg-green-400/20 text-green-400 hover:bg-green-400/30 transition-colors"
                            title="Unretire"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                        )}
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
              className="bg-surface-dark-elevated rounded-xl p-6 max-w-lg w-full border border-white/10 overflow-y-auto max-h-[80vh]"
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
                    Retire Player
                  </h3>
                  <p className="text-white/60 text-center mb-6">
                    Are you sure you want to retire <span className="text-white font-semibold">{selectedPlayer?.name}</span>? They will be marked as Retired.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={this.closeModal}
                      className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => this.handleDelete(selectedPlayer)}
                      disabled={actionLoading === selectedPlayer?.id}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedPlayer?.id ? 'Retiring...' : 'Retire'}
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
                      <label className="block text-white/60 text-sm mb-1">Profile Photo</label>
                      {this.state.editForm?.photo && (
                        <img src={this.state.editForm.photo} alt="Current" className="w-16 h-16 rounded-full object-cover mb-2" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={this.handlePhotoSelect}
                        className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-gold/20 file:text-accent-gold hover:file:bg-accent-gold/30"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={this.state.editForm?.name || ''}
                        onChange={this.handleEditFormChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={this.state.editForm?.email || ''}
                        onChange={this.handleEditFormChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Jersey Number</label>
                      <input
                        type="number"
                        name="number"
                        value={this.state.editForm?.number || ''}
                        onChange={this.handleEditFormChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                        placeholder="e.g. 10"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Position</label>
                      <select
                        name="position"
                        value={this.state.editForm?.position || ''}
                        onChange={this.handleEditFormChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                      >
                        <option value="Unassigned">Unassigned</option>
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
                    {this.state.editForm?.position !== 'GK' ? (
                      <div className="space-y-3">
                        <label className="block text-white/60 text-sm">Player Stats (1-99)</label>
                        {['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].map(stat => (
                          <div key={stat} className="flex items-center gap-3">
                            <span className="text-white/50 text-xs w-20 capitalize">{stat}</span>
                            <input type="range" min="1" max="99" name={`stat_${stat}`} value={this.state.editForm?.[`stat_${stat}`] || 50} onChange={this.handleEditFormChange} className="flex-1 accent-accent-gold" />
                            <span className="text-white text-xs w-8 text-right">{this.state.editForm?.[`stat_${stat}`] || 50}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-white/60 text-sm">GK Stats (1-99)</label>
                        {['diving', 'handling', 'kicking', 'reflexes', 'gk_speed', 'gk_positioning'].map(stat => (
                          <div key={stat} className="flex items-center gap-3">
                            <span className="text-white/50 text-xs w-20 capitalize">{stat.replace('gk_', '')}</span>
                            <input type="range" min="1" max="99" name={`stat_${stat}`} value={this.state.editForm?.[`stat_${stat}`] || 50} onChange={this.handleEditFormChange} className="flex-1 accent-accent-gold" />
                            <span className="text-white text-xs w-8 text-right">{this.state.editForm?.[`stat_${stat}`] || 50}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <label className="block text-white/60 text-sm mb-1">Status</label>
                      <select
                        name="status"
                        value={this.state.editForm?.status || ''}
                        onChange={this.handleEditFormChange}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Retired</option>
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
                      onClick={this.handleSaveEdit}
                      disabled={actionLoading === selectedPlayer?.id}
                      className="flex-1 px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedPlayer?.id ? 'Saving...' : 'Save Changes'}
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

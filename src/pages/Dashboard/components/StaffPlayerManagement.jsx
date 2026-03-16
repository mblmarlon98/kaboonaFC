import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../services/supabase';

const STAFF_ROLES = ['owner', 'manager', 'coach', 'admin', 'editor', 'marketing'];

const ROLE_BADGE_COLORS = {
  owner: 'bg-yellow-500/20 text-yellow-400',
  manager: 'bg-orange-500/20 text-orange-400',
  coach: 'bg-blue-500/20 text-blue-400',
  admin: 'bg-purple-500/20 text-purple-400',
  editor: 'bg-cyan-500/20 text-cyan-400',
  marketing: 'bg-pink-500/20 text-pink-400',
  player: 'bg-green-500/20 text-green-400',
  fan: 'bg-white/10 text-white/60',
};

const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  coach: 'Coach',
  admin: 'Admin',
  editor: 'Editor',
  marketing: 'Marketing',
  player: 'Player',
};

class StaffPlayerManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profiles: [],
      players: [],
      invitations: [],
      loading: true,
      error: null,
      successMessage: null,

      // Invite modal
      showInviteModal: false,
      inviteTargetRole: null,
      inviteMode: null, // 'existing' | 'link'
      inviteSelectedRoles: [],
      inviteSearchQuery: '',
      inviteCreating: false,
      inviteLink: null,
      inviteCopied: false,

      // Existing user assign
      assigningUserId: null,
    };
  }

  componentDidMount() {
    this.fetchAllData();
  }

  fetchAllData = async () => {
    this.setState({ loading: true, error: null });

    try {
      const [profilesRes, playersRes, invitationsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, role, roles, profile_image_url'),
        supabase
          .from('players')
          .select('id, user_id, position, jersey_number'),
        supabase
          .from('role_invitations')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (playersRes.error) throw playersRes.error;
      if (invitationsRes.error) throw invitationsRes.error;

      this.setState({
        profiles: profilesRes.data || [],
        players: playersRes.data || [],
        invitations: invitationsRes.data || [],
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  getProfilesByRole = (role) => {
    const { profiles } = this.state;
    return profiles.filter((p) => {
      const userRoles = p.roles || [];
      return userRoles.includes(role);
    });
  };

  getPlayersWithProfiles = () => {
    const { players, profiles } = this.state;
    const profileMap = {};
    profiles.forEach((p) => {
      profileMap[p.id] = p;
    });

    return players.map((player) => ({
      ...player,
      profile: profileMap[player.user_id] || null,
    }));
  };

  getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Invite modal
  openInviteModal = (role) => {
    const initialRoles = role === 'player' ? ['fan', 'player'] : [role];
    this.setState({
      showInviteModal: true,
      inviteTargetRole: role,
      inviteMode: null,
      inviteSelectedRoles: initialRoles,
      inviteSearchQuery: '',
      inviteLink: null,
      inviteCopied: false,
    });
  };

  closeInviteModal = () => {
    this.setState({
      showInviteModal: false,
      inviteTargetRole: null,
      inviteMode: null,
      inviteSelectedRoles: [],
      inviteSearchQuery: '',
      inviteLink: null,
      inviteCopied: false,
      inviteCreating: false,
    });
  };

  setInviteMode = (mode) => {
    this.setState({ inviteMode: mode, inviteLink: null, inviteCopied: false });
  };

  toggleInviteRole = (role) => {
    this.setState((prev) => {
      const { inviteSelectedRoles, inviteTargetRole } = prev;
      let updated;

      if (inviteSelectedRoles.includes(role)) {
        // Don't allow removing the target role
        if (role === inviteTargetRole) return null;
        updated = inviteSelectedRoles.filter((r) => r !== role);
      } else {
        updated = [...inviteSelectedRoles, role];
      }

      // Always ensure 'fan' is included for staff invites
      if (!updated.includes('fan') && inviteTargetRole !== 'player') {
        updated.push('fan');
      }

      return { inviteSelectedRoles: updated };
    });
  };

  handleInviteSearch = (e) => {
    this.setState({ inviteSearchQuery: e.target.value });
  };

  getEligibleUsers = () => {
    const { profiles } = this.state;
    const { inviteTargetRole, inviteSearchQuery } = this.state;

    return profiles.filter((p) => {
      const userRoles = p.roles || [];
      // Exclude users who already have this role
      if (userRoles.includes(inviteTargetRole)) return false;
      // Exclude super_admins from showing
      if (userRoles.includes('super_admin')) return false;

      // Search filter
      if (inviteSearchQuery) {
        const q = inviteSearchQuery.toLowerCase();
        const nameMatch = (p.full_name || '').toLowerCase().includes(q);
        const emailMatch = (p.email || '').toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }

      return true;
    });
  };

  assignRoleToUser = async (userId) => {
    const { inviteTargetRole } = this.state;
    this.setState({ assigningUserId: userId });

    try {
      // Get current profile
      const profile = this.state.profiles.find((p) => p.id === userId);
      if (!profile) throw new Error('Profile not found');

      const currentRoles = profile.roles || ['fan'];
      const updatedRoles = [...new Set([...currentRoles, inviteTargetRole])];

      // Determine best primary role (highest privilege)
      const rolePriority = ['owner', 'manager', 'coach', 'admin', 'editor', 'marketing', 'player', 'fan'];
      const primaryRole = rolePriority.find((r) => updatedRoles.includes(r)) || 'fan';

      const profileUpdate = { roles: updatedRoles, role: primaryRole };
      // If assigning player role, auto-approve (skip pending request flow)
      if (inviteTargetRole === 'player') {
        profileUpdate.player_request_status = 'approved';
      }

      const { error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (error) throw error;

      // If assigning player role, ensure player record exists
      if (inviteTargetRole === 'player') {
        await supabase
          .from('players')
          .upsert({ user_id: userId, position: 'CM' }, { onConflict: 'user_id' });
      }

      this.setState({
        assigningUserId: null,
        successMessage: `${inviteTargetRole} role assigned to ${profile.full_name || profile.email}`,
      });

      setTimeout(() => this.setState({ successMessage: null }), 3000);

      this.closeInviteModal();
      this.fetchAllData();
    } catch (error) {
      console.error('Error assigning role:', error);
      this.setState({
        assigningUserId: null,
        error: error.message,
      });
    }
  };

  removeRoleFromUser = async (userId, role) => {
    const profile = this.state.profiles.find((p) => p.id === userId);
    if (!profile) return;

    const displayName = profile.full_name || profile.email || 'this user';
    if (!window.confirm(`Remove ${role} role from ${displayName}?`)) return;

    try {
      const currentRoles = profile.roles || ['fan'];
      const updatedRoles = currentRoles.filter((r) => r !== role);
      // Ensure at least 'fan' remains
      if (updatedRoles.length === 0) updatedRoles.push('fan');

      const rolePriority = ['owner', 'manager', 'coach', 'admin', 'editor', 'marketing', 'player', 'fan'];
      const primaryRole = rolePriority.find((r) => updatedRoles.includes(r)) || 'fan';

      const { error } = await supabase
        .from('profiles')
        .update({ roles: updatedRoles, role: primaryRole })
        .eq('id', userId);

      if (error) throw error;

      // If removing 'player' role, also delete the player record
      if (role === 'player') {
        await supabase.from('players').delete().eq('user_id', userId);
      }

      this.setState({
        successMessage: `Removed ${role} role from ${displayName}`,
      });
      setTimeout(() => this.setState({ successMessage: null }), 3000);
      this.fetchAllData();
    } catch (error) {
      console.error('Error removing role:', error);
      this.setState({ error: error.message });
    }
  };

  removePlayer = async (playerId, userId) => {
    const profile = this.state.profiles.find((p) => p.id === userId);
    const displayName = profile?.full_name || profile?.email || 'this player';
    if (!window.confirm(`Remove ${displayName} from the squad? This will delete their player record and remove the player role.`)) return;

    try {
      // Delete player record
      const { error: playerError } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (playerError) throw playerError;

      // Remove player role from profile
      if (profile) {
        const currentRoles = profile.roles || ['fan'];
        const updatedRoles = currentRoles.filter((r) => r !== 'player');
        if (updatedRoles.length === 0) updatedRoles.push('fan');

        const rolePriority = ['owner', 'manager', 'coach', 'admin', 'editor', 'marketing', 'fan'];
        const primaryRole = rolePriority.find((r) => updatedRoles.includes(r)) || 'fan';

        await supabase
          .from('profiles')
          .update({ roles: updatedRoles, role: primaryRole, player_request_status: null })
          .eq('id', userId);
      }

      this.setState({
        successMessage: `Removed ${displayName} from the squad`,
      });
      setTimeout(() => this.setState({ successMessage: null }), 3000);
      this.fetchAllData();
    } catch (error) {
      console.error('Error removing player:', error);
      this.setState({ error: error.message });
    }
  };

  generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  createInviteLink = async () => {
    const { inviteSelectedRoles, inviteTargetRole } = this.state;
    const { user } = this.props;

    this.setState({ inviteCreating: true });

    try {
      const token = this.generateToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Build label
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      const roleLabel = (ROLE_LABELS[inviteTargetRole] || inviteTargetRole);
      const label = `${roleLabel} Invite - ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

      // Ensure 'fan' is always included
      const roles = [...new Set([...inviteSelectedRoles, 'fan'])];

      const { error } = await supabase.from('role_invitations').insert({
        token,
        roles,
        label,
        created_by: user?.id || null,
        expires_at: expiresAt.toISOString(),
        max_uses: null,
        use_count: 0,
        is_active: true,
      });

      if (error) throw error;

      const link = `${window.location.origin}/register?invite=${token}`;

      this.setState({
        inviteLink: link,
        inviteCreating: false,
      });

      // Refresh invitations
      this.fetchInvitations();
    } catch (error) {
      console.error('Error creating invitation:', error);
      this.setState({
        inviteCreating: false,
        error: error.message,
      });
    }
  };

  fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('role_invitations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.setState({ invitations: data || [] });
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ inviteCopied: true });
      setTimeout(() => this.setState({ inviteCopied: false }), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.setState({ inviteCopied: true });
      setTimeout(() => this.setState({ inviteCopied: false }), 2000);
    }
  };

  copyInvitationLink = async (token) => {
    const link = `${window.location.origin}/register?invite=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      this.setState({ successMessage: 'Link copied to clipboard!' });
      setTimeout(() => this.setState({ successMessage: null }), 2000);
    } catch (err) {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.setState({ successMessage: 'Link copied to clipboard!' });
      setTimeout(() => this.setState({ successMessage: null }), 2000);
    }
  };

  deactivateInvitation = async (invitationId) => {
    try {
      const { error } = await supabase
        .from('role_invitations')
        .update({ is_active: false })
        .eq('id', invitationId);

      if (error) throw error;

      this.setState((prev) => ({
        invitations: prev.invitations.filter((inv) => inv.id !== invitationId),
        successMessage: 'Invitation deactivated',
      }));
      setTimeout(() => this.setState({ successMessage: null }), 2000);
    } catch (error) {
      console.error('Error deactivating invitation:', error);
      this.setState({ error: error.message });
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  renderLoadingSpinner = () => (
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
        <p className="text-white/50">Loading staff and players...</p>
      </div>
    </div>
  );

  renderAvatar = (profile, size = 'w-12 h-12') => {
    if (profile?.profile_image_url) {
      return (
        <div className={`${size} rounded-full overflow-hidden flex-shrink-0`}>
          <img
            src={profile.profile_image_url}
            alt={profile.full_name || ''}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return (
      <div className={`${size} rounded-full bg-accent-gold/20 flex items-center justify-center flex-shrink-0`}>
        <span className="text-accent-gold font-bold text-sm">
          {this.getInitials(profile?.full_name)}
        </span>
      </div>
    );
  };

  renderUserCard = (profile, role) => (
    <motion.div
      key={`${role}-${profile.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-dark-elevated rounded-xl border border-white/10 p-4 flex items-center gap-4 hover:border-white/20 transition-colors group"
    >
      {this.renderAvatar(profile)}
      <div className="min-w-0 flex-1">
        <p className="text-white font-medium text-sm truncate">
          {profile.full_name || 'Unnamed'}
        </p>
        <p className="text-white/40 text-xs truncate">{profile.email || 'No email'}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS.fan}`}>
        {ROLE_LABELS[role] || role}
      </span>
      <button
        onClick={() => this.removeRoleFromUser(profile.id, role)}
        className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
        title={`Remove ${role} role`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );

  renderAddButton = (role) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => this.openInviteModal(role)}
      className="bg-surface-dark-elevated rounded-xl border border-dashed border-white/20 p-4 flex items-center justify-center gap-2 hover:border-accent-gold/50 hover:bg-accent-gold/5 transition-all cursor-pointer min-h-[72px]"
    >
      <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span className="text-white/40 text-sm">Add {ROLE_LABELS[role] || role}</span>
    </motion.button>
  );

  renderRoleSection = (role) => {
    const usersInRole = this.getProfilesByRole(role);

    return (
      <motion.div
        key={role}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Role Header */}
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-display font-bold text-white capitalize">
            {ROLE_LABELS[role] || role}s
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE_COLORS[role]}`}>
            {usersInRole.length}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {usersInRole.map((profile) => this.renderUserCard(profile, role))}
          {this.renderAddButton(role)}
        </div>

        {/* Empty State */}
        {usersInRole.length === 0 && (
          <p className="text-white/30 text-sm mt-2 ml-1">No {ROLE_LABELS[role] || role}s assigned yet</p>
        )}
      </motion.div>
    );
  };

  renderPlayersSection = () => {
    const playersWithProfiles = this.getPlayersWithProfiles();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-display font-bold text-white">Players</h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE_COLORS.player}`}>
            {playersWithProfiles.length}
          </span>
        </div>

        {/* Player Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {playersWithProfiles.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-dark-elevated rounded-xl border border-white/10 p-4 flex items-center gap-4 hover:border-white/20 transition-colors group"
            >
              {this.renderAvatar(player.profile)}
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-sm truncate">
                  {player.profile?.full_name || 'Unknown Player'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {player.position && (
                    <span className="text-white/50 text-xs">{player.position}</span>
                  )}
                  {player.jersey_number != null && (
                    <span className="text-accent-gold text-xs font-bold">#{player.jersey_number}</span>
                  )}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_BADGE_COLORS.player}`}>
                Player
              </span>
              <button
                onClick={() => this.removePlayer(player.id, player.user_id)}
                className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove player"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
          {this.renderAddButton('player')}
        </div>

        {playersWithProfiles.length === 0 && (
          <p className="text-white/30 text-sm mt-2 ml-1">No players registered yet</p>
        )}
      </motion.div>
    );
  };

  renderInvitationsPanel = () => {
    const { invitations } = this.state;

    if (invitations.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10"
      >
        <h3 className="text-lg font-display font-bold text-white mb-4">Active Invitation Links</h3>
        <div className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Label</th>
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Roles</th>
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Created</th>
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Uses</th>
                  <th className="text-left px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Expires</th>
                  <th className="text-right px-6 py-4 text-white/50 text-xs uppercase tracking-wider font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const expired = this.isExpired(inv.expires_at);
                  return (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white text-sm font-medium">{inv.label || 'Untitled'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(inv.roles || []).filter((r) => r !== 'fan').map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS.fan}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white/60 text-sm">{this.formatDate(inv.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white text-sm font-medium">
                          {inv.use_count || 0}
                          {inv.max_uses != null && ` / ${inv.max_uses}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${expired ? 'text-red-400' : 'text-white/60'}`}>
                          {expired ? 'Expired' : this.formatDate(inv.expires_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => this.copyInvitationLink(inv.token)}
                            className="px-3 py-1.5 text-xs font-medium bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                          >
                            Copy Link
                          </button>
                          <button
                            onClick={() => this.deactivateInvitation(inv.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  renderInviteModal = () => {
    const {
      showInviteModal,
      inviteTargetRole,
      inviteMode,
      inviteSelectedRoles,
      inviteSearchQuery,
      inviteCreating,
      inviteLink,
      inviteCopied,
      assigningUserId,
    } = this.state;

    if (!showInviteModal) return null;

    const eligibleUsers = this.getEligibleUsers();
    const isPlayerInvite = inviteTargetRole === 'player';

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={this.closeInviteModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-surface-dark-elevated rounded-xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h3 className="text-lg font-display font-bold text-white">
                  {inviteMode === null && `Add ${ROLE_LABELS[inviteTargetRole] || inviteTargetRole}`}
                  {inviteMode === 'existing' && 'Choose Existing User'}
                  {inviteMode === 'link' && 'Create Invitation Link'}
                </h3>
                <p className="text-white/50 text-sm mt-1">
                  {inviteMode === null && 'Choose how to add this role'}
                  {inviteMode === 'existing' && `Assign the ${inviteTargetRole} role to an existing user`}
                  {inviteMode === 'link' && 'Generate a shareable registration link'}
                </p>
              </div>
              <button onClick={this.closeInviteModal} className="text-white/50 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Mode Selection */}
              {inviteMode === null && (
                <div className="space-y-3">
                  <button
                    onClick={() => this.setInviteMode('existing')}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-accent-gold/50 hover:bg-accent-gold/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium group-hover:text-accent-gold transition-colors">
                          Choose from existing users
                        </p>
                        <p className="text-white/40 text-sm mt-0.5">
                          Assign this role to someone who already has an account
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => this.setInviteMode('link')}
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-accent-gold/50 hover:bg-accent-gold/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium group-hover:text-accent-gold transition-colors">
                          Create invitation link
                        </p>
                        <p className="text-white/40 text-sm mt-0.5">
                          Generate a link for someone to register with this role
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Existing User Selection */}
              {inviteMode === 'existing' && (
                <div>
                  <button
                    onClick={() => this.setInviteMode(null)}
                    className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>

                  {/* Search */}
                  <div className="relative mb-4">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={inviteSearchQuery}
                      onChange={this.handleInviteSearch}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-accent-gold"
                    />
                  </div>

                  {/* User List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {eligibleUsers.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-white/40 text-sm">No eligible users found</p>
                      </div>
                    )}
                    {eligibleUsers.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => this.assignRoleToUser(profile.id)}
                        disabled={assigningUserId === profile.id}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-accent-gold/50 hover:bg-accent-gold/5 transition-all disabled:opacity-50"
                      >
                        {this.renderAvatar(profile, 'w-10 h-10')}
                        <div className="text-left min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">
                            {profile.full_name || 'Unnamed'}
                          </p>
                          <p className="text-white/40 text-xs truncate">{profile.email}</p>
                        </div>
                        {assigningUserId === profile.id ? (
                          <svg className="animate-spin w-5 h-5 text-accent-gold flex-shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Link Mode */}
              {inviteMode === 'link' && !inviteLink && (
                <div>
                  <button
                    onClick={() => this.setInviteMode(null)}
                    className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>

                  {/* Multi-Role Selection */}
                  {!isPlayerInvite && (
                    <div className="mb-6">
                      <p className="text-white/70 text-sm font-medium mb-3">
                        Select roles for this invitation:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[...STAFF_ROLES, 'player'].map((role) => {
                          const isSelected = inviteSelectedRoles.includes(role);
                          const isTarget = role === inviteTargetRole;
                          return (
                            <button
                              key={role}
                              onClick={() => this.toggleInviteRole(role)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                                isSelected
                                  ? `${ROLE_BADGE_COLORS[role]} border-current`
                                  : 'border-white/10 text-white/40 hover:border-white/20'
                              } ${isTarget ? 'ring-1 ring-accent-gold/30' : ''}`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'bg-current border-current' : 'border-white/30'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm font-medium capitalize">
                                {ROLE_LABELS[role]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isPlayerInvite && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400 text-sm">
                        This will create a bulk player invite link. New users who register with this link will automatically receive the <strong>fan</strong> and <strong>player</strong> roles.
                      </p>
                    </div>
                  )}

                  {/* Selected Roles Summary */}
                  <div className="mb-6">
                    <p className="text-white/50 text-xs mb-2">Roles included in this invite:</p>
                    <div className="flex flex-wrap gap-1">
                      {[...new Set([...inviteSelectedRoles, 'fan'])].map((role) => (
                        <span
                          key={role}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS.fan}`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={this.createInviteLink}
                    disabled={inviteCreating}
                    className="w-full py-3 px-4 bg-accent-gold text-black rounded-lg hover:bg-accent-gold-light transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inviteCreating ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        Generate Invite Link
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Link Generated */}
              {inviteMode === 'link' && inviteLink && (
                <div>
                  <div className="mb-4 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  <h4 className="text-white font-bold text-center mb-2">Invitation Link Created!</h4>
                  <p className="text-white/50 text-sm text-center mb-4">
                    Share this link with the person you want to invite. It expires in 30 days.
                  </p>

                  <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg mb-4">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-transparent text-white text-sm outline-none min-w-0"
                    />
                    <button
                      onClick={() => this.copyToClipboard(inviteLink)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                        inviteCopied
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-accent-gold text-black hover:bg-accent-gold-light'
                      }`}
                    >
                      {inviteCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  <button
                    onClick={this.closeInviteModal}
                    className="w-full py-2.5 px-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  render() {
    const { loading, error, successMessage } = this.state;

    return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">Staff & Player Management</h2>
            <p className="text-white/50 text-sm mt-1">
              Manage team roles, staff assignments, and invitation links
            </p>
          </div>
          <button
            onClick={this.fetchAllData}
            className="mt-3 sm:mt-0 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between"
            >
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => this.setState({ error: null })}
                className="text-red-400 hover:text-red-300 ml-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && this.renderLoadingSpinner()}

        {/* Content */}
        {!loading && (
          <div>
            {/* Staff Role Sections */}
            {STAFF_ROLES.map((role) => this.renderRoleSection(role))}

            {/* Divider */}
            <div className="border-t border-white/10 my-8" />

            {/* Players Section */}
            {this.renderPlayersSection()}

            {/* Active Invitations */}
            {this.renderInvitationsPanel()}
          </div>
        )}

        {/* Invite Modal */}
        {this.renderInviteModal()}
      </div>
    );
  }
}

export default StaffPlayerManagement;

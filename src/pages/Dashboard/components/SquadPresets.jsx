import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { getPresets, createPreset, deletePreset, setPresetPlayers } from '../../../services/squadPresetService';
import { getAllActivePlayers } from '../../../services/schedulingService';
import { getInjuredPlayerIds } from '../../../services/injuryService';
import { supabase } from '../../../services/supabase';

class SquadPresets extends Component {
  constructor(props) {
    super(props);
    this.state = {
      presets: [],
      players: [],
      injuredIds: new Set(),
      selectedPreset: null,
      selectedPlayerIds: new Set(),
      presetName: '',
      isCreating: false,
      loading: true,
      saving: false,
      showNotification: false,
      notificationMessage: '',
      userId: null,
      deletingPresetId: null,
    };
  }

  componentDidMount() {
    this.initUser();
    this.fetchData();
  }

  componentWillUnmount() {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
  }

  initUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.setState({ userId: user.id });
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  fetchData = async () => {
    this.setState({ loading: true });
    try {
      const [presets, players, injuredIds] = await Promise.all([
        getPresets(),
        getAllActivePlayers(),
        getInjuredPlayerIds(),
      ]);

      this.setState({ presets, players, injuredIds, loading: false });
    } catch (err) {
      console.error('Error fetching squad preset data:', err);
      this.setState({ loading: false });
    }
  };

  showNotification = (message) => {
    this.setState({ showNotification: true, notificationMessage: message });
    this.notificationTimer = setTimeout(() => this.setState({ showNotification: false }), 3000);
  };

  handleCreatePreset = async () => {
    const { presetName, userId } = this.state;
    const trimmedName = presetName.trim();
    if (!trimmedName) return;

    this.setState({ isCreating: true });
    try {
      await createPreset(trimmedName, userId);
      this.setState({ presetName: '', isCreating: false });
      this.showNotification('Preset created successfully');
      await this.fetchData();
    } catch (err) {
      console.error('Error creating preset:', err);
      this.setState({ isCreating: false });
      this.showNotification('Failed to create preset');
    }
  };

  handleSelectPreset = (preset) => {
    this.setState({
      selectedPreset: preset,
      selectedPlayerIds: new Set(preset.playerIds || []),
    });
  };

  handleDeletePreset = async (presetId) => {
    this.setState({ deletingPresetId: null });
    try {
      await deletePreset(presetId);
      const { selectedPreset } = this.state;
      if (selectedPreset && selectedPreset.id === presetId) {
        this.setState({ selectedPreset: null, selectedPlayerIds: new Set() });
      }
      this.showNotification('Preset deleted');
      await this.fetchData();
    } catch (err) {
      console.error('Error deleting preset:', err);
      this.showNotification('Failed to delete preset');
    }
  };

  handleTogglePlayer = (playerId) => {
    this.setState((prev) => {
      const next = new Set(prev.selectedPlayerIds);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return { selectedPlayerIds: next };
    });
  };

  handleSavePresetPlayers = async () => {
    const { selectedPreset, selectedPlayerIds } = this.state;
    if (!selectedPreset) return;

    this.setState({ saving: true });
    try {
      await setPresetPlayers(selectedPreset.id, [...selectedPlayerIds]);
      this.setState({ saving: false });
      this.showNotification('Squad preset saved successfully');
      await this.fetchData();

      // Re-select the preset with updated data
      const { presets } = this.state;
      const updated = presets.find((p) => p.id === selectedPreset.id);
      if (updated) {
        this.setState({
          selectedPreset: updated,
          selectedPlayerIds: new Set(updated.playerIds || []),
        });
      }
    } catch (err) {
      console.error('Error saving preset players:', err);
      this.setState({ saving: false });
      this.showNotification('Failed to save preset players');
    }
  };

  getPlayerInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  renderLoadingSkeleton = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="h-12 bg-surface-dark-elevated rounded-xl animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-dark-elevated rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="lg:col-span-2">
          <div className="h-64 bg-surface-dark-elevated rounded-xl animate-pulse" />
        </div>
      </div>
    );
  };

  renderPresetList = () => {
    const { presets, selectedPreset, presetName, isCreating, deletingPresetId } = this.state;

    return (
      <div className="lg:col-span-1 space-y-4">
        {/* Create new preset */}
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-4">
          <h3 className="text-white font-display font-bold text-sm mb-3">New Preset</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => this.setState({ presetName: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') this.handleCreatePreset();
              }}
              placeholder="Preset name..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-accent-gold"
            />
            <button
              onClick={this.handleCreatePreset}
              disabled={isCreating || !presetName.trim()}
              className="px-4 py-2 bg-accent-gold text-black font-bold text-sm rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isCreating && (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              )}
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Preset cards */}
        {presets.length === 0 ? (
          <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-white/5 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">No presets yet. Create one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {presets.map((preset) => {
              const isActive = selectedPreset && selectedPreset.id === preset.id;

              return (
                <motion.div
                  key={preset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-accent-gold/10 border-accent-gold/30'
                      : 'bg-surface-dark-elevated border-white/5 hover:border-white/10'
                  }`}
                  onClick={() => this.handleSelectPreset(preset)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{preset.name}</p>
                      <p className="text-white/40 text-xs">{preset.playerCount} players</p>
                    </div>
                    {deletingPresetId === preset.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            this.handleDeletePreset(preset.id);
                          }}
                          className="text-xs text-red-400 hover:text-red-300 font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            this.setState({ deletingPresetId: null });
                          }}
                          className="text-xs text-white/40 hover:text-white/60"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          this.setState({ deletingPresetId: preset.id });
                        }}
                        className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                        title="Delete preset"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  renderPlayerGrid = () => {
    const { selectedPreset, selectedPlayerIds, players, injuredIds, saving } = this.state;

    if (!selectedPreset) {
      return (
        <div className="lg:col-span-2">
          <div className="bg-surface-dark rounded-2xl border border-white/5 flex items-center justify-center p-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-white/60 font-medium">Select a preset to manage players</h3>
              <p className="text-white/30 text-sm mt-1">Choose a preset from the list or create a new one</p>
            </div>
          </div>
        </div>
      );
    }

    const selectedCount = selectedPlayerIds.size;

    return (
      <div className="lg:col-span-2 space-y-4">
        {/* Preset header */}
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-display font-bold text-lg">{selectedPreset.name}</h3>
            <p className="text-white/40 text-sm">{selectedCount} player{selectedCount !== 1 ? 's' : ''} selected</p>
          </div>
          <button
            onClick={this.handleSavePresetPlayers}
            disabled={saving}
            className="px-5 py-2.5 bg-accent-gold text-black font-bold text-sm rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            )}
            {saving ? 'Saving...' : 'Save Squad'}
          </button>
        </div>

        {/* Player grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {players.map((player) => {
            const isInjured = injuredIds.has(player.user_id);
            const isSelected = selectedPlayerIds.has(player.user_id);

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isInjured
                    ? 'bg-red-500/5 border-red-500/20 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-accent-gold/10 border-accent-gold/30'
                    : 'bg-surface-dark border-white/5 hover:border-white/10'
                }`}
                onClick={() => {
                  if (!isInjured) this.handleTogglePlayer(player.user_id);
                }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isInjured}
                    onChange={() => {
                      if (!isInjured) this.handleTogglePlayer(player.user_id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-accent-gold focus:ring-accent-gold focus:ring-offset-0 focus:ring-1 disabled:opacity-30"
                  />
                  <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                    {player.profile_image_url ? (
                      <img
                        src={player.profile_image_url}
                        alt={player.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/40 text-xs font-medium">
                          {this.getPlayerInitials(player.full_name)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{player.full_name}</p>
                    <p className="text-white/40 text-xs">
                      {player.position || 'No position'}
                      {player.jersey_number ? ` #${player.jersey_number}` : ''}
                    </p>
                  </div>
                  {isInjured && (
                    <span className="ml-auto text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex-shrink-0">
                      Injured
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {players.length === 0 && (
          <div className="bg-surface-dark rounded-2xl border border-white/5 p-12 text-center">
            <p className="text-white/40">No active players found.</p>
          </div>
        )}
      </div>
    );
  };

  render() {
    const { loading, showNotification, notificationMessage } = this.state;

    return (
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-white">Squad Presets</h1>
          <p className="text-white/50 mt-1">Create and manage reusable squad collections</p>
        </motion.div>

        {/* Notification toast */}
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-4 right-4 z-50 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {notificationMessage}
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          this.renderLoadingSkeleton()
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {this.renderPresetList()}
            {this.renderPlayerGrid()}
          </motion.div>
        )}
      </div>
    );
  }
}

export default SquadPresets;

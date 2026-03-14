import React, { Component } from 'react';
import { motion } from 'framer-motion';
import FormationPitch from '../../../components/shared/FormationPitch';
import PlayerFIFACard from '../../../components/shared/PlayerFIFACard';
import supabase from '../../../services/supabase';
import { getUpcomingMatches, getInvitationsForEvent } from '../../../services/schedulingService';
import { createBulkNotifications } from '../../../services/notificationService';

/**
 * Common formations shown as quick-select buttons
 */
const COMMON_FORMATIONS = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'];

/**
 * Position compatibility map (mirrors FormationPitch)
 */
const SLOT_POSITIONS = {
  GK: ['GK'],
  LB: ['LB', 'LWB'],
  CB1: ['CB'], CB2: ['CB'], CB3: ['CB'],
  RB: ['RB', 'RWB'],
  LWB: ['LWB', 'LB', 'LM'],
  RWB: ['RWB', 'RB', 'RM'],
  CDM: ['CDM', 'CM'], CDM1: ['CDM', 'CM'], CDM2: ['CDM', 'CM'],
  CM: ['CM', 'CDM', 'CAM'], CM1: ['CM', 'CDM', 'CAM'], CM2: ['CM', 'CDM', 'CAM'],
  LM: ['LM', 'LW', 'CM'],
  RM: ['RM', 'RW', 'CM'],
  CAM: ['CAM', 'CM', 'CF'], CAM1: ['CAM', 'CM', 'LW'], CAM2: ['CAM', 'CM', 'RW'],
  LW: ['LW', 'LM', 'ST'],
  RW: ['RW', 'RM', 'ST'],
  ST: ['ST', 'CF', 'CAM'],
  ST1: ['ST', 'CF'], ST2: ['ST', 'CF'],
};

const getSlotDisplayPosition = (slotName) => slotName.replace(/[0-9]/g, '');

/**
 * FormationBuilder - Visual pitch editor wired to real match data,
 * save/publish to the formations table, and player notifications.
 */
class FormationBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Match data
      matches: [],
      selectedMatchId: '',
      selectedMatch: null,
      loadingMatches: true,

      // Players accepted for this match
      matchPlayers: [],
      loadingPlayers: false,

      // Formation state
      selectedFormation: '4-4-2',
      placedPlayers: {},
      draggedPlayer: null,
      existingFormationId: null,

      // Mobile selection
      selectingForSlot: null,
      showAllPlayers: false,

      // UI
      isSaving: false,
      isPublishing: false,
      saveMessage: null,
    };
  }

  componentDidMount() {
    this.fetchMatches();
  }

  // ─── Data Fetching ──────────────────────────────────────────────────

  fetchMatches = async () => {
    try {
      const matches = await getUpcomingMatches();
      this.setState({ matches, loadingMatches: false });
    } catch (error) {
      console.error('Error fetching matches:', error);
      this.setState({ matches: [], loadingMatches: false });
    }
  };

  handleMatchSelect = async (e) => {
    const matchId = e.target.value;
    if (!matchId) {
      this.setState({
        selectedMatchId: '',
        selectedMatch: null,
        matchPlayers: [],
        placedPlayers: {},
        existingFormationId: null,
        selectedFormation: '4-4-2',
        saveMessage: null,
      });
      return;
    }

    const match = this.state.matches.find((m) => m.id === matchId);
    this.setState({
      selectedMatchId: matchId,
      selectedMatch: match,
      loadingPlayers: true,
      placedPlayers: {},
      existingFormationId: null,
      saveMessage: null,
    });

    try {
      // Fetch accepted players and existing formation in parallel
      const [invitations, formationResult] = await Promise.all([
        getInvitationsForEvent('match', matchId),
        supabase
          .from('formations')
          .select('*')
          .eq('match_id', matchId)
          .order('updated_at', { ascending: false })
          .limit(1),
      ]);

      const accepted = invitations.filter((inv) => inv.status === 'accepted');

      // Build enriched player list from accepted invitations
      let enrichedPlayers = [];
      if (accepted.length > 0) {
        const userIds = accepted.map((inv) => inv.player_id);
        const { data: playersData } = await supabase
          .from('players_with_profiles')
          .select('*')
          .in('user_id', userIds);

        enrichedPlayers = accepted
          .map((inv) => {
            const playerRecord = (playersData || []).find(
              (p) => p.user_id === inv.player_id
            );
            if (!playerRecord) return null;
            return {
              ...playerRecord,
              name: playerRecord.name || inv.profiles?.full_name || 'Unknown',
              number: playerRecord.number || playerRecord.jersey_number,
            };
          })
          .filter(Boolean);
      }

      // Restore existing formation if one exists
      const existingFormation = formationResult.data?.[0];
      let restoredPlacedPlayers = {};
      let restoredFormationType = '4-4-2';
      let existingFormationId = null;

      if (existingFormation) {
        existingFormationId = existingFormation.id;
        restoredFormationType = existingFormation.formation_type || '4-4-2';
        const positions = existingFormation.positions || [];

        // Rebuild placedPlayers from saved positions
        positions.forEach((pos) => {
          const player = enrichedPlayers.find((p) => p.id === pos.player_id);
          if (player) {
            restoredPlacedPlayers[pos.slot] = {
              player,
              activePosition: pos.active_position || null,
              isCompatible: this.isPlayerCompatible(player, pos.slot),
            };
          }
        });
      }

      this.setState({
        matchPlayers: enrichedPlayers,
        loadingPlayers: false,
        selectedFormation: restoredFormationType,
        placedPlayers: restoredPlacedPlayers,
        existingFormationId,
      });
    } catch (error) {
      console.error('Error loading match data:', error);
      this.setState({ loadingPlayers: false, matchPlayers: [] });
    }
  };

  // ─── Formation Logic ────────────────────────────────────────────────

  isPlayerCompatible = (player, slotName) => {
    if (!player) return false;
    const validPositions = SLOT_POSITIONS[slotName] || [getSlotDisplayPosition(slotName)];
    const playerPositions = [player.position, ...(player.alternate_positions || [])];
    return validPositions.some((pos) => playerPositions.includes(pos));
  };

  getActivePosition = (player, slotName) => {
    if (!player) return null;
    const validPositions = SLOT_POSITIONS[slotName] || [getSlotDisplayPosition(slotName)];
    const playerPositions = [player.position, ...(player.alternate_positions || [])];

    for (const validPos of validPositions) {
      if (playerPositions.includes(validPos)) {
        if (player.position === validPos) return null;
        return validPos;
      }
    }
    return getSlotDisplayPosition(slotName);
  };

  handleFormationChange = (formation) => {
    this.setState({
      selectedFormation: formation,
      placedPlayers: {},
    });
  };

  handlePlayerPlaced = (slotName, player, activePosition) => {
    const isCompatible = this.isPlayerCompatible(player, slotName);
    this.setState((prevState) => ({
      placedPlayers: {
        ...prevState.placedPlayers,
        [slotName]: { player, activePosition, isCompatible },
      },
    }));
  };

  handlePlayerRemoved = (slotName) => {
    this.setState((prevState) => {
      const newPlacedPlayers = { ...prevState.placedPlayers };
      delete newPlacedPlayers[slotName];
      return { placedPlayers: newPlacedPlayers };
    });
  };

  handleDragStart = (player) => {
    this.setState({ draggedPlayer: player });
  };

  handleDragEnd = () => {
    this.setState({ draggedPlayer: null });
  };

  handleClearFormation = () => {
    this.setState({ placedPlayers: {} });
  };

  getPlacedPlayerIds = () => {
    const { placedPlayers } = this.state;
    return Object.values(placedPlayers).map((data) => data.player.id);
  };

  // ─── Mobile Slot Click ──────────────────────────────────────────────

  handleSlotClick = (slotName) => {
    this.setState({
      selectingForSlot: slotName,
      showAllPlayers: false,
    });
  };

  handleSelectPlayer = (player) => {
    const { selectingForSlot } = this.state;
    if (!selectingForSlot) return;

    const activePosition = this.getActivePosition(player, selectingForSlot);
    const isCompatible = this.isPlayerCompatible(player, selectingForSlot);

    this.setState((prevState) => ({
      placedPlayers: {
        ...prevState.placedPlayers,
        [selectingForSlot]: { player, activePosition, isCompatible },
      },
      selectingForSlot: null,
      showAllPlayers: false,
    }));
  };

  handleCloseSelection = () => {
    this.setState({ selectingForSlot: null, showAllPlayers: false });
  };

  getSuggestedPlayers = (slotName) => {
    const { matchPlayers } = this.state;
    const placedIds = this.getPlacedPlayerIds();
    return matchPlayers.filter((player) => {
      if (placedIds.includes(player.id)) return false;
      return this.isPlayerCompatible(player, slotName);
    });
  };

  getAvailablePlayers = () => {
    const { matchPlayers } = this.state;
    const placedIds = this.getPlacedPlayerIds();
    return matchPlayers.filter((player) => !placedIds.includes(player.id));
  };

  // ─── Serialize placedPlayers for DB ─────────────────────────────────

  serializePositions = () => {
    const { placedPlayers } = this.state;
    return Object.entries(placedPlayers).map(([slot, data]) => ({
      slot,
      player_id: data.player.id,
      active_position: data.activePosition || null,
    }));
  };

  // ─── Save / Publish ─────────────────────────────────────────────────

  handleSave = async () => {
    this.setState({ isSaving: true, saveMessage: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const {
        selectedMatchId,
        selectedFormation,
        existingFormationId,
      } = this.state;

      const positions = this.serializePositions();

      const payload = {
        match_id: selectedMatchId,
        formation_type: selectedFormation,
        positions,
        created_by: user.id,
        published: false,
      };

      if (existingFormationId) {
        payload.id = existingFormationId;
      }

      const { data, error } = await supabase
        .from('formations')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      this.setState({
        isSaving: false,
        existingFormationId: data.id,
        saveMessage: { type: 'success', text: 'Formation saved successfully!' },
      });
    } catch (error) {
      console.error('Error saving formation:', error);
      this.setState({
        isSaving: false,
        saveMessage: { type: 'error', text: 'Failed to save formation.' },
      });
    }

    setTimeout(() => this.setState({ saveMessage: null }), 3000);
  };

  handlePublish = async () => {
    this.setState({ isPublishing: true, saveMessage: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const {
        selectedMatchId,
        selectedFormation,
        selectedMatch,
        existingFormationId,
        matchPlayers,
      } = this.state;

      const positions = this.serializePositions();

      const payload = {
        match_id: selectedMatchId,
        formation_type: selectedFormation,
        positions,
        created_by: user.id,
        published: true,
        published_at: new Date().toISOString(),
      };

      if (existingFormationId) {
        payload.id = existingFormationId;
      }

      const { data, error } = await supabase
        .from('formations')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      // Notify all match players
      const playerUserIds = matchPlayers.map((p) => p.user_id).filter(Boolean);
      if (playerUserIds.length > 0) {
        const opponent = selectedMatch?.opponent || 'opponent';
        await createBulkNotifications(playerUserIds, {
          title: 'Formation Published',
          body: `Formation published for match vs ${opponent}`,
          type: 'formation_published',
          referenceType: 'match',
          referenceId: selectedMatchId,
        });
      }

      this.setState({
        isPublishing: false,
        existingFormationId: data.id,
        saveMessage: { type: 'success', text: 'Formation published and players notified!' },
      });
    } catch (error) {
      console.error('Error publishing formation:', error);
      this.setState({
        isPublishing: false,
        saveMessage: { type: 'error', text: 'Failed to publish formation.' },
      });
    }

    setTimeout(() => this.setState({ saveMessage: null }), 3000);
  };

  // ─── Date Formatting ────────────────────────────────────────────────

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // ─── Sidebar Drag Helpers ───────────────────────────────────────────

  handleSidebarDragStart = (e, player) => {
    e.dataTransfer.setData('playerId', player.id);
    e.dataTransfer.effectAllowed = 'move';
    this.handleDragStart(player);

    const card = e.target.closest('.player-sidebar-card');
    if (card) {
      e.dataTransfer.setDragImage(card, 30, 40);
    }
  };

  // ─── Render: Player Selection Modal (mobile) ───────────────────────

  renderPlayerSelectionModal = () => {
    const { selectingForSlot, showAllPlayers, placedPlayers } = this.state;
    if (!selectingForSlot) return null;

    const displayPos = getSlotDisplayPosition(selectingForSlot);
    const suggestedPlayers = this.getSuggestedPlayers(selectingForSlot);
    const allAvailable = this.getAvailablePlayers();
    const currentPlayer = placedPlayers[selectingForSlot]?.player;
    const playersToShow = showAllPlayers ? allAvailable : suggestedPlayers;

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-dark-elevated rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Select Player</h3>
              <p className="text-sm text-gray-400">Position: {displayPos}</p>
            </div>
            <button
              onClick={this.handleCloseSelection}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              x
            </button>
          </div>

          {/* Current player */}
          {currentPlayer && (
            <div className="p-3 border-b border-white/10 bg-white/5">
              <p className="text-xs text-gray-400 mb-2">Current Player</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold font-bold text-xs">
                    {currentPlayer.position}
                  </div>
                  <span className="text-white font-medium">{currentPlayer.name}</span>
                </div>
                <button
                  onClick={(ev) => {
                    ev.stopPropagation();
                    this.handlePlayerRemoved(selectingForSlot);
                    this.handleCloseSelection();
                  }}
                  className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Toggle buttons */}
          <div className="p-3 flex gap-2">
            <button
              onClick={() => this.setState({ showAllPlayers: false })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                !showAllPlayers
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              Suggested ({suggestedPlayers.length})
            </button>
            <button
              onClick={() => this.setState({ showAllPlayers: true })}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                showAllPlayers
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-gray-400 hover:text-white'
              }`}
            >
              All Players ({allAvailable.length})
            </button>
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {playersToShow.length === 0 ? (
              <p className="text-center text-gray-400 py-8">
                {showAllPlayers ? 'All players are on the field' : 'No suggested players available'}
              </p>
            ) : (
              playersToShow.map((player) => {
                const isCompatible = this.isPlayerCompatible(player, selectingForSlot);
                return (
                  <button
                    key={player.id}
                    onClick={() => this.handleSelectPlayer(player)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isCompatible ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {player.position}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{player.name}</p>
                      <p className="text-xs text-gray-400">#{player.number}</p>
                    </div>
                    {!isCompatible && (
                      <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                        Out of position
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ─── Render: Player Sidebar ─────────────────────────────────────────

  renderPlayerSidebar = () => {
    const { matchPlayers, placedPlayers, draggedPlayer } = this.state;
    const placedIds = this.getPlacedPlayerIds();

    if (matchPlayers.length === 0) {
      return (
        <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center text-center">
          <svg className="w-12 h-12 text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-gray-400 text-sm">No players accepted this match yet.</p>
        </div>
      );
    }

    return (
      <div className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-display font-bold text-white">
            Available Players
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Drag onto pitch or tap positions
          </p>
        </div>
        <div className="p-3 overflow-y-auto max-h-[500px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-3">
          {matchPlayers.map((player) => {
            const isPlaced = placedIds.includes(player.id);
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`player-sidebar-card flex flex-col items-center ${
                  isPlaced ? 'opacity-30 pointer-events-none' : ''
                }`}
                draggable={!isPlaced}
                onDragStart={(e) => !isPlaced && this.handleSidebarDragStart(e, player)}
                onDragEnd={this.handleDragEnd}
              >
                <div className={`${isPlaced ? '' : 'cursor-grab active:cursor-grabbing'}`}>
                  <PlayerFIFACard
                    player={player}
                    size="xs"
                    showStats={false}
                    showSkillsAndWF={false}
                  />
                </div>
                <p className="text-[10px] text-white/60 text-center mt-1 truncate w-full">
                  {player.name?.split(' ').pop()}
                </p>
              </motion.div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-white/10 text-xs text-white/40">
          {matchPlayers.length - placedIds.length} of {matchPlayers.length} available
        </div>
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────

  render() {
    const {
      matches,
      selectedMatchId,
      selectedMatch,
      loadingMatches,
      loadingPlayers,
      matchPlayers,
      selectedFormation,
      placedPlayers,
      isSaving,
      isPublishing,
      saveMessage,
    } = this.state;

    const placedCount = Object.keys(placedPlayers).length;

    // ── Loading state ──
    if (loadingMatches) {
      return (
        <div className="flex items-center justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-accent-gold border-t-transparent rounded-full"
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-display font-bold text-white">
            Formation Builder
          </h2>
          <p className="text-gray-400 mt-1">
            Select a match, choose a formation, and assign players
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              saveMessage.type === 'success'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {saveMessage.text}
          </motion.div>
        )}

        {/* Match Selector */}
        <div className="bg-surface-dark-elevated rounded-xl p-4 border border-white/10">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Match
          </label>
          {matches.length === 0 ? (
            <div className="text-center py-6">
              <svg className="w-10 h-10 mx-auto text-white/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">No upcoming matches. Schedule a match first.</p>
            </div>
          ) : (
            <select
              value={selectedMatchId}
              onChange={this.handleMatchSelect}
              className="w-full px-4 py-3 bg-surface-dark border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-accent-gold focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">Select a match...</option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  vs {match.opponent} — {this.formatDate(match.match_date)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Everything below requires a match to be selected */}
        {selectedMatchId && (
          <>
            {/* Formation Type Selector */}
            <div className="bg-surface-dark-elevated rounded-xl p-4 border border-white/10">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Formation
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_FORMATIONS.map((formation) => (
                  <button
                    key={formation}
                    onClick={() => this.handleFormationChange(formation)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      selectedFormation === formation
                        ? 'bg-accent-gold text-black'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {formation}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading players spinner */}
            {loadingPlayers && (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 border-4 border-accent-gold border-t-transparent rounded-full"
                />
              </div>
            )}

            {/* Pitch + Sidebar Layout */}
            {!loadingPlayers && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Pitch (2/3) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-surface-dark-elevated rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-display font-bold text-white">
                          {selectedFormation} Formation
                        </h3>
                        <p className="text-sm text-gray-400">
                          vs {selectedMatch?.opponent} — {placedCount}/11 players placed
                        </p>
                      </div>
                      {placedCount > 0 && (
                        <button
                          onClick={this.handleClearFormation}
                          className="px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <FormationPitch
                      formation={selectedFormation}
                      placedPlayers={placedPlayers}
                      draggedPlayer={this.state.draggedPlayer}
                      players={matchPlayers}
                      onPlayerPlaced={this.handlePlayerPlaced}
                      onPlayerRemoved={this.handlePlayerRemoved}
                      onSlotClick={this.handleSlotClick}
                      className="max-w-lg mx-auto"
                    />

                    <p className="text-center text-sm text-gray-500 mt-4">
                      Tap a position to assign a player
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Save */}
                    <button
                      onClick={this.handleSave}
                      disabled={isSaving || isPublishing || placedCount === 0}
                      className="flex-1 px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Save Formation
                        </>
                      )}
                    </button>

                    {/* Publish */}
                    <button
                      onClick={this.handlePublish}
                      disabled={isSaving || isPublishing || placedCount === 0}
                      className="flex-1 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isPublishing ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Publish Formation
                        </>
                      )}
                    </button>

                    {/* Clear */}
                    <button
                      onClick={this.handleClearFormation}
                      disabled={placedCount === 0}
                      className="px-6 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>

                {/* Right: Player Sidebar (1/3) */}
                <div className="lg:col-span-1">
                  {this.renderPlayerSidebar()}
                </div>
              </div>
            )}
          </>
        )}

        {/* Player Selection Modal (Mobile) */}
        {this.renderPlayerSelectionModal()}
      </div>
    );
  }
}

export default FormationBuilder;

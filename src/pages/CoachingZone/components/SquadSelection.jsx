import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../../../services/supabase';
import PlayerFIFACard from '../../../components/shared/PlayerFIFACard';
import liveData from '../../../data/league-live.json';

/**
 * Position group mapping for filter buttons
 */
const POSITION_GROUPS = {
  GK: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'FWD', RW: 'FWD', CF: 'FWD', ST: 'FWD',
  // Scraped positions map directly
  DEF: 'DEF', MID: 'MID', FWD: 'FWD',
};

const FILTER_OPTIONS = ['All', 'GK', 'DEF', 'MID', 'FWD'];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'overall', label: 'Overall Rating' },
  { value: 'goals', label: 'Goals' },
  { value: 'position', label: 'Position' },
];

/**
 * Outfield stat keys and labels
 */
const OUTFIELD_STATS = [
  { key: 'pace', label: 'PAC' },
  { key: 'shooting', label: 'SHO' },
  { key: 'passing', label: 'PAS' },
  { key: 'dribbling', label: 'DRI' },
  { key: 'defending', label: 'DEF' },
  { key: 'physical', label: 'PHY' },
];

const GK_STATS = [
  { key: 'diving', label: 'DIV' },
  { key: 'handling', label: 'HAN' },
  { key: 'kicking', label: 'KIC' },
  { key: 'reflexes', label: 'REF' },
  { key: 'speed', label: 'SPD' },
  { key: 'positioning', label: 'POS' },
];

/**
 * Calculate overall rating from stats object
 */
const calculateOverall = (stats, position) => {
  if (!stats) return 50;
  if (position === 'GK') {
    const { diving = 50, handling = 50, kicking = 50, reflexes = 50, speed = 50, positioning = 50 } = stats;
    return Math.round((diving + handling + kicking + reflexes + speed + positioning) / 6);
  }
  const { pace = 50, shooting = 50, passing = 50, dribbling = 50, defending = 50, physical = 50 } = stats;
  return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
};

/**
 * Fuzzy name matching: checks if scraped name is contained in DB name or vice versa
 */
const namesMatch = (dbName, scrapedName) => {
  if (!dbName || !scrapedName) return false;
  const a = dbName.toLowerCase().trim();
  const b = scrapedName.toLowerCase().trim();
  if (a === b) return true;
  // Check if one name contains the other
  if (a.includes(b) || b.includes(a)) return true;
  // Check if last names match
  const aLast = a.split(' ').pop();
  const bLast = b.split(' ').pop();
  if (aLast.length > 2 && bLast.length > 2 && aLast === bLast) return true;
  // Check if first names match when one has only first name
  const aFirst = a.split(' ')[0];
  const bFirst = b.split(' ')[0];
  if (a.split(' ').length === 1 && aFirst === bFirst) return true;
  if (b.split(' ').length === 1 && bFirst === aFirst) return true;
  return false;
};

/**
 * SquadSelection - View and manage squad players with real data from Supabase
 * Coach functionality: edit player stats, add match stats
 */
class SquadSelection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
      scrapedSquad: liveData.kaboonaSquad || [],
      isLoading: true,
      error: null,
      filterPosition: 'All',
      searchQuery: '',
      sortBy: 'name',
      // Edit modal state
      editModalOpen: false,
      editingPlayer: null,
      editForm: {},
      isSaving: false,
      saveMessage: null,
      // Add match stats state
      matchStatsForm: { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, minutes_played: 0 },
      isAddingStats: false,
      addStatsMessage: null,
    };
  }

  componentDidMount() {
    this.fetchPlayers();
  }

  fetchPlayers = async () => {
    this.setState({ isLoading: true, error: null });
    try {
      // Fetch players with profiles and aggregated stats
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select(`
          id,
          user_id,
          name,
          jersey_number,
          position,
          alternate_positions,
          country,
          country_name,
          bio,
          image,
          height,
          weight,
          age,
          preferred_foot,
          weak_foot_rating,
          skill_moves,
          pace,
          shooting,
          passing,
          dribbling,
          defending,
          physical,
          diving,
          handling,
          kicking,
          reflexes,
          gk_speed,
          gk_positioning,
          is_retired,
          is_alumni,
          card_background_image_url,
          profiles:user_id (
            full_name,
            profile_image_url,
            email
          )
        `)
        .eq('is_retired', false)
        .eq('is_alumni', false);

      if (playersError) throw playersError;

      // Fetch aggregated player_stats for all players
      const playerIds = (playersData || []).map(p => p.id);
      let statsMap = {};

      if (playerIds.length > 0) {
        const { data: statsData, error: statsError } = await supabase
          .from('player_stats')
          .select('player_id, goals, assists, yellow_cards, red_cards, minutes_played');

        if (!statsError && statsData) {
          // Aggregate stats per player
          statsData.forEach(stat => {
            if (!statsMap[stat.player_id]) {
              statsMap[stat.player_id] = { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, matches: 0, minutes_played: 0 };
            }
            statsMap[stat.player_id].goals += stat.goals || 0;
            statsMap[stat.player_id].assists += stat.assists || 0;
            statsMap[stat.player_id].yellow_cards += stat.yellow_cards || 0;
            statsMap[stat.player_id].red_cards += stat.red_cards || 0;
            statsMap[stat.player_id].minutes_played += stat.minutes_played || 0;
            statsMap[stat.player_id].matches += 1;
          });
        }
      }

      // Build player objects with merged data
      const scrapedSquad = liveData.kaboonaSquad || [];
      const players = (playersData || []).map(p => {
        const displayName = p.name || (p.profiles && p.profiles.full_name) || 'Unknown Player';
        const displayImage = p.image || p.card_background_image_url || (p.profiles && p.profiles.profile_image_url) || null;
        const position = p.position || 'ST';
        const isGK = position === 'GK';

        const stats = isGK
          ? {
              diving: p.diving || 50,
              handling: p.handling || 50,
              kicking: p.kicking || 50,
              reflexes: p.reflexes || 50,
              speed: p.gk_speed || 50,
              positioning: p.gk_positioning || 50,
            }
          : {
              pace: p.pace || 50,
              shooting: p.shooting || 50,
              passing: p.passing || 50,
              dribbling: p.dribbling || 50,
              defending: p.defending || 50,
              physical: p.physical || 50,
            };

        const overall = calculateOverall(stats, position);
        const seasonStats = statsMap[p.id] || { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, matches: 0, minutes_played: 0 };

        // Try to match with scraped data
        const scrapedMatch = scrapedSquad.find(s => namesMatch(displayName, s.name));

        return {
          id: p.id,
          user_id: p.user_id,
          name: displayName,
          number: p.jersey_number || 0,
          position: position,
          alternate_positions: p.alternate_positions || [],
          country: p.country || 'my',
          countryName: p.country_name || '',
          image: displayImage,
          bio: p.bio,
          age: p.age,
          height: p.height,
          weight: p.weight,
          foot: p.preferred_foot || 'right',
          skill_moves: p.skill_moves || 3,
          weak_foot: p.weak_foot_rating || 3,
          stats: stats,
          overall: overall,
          seasonStats: seasonStats,
          scrapedData: scrapedMatch || null,
          // Raw DB values for edit form
          _raw: {
            pace: p.pace, shooting: p.shooting, passing: p.passing,
            dribbling: p.dribbling, defending: p.defending, physical: p.physical,
            diving: p.diving, handling: p.handling, kicking: p.kicking,
            reflexes: p.reflexes, gk_speed: p.gk_speed, gk_positioning: p.gk_positioning,
          },
        };
      });

      this.setState({ players, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch squad data:', err);
      this.setState({ error: err.message, isLoading: false });
    }
  };

  handleFilterChange = (filter) => {
    this.setState({ filterPosition: filter });
  };

  handleSearchChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  handleSortChange = (e) => {
    this.setState({ sortBy: e.target.value });
  };

  getFilteredPlayers = () => {
    const { players, filterPosition, searchQuery, sortBy } = this.state;
    let filtered = [...players];

    // Filter by position group
    if (filterPosition !== 'All') {
      filtered = filtered.filter(p => {
        const group = POSITION_GROUPS[p.position] || 'FWD';
        return group === filterPosition;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        String(p.number).includes(q)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'overall':
          return b.overall - a.overall;
        case 'goals':
          return (b.seasonStats.goals + (b.scrapedData ? b.scrapedData.goals : 0))
            - (a.seasonStats.goals + (a.scrapedData ? a.scrapedData.goals : 0));
        case 'position': {
          const order = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
          const aGroup = order[POSITION_GROUPS[a.position]] || 3;
          const bGroup = order[POSITION_GROUPS[b.position]] || 3;
          return aGroup - bGroup || a.name.localeCompare(b.name);
        }
        default:
          return 0;
      }
    });

    return filtered;
  };

  // ─── Edit Modal ──────────────────────────────────────────────────────

  openEditModal = (player) => {
    const isGK = player.position === 'GK';
    const editForm = {
      position: player.position,
      jersey_number: player.number,
      ...(isGK
        ? {
            diving: player._raw.diving || 50,
            handling: player._raw.handling || 50,
            kicking: player._raw.kicking || 50,
            reflexes: player._raw.reflexes || 50,
            gk_speed: player._raw.gk_speed || 50,
            gk_positioning: player._raw.gk_positioning || 50,
          }
        : {
            pace: player._raw.pace || 50,
            shooting: player._raw.shooting || 50,
            passing: player._raw.passing || 50,
            dribbling: player._raw.dribbling || 50,
            defending: player._raw.defending || 50,
            physical: player._raw.physical || 50,
          }),
    };

    this.setState({
      editModalOpen: true,
      editingPlayer: player,
      editForm,
      saveMessage: null,
      matchStatsForm: { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, minutes_played: 0 },
      addStatsMessage: null,
    });
  };

  closeEditModal = () => {
    this.setState({
      editModalOpen: false,
      editingPlayer: null,
      editForm: {},
      saveMessage: null,
      addStatsMessage: null,
    });
  };

  handleEditFormChange = (field, value) => {
    this.setState(prev => {
      const editForm = { ...prev.editForm, [field]: value };

      // If position changed between GK and outfield, reset stats
      if (field === 'position') {
        const wasGK = prev.editForm.position === 'GK';
        const isGK = value === 'GK';
        if (wasGK !== isGK) {
          if (isGK) {
            editForm.diving = 50;
            editForm.handling = 50;
            editForm.kicking = 50;
            editForm.reflexes = 50;
            editForm.gk_speed = 50;
            editForm.gk_positioning = 50;
            delete editForm.pace;
            delete editForm.shooting;
            delete editForm.passing;
            delete editForm.dribbling;
            delete editForm.defending;
            delete editForm.physical;
          } else {
            editForm.pace = 50;
            editForm.shooting = 50;
            editForm.passing = 50;
            editForm.dribbling = 50;
            editForm.defending = 50;
            editForm.physical = 50;
            delete editForm.diving;
            delete editForm.handling;
            delete editForm.kicking;
            delete editForm.reflexes;
            delete editForm.gk_speed;
            delete editForm.gk_positioning;
          }
        }
      }

      return { editForm };
    });
  };

  handleMatchStatsChange = (field, value) => {
    this.setState(prev => ({
      matchStatsForm: { ...prev.matchStatsForm, [field]: parseInt(value, 10) || 0 },
    }));
  };

  handleSavePlayer = async () => {
    const { editingPlayer, editForm } = this.state;
    if (!editingPlayer) return;

    this.setState({ isSaving: true, saveMessage: null });
    try {
      const isGK = editForm.position === 'GK';
      const updateData = {
        position: editForm.position,
        jersey_number: editForm.jersey_number,
      };

      if (isGK) {
        updateData.diving = editForm.diving;
        updateData.handling = editForm.handling;
        updateData.kicking = editForm.kicking;
        updateData.reflexes = editForm.reflexes;
        updateData.gk_speed = editForm.gk_speed;
        updateData.gk_positioning = editForm.gk_positioning;
      } else {
        updateData.pace = editForm.pace;
        updateData.shooting = editForm.shooting;
        updateData.passing = editForm.passing;
        updateData.dribbling = editForm.dribbling;
        updateData.defending = editForm.defending;
        updateData.physical = editForm.physical;
      }

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', editingPlayer.id);

      if (error) throw error;

      this.setState({
        isSaving: false,
        saveMessage: { type: 'success', text: 'Player updated successfully!' },
      });

      // Refresh data
      await this.fetchPlayers();
    } catch (err) {
      console.error('Failed to save player:', err);
      this.setState({
        isSaving: false,
        saveMessage: { type: 'error', text: 'Failed to save: ' + err.message },
      });
    }
  };

  handleAddMatchStats = async () => {
    const { editingPlayer, matchStatsForm } = this.state;
    if (!editingPlayer) return;

    this.setState({ isAddingStats: true, addStatsMessage: null });
    try {
      // Insert into player_stats without a match_id (quick-add)
      // We need a match_id; if none exists, create a placeholder
      // For quick-add we'll use a "manual entry" approach
      const { error } = await supabase
        .from('player_stats')
        .insert({
          player_id: editingPlayer.id,
          goals: matchStatsForm.goals,
          assists: matchStatsForm.assists,
          yellow_cards: matchStatsForm.yellow_cards,
          red_cards: matchStatsForm.red_cards,
          minutes_played: matchStatsForm.minutes_played,
        });

      if (error) throw error;

      this.setState({
        isAddingStats: false,
        addStatsMessage: { type: 'success', text: 'Match stats added!' },
        matchStatsForm: { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0, minutes_played: 0 },
      });

      // Refresh data
      await this.fetchPlayers();
    } catch (err) {
      console.error('Failed to add match stats:', err);
      this.setState({
        isAddingStats: false,
        addStatsMessage: { type: 'error', text: 'Failed to add stats: ' + err.message },
      });
    }
  };

  // ─── Preview player for modal (live updating) ────────────────────────

  getPreviewPlayer = () => {
    const { editingPlayer, editForm } = this.state;
    if (!editingPlayer) return null;

    const isGK = editForm.position === 'GK';
    const stats = isGK
      ? {
          diving: editForm.diving || 50,
          handling: editForm.handling || 50,
          kicking: editForm.kicking || 50,
          reflexes: editForm.reflexes || 50,
          speed: editForm.gk_speed || 50,
          positioning: editForm.gk_positioning || 50,
        }
      : {
          pace: editForm.pace || 50,
          shooting: editForm.shooting || 50,
          passing: editForm.passing || 50,
          dribbling: editForm.dribbling || 50,
          defending: editForm.defending || 50,
          physical: editForm.physical || 50,
        };

    return {
      ...editingPlayer,
      position: editForm.position,
      number: editForm.jersey_number,
      stats: stats,
      overall: calculateOverall(stats, editForm.position),
    };
  };

  // ─── Scraped fallback cards ──────────────────────────────────────────

  renderScrapedFallback = () => {
    const { scrapedSquad, filterPosition, searchQuery, sortBy } = this.state;
    let filtered = [...scrapedSquad];

    if (filterPosition !== 'All') {
      filtered = filtered.filter(p => p.position === filterPosition);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'goals': return b.goals - a.goals;
        case 'position': {
          const order = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
          return (order[a.position] || 3) - (order[b.position] || 3);
        }
        default: return a.name.localeCompare(b.name);
      }
    });

    return (
      <div>
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
          Showing scraped squad data from AGD Sports (read-only). No registered players found in the database.
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((player, idx) => (
            <motion.div
              key={player.name + '-' + idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex flex-col items-center"
            >
              <PlayerFIFACard
                name={player.name}
                position={player.position}
                number={idx + 1}
                country="my"
                size="sm"
                stats={
                  player.position === 'GK'
                    ? { diving: 50, handling: 50, kicking: 50, reflexes: 50, speed: 50, positioning: 50 }
                    : { pace: 50, shooting: 50, passing: 50, dribbling: 50, defending: 50, physical: 50 }
                }
                showSkillsAndWF={false}
                onClick={() => {}}
              />
              {/* Scraped stats badges */}
              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">
                  Age: {player.age}
                </span>
                {player.goals > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                    {player.goals}G
                  </span>
                )}
                {player.assists > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    {player.assists}A
                  </span>
                )}
                {player.yellowCards > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                    {player.yellowCards}Y
                  </span>
                )}
                {player.redCards > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                    {player.redCards}R
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-12">No players match your filters.</p>
        )}
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────

  renderStatSlider = (label, field, value) => {
    const getColor = (v) => {
      if (v >= 80) return '#4ade80';
      if (v >= 60) return '#facc15';
      if (v >= 40) return '#fb923c';
      return '#ef4444';
    };

    return (
      <div key={field} className="flex items-center gap-3">
        <span className="w-10 text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <input
          type="range"
          min="1"
          max="99"
          value={value}
          onChange={(e) => this.handleEditFormChange(field, parseInt(e.target.value, 10))}
          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${getColor(value)} 0%, ${getColor(value)} ${value}%, #333 ${value}%, #333 100%)`,
          }}
        />
        <span className="w-8 text-right text-sm font-bold" style={{ color: getColor(value) }}>
          {value}
        </span>
      </div>
    );
  };

  renderEditModal = () => {
    const { editModalOpen, editForm, isSaving, saveMessage, matchStatsForm, isAddingStats, addStatsMessage, editingPlayer } = this.state;
    if (!editModalOpen || !editingPlayer) return null;

    const previewPlayer = this.getPreviewPlayer();
    const isGK = editForm.position === 'GK';
    const statDefs = isGK ? GK_STATS : OUTFIELD_STATS;

    // Map stat defs to edit form fields
    const statFieldMap = isGK
      ? { diving: 'diving', handling: 'handling', kicking: 'kicking', reflexes: 'reflexes', speed: 'gk_speed', positioning: 'gk_positioning' }
      : { pace: 'pace', shooting: 'shooting', passing: 'passing', dribbling: 'dribbling', defending: 'defending', physical: 'physical' };

    const allPositions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'];

    return (
      <AnimatePresence>
        <motion.div
          key="edit-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) this.closeEditModal(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="bg-surface-dark-elevated rounded-2xl border border-white/10 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <h3 className="text-xl font-display font-bold text-white">
                Edit Player: {editingPlayer.name}
              </h3>
              <button
                onClick={this.closeEditModal}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: FIFA Card Preview */}
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Live Preview</span>
                  {previewPlayer && (
                    <PlayerFIFACard
                      player={previewPlayer}
                      size="sm"
                      showSkillsAndWF={false}
                      onClick={() => {}}
                    />
                  )}
                </div>

                {/* Right: Edit Form */}
                <div className="flex-1 space-y-5">
                  {/* Position & Jersey Number */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Position</label>
                      <select
                        value={editForm.position}
                        onChange={(e) => this.handleEditFormChange('position', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-gold/50"
                      >
                        {allPositions.map(pos => (
                          <option key={pos} value={pos} className="bg-surface-dark">{pos}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Jersey #</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={editForm.jersey_number || ''}
                        onChange={(e) => this.handleEditFormChange('jersey_number', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-gold/50"
                      />
                    </div>
                  </div>

                  {/* Stat Sliders */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      {isGK ? 'Goalkeeper Stats' : 'Outfield Stats'}
                    </h4>
                    <div className="space-y-3">
                      {statDefs.map(({ key, label }) => {
                        const formField = statFieldMap[key];
                        return this.renderStatSlider(label, formField, editForm[formField] || 50);
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={this.handleSavePlayer}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    {saveMessage && (
                      <span className={`text-sm ${saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {saveMessage.text}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10 pt-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Quick Add Match Stats
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Goals</label>
                        <input
                          type="number"
                          min="0"
                          value={matchStatsForm.goals}
                          onChange={(e) => this.handleMatchStatsChange('goals', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Assists</label>
                        <input
                          type="number"
                          min="0"
                          value={matchStatsForm.assists}
                          onChange={(e) => this.handleMatchStatsChange('assists', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Yellow Cards</label>
                        <input
                          type="number"
                          min="0"
                          value={matchStatsForm.yellow_cards}
                          onChange={(e) => this.handleMatchStatsChange('yellow_cards', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-yellow-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Red Cards</label>
                        <input
                          type="number"
                          min="0"
                          value={matchStatsForm.red_cards}
                          onChange={(e) => this.handleMatchStatsChange('red_cards', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Minutes Played</label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={matchStatsForm.minutes_played}
                          onChange={(e) => this.handleMatchStatsChange('minutes_played', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={this.handleAddMatchStats}
                        disabled={isAddingStats}
                        className="px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                      >
                        {isAddingStats ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Adding...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Stats
                          </>
                        )}
                      </button>
                      {addStatsMessage && (
                        <span className={`text-sm ${addStatsMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                          {addStatsMessage.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  render() {
    const { players, isLoading, error, filterPosition, searchQuery, sortBy } = this.state;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-display font-bold text-white">
            Squad Management
          </h2>
          <p className="text-gray-400 mt-1">
            View, filter and edit your squad. Click a player card to edit stats.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-2"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button
              onClick={this.fetchPlayers}
              className="ml-auto text-sm underline hover:text-red-300"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Filters & Search Bar */}
        <div className="bg-surface-dark-elevated rounded-xl p-4 space-y-4">
          {/* Position Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => this.handleFilterChange(opt)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterPosition === opt
                    ? 'bg-accent-gold text-black'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Search & Sort Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or number..."
                value={searchQuery}
                onChange={this.handleSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent-gold/50"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={this.handleSortChange}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent-gold/50"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-surface-dark">{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <svg className="animate-spin w-10 h-10 text-accent-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-400 text-sm">Loading squad data...</p>
          </div>
        )}

        {/* Content */}
        {!isLoading && players.length === 0 && (
          <div>
            {/* Check if scraped data is available */}
            {(this.state.scrapedSquad && this.state.scrapedSquad.length > 0) ? (
              this.renderScrapedFallback()
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-2">
                  No players registered yet
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto">
                  Players can sign up and create their profile. Once registered, they will appear here for squad management.
                </p>
              </motion.div>
            )}
          </div>
        )}

        {/* Player Cards Grid */}
        {!isLoading && players.length > 0 && (
          <div>
            {/* Player count */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                {this.getFilteredPlayers().length} of {players.length} players
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              <AnimatePresence>
                {this.getFilteredPlayers().map((player, idx) => (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex flex-col items-center"
                  >
                    {/* Player FIFA Card */}
                    <PlayerFIFACard
                      player={player}
                      size="sm"
                      showSkillsAndWF={false}
                      onClick={() => this.openEditModal(player)}
                    />

                    {/* Season Stats Badges */}
                    <div className="mt-2 flex flex-wrap gap-1 justify-center">
                      {player.seasonStats.matches > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400" title="Matches played">
                          {player.seasonStats.matches}M
                        </span>
                      )}
                      {player.seasonStats.goals > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400" title="Goals">
                          {player.seasonStats.goals}G
                        </span>
                      )}
                      {player.seasonStats.assists > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400" title="Assists">
                          {player.seasonStats.assists}A
                        </span>
                      )}
                      {player.seasonStats.yellow_cards > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400" title="Yellow cards">
                          {player.seasonStats.yellow_cards}Y
                        </span>
                      )}
                      {player.seasonStats.red_cards > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400" title="Red cards">
                          {player.seasonStats.red_cards}R
                        </span>
                      )}
                    </div>

                    {/* AGD Scraped Data Badge */}
                    {player.scrapedData && (
                      <div className="mt-1 flex items-center gap-1" title="Official stats from AGD Sports">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-gold/15 text-accent-gold border border-accent-gold/20 font-medium">
                          AGD
                        </span>
                        {player.scrapedData.goals > 0 && (
                          <span className="text-[9px] px-1 py-0.5 text-accent-gold/80">
                            {player.scrapedData.goals}G
                          </span>
                        )}
                        {player.scrapedData.assists > 0 && (
                          <span className="text-[9px] px-1 py-0.5 text-accent-gold/80">
                            {player.scrapedData.assists}A
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {this.getFilteredPlayers().length === 0 && (
              <p className="text-center text-gray-500 py-12">No players match your filters.</p>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {this.renderEditModal()}
      </div>
    );
  }
}

export default SquadSelection;

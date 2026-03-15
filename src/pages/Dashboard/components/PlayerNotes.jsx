import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';
import { createNotification } from '../../../services/notificationService';

const CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'injury', label: 'Injury', color: 'bg-red-500/20 text-red-400' },
  { value: 'form', label: 'Form', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'feedback', label: 'Feedback', color: 'bg-green-500/20 text-green-400' },
];

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'injury', label: 'Injury' },
  { value: 'form', label: 'Form' },
  { value: 'feedback', label: 'Feedback' },
];

class PlayerNotes extends Component {
  constructor(props) {
    super(props);
    this.state = {
      players: [],
      loadingPlayers: true,
      selectedPlayerId: null,
      notes: [],
      loadingNotes: false,
      activeFilter: 'all',
      // Add note form
      noteText: '',
      noteCategory: 'general',
      savingNote: false,
      // Delete
      deletingNoteId: null,
      // Notification
      showNotification: false,
      notificationMessage: '',
      // Mobile
      isMobile: window.innerWidth < 768,
    };
  }

  componentDidMount() {
    this.fetchPlayers();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    this.setState({ isMobile: window.innerWidth < 768 });
  };

  showNotification = (message) => {
    this.setState({ showNotification: true, notificationMessage: message });
    setTimeout(() => this.setState({ showNotification: false }), 3000);
  };

  fetchPlayers = async () => {
    this.setState({ loadingPlayers: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, profile_image_url, role, roles, players(position)')
        .order('full_name');
      if (error) throw error;

      // Filter to only players, flatten position from joined players table
      const players = (data || [])
        .filter((p) => {
          if (Array.isArray(p.roles)) return p.roles.includes('player');
          return p.role === 'player';
        })
        .map((p) => ({
          ...p,
          position: p.players?.[0]?.position || p.players?.position || null,
        }));

      this.setState({ players, loadingPlayers: false });
    } catch (err) {
      console.error('Error fetching players:', err);
      this.setState({ loadingPlayers: false });
    }
  };

  selectPlayer = (playerId) => {
    this.setState({ selectedPlayerId: playerId, activeFilter: 'all' }, () => {
      this.fetchNotes(playerId);
    });
  };

  fetchNotes = async (playerId) => {
    this.setState({ loadingNotes: true });
    try {
      const { data, error } = await supabase
        .from('player_notes')
        .select('*, profiles!player_notes_author_id_fkey(full_name)')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      this.setState({ notes: data || [], loadingNotes: false });
    } catch (err) {
      console.error('Error fetching notes:', err);
      this.setState({ loadingNotes: false });
      this.showNotification('Failed to load notes');
    }
  };

  handleAddNote = async () => {
    const { noteText, noteCategory, selectedPlayerId } = this.state;
    const { user } = this.props;
    if (!noteText.trim() || !selectedPlayerId) return;

    this.setState({ savingNote: true });
    try {
      const { data: result, error } = await supabase.from('player_notes').insert({
        player_id: selectedPlayerId,
        author_id: user?.id,
        note: noteText.trim(),
        category: noteCategory,
      }).select().single();
      if (error) throw error;

      // Send notification to the player (skip injury-category notes)
      if (noteCategory !== 'injury') {
        const authorName = user?.full_name || 'Coach';
        await createNotification({
          userId: selectedPlayerId,
          title: `New note from ${authorName}`,
          body: noteText.trim().substring(0, 100),
          type: 'note_created',
          referenceType: 'note',
          referenceId: result.id,
        });
      }

      this.setState({ noteText: '', noteCategory: 'general', savingNote: false });
      this.showNotification('Note added successfully');
      await this.fetchNotes(selectedPlayerId);
    } catch (err) {
      console.error('Error adding note:', err);
      this.setState({ savingNote: false });
      this.showNotification('Failed to add note');
    }
  };

  handleDeleteNote = async (noteId) => {
    const { selectedPlayerId } = this.state;
    this.setState({ deletingNoteId: null });
    try {
      const { error } = await supabase.from('player_notes').delete().eq('id', noteId);
      if (error) throw error;
      this.showNotification('Note deleted');
      await this.fetchNotes(selectedPlayerId);
    } catch (err) {
      console.error('Error deleting note:', err);
      this.showNotification('Failed to delete note');
    }
  };

  getCategoryBadge = (category) => {
    const found = CATEGORIES.find((c) => c.value === category);
    return found || CATEGORIES[0];
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  getFilteredNotes = () => {
    const { notes, activeFilter } = this.state;
    if (activeFilter === 'all') return notes;
    return notes.filter((n) => n.category === activeFilter);
  };

  renderPlayerList = () => {
    const { players, loadingPlayers, selectedPlayerId, isMobile } = this.state;

    if (loadingPlayers) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-3 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="mb-4">
          <select
            value={selectedPlayerId || ''}
            onChange={(e) => e.target.value && this.selectPlayer(e.target.value)}
            className="w-full px-4 py-3 bg-surface-dark-elevated border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold appearance-none"
          >
            <option value="" className="bg-surface-dark">Select a player...</option>
            {players.map((player) => (
              <option key={player.id} value={player.id} className="bg-surface-dark">
                {player.full_name || 'Unnamed'}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="w-72 flex-shrink-0 bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-white font-display font-bold">Players</h3>
          <p className="text-white/40 text-xs mt-1">{players.length} players</p>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
          {players.map((player) => (
            <button
              key={player.id}
              onClick={() => this.selectPlayer(player.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-white/5 ${
                selectedPlayerId === player.id
                  ? 'bg-accent-gold/10 border-l-2 border-l-accent-gold'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-white/10">
                {player.profile_image_url ? (
                  <img src={player.profile_image_url} alt={player.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${selectedPlayerId === player.id ? 'text-accent-gold' : 'text-white'}`}>
                  {player.full_name || 'Unnamed'}
                </p>
                {player.position && (
                  <p className="text-white/40 text-xs">{player.position}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  renderNotesPanel = () => {
    const { selectedPlayerId, loadingNotes, noteText, noteCategory, savingNote, deletingNoteId, activeFilter, players } = this.state;
    const { user } = this.props;
    const filteredNotes = this.getFilteredNotes();
    const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

    if (!selectedPlayerId) {
      return (
        <div className="flex-1 bg-surface-dark-elevated rounded-xl border border-white/10 flex items-center justify-center p-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-white/60 font-medium">Select a player to view notes</h3>
            <p className="text-white/30 text-sm mt-1">Choose a player from the list to see or add notes</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 space-y-4">
        {/* Player header */}
        {selectedPlayer && (
          <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
              {selectedPlayer.profile_image_url ? (
                <img src={selectedPlayer.profile_image_url} alt={selectedPlayer.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-white font-display font-bold text-lg">{selectedPlayer.full_name}</h3>
              {selectedPlayer.position && (
                <p className="text-white/40 text-sm">{selectedPlayer.position}</p>
              )}
            </div>
          </div>
        )}

        {/* Add note form */}
        <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-4">
          <h4 className="text-white font-medium text-sm mb-3">Add Note</h4>
          <textarea
            value={noteText}
            onChange={(e) => this.setState({ noteText: e.target.value })}
            placeholder="Write a note about this player..."
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold resize-none mb-3"
          />
          <div className="flex items-center gap-3">
            <select
              value={noteCategory}
              onChange={(e) => this.setState({ noteCategory: e.target.value })}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-accent-gold appearance-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-surface-dark">
                  {cat.label}
                </option>
              ))}
            </select>
            <button
              onClick={this.handleAddNote}
              disabled={savingNote || !noteText.trim()}
              className="px-5 py-2 bg-accent-gold text-black font-bold text-sm rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {savingNote && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {savingNote ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => this.setState({ activeFilter: tab.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === tab.value
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notes list */}
        {loadingNotes ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-8 text-center">
            <p className="text-white/40">No notes found for this player.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => {
              const badge = this.getCategoryBadge(note.category);
              const isOwn = user && note.author_id === user.id;

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface-dark-elevated rounded-xl border border-white/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white/70 text-sm font-medium">
                        {note.profiles?.full_name || 'Unknown'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs">{this.formatDate(note.created_at)}</span>
                      {isOwn && (
                        deletingNoteId === note.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => this.handleDeleteNote(note.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => this.setState({ deletingNoteId: null })}
                              className="text-xs text-white/40 hover:text-white/60"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => this.setState({ deletingNoteId: note.id })}
                            className="p-1 text-white/20 hover:text-red-400 transition-colors"
                            title="Delete note"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <p className="text-white/80 text-sm whitespace-pre-wrap">{note.note}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  render() {
    const { showNotification, notificationMessage, isMobile } = this.state;

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-white">Player Notes</h1>
          <p className="text-white/50 mt-1">Add and review coaching notes for each player</p>
        </motion.div>

        {/* Notification */}
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

        {/* Two-panel layout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={isMobile ? '' : 'flex gap-6'}
        >
          {this.renderPlayerList()}
          {this.renderNotesPanel()}
        </motion.div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(PlayerNotes);

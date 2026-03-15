import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getPhotoTags, addPhotoTag, removePhotoTag, searchPlayers } from '../../../services/fanPortalService';

/**
 * Full-screen photo lightbox with Instagram-style player tagging
 * Click photo to place tag, search for player, confirm
 * Shows existing tags on hover
 */
class PhotoLightbox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tags: [],
      showTags: false,
      // Tagging mode
      isTagging: false,
      tagPosition: null, // { x, y } in percentage
      searchQuery: '',
      searchResults: [],
      searching: false,
      saving: false,
    };
    this.imageRef = React.createRef();
    this.searchTimeout = null;
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    this.loadTags();
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.photo?.id !== this.props.photo?.id) {
      this.loadTags();
      this.setState({ isTagging: false, tagPosition: null, searchQuery: '', searchResults: [] });
    }
  }

  loadTags = async () => {
    const { photo } = this.props;
    if (!photo) return;
    try {
      const tags = await getPhotoTags(photo.id);
      this.setState({ tags });
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (this.state.isTagging) {
        this.setState({ isTagging: false, tagPosition: null, searchQuery: '', searchResults: [] });
      } else {
        this.props.onClose();
      }
    }
    if (!this.state.isTagging) {
      if (e.key === 'ArrowLeft') this.props.onPrev?.();
      if (e.key === 'ArrowRight') this.props.onNext?.();
    }
  };

  handleImageClick = (e) => {
    const { user } = this.props;
    if (!user) return;

    const rect = this.imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    this.setState({
      isTagging: true,
      tagPosition: { x, y },
      searchQuery: '',
      searchResults: [],
    });
  };

  handleSearchChange = (e) => {
    const query = e.target.value;
    this.setState({ searchQuery: query });

    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (query.trim().length < 2) {
      this.setState({ searchResults: [] });
      return;
    }

    this.searchTimeout = setTimeout(async () => {
      this.setState({ searching: true });
      try {
        const results = await searchPlayers(query.trim());
        // Filter out already tagged players
        const taggedIds = this.state.tags.map(t => t.player_id);
        const filtered = results.filter(p => !taggedIds.includes(p.user_id));
        this.setState({ searchResults: filtered, searching: false });
      } catch (err) {
        console.error('Search error:', err);
        this.setState({ searching: false });
      }
    }, 300);
  };

  handleTagPlayer = async (player) => {
    const { photo, user } = this.props;
    const { tagPosition } = this.state;
    if (!photo || !user || !tagPosition) return;

    this.setState({ saving: true });
    try {
      const tag = await addPhotoTag({
        photoId: photo.id,
        playerId: player.user_id,
        x: tagPosition.x,
        y: tagPosition.y,
        taggedBy: user.id,
      });
      this.setState((prev) => ({
        tags: [...prev.tags, tag],
        isTagging: false,
        tagPosition: null,
        searchQuery: '',
        searchResults: [],
        saving: false,
      }));
    } catch (err) {
      console.error('Tag error:', err);
      this.setState({ saving: false });
    }
  };

  handleRemoveTag = async (tagId) => {
    try {
      await removePhotoTag(tagId);
      this.setState((prev) => ({
        tags: prev.tags.filter(t => t.id !== tagId),
      }));
    } catch (err) {
      console.error('Remove tag error:', err);
    }
  };

  cancelTagging = () => {
    this.setState({ isTagging: false, tagPosition: null, searchQuery: '', searchResults: [] });
  };

  render() {
    const { photo, onClose, onPrev, onNext, user } = this.props;
    const { tags, showTags, isTagging, tagPosition, searchQuery, searchResults, searching, saving } = this.state;
    if (!photo) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Tag Button */}
          {user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                this.setState({ showTags: !showTags });
              }}
              className={`absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium ${
                showTags || tags.length > 0
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {tags.length > 0 ? `${tags.length} tagged` : 'Tag'}
            </button>
          )}

          {/* Nav Arrows */}
          {onPrev && !isTagging && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {onNext && !isTagging && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-5xl max-h-[85vh] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The Photo */}
            <div
              className="relative inline-block"
              onMouseEnter={() => tags.length > 0 && this.setState({ showTags: true })}
              onMouseLeave={() => !isTagging && this.setState({ showTags: false })}
            >
              <img
                ref={this.imageRef}
                src={photo.image_url}
                alt={photo.caption || ''}
                className={`max-w-full max-h-[75vh] object-contain rounded-lg ${user ? 'cursor-crosshair' : ''}`}
                onClick={this.handleImageClick}
              />

              {/* Existing Tags */}
              <AnimatePresence>
                {showTags && tags.map((tag) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute group"
                    style={{
                      left: `${tag.x_position}%`,
                      top: `${tag.y_position}%`,
                      transform: 'translate(-50%, -100%)',
                    }}
                  >
                    {/* Tag marker */}
                    <div className="relative">
                      <Link
                        to={`/player/${tag.player_id}`}
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-white/20 hover:border-accent-gold/50 hover:bg-black/90 transition-colors whitespace-nowrap"
                      >
                        {tag.profiles?.profile_image_url && (
                          <img src={tag.profiles.profile_image_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                        )}
                        {tag.profiles?.full_name || 'Player'}
                      </Link>
                      {/* Remove button */}
                      {user && (user.id === tag.tagged_by || user.id === tag.player_id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            this.handleRemoveTag(tag.id);
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          x
                        </button>
                      )}
                      {/* Arrow pointing down */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/80" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* New tag placement marker */}
              {isTagging && tagPosition && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute"
                  style={{
                    left: `${tagPosition.x}%`,
                    top: `${tagPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-accent-gold bg-accent-gold/20 animate-pulse" />
                </motion.div>
              )}
            </div>

            {/* Caption & Info */}
            {(photo.caption || photo.profiles?.full_name || tags.length > 0) && (
              <div className="text-center mt-3">
                {photo.caption && <p className="text-white text-sm">{photo.caption}</p>}
                {photo.profiles?.full_name && (
                  <p className="text-gray-500 text-xs mt-1">by {photo.profiles.full_name}</p>
                )}
                {tags.length > 0 && !showTags && (
                  <button
                    onClick={() => this.setState({ showTags: true })}
                    className="text-accent-gold text-xs mt-1 hover:underline"
                  >
                    {tags.length} player{tags.length !== 1 ? 's' : ''} tagged — tap to view
                  </button>
                )}
              </div>
            )}

            {/* Tagging Search Panel */}
            <AnimatePresence>
              {isTagging && tagPosition && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute z-20 bg-surface-dark-elevated border border-white/20 rounded-xl shadow-2xl p-3 w-72"
                  style={{
                    left: `${Math.min(tagPosition.x, 70)}%`,
                    top: `${Math.min(tagPosition.y + 5, 80)}%`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-semibold">Tag a player</span>
                    <button
                      onClick={this.cancelTagging}
                      className="text-white/50 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={this.handleSearchChange}
                    placeholder="Search player name..."
                    autoFocus
                    className="w-full px-3 py-2 bg-surface-dark border border-white/10 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-accent-gold"
                  />
                  {/* Search Results */}
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {searching && (
                      <div className="flex justify-center py-3">
                        <div className="w-5 h-5 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                      <p className="text-white/40 text-xs text-center py-3">No players found</p>
                    )}
                    {searchResults.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => this.handleTagPlayer(player)}
                        disabled={saving}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left disabled:opacity-50"
                      >
                        <div className="w-8 h-8 rounded-full bg-accent-gold/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {player.image ? (
                            <img src={player.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-accent-gold">
                              {player.name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{player.name}</p>
                          <p className="text-white/40 text-xs">
                            {player.position} {player.number ? `#${player.number}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(PhotoLightbox);

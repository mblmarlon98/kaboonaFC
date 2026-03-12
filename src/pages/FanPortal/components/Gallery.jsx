import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import AlbumView from './AlbumView';
import { getAlbums, createAlbum } from '../../../services/fanPortalService';

class Gallery extends Component {
  constructor(props) {
    super(props);
    this.state = {
      albums: [],
      loading: true,
      selectedAlbum: null,
      showCreateForm: false,
      newTitle: '',
      newDescription: '',
      creating: false,
    };
  }

  async componentDidMount() {
    try {
      const albums = await getAlbums();
      this.setState({ albums, loading: false });
    } catch (err) {
      console.error('Gallery error:', err);
      this.setState({ loading: false });
    }
  }

  handleCreateAlbum = async () => {
    const { newTitle, newDescription } = this.state;
    const userId = this.props.user?.id;
    if (!newTitle.trim() || !userId) return;
    this.setState({ creating: true });
    try {
      const album = await createAlbum({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        createdBy: userId,
      });
      this.setState((prev) => ({
        albums: [{ ...album, photoCount: 0, createdByName: 'You' }, ...prev.albums],
        showCreateForm: false,
        newTitle: '',
        newDescription: '',
        creating: false,
      }));
    } catch (err) {
      console.error('Create album error:', err);
      this.setState({ creating: false });
    }
  };

  render() {
    const { albums, loading, selectedAlbum, showCreateForm, newTitle, newDescription, creating } = this.state;
    const { user } = this.props;

    if (selectedAlbum) {
      return (
        <AlbumView
          album={selectedAlbum}
          onBack={() => this.setState({ selectedAlbum: null })}
        />
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-white">Photo Gallery</h2>
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => this.setState({ showCreateForm: !showCreateForm })}
              className="px-4 py-2 bg-accent-gold text-black rounded-lg font-semibold text-sm"
            >
              {showCreateForm ? 'Cancel' : 'New Album'}
            </motion.button>
          )}
        </div>

        {/* Create Album Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4 space-y-3"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => this.setState({ newTitle: e.target.value })}
              placeholder="Album title"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => this.setState({ newDescription: e.target.value })}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 bg-surface-dark border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none"
            />
            <button
              onClick={this.handleCreateAlbum}
              disabled={!newTitle.trim() || creating}
              className="px-4 py-2 bg-accent-gold text-black rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Album'}
            </button>
          </motion.div>
        )}

        {/* Album Grid */}
        {albums.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-5xl mb-4">📸</p>
            <h3 className="text-xl font-display font-bold text-white mb-2">No Albums Yet</h3>
            <p>Create the first album to start sharing photos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album, i) => (
              <motion.button
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => this.setState({ selectedAlbum: album })}
                className="text-left bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden hover:border-accent-gold/50 transition-all"
              >
                <div className="aspect-square bg-surface-dark-hover flex items-center justify-center">
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-600">📷</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate flex-1">{album.title}</h3>
                    {album.is_official && (
                      <span className="text-[9px] font-bold bg-accent-gold text-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Official
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {album.photoCount} photo{album.photoCount !== 1 ? 's' : ''} &middot; {album.createdByName}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(Gallery);

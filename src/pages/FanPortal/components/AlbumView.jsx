import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import PhotoLightbox from './PhotoLightbox';
import { getAlbumPhotos, uploadPhoto } from '../../../services/fanPortalService';

class AlbumView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: [],
      loading: true,
      lightboxIndex: -1,
      uploading: false,
      caption: '',
    };
    this.fileRef = React.createRef();
  }

  async componentDidMount() {
    try {
      const photos = await getAlbumPhotos(this.props.album.id);
      this.setState({ photos, loading: false });
    } catch (err) {
      console.error('Album photos error:', err);
      this.setState({ loading: false });
    }
  }

  handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
    const userId = this.props.user?.id;
    if (!userId) return;
    this.setState({ uploading: true });
    try {
      const photo = await uploadPhoto({
        albumId: this.props.album.id,
        userId,
        file,
        caption: this.state.caption || null,
      });
      this.setState((prev) => ({
        photos: [photo, ...prev.photos],
        uploading: false,
        caption: '',
      }));
    } catch (err) {
      console.error('Upload error:', err);
      this.setState({ uploading: false });
    }
  };

  render() {
    const { album, onBack, user } = this.props;
    const { photos, loading, lightboxIndex, uploading, caption } = this.state;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-display font-bold text-white">{album.title}</h2>
            {album.is_official && (
              <span className="text-[10px] font-bold bg-accent-gold text-black px-2 py-0.5 rounded-full">Official</span>
            )}
          </div>
        </div>

        {/* Upload */}
        {user && (
          <div className="flex gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => this.setState({ caption: e.target.value })}
              placeholder="Caption (optional)"
              maxLength={200}
              className="flex-1 px-3 py-2 bg-surface-dark-elevated border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:border-accent-gold focus:outline-none"
            />
            <button
              onClick={() => this.fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-accent-gold text-black rounded-lg font-semibold text-sm disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            <input ref={this.fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={this.handleUpload} className="hidden" />
          </div>
        )}

        {/* Photo Grid (Masonry-style with CSS columns) */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📷</p>
            <p>No photos yet. Be the first to upload!</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="break-inside-avoid cursor-pointer group"
                onClick={() => this.setState({ lightboxIndex: i })}
              >
                <div className="relative rounded-lg overflow-hidden">
                  <img src={photo.image_url} alt={photo.caption || ''} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.caption && (
                      <p className="absolute bottom-2 left-2 right-2 text-white text-xs">{photo.caption}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {lightboxIndex >= 0 && (
          <PhotoLightbox
            photo={photos[lightboxIndex]}
            onClose={() => this.setState({ lightboxIndex: -1 })}
            onPrev={lightboxIndex > 0 ? () => this.setState({ lightboxIndex: lightboxIndex - 1 }) : null}
            onNext={lightboxIndex < photos.length - 1 ? () => this.setState({ lightboxIndex: lightboxIndex + 1 }) : null}
          />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(AlbumView);

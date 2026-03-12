import React, { Component } from 'react';
import { motion } from 'framer-motion';

class ComposeBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: '',
      imageFile: null,
      imagePreview: null,
      submitting: false,
    };
    this.fileInputRef = React.createRef();
  }

  handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    const preview = URL.createObjectURL(file);
    this.setState({ imageFile: file, imagePreview: preview });
  };

  handleRemoveImage = () => {
    if (this.state.imagePreview) URL.revokeObjectURL(this.state.imagePreview);
    this.setState({ imageFile: null, imagePreview: null });
  };

  handleSubmit = async () => {
    const { content, imageFile } = this.state;
    if (!content.trim()) return;
    this.setState({ submitting: true });
    try {
      await this.props.onSubmit({ content: content.trim(), imageFile });
      if (this.state.imagePreview) URL.revokeObjectURL(this.state.imagePreview);
      this.setState({ content: '', imageFile: null, imagePreview: null });
    } catch (err) {
      console.error('Post error:', err);
    } finally {
      this.setState({ submitting: false });
    }
  };

  render() {
    const { content, imagePreview, submitting } = this.state;
    const { user } = this.props;

    if (!user) {
      return (
        <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-6 text-center">
          <p className="text-gray-400">Log in to share with the community</p>
        </div>
      );
    }

    return (
      <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4">
        <textarea
          value={content}
          onChange={(e) => this.setState({ content: e.target.value })}
          placeholder="Share something with the fans..."
          maxLength={500}
          rows={3}
          className="w-full bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm"
        />

        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg" />
            <button
              onClick={this.handleRemoveImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
            >
              X
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
          <div className="flex gap-2">
            <button
              onClick={() => this.fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-accent-gold transition-colors rounded-lg hover:bg-surface-dark-hover"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <input ref={this.fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={this.handleImageSelect} className="hidden" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{content.length}/500</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={this.handleSubmit}
              disabled={!content.trim() || submitting}
              className="px-4 py-2 bg-accent-gold text-black rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Posting...' : 'Post'}
            </motion.button>
          </div>
        </div>
      </div>
    );
  }
}

export default ComposeBox;

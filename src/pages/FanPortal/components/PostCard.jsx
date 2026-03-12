import React, { Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getComments, addComment } from '../../../services/fanPortalService';

class PostCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showComments: false,
      comments: [],
      commentText: '',
      loadingComments: false,
    };
  }

  getBadge = (role) => {
    if (role === 'player') return { label: 'Player', color: 'text-accent-gold border-accent-gold' };
    if (role === 'coach' || role === 'owner') return { label: role.charAt(0).toUpperCase() + role.slice(1), color: 'text-accent-gold border-accent-gold' };
    return null;
  };

  getEngagementBadge = (points) => {
    if (points >= 1000) return 'Legend';
    if (points >= 500) return 'Ultras';
    if (points >= 100) return 'Supporter';
    return null;
  };

  handleToggleComments = async () => {
    const { showComments } = this.state;
    if (!showComments) {
      this.setState({ loadingComments: true, showComments: true });
      try {
        const comments = await getComments(this.props.post.id);
        this.setState({ comments, loadingComments: false });
      } catch (err) {
        console.error('Load comments error:', err);
        this.setState({ loadingComments: false });
      }
    } else {
      this.setState({ showComments: false });
    }
  };

  handleAddComment = async () => {
    const { commentText } = this.state;
    const { post, userId } = this.props;
    if (!commentText.trim() || !userId) return;
    try {
      const newComment = await addComment(post.id, userId, commentText.trim());
      this.setState((prev) => ({
        comments: [...prev.comments, newComment],
        commentText: '',
      }));
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  render() {
    const { post, isLiked, onLike, userId } = this.props;
    const { showComments, comments, commentText, loadingComments } = this.state;
    const profile = post.profiles || {};
    const roleBadge = this.getBadge(profile.role);
    const isSpecial = profile.role === 'player' || profile.role === 'coach' || profile.role === 'owner';

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden ${isSpecial ? 'border-l-4 border-l-accent-gold' : ''}`}
      >
        {/* Header */}
        <div className="p-4 pb-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-dark-hover flex items-center justify-center overflow-hidden">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg text-gray-500">{(profile.full_name || '?')[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm truncate">{profile.full_name || 'Anonymous'}</span>
              {roleBadge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{this.formatTime(post.created_at)}</span>
          </div>
          {userId === post.user_id && (
            <button
              onClick={() => this.props.onDelete?.(post.id)}
              className="text-gray-600 hover:text-red-400 transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <p className="text-gray-200 text-sm whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img src={post.image_url} alt="" className="w-full max-h-96 object-cover" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-3 flex items-center gap-4">
          <button
            onClick={() => onLike?.(post.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-accent-gold' : 'text-gray-500 hover:text-accent-gold'}`}
          >
            <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.likes_count > 0 && <span>{post.likes_count}</span>}
          </button>
          <button
            onClick={this.handleToggleComments}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comments_count > 0 && <span>{post.comments_count}</span>}
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-800 overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {loadingComments ? (
                  <div className="text-center py-2">
                    <div className="w-5 h-5 border-2 border-accent-gold border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-surface-dark-hover flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {c.profiles?.profile_image_url ? (
                          <img src={c.profiles.profile_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-500">{(c.profiles?.full_name || '?')[0]}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white">{c.profiles?.full_name}</span>
                        <span className="text-xs text-gray-500 ml-2">{this.formatTime(c.created_at)}</span>
                        <p className="text-sm text-gray-300">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {userId && (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => this.setState({ commentText: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && this.handleAddComment()}
                      placeholder="Write a comment..."
                      maxLength={280}
                      className="flex-1 px-3 py-2 bg-surface-dark rounded-lg text-sm text-white placeholder-gray-500 border border-gray-700 focus:border-accent-gold focus:outline-none"
                    />
                    <button onClick={this.handleAddComment} className="px-3 py-2 bg-accent-gold text-black rounded-lg text-sm font-semibold">
                      Post
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
}

export default PostCard;

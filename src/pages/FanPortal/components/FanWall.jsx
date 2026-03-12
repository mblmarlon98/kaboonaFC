import React, { Component } from 'react';
import { connect } from 'react-redux';
import ComposeBox from './ComposeBox';
import PostCard from './PostCard';
import { getFanPosts, createFanPost, toggleLike, getUserLikes, deleteFanPost, uploadFanPostImage } from '../../../services/fanPortalService';

class FanWall extends Component {
  constructor(props) {
    super(props);
    this.state = {
      posts: [],
      likedPostIds: [],
      page: 0,
      hasMore: true,
      loading: true,
    };
  }

  async componentDidMount() {
    await this.loadPosts(0);
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  loadPosts = async (page) => {
    try {
      const posts = await getFanPosts(page);
      const userId = this.props.user?.id;
      let likedPostIds = [];
      if (userId && posts.length > 0) {
        likedPostIds = await getUserLikes(userId, posts.map((p) => p.id));
      }
      this.setState((prev) => ({
        posts: page === 0 ? posts : [...prev.posts, ...posts],
        likedPostIds: page === 0 ? likedPostIds : [...prev.likedPostIds, ...likedPostIds],
        page,
        hasMore: posts.length === 20,
        loading: false,
      }));
    } catch (err) {
      console.error('Load posts error:', err);
      this.setState({ loading: false });
    }
  };

  handleScroll = () => {
    const { loading, hasMore, page } = this.state;
    if (loading || !hasMore) return;
    const scrollBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400;
    if (scrollBottom) {
      this.setState({ loading: true });
      this.loadPosts(page + 1);
    }
  };

  handleSubmitPost = async ({ content, imageFile }) => {
    const userId = this.props.user?.id;
    if (!userId) return;
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadFanPostImage(userId, imageFile);
    }
    const newPost = await createFanPost({
      userId,
      content,
      imageUrl,
      postType: imageUrl ? 'image' : 'text',
    });
    this.setState((prev) => ({ posts: [newPost, ...prev.posts] }));
  };

  handleLike = async (postId) => {
    const userId = this.props.user?.id;
    if (!userId) return;
    const liked = await toggleLike(postId, userId);
    this.setState((prev) => ({
      likedPostIds: liked
        ? [...prev.likedPostIds, postId]
        : prev.likedPostIds.filter((id) => id !== postId),
      posts: prev.posts.map((p) =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (liked ? 1 : -1) }
          : p
      ),
    }));
  };

  handleDelete = async (postId) => {
    await deleteFanPost(postId);
    this.setState((prev) => ({
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
  };

  render() {
    const { posts, likedPostIds, loading } = this.state;
    const { user } = this.props;
    const userId = user?.id;

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <ComposeBox user={user} onSubmit={this.handleSubmitPost} />

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            userId={userId}
            isLiked={likedPostIds.includes(post.id)}
            onLike={this.handleLike}
            onDelete={this.handleDelete}
          />
        ))}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">💬</p>
            <p>No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user || null,
});

export default connect(mapStateToProps)(FanWall);

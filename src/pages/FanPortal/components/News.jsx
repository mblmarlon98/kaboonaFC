import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

class News extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articles: [],
      loading: true,
      error: null,
      selectedArticle: null,
    };
  }

  componentDidMount() {
    this.fetchArticles();
  }

  fetchArticles = async () => {
    this.setState({ loading: true });
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('id, title, description, image_url, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      this.setState({ articles: data || [], loading: false });
    } catch (err) {
      console.error('Error fetching news:', err);
      this.setState({ error: err.message, loading: false });
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  openArticle = (article) => {
    this.setState({ selectedArticle: article });
  };

  closeArticle = () => {
    this.setState({ selectedArticle: null });
  };

  render() {
    const { articles, loading, error, selectedArticle } = this.state;

    return (
      <div>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">
              Club <span className="text-accent-gold">News</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">Latest updates from Kaboona FC</p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400">Failed to load news</p>
            <button
              onClick={this.fetchArticles}
              className="mt-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && articles.length === 0 && (
          <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-white font-display font-bold text-lg mb-2">No News Yet</h3>
            <p className="text-gray-400">Stay tuned for updates from the club.</p>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => this.openArticle(article)}
                className="bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden hover:border-accent-gold/30 transition-all duration-300 cursor-pointer group"
              >
                {/* Image */}
                {article.image_url ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-accent-gold/10 to-accent-gold/5 flex items-center justify-center">
                    <svg className="w-12 h-12 text-accent-gold/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  <p className="text-accent-gold text-xs font-medium mb-2">
                    {this.formatDate(article.published_at)}
                  </p>
                  <h3 className="text-white font-display font-bold text-lg mb-2 group-hover:text-accent-gold transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-3">
                    {article.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Article Detail Modal */}
        {selectedArticle && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={this.closeArticle}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-dark-elevated rounded-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="sticky top-0 z-10 flex justify-end p-4">
                <button
                  onClick={this.closeArticle}
                  className="p-2 bg-black/50 rounded-full text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Image */}
              {selectedArticle.image_url && (
                <div className="px-6 -mt-8">
                  <img
                    src={selectedArticle.image_url}
                    alt={selectedArticle.title}
                    className="w-full rounded-xl object-cover max-h-80"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <p className="text-accent-gold text-sm font-medium mb-3">
                  {this.formatDate(selectedArticle.published_at)}
                </p>
                <h2 className="text-2xl font-display font-bold text-white mb-4">
                  {selectedArticle.title}
                </h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedArticle.description}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }
}

export default News;

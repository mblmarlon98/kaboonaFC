import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'training', label: 'Training' },
  { value: 'match', label: 'Match' },
  { value: 'event', label: 'Event' },
  { value: 'article', label: 'Article' },
  { value: 'player', label: 'Player' },
];

const PAGE_SIZE = 50;

class ActivityLog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      entries: [],
      loading: true,
      error: null,
      activeFilter: 'all',
      hasMore: true,
      loadingMore: false,
    };
    this.refreshInterval = null;
  }

  componentDidMount() {
    this.fetchEntries();
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchEntries(true);
    }, 30000);
  }

  componentWillUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  fetchEntries = async (silent = false) => {
    if (!silent) {
      this.setState({ loading: true, error: null });
    }
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, profiles(full_name, profile_image_url)')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw error;
      this.setState({
        entries: data || [],
        loading: false,
        hasMore: (data || []).length === PAGE_SIZE,
      });
    } catch (err) {
      console.error('Error fetching activity log:', err);
      if (!silent) {
        this.setState({ error: err.message, loading: false });
      }
    }
  };

  loadMore = async () => {
    const { entries } = this.state;
    this.setState({ loadingMore: true });
    try {
      const lastEntry = entries[entries.length - 1];
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, profiles(full_name, profile_image_url)')
        .order('created_at', { ascending: false })
        .lt('created_at', lastEntry.created_at)
        .limit(PAGE_SIZE);
      if (error) throw error;
      this.setState((prev) => ({
        entries: [...prev.entries, ...(data || [])],
        loadingMore: false,
        hasMore: (data || []).length === PAGE_SIZE,
      }));
    } catch (err) {
      console.error('Error loading more entries:', err);
      this.setState({ loadingMore: false });
    }
  };

  getRelativeTime = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  getActionDescription = (entry) => {
    const action = entry.action || 'performed action on';
    const entityType = entry.entity_type || 'item';
    let description = `${action} ${entityType}`;
    if (entry.details && entry.details.title) {
      description += ` '${entry.details.title}'`;
    }
    return description;
  };

  getActionIcon = (entry) => {
    const action = entry.action;
    if (action === 'created' || action === 'create') {
      return (
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    }
    if (action === 'updated' || action === 'update') {
      return (
        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    }
    if (action === 'deleted' || action === 'delete') {
      return (
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    }
    if (action === 'published' || action === 'publish') {
      return (
        <svg className="w-4 h-4 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  getFilteredEntries = () => {
    const { entries, activeFilter } = this.state;
    if (activeFilter === 'all') return entries;
    return entries.filter((e) => e.entity_type === activeFilter);
  };

  renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin mb-4" />
      <p className="text-white/50">Loading activity log...</p>
    </div>
  );

  render() {
    const { loading, error, activeFilter, hasMore, loadingMore } = this.state;
    const filteredEntries = this.getFilteredEntries();

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-white">Activity Log</h1>
          <p className="text-white/50 mt-1">Recent activity across the platform</p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => this.setState({ activeFilter: tab.value })}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeFilter === tab.value
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {loading ? this.renderLoading() : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-red-400 mb-2">Something went wrong</p>
              <p className="text-white/40 text-sm mb-4">{error}</p>
              <button onClick={() => this.fetchEntries()} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                Try Again
              </button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-display font-bold text-lg mb-2">No activity recorded yet</h3>
              <p className="text-white/50">Activity will appear here as actions are performed across the platform.</p>
            </div>
          ) : (
            <div className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden">
              <div className="divide-y divide-white/5">
                {filteredEntries.map((entry, index) => {
                  const name = entry.profiles?.full_name || 'Unknown User';
                  const avatar = entry.profiles?.profile_image_url;

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-white/10">
                        {avatar ? (
                          <img src={avatar} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Action icon */}
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        {this.getActionIcon(entry)}
                      </div>

                      {/* Description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">
                          <span className="font-medium">{name}</span>{' '}
                          <span className="text-white/60">{this.getActionDescription(entry)}</span>
                        </p>
                      </div>

                      {/* Timestamp */}
                      <span className="text-white/30 text-xs flex-shrink-0">
                        {this.getRelativeTime(entry.created_at)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Load more */}
              {hasMore && activeFilter === 'all' && (
                <div className="px-5 py-4 border-t border-white/5">
                  <button
                    onClick={this.loadMore}
                    disabled={loadingMore}
                    className="w-full py-2.5 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    );
  }
}

export default ActivityLog;

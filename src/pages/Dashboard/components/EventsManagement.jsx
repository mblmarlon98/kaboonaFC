import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

const EVENT_TYPES = [
  { value: 'fan_event', label: 'Fan Event', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'sponsor_event', label: 'Sponsor Event', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'community', label: 'Community', color: 'bg-green-500/20 text-green-400' },
];

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'fan_event', label: 'Fan Events' },
  { value: 'sponsor_event', label: 'Sponsor Events' },
  { value: 'community', label: 'Community' },
];

const defaultForm = {
  title: '',
  description: '',
  date: '',
  end_date: '',
  location: '',
  type: 'fan_event',
  image_url: '',
  is_public: true,
};

class EventsManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      events: [],
      loading: true,
      error: null,
      activeFilter: 'all',
      // Modal
      showModal: false,
      editingId: null,
      form: { ...defaultForm },
      saving: false,
      uploadingImage: false,
      // Delete confirmation
      deleteConfirmId: null,
      // Notification
      showNotification: false,
      notificationMessage: '',
    };
  }

  componentDidMount() {
    this.fetchEvents();
  }

  showNotification = (message) => {
    this.setState({ showNotification: true, notificationMessage: message });
    setTimeout(() => this.setState({ showNotification: false }), 3000);
  };

  fetchEvents = async () => {
    this.setState({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      this.setState({ events: data || [], loading: false });
    } catch (err) {
      console.error('Error fetching events:', err);
      this.setState({ error: err.message, loading: false });
    }
  };

  openCreateModal = () => {
    this.setState({
      showModal: true,
      editingId: null,
      form: { ...defaultForm },
    });
  };

  openEditModal = (event) => {
    this.setState({
      showModal: true,
      editingId: event.id,
      form: {
        title: event.title || '',
        description: event.description || '',
        date: event.date ? event.date.slice(0, 16) : '',
        end_date: event.end_date ? event.end_date.slice(0, 16) : '',
        location: event.location || '',
        type: event.type || 'fan_event',
        image_url: event.image_url || '',
        is_public: event.is_public !== false,
      },
    });
  };

  closeModal = () => {
    this.setState({
      showModal: false,
      editingId: null,
      form: { ...defaultForm },
    });
  };

  handleFieldChange = (key, value) => {
    this.setState((prev) => ({
      form: { ...prev.form, [key]: value },
    }));
  };

  handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    this.setState({ uploadingImage: true });
    try {
      const ext = file.name.split('.').pop();
      const path = `events/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('site-content').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('site-content').getPublicUrl(path);
      this.handleFieldChange('image_url', publicUrl);
      this.setState({ uploadingImage: false });
    } catch (err) {
      console.error('Error uploading image:', err);
      this.setState({ uploadingImage: false });
      this.showNotification('Failed to upload image');
    }
  };

  handleSave = async () => {
    const { editingId, form } = this.state;
    if (!form.title.trim() || !form.date) return;
    this.setState({ saving: true });
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        end_date: form.end_date || null,
        location: form.location.trim(),
        type: form.type,
        image_url: form.image_url || null,
        is_public: form.is_public,
      };
      if (editingId) {
        const { error } = await supabase.from('events').update(payload).eq('id', editingId);
        if (error) throw error;
        this.showNotification('Event updated successfully!');
      } else {
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw error;
        this.showNotification('Event created successfully!');
      }
      this.setState({ saving: false });
      this.closeModal();
      await this.fetchEvents();
    } catch (err) {
      console.error('Error saving event:', err);
      this.setState({ saving: false });
      this.showNotification('Failed to save event');
    }
  };

  handleDelete = async (id) => {
    this.setState({ deleteConfirmId: null });
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      this.showNotification('Event deleted');
      await this.fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      this.showNotification('Failed to delete event');
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  getTypeBadge = (type) => {
    const found = EVENT_TYPES.find((t) => t.value === type);
    return found || { label: type, color: 'bg-white/10 text-white/70' };
  };

  getFilteredEvents = () => {
    const { events, activeFilter } = this.state;
    if (activeFilter === 'all') return events;
    return events.filter((e) => e.type === activeFilter);
  };

  renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin mb-4" />
      <p className="text-white/50">Loading events...</p>
    </div>
  );

  renderError = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-14 h-14 bg-red-400/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-red-400 mb-2">Something went wrong</p>
      <p className="text-white/40 text-sm mb-4">{this.state.error}</p>
      <button onClick={this.fetchEvents} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
        Try Again
      </button>
    </div>
  );

  renderModal = () => {
    const { showModal, editingId, form, saving, uploadingImage } = this.state;
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={this.closeModal}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-dark-elevated rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-display font-bold text-white mb-6">
            {editingId ? 'Edit Event' : 'Create Event'}
          </h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => this.handleFieldChange('title', e.target.value)}
                placeholder="Event title..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => this.handleFieldChange('description', e.target.value)}
                placeholder="Event description..."
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold resize-none"
              />
            </div>

            {/* Date & End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => this.handleFieldChange('date', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-2">End Date & Time (optional)</label>
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => this.handleFieldChange('end_date', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => this.handleFieldChange('location', e.target.value)}
                placeholder="Event location..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Type</label>
              <select
                value={form.type}
                onChange={(e) => this.handleFieldChange('type', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold appearance-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-surface-dark">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-white/60 text-sm mb-2">Image</label>
              {form.image_url && (
                <div className="mb-3 relative inline-block">
                  <img src={form.image_url} alt="" className="h-40 rounded-lg object-cover" />
                  <button
                    onClick={() => this.handleFieldChange('image_url', '')}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    &times;
                  </button>
                </div>
              )}
              <label className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white/60 text-sm">
                  {uploadingImage ? 'Uploading...' : form.image_url ? 'Change image' : 'Upload image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={this.handleImageUpload}
                />
              </label>
            </div>

            {/* Is Public Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => this.handleFieldChange('is_public', !form.is_public)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.is_public ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  form.is_public ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
              <span className="text-white/70 text-sm">
                {form.is_public ? 'Public event' : 'Private event'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
            <button
              onClick={this.closeModal}
              className="px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={this.handleSave}
              disabled={saving || !form.title.trim() || !form.date}
              className="px-5 py-2.5 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  render() {
    const { loading, error, activeFilter, showNotification, notificationMessage, deleteConfirmId } = this.state;
    const filteredEvents = this.getFilteredEvents();

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-white">Events Management</h1>
          <p className="text-white/50 mt-1">Create and manage marketing, fan, and community events</p>
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

        {/* Modal */}
        {this.renderModal()}

        {/* Toolbar: Filter Tabs + Create Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
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
          </div>
          <button
            onClick={this.openCreateModal}
            className="px-5 py-2.5 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        </motion.div>

        {/* Events List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {loading ? this.renderLoading() : error ? this.renderError() : filteredEvents.length === 0 ? (
            <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-display font-bold text-lg mb-2">No events found</h3>
              <p className="text-white/50">Create your first event to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEvents.map((event) => {
                const badge = this.getTypeBadge(event.type);
                return (
                  <div
                    key={event.id}
                    className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6 flex flex-col group"
                  >
                    {/* Image */}
                    {event.image_url && (
                      <img src={event.image_url} alt="" className="w-full h-40 rounded-lg object-cover mb-4" />
                    )}

                    {/* Title & badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-white font-bold text-lg leading-tight">{event.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                        {event.is_public ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Public</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Private</span>
                        )}
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {this.formatDate(event.date)}
                      {event.end_date && ` - ${this.formatDate(event.end_date)}`}
                    </div>

                    {/* Location */}
                    {event.location && (
                      <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                    )}

                    {/* Description */}
                    {event.description && (
                      <p className="text-white/40 text-sm line-clamp-2 mb-4 flex-1">{event.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/10">
                      <button
                        onClick={() => this.openEditModal(event)}
                        className="flex-1 px-3 py-2 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      {deleteConfirmId === event.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => this.handleDelete(event.id)}
                            className="px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => this.setState({ deleteConfirmId: null })}
                            className="px-3 py-2 bg-white/10 text-white/60 text-sm rounded-lg hover:bg-white/20 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => this.setState({ deleteConfirmId: event.id })}
                          className="px-3 py-2 bg-red-500/10 text-red-400 text-sm rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    );
  }
}

export default EventsManagement;

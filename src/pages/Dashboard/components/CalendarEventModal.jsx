import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

const EVENT_TYPE_COLORS = {
  training: { light: 'bg-blue-500/20', text: 'text-blue-400', label: 'Training' },
  match: { light: 'bg-red-500/20', text: 'text-red-400', label: 'Match' },
  event: { light: 'bg-green-500/20', text: 'text-green-400', label: 'Event' },
};

/**
 * CalendarEventModal
 * Modal for viewing, creating, and editing calendar events.
 * Supports training, match, and event types with role-aware forms.
 */
class CalendarEventModal extends Component {
  constructor(props) {
    super(props);

    const { event, eventType } = props;
    const isCreate = !event;

    this.state = {
      isEditing: isCreate,
      saving: false,
      deleting: false,
      showDeleteConfirm: false,
      error: null,
      form: this.getInitialFormState(event, eventType),
    };
  }

  getInitialFormState = (event, eventType) => {
    if (!event) {
      // Create mode defaults
      const now = new Date();
      const defaultDate = new Date(now.getTime() + 3600000);
      const defaultDateStr = defaultDate.toISOString().split('T')[0];
      const defaultTimeStr = `${String(defaultDate.getHours()).padStart(2, '0')}:${String(defaultDate.getMinutes()).padStart(2, '0')}`;
      const dateStr = this.toDateTimeLocal(defaultDate);

      if (eventType === 'training') {
        return { session_date: defaultDateStr, session_time: defaultTimeStr, location: '' };
      }
      if (eventType === 'match') {
        return { opponent: '', match_date: defaultDateStr, match_time: defaultTimeStr, location: '' };
      }
      if (eventType === 'event') {
        return { title: '', description: '', date: dateStr, end_date: '', location: '', type: 'fan_event', is_public: true };
      }
      return {};
    }

    // Edit / view mode — populate from event
    const type = event.eventType || eventType;
    if (type === 'training') {
      return {
        session_date: event.session_date || '',
        session_time: event.session_time || '',
        location: event.location || '',
      };
    }
    if (type === 'match') {
      return {
        opponent: event.opponent || '',
        match_date: event.match_date || '',
        match_time: event.match_time || '',
        location: event.location || '',
      };
    }
    if (type === 'event') {
      return {
        title: event.title || '',
        description: event.description || '',
        date: this.toDateTimeLocal(event.date),
        end_date: event.end_date ? this.toDateTimeLocal(event.end_date) : '',
        location: event.location || '',
        type: event.type || 'fan_event',
        is_public: event.is_public !== undefined ? event.is_public : true,
      };
    }
    return {};
  };

  toDateTimeLocal = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  handleChange = (field, value) => {
    this.setState((prev) => ({
      form: { ...prev.form, [field]: value },
    }));
  };

  getTableName = () => {
    const { event, eventType } = this.props;
    const type = event?.eventType || eventType;
    if (type === 'training') return 'training_sessions';
    if (type === 'match') return 'matches';
    if (type === 'event') return 'events';
    return null;
  };

  handleSave = async () => {
    const { event, onSave, user } = this.props;
    const { form } = this.state;
    const table = this.getTableName();

    if (!table) return;

    this.setState({ saving: true, error: null });

    try {
      const { event: existingEvent, eventType } = this.props;
      const type = existingEvent?.eventType || eventType;

      // Build the data payload
      const data = { ...form };

      // For events table, convert datetime-local strings to ISO
      if (type === 'event') {
        if (data.date) data.date = new Date(data.date).toISOString();
        if (data.end_date) {
          data.end_date = data.end_date ? new Date(data.end_date).toISOString() : null;
        }
      }
      // For training_sessions and matches, session_date/match_date/session_time/match_time are already plain strings

      if (event && event.id) {
        // Update existing
        const { error } = await supabase
          .from(table)
          .update(data)
          .eq('id', event.id);

        if (error) throw error;
      } else {
        // Insert new
        if (user?.id) {
          data.created_by = user.id;
        }
        const { error } = await supabase
          .from(table)
          .insert(data);

        if (error) throw error;
      }

      if (onSave) onSave();
    } catch (err) {
      console.error('Error saving event:', err);
      this.setState({ error: err.message || 'Failed to save event' });
    } finally {
      this.setState({ saving: false });
    }
  };

  handleDelete = async () => {
    const { event, onSave } = this.props;
    const table = this.getTableName();

    if (!table || !event?.id) return;

    this.setState({ deleting: true, error: null });

    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', event.id);

      if (error) throw error;
      if (onSave) onSave();
    } catch (err) {
      console.error('Error deleting event:', err);
      this.setState({ error: err.message || 'Failed to delete event', deleting: false });
    }
  };

  formatViewDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  renderViewMode = () => {
    const { event, readOnly } = this.props;
    const type = event?.eventType;
    const colorConfig = EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.event;

    return (
      <div className="space-y-4">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorConfig.light} ${colorConfig.text}`}>
            {colorConfig.label}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-xl font-display font-bold text-white">
          {type === 'match' ? `vs ${event.opponent || 'TBD'}` : type === 'training' ? 'Training Session' : event.title || 'Untitled'}
        </h2>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-white/70">
            <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{this.formatViewDate(event.session_date || event.match_date || event.date)}</span>
          </div>

          {(event.session_time || event.match_time) && (
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{event.session_time || event.match_time}</span>
            </div>
          )}

          {event.end_date && (
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ends: {this.formatViewDate(event.end_date)}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
          )}

          {event.type && (
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="capitalize">{event.type.replace(/_/g, ' ')}</span>
            </div>
          )}

          {(event.notes || event.description) && (
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/5">
              <p className="text-white/60 text-sm whitespace-pre-wrap">{event.notes || event.description}</p>
            </div>
          )}

          {event.is_public !== undefined && (
            <div className="flex items-center gap-3 text-white/70">
              <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={event.is_public ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"} />
              </svg>
              <span>{event.is_public ? 'Public event' : 'Private event'}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!readOnly && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => this.setState({ isEditing: true })}
              className="flex-1 py-2.5 px-4 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors text-sm"
            >
              Edit
            </button>
            {!this.state.showDeleteConfirm ? (
              <button
                onClick={() => this.setState({ showDeleteConfirm: true })}
                className="py-2.5 px-4 bg-red-500/20 text-red-400 font-semibold rounded-lg hover:bg-red-500/30 transition-colors text-sm"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-sm">Are you sure?</span>
                <button
                  onClick={this.handleDelete}
                  disabled={this.state.deleting}
                  className="py-2 px-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                >
                  {this.state.deleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => this.setState({ showDeleteConfirm: false })}
                  className="py-2 px-3 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors text-sm"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  renderFormField = (label, field, type, options) => {
    const { form } = this.state;
    const value = form[field] !== undefined ? form[field] : '';

    if (type === 'textarea') {
      return (
        <div key={field}>
          <label className="block text-white/60 text-sm mb-1.5">{label}</label>
          <textarea
            value={value}
            onChange={(e) => this.handleChange(field, e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold transition-colors resize-none"
          />
        </div>
      );
    }

    if (type === 'select') {
      return (
        <div key={field}>
          <label className="block text-white/60 text-sm mb-1.5">{label}</label>
          <select
            value={value}
            onChange={(e) => this.handleChange(field, e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold transition-colors"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a1a]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === 'toggle') {
      return (
        <div key={field} className="flex items-center justify-between">
          <label className="text-white/60 text-sm">{label}</label>
          <button
            type="button"
            onClick={() => this.handleChange(field, !value)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              value ? 'bg-accent-gold' : 'bg-white/10'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                value ? 'left-[26px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      );
    }

    return (
      <div key={field}>
        <label className="block text-white/60 text-sm mb-1.5">{label}</label>
        <input
          type={type || 'text'}
          value={value}
          onChange={(e) => this.handleChange(field, e.target.value)}
          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold transition-colors"
        />
      </div>
    );
  };

  renderEditMode = () => {
    const { event, eventType } = this.props;
    const { saving, error } = this.state;
    const type = event?.eventType || eventType;
    const isCreate = !event;
    const colorConfig = EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.event;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorConfig.light} ${colorConfig.text}`}>
            {colorConfig.label}
          </span>
          <h2 className="text-lg font-display font-bold text-white">
            {isCreate ? `New ${colorConfig.label}` : `Edit ${colorConfig.label}`}
          </h2>
        </div>

        <div className="space-y-4">
          {type === 'training' && (
            <>
              {this.renderFormField('Date', 'session_date', 'date')}
              {this.renderFormField('Time', 'session_time', 'time')}
              {this.renderFormField('Location', 'location', 'text')}
            </>
          )}

          {type === 'match' && (
            <>
              {this.renderFormField('Opponent', 'opponent', 'text')}
              {this.renderFormField('Date', 'match_date', 'date')}
              {this.renderFormField('Time', 'match_time', 'time')}
              {this.renderFormField('Location', 'location', 'text')}
            </>
          )}

          {type === 'event' && (
            <>
              {this.renderFormField('Title', 'title', 'text')}
              {this.renderFormField('Description', 'description', 'textarea')}
              {this.renderFormField('Start Date & Time', 'date', 'datetime-local')}
              {this.renderFormField('End Date & Time', 'end_date', 'datetime-local')}
              {this.renderFormField('Location', 'location', 'text')}
              {this.renderFormField('Event Type', 'type', 'select', [
                { value: 'fan_event', label: 'Fan Event' },
                { value: 'sponsor_event', label: 'Sponsor Event' },
                { value: 'community', label: 'Community' },
              ])}
              {this.renderFormField('Public Event', 'is_public', 'toggle')}
            </>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <button
            onClick={this.handleSave}
            disabled={saving}
            className="flex-1 py-2.5 px-4 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : isCreate ? 'Create' : 'Save Changes'}
          </button>
          {!isCreate && (
            <button
              onClick={() => this.setState({ isEditing: false, form: this.getInitialFormState(this.props.event, this.props.eventType) })}
              className="py-2.5 px-4 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  };

  render() {
    const { onClose, readOnly, event } = this.props;
    const { isEditing } = this.state;

    const showEditForm = isEditing && !readOnly;
    const showView = !isEditing || readOnly;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-surface-dark-elevated rounded-xl border border-white/10 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors z-10"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {showView && event ? this.renderViewMode() : null}
            {showEditForm ? this.renderEditMode() : null}
          </div>
        </motion.div>
      </motion.div>
    );
  }
}

export default CalendarEventModal;

import React, { Component } from 'react';
import { motion } from 'framer-motion';

// Mock content sections
const mockContentSections = [
  {
    id: 'hero',
    name: 'Hero Section',
    fields: [
      { key: 'title', label: 'Title', type: 'text', value: 'Rise to Glory' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', value: 'Join the Movement' },
      { key: 'description', label: 'Description', type: 'textarea', value: 'Experience elite football training at Sunway University with Kaboona FC.' },
      { key: 'ctaText', label: 'CTA Button Text', type: 'text', value: 'Join Now' },
    ],
  },
  {
    id: 'about',
    name: 'About Section',
    fields: [
      { key: 'title', label: 'Title', type: 'text', value: 'About Kaboona FC' },
      { key: 'description', label: 'Description', type: 'textarea', value: 'Founded with a passion for football excellence, Kaboona FC brings together talented players from across Sunway University.' },
      { key: 'mission', label: 'Mission Statement', type: 'textarea', value: 'To develop world-class football talent and foster a community of dedicated athletes.' },
    ],
  },
  {
    id: 'training',
    name: 'Training Section',
    fields: [
      { key: 'title', label: 'Title', type: 'text', value: 'Training Programs' },
      { key: 'description', label: 'Description', type: 'textarea', value: 'Professional coaching and structured training sessions for all skill levels.' },
    ],
  },
];

// Mock coaches/staff data
const mockStaff = [
  { id: 1, name: 'Coach Ahmad', role: 'Head Coach', order: 1, image: null },
  { id: 2, name: 'Sarah Wong', role: 'Assistant Coach', order: 2, image: null },
  { id: 3, name: 'Michael Tan', role: 'Fitness Trainer', order: 3, image: null },
  { id: 4, name: 'Priya Raj', role: 'Team Manager', order: 4, image: null },
];

/**
 * Content Management Component
 * CMS for editing site text and managing coaches/staff display order
 */
class ContentManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'content',
      contentSections: mockContentSections,
      staff: mockStaff,
      editingSection: null,
      editedValues: {},
      showSaveNotification: false,
      draggedStaff: null,
    };
  }

  handleTabChange = (tab) => {
    this.setState({ activeTab: tab });
  };

  startEditing = (sectionId) => {
    const section = this.state.contentSections.find((s) => s.id === sectionId);
    const editedValues = {};
    section.fields.forEach((field) => {
      editedValues[field.key] = field.value;
    });
    this.setState({ editingSection: sectionId, editedValues });
  };

  handleFieldChange = (key, value) => {
    this.setState((prevState) => ({
      editedValues: { ...prevState.editedValues, [key]: value },
    }));
  };

  saveSection = () => {
    const { editingSection, editedValues, contentSections } = this.state;

    const updatedSections = contentSections.map((section) => {
      if (section.id === editingSection) {
        return {
          ...section,
          fields: section.fields.map((field) => ({
            ...field,
            value: editedValues[field.key] || field.value,
          })),
        };
      }
      return section;
    });

    this.setState({
      contentSections: updatedSections,
      editingSection: null,
      editedValues: {},
      showSaveNotification: true,
    });

    setTimeout(() => {
      this.setState({ showSaveNotification: false });
    }, 3000);
  };

  cancelEditing = () => {
    this.setState({ editingSection: null, editedValues: {} });
  };

  handleDragStart = (e, staffId) => {
    this.setState({ draggedStaff: staffId });
    e.dataTransfer.effectAllowed = 'move';
  };

  handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  handleDrop = (e, targetId) => {
    e.preventDefault();
    const { staff, draggedStaff } = this.state;

    if (draggedStaff === targetId) return;

    const draggedIndex = staff.findIndex((s) => s.id === draggedStaff);
    const targetIndex = staff.findIndex((s) => s.id === targetId);

    const newStaff = [...staff];
    const [removed] = newStaff.splice(draggedIndex, 1);
    newStaff.splice(targetIndex, 0, removed);

    // Update order values
    const reorderedStaff = newStaff.map((s, index) => ({
      ...s,
      order: index + 1,
    }));

    this.setState({ staff: reorderedStaff, draggedStaff: null });
  };

  handleDragEnd = () => {
    this.setState({ draggedStaff: null });
  };

  handleImageUpload = (e, staffId) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to Supabase storage
      const reader = new FileReader();
      reader.onload = (event) => {
        this.setState((prevState) => ({
          staff: prevState.staff.map((s) =>
            s.id === staffId ? { ...s, image: event.target.result } : s
          ),
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  render() {
    const {
      activeTab,
      contentSections,
      staff,
      editingSection,
      editedValues,
      showSaveNotification,
      draggedStaff,
    } = this.state;

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-display font-bold text-white">Content Management</h1>
          <p className="text-white/50 mt-1">Edit site content, upload images, and manage staff display</p>
        </motion.div>

        {/* Save Notification */}
        {showSaveNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Changes saved successfully!
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <button
            onClick={() => this.handleTabChange('content')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'content'
                ? 'bg-accent-gold text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Site Content
          </button>
          <button
            onClick={() => this.handleTabChange('staff')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'staff'
                ? 'bg-accent-gold text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Coaches & Staff
          </button>
          <button
            onClick={() => this.handleTabChange('images')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'images'
                ? 'bg-accent-gold text-black'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Images
          </button>
        </motion.div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {contentSections.map((section) => (
              <div
                key={section.id}
                className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden"
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-lg font-display font-bold text-white">{section.name}</h3>
                  {editingSection !== section.id ? (
                    <button
                      onClick={() => this.startEditing(section.id)}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={this.cancelEditing}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={this.saveSection}
                        className="px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-white/60 text-sm mb-2">{field.label}</label>
                      {editingSection === section.id ? (
                        field.type === 'textarea' ? (
                          <textarea
                            value={editedValues[field.key] || ''}
                            onChange={(e) => this.handleFieldChange(field.key, e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold resize-none"
                          />
                        ) : (
                          <input
                            type="text"
                            value={editedValues[field.key] || ''}
                            onChange={(e) => this.handleFieldChange(field.key, e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
                          />
                        )
                      ) : (
                        <p className="text-white/80 bg-white/5 px-4 py-3 rounded-lg">{field.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6">
              <div className="mb-4">
                <p className="text-white/60 text-sm">Drag and drop to reorder staff display</p>
              </div>
              <div className="space-y-3">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={(e) => this.handleDragStart(e, member.id)}
                    onDragOver={this.handleDragOver}
                    onDrop={(e) => this.handleDrop(e, member.id)}
                    onDragEnd={this.handleDragEnd}
                    className={`flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 cursor-move transition-all ${
                      draggedStaff === member.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    {/* Drag Handle */}
                    <div className="text-white/30">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>

                    {/* Order Number */}
                    <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-accent-gold font-bold text-sm">{member.order}</span>
                    </div>

                    {/* Image */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 bg-black/50 rounded-lg flex items-center justify-center transition-opacity">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => this.handleImageUpload(e, member.id)}
                        />
                      </label>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-white/50 text-sm">{member.role}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Staff Button */}
              <button className="mt-4 w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-white/50 hover:text-white hover:border-accent-gold transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Staff Member
              </button>
            </div>
          </motion.div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6"
          >
            <h3 className="text-lg font-display font-bold text-white mb-4">Image Gallery</h3>
            <p className="text-white/60 mb-6">Upload and manage images for the website</p>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-accent-gold transition-colors cursor-pointer">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-white font-semibold mb-2">Drop images here or click to upload</h4>
              <p className="text-white/50 text-sm">Supports: JPG, PNG, WebP (Max 5MB)</p>
            </div>

            {/* Image Grid Placeholder */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-white/5 rounded-lg flex items-center justify-center border border-white/10"
                >
                  <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }
}

export default ContentManagement;

import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

const SECTION_DEFINITIONS = {
  hero: {
    name: 'Hero Section',
    fields: [
      { key: 'clubName', label: 'Club Name (large heading)', type: 'text' },
      { key: 'clubSuffix', label: 'Club Suffix (e.g. FC)', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'ctaText1', label: 'Primary Button Text', type: 'text' },
      { key: 'ctaText2', label: 'Secondary Button Text', type: 'text' },
    ],
  },
  about: {
    name: 'About Section',
    fields: [
      { key: 'badge', label: 'Badge Label', type: 'text' },
      { key: 'title', label: 'Club Name', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Section Image', type: 'image' },
      { key: 'stat1Value', label: 'Stat 1 - Value', type: 'text' },
      { key: 'stat1Label', label: 'Stat 1 - Label', type: 'text' },
      { key: 'stat2Value', label: 'Stat 2 - Value', type: 'text' },
      { key: 'stat2Label', label: 'Stat 2 - Label', type: 'text' },
      { key: 'stat3Value', label: 'Stat 3 - Value', type: 'text' },
      { key: 'stat3Label', label: 'Stat 3 - Label', type: 'text' },
      { key: 'stat4Value', label: 'Stat 4 - Value', type: 'text' },
      { key: 'stat4Label', label: 'Stat 4 - Label', type: 'text' },
    ],
  },
  glory: {
    name: 'Glory Section',
    fields: [
      { key: 'badge', label: 'Badge Label', type: 'text' },
      { key: 'heading', label: 'League Heading', type: 'text' },
      { key: 'leagueTitle', label: 'League Name', type: 'text' },
      { key: 'achievementsBadge', label: 'Achievements Badge', type: 'text' },
      { key: 'achievementsHeading', label: 'Achievements Heading', type: 'text' },
      { key: 'shameBadge', label: 'Wall of Shame Badge', type: 'text' },
      { key: 'shameHeading', label: 'Wall of Shame Heading', type: 'text' },
    ],
  },
  training: {
    name: 'Training Ground',
    fields: [
      { key: 'badge', label: 'Badge Label', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Training Ground Photo', type: 'image' },
      { key: 'feature1', label: 'Feature 1', type: 'text' },
      { key: 'feature2', label: 'Feature 2', type: 'text' },
      { key: 'feature3', label: 'Feature 3', type: 'text' },
      { key: 'feature4', label: 'Feature 4', type: 'text' },
      { key: 'groundLabel', label: 'Ground Name', type: 'text' },
      { key: 'lat', label: 'Latitude', type: 'text' },
      { key: 'lng', label: 'Longitude', type: 'text' },
    ],
  },
  team_preview: {
    name: 'Staff Preview Section',
    fields: [
      { key: 'badge', label: 'Badge Label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  cta: {
    name: 'Call to Action',
    fields: [
      { key: 'badge', label: 'Badge Label', type: 'text' },
      { key: 'heading', label: 'Section Heading', type: 'text' },
      { key: 'description', label: 'Section Description', type: 'textarea' },
      { key: 'card1Subtitle', label: 'Card 1 - Subtitle', type: 'text' },
      { key: 'card1Title', label: 'Card 1 - Title', type: 'text' },
      { key: 'card1Description', label: 'Card 1 - Description', type: 'textarea' },
      { key: 'card1ButtonText', label: 'Card 1 - Button Text', type: 'text' },
      { key: 'card2Subtitle', label: 'Card 2 - Subtitle', type: 'text' },
      { key: 'card2Title', label: 'Card 2 - Title', type: 'text' },
      { key: 'card2Description', label: 'Card 2 - Description', type: 'textarea' },
      { key: 'card2ButtonText', label: 'Card 2 - Button Text', type: 'text' },
      { key: 'stat1Value', label: 'Stat 1 - Value', type: 'text' },
      { key: 'stat1Label', label: 'Stat 1 - Label', type: 'text' },
      { key: 'stat2Value', label: 'Stat 2 - Value', type: 'text' },
      { key: 'stat2Label', label: 'Stat 2 - Label', type: 'text' },
      { key: 'stat3Value', label: 'Stat 3 - Value', type: 'text' },
      { key: 'stat3Label', label: 'Stat 3 - Label', type: 'text' },
      { key: 'stat4Value', label: 'Stat 4 - Value', type: 'text' },
      { key: 'stat4Label', label: 'Stat 4 - Label', type: 'text' },
    ],
  },
};

const ROLE_HIERARCHY = ['owner', 'manager', 'coach', 'admin'];

/**
 * Role-based section permissions.
 * owner/admin/super_admin → all sections
 * coach → training, team_preview
 * marketing/editor → hero, about, glory, cta
 */
const ROLE_SECTION_PERMISSIONS = {
  owner: Object.keys(SECTION_DEFINITIONS),
  admin: Object.keys(SECTION_DEFINITIONS),
  super_admin: Object.keys(SECTION_DEFINITIONS),
  coach: ['training', 'team_preview'],
  marketing: ['hero', 'about', 'glory', 'cta'],
  editor: ['hero', 'about', 'glory', 'cta'],
};

const SECTION_DESCRIPTIONS = {
  hero: 'Main banner — the first thing visitors see',
  about: 'Club introduction with image and stats',
  glory: 'League standing and achievements display',
  training: 'Training ground info, features, and map location',
  team_preview: 'Staff members preview on homepage',
  cta: 'Call-to-action cards for joining the club',
};

class ContentManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'content',
      // Site Content
      contentData: {},
      editingSection: null,
      editedValues: {},
      loadingContent: true,
      savingSection: false,
      contentError: null,
      // Staff
      staff: [],
      loadingStaff: true,
      staffError: null,
      draggedStaff: null,
      // News
      articles: [],
      loadingNews: true,
      newsError: null,
      editingArticle: null,
      articleForm: { title: '', description: '', image_url: '', is_published: false },
      savingArticle: false,
      // Shared
      showNotification: false,
      notificationMessage: '',
      uploadingImage: false,
    };
    this.imageInputRef = React.createRef();
    this.articleImageRef = React.createRef();
  }

  componentDidMount() {
    this.fetchContent();
    this.fetchStaff();
    this.fetchArticles();
  }

  /**
   * Get allowed section keys based on the user's roles.
   */
  getAllowedSections = () => {
    const { user } = this.props;
    if (!user) return Object.keys(SECTION_DEFINITIONS);
    const userRoles = user.roles || (user.role ? [user.role] : []);
    const allowed = new Set();
    userRoles.forEach((role) => {
      const sections = ROLE_SECTION_PERMISSIONS[role];
      if (sections) sections.forEach((s) => allowed.add(s));
    });
    // If no matching role found (fallback), show all sections
    return allowed.size > 0 ? Array.from(allowed) : Object.keys(SECTION_DEFINITIONS);
  };

  // ─── Notifications ──────────────────────────────────────────────

  showNotification = (message) => {
    this.setState({ showNotification: true, notificationMessage: message });
    setTimeout(() => this.setState({ showNotification: false }), 3000);
  };

  // ─── Site Content ───────────────────────────────────────────────

  fetchContent = async () => {
    this.setState({ loadingContent: true, contentError: null });
    try {
      const { data, error } = await supabase.from('site_content').select('key, value');
      if (error) throw error;
      const contentData = {};
      if (data) data.forEach((row) => { contentData[row.key] = row.value || {}; });
      this.setState({ contentData, loadingContent: false });
    } catch (err) {
      console.error('Error fetching site content:', err);
      this.setState({ contentError: err.message, loadingContent: false });
    }
  };

  hasContentData = () => {
    const { contentData } = this.state;
    return Object.keys(contentData).some((key) => key in SECTION_DEFINITIONS);
  };

  createDefaultSections = async () => {
    this.setState({ savingSection: true });
    try {
      const defaults = {
        hero: {
          clubName: 'KABOONA',
          clubSuffix: 'FC',
          tagline: 'Rise to Glory',
          ctaText1: 'Join the Team',
          ctaText2: 'Become a Fan',
        },
        about: {
          badge: 'ABOUT THE CLUB',
          title: 'Kaboona FC',
          location: '',
          description: '',
          image: '',
          stat1Value: '', stat1Label: '',
          stat2Value: '', stat2Label: '',
          stat3Value: '', stat3Label: '',
          stat4Value: '', stat4Label: '',
        },
        glory: {
          badge: 'GLORY SECTION',
          heading: 'League Standing',
          leagueTitle: 'The New Camp Edition (Division 3)',
          achievementsBadge: 'ACHIEVEMENTS',
          achievementsHeading: 'Our Stars',
          shameBadge: 'HALL OF INFAMY',
          shameHeading: 'Wall of Shame',
        },
        training: {
          badge: 'TRAINING GROUND',
          title: '',
          description: '',
          image: '',
          feature1: '', feature2: '', feature3: '', feature4: '',
          groundLabel: 'Training Ground',
          lat: '3.0673',
          lng: '101.6038',
        },
        team_preview: {
          badge: 'OUR STAFF',
          heading: 'Meet Our Team',
          description: 'The people who lead, manage, and coach Kaboona FC to success.',
        },
        cta: {
          badge: 'GET INVOLVED',
          heading: 'Join the Pride',
          description: 'Whether you want to play or support from the sidelines, there\'s a place for you at Kaboona FC.',
          card1Subtitle: 'Become a Player',
          card1Title: 'Join the Team',
          card1Description: 'Ready to take your game to the next level? Create an account and request to join the Kaboona FC squad.',
          card1ButtonText: 'Sign Up Now',
          card2Subtitle: 'Join the Community',
          card2Title: 'Become a Fan',
          card2Description: 'Support Kaboona FC from the stands! Get exclusive content, match updates, and be part of our growing fanbase.',
          card2ButtonText: 'Join Fan Portal',
          stat1Value: '100+', stat1Label: 'Active Members',
          stat2Value: '50+', stat2Label: 'Training Sessions',
          stat3Value: '3', stat3Label: 'Competitive Teams',
          stat4Value: '1', stat4Label: 'United Community',
        },
      };
      const rows = Object.entries(defaults).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      this.setState({ savingSection: false });
      await this.fetchContent();
    } catch (err) {
      console.error('Error creating default sections:', err);
      this.setState({ contentError: err.message, savingSection: false });
    }
  };

  startEditing = (sectionKey) => {
    const { contentData } = this.state;
    const sectionValues = contentData[sectionKey] || {};
    const definition = SECTION_DEFINITIONS[sectionKey];
    const editedValues = {};
    definition.fields.forEach((field) => {
      editedValues[field.key] = sectionValues[field.key] || '';
    });
    this.setState({ editingSection: sectionKey, editedValues });
  };

  handleFieldChange = (key, value) => {
    this.setState((prev) => ({ editedValues: { ...prev.editedValues, [key]: value } }));
  };

  uploadSectionImage = async (sectionKey, fieldKey, file) => {
    this.setState({ uploadingImage: true });
    try {
      const ext = file.name.split('.').pop();
      const path = `sections/${sectionKey}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('site-content').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('site-content').getPublicUrl(path);
      this.handleFieldChange(fieldKey, publicUrl);
      this.setState({ uploadingImage: false });
    } catch (err) {
      console.error('Error uploading image:', err);
      this.setState({ uploadingImage: false });
      this.showNotification('Failed to upload image');
    }
  };

  saveSection = async () => {
    const { editingSection, editedValues } = this.state;
    this.setState({ savingSection: true });
    try {
      const { error } = await supabase.from('site_content').upsert(
        { key: editingSection, value: editedValues },
        { onConflict: 'key' }
      );
      if (error) throw error;
      this.setState((prev) => ({
        contentData: { ...prev.contentData, [editingSection]: { ...editedValues } },
        editingSection: null,
        editedValues: {},
        savingSection: false,
      }));
      this.showNotification('Content saved successfully!');
    } catch (err) {
      console.error('Error saving section:', err);
      this.setState({ contentError: err.message, savingSection: false });
    }
  };

  cancelEditing = () => {
    this.setState({ editingSection: null, editedValues: {} });
  };

  // ─── Staff ──────────────────────────────────────────────────────

  fetchStaff = async () => {
    this.setState({ loadingStaff: true, staffError: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, roles, profile_image_url');
      if (error) throw error;
      const staffRoles = ['coach', 'manager', 'admin', 'owner'];
      const staffMembers = (data || []).filter((profile) => {
        if (Array.isArray(profile.roles)) return profile.roles.some((r) => staffRoles.includes(r));
        return staffRoles.includes(profile.role);
      });
      staffMembers.sort((a, b) => {
        const aIdx = ROLE_HIERARCHY.indexOf(this.getHighestRole(a));
        const bIdx = ROLE_HIERARCHY.indexOf(this.getHighestRole(b));
        return (aIdx === -1 ? ROLE_HIERARCHY.length : aIdx) - (bIdx === -1 ? ROLE_HIERARCHY.length : bIdx);
      });
      this.setState({ staff: staffMembers, loadingStaff: false });
    } catch (err) {
      console.error('Error fetching staff:', err);
      this.setState({ staffError: err.message, loadingStaff: false });
    }
  };

  getHighestRole = (profile) => {
    if (Array.isArray(profile.roles) && profile.roles.length > 0) {
      let best = null;
      let bestIndex = ROLE_HIERARCHY.length;
      for (const r of profile.roles) {
        const idx = ROLE_HIERARCHY.indexOf(r);
        if (idx !== -1 && idx < bestIndex) { best = r; bestIndex = idx; }
      }
      return best || profile.roles[0];
    }
    return profile.role || 'staff';
  };

  getDisplayRole = (profile) => {
    const role = this.getHighestRole(profile);
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  handleDragStart = (e, staffId) => {
    this.setState({ draggedStaff: staffId });
    e.dataTransfer.effectAllowed = 'move';
  };

  handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  handleDrop = (e, targetId) => {
    e.preventDefault();
    const { staff, draggedStaff } = this.state;
    if (draggedStaff === targetId) return;
    const draggedIndex = staff.findIndex((s) => s.id === draggedStaff);
    const targetIndex = staff.findIndex((s) => s.id === targetId);
    const newStaff = [...staff];
    const [removed] = newStaff.splice(draggedIndex, 1);
    newStaff.splice(targetIndex, 0, removed);
    this.setState({ staff: newStaff, draggedStaff: null });
  };

  handleDragEnd = () => { this.setState({ draggedStaff: null }); };

  // ─── News Articles ──────────────────────────────────────────────

  fetchArticles = async () => {
    this.setState({ loadingNews: true, newsError: null });
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this.setState({ articles: data || [], loadingNews: false });
    } catch (err) {
      console.error('Error fetching articles:', err);
      this.setState({ newsError: err.message, loadingNews: false });
    }
  };

  openArticleForm = (article = null) => {
    if (article) {
      this.setState({
        editingArticle: article.id,
        articleForm: {
          title: article.title,
          description: article.description,
          image_url: article.image_url || '',
          is_published: article.is_published,
        },
      });
    } else {
      this.setState({
        editingArticle: 'new',
        articleForm: { title: '', description: '', image_url: '', is_published: false },
      });
    }
  };

  closeArticleForm = () => {
    this.setState({ editingArticle: null, articleForm: { title: '', description: '', image_url: '', is_published: false } });
  };

  handleArticleFieldChange = (key, value) => {
    this.setState((prev) => ({ articleForm: { ...prev.articleForm, [key]: value } }));
  };

  uploadArticleImage = async (file) => {
    this.setState({ uploadingImage: true });
    try {
      const ext = file.name.split('.').pop();
      const path = `news/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('site-content').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('site-content').getPublicUrl(path);
      this.handleArticleFieldChange('image_url', publicUrl);
      this.setState({ uploadingImage: false });
    } catch (err) {
      console.error('Error uploading article image:', err);
      this.setState({ uploadingImage: false });
      this.showNotification('Failed to upload image');
    }
  };

  saveArticle = async () => {
    const { editingArticle, articleForm } = this.state;
    if (!articleForm.title.trim() || !articleForm.description.trim()) return;
    this.setState({ savingArticle: true });
    try {
      if (editingArticle === 'new') {
        const { error } = await supabase.from('news_articles').insert({
          title: articleForm.title,
          description: articleForm.description,
          image_url: articleForm.image_url || null,
          is_published: articleForm.is_published,
          published_at: new Date().toISOString(),
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('news_articles').update({
          title: articleForm.title,
          description: articleForm.description,
          image_url: articleForm.image_url || null,
          is_published: articleForm.is_published,
        }).eq('id', editingArticle);
        if (error) throw error;
      }
      this.setState({ savingArticle: false });
      this.closeArticleForm();
      this.showNotification(editingArticle === 'new' ? 'Article created!' : 'Article updated!');
      await this.fetchArticles();
    } catch (err) {
      console.error('Error saving article:', err);
      this.setState({ savingArticle: false });
      this.showNotification('Failed to save article');
    }
  };

  deleteArticle = async (id) => {
    try {
      const { error } = await supabase.from('news_articles').delete().eq('id', id);
      if (error) throw error;
      this.showNotification('Article deleted');
      await this.fetchArticles();
    } catch (err) {
      console.error('Error deleting article:', err);
      this.showNotification('Failed to delete article');
    }
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ─── Render Helpers ─────────────────────────────────────────────

  renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-4 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin mb-4" />
      <p className="text-white/50">Loading...</p>
    </div>
  );

  renderError = (message, onRetry) => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-14 h-14 bg-red-400/20 rounded-full flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-red-400 mb-2">Something went wrong</p>
      <p className="text-white/40 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
          Try Again
        </button>
      )}
    </div>
  );

  renderImageField = (fieldKey, currentValue, onUpload) => {
    const { uploadingImage } = this.state;
    return (
      <div>
        {currentValue && (
          <div className="mb-3 relative inline-block">
            <img src={currentValue} alt="" className="h-32 rounded-lg object-cover" />
            <button
              onClick={() => this.handleFieldChange(fieldKey, '')}
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
            {uploadingImage ? 'Uploading...' : currentValue ? 'Change image' : 'Upload image'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploadingImage}
            onChange={(e) => {
              if (e.target.files?.[0]) onUpload(e.target.files[0]);
            }}
          />
        </label>
      </div>
    );
  };

  // ─── Section Previews (read-only, mirroring homepage) ───────────

  renderSectionPreview = (sectionKey, data) => {
    switch (sectionKey) {
      case 'hero': return this.renderHeroPreview(data);
      case 'about': return this.renderAboutPreview(data);
      case 'glory': return this.renderGloryPreview(data);
      case 'training': return this.renderTrainingPreview(data);
      case 'team_preview': return this.renderTeamPreviewPreview(data);
      case 'cta': return this.renderCtaPreview(data);
      default: return null;
    }
  };

  renderHeroPreview = (data) => {
    const clubName = data.clubName || '';
    const clubSuffix = data.clubSuffix || '';
    const tagline = data.tagline || '';
    const ctaText1 = data.ctaText1 || '';
    const ctaText2 = data.ctaText2 || '';
    if (!clubName && !tagline) return <p className="text-white/30 italic text-center py-6">No content set</p>;
    return (
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-surface-dark via-surface-dark-elevated to-surface-dark p-8 text-center">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(212,175,55,0.1) 35px, rgba(212,175,55,0.1) 70px)',
          }} />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent-gold/10 rounded-full blur-[60px]" />
        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-4">
            <img src={`${import.meta.env.BASE_URL}kaboona-logo.png`} alt="" className="w-full h-full object-contain opacity-60" />
          </div>
          <h3 className="font-display text-4xl font-bold text-white tracking-wider">
            {clubName}
            {clubSuffix && <span className="block text-accent-gold text-2xl mt-1">{clubSuffix}</span>}
          </h3>
          {tagline && <p className="text-white/50 mt-3 text-lg">{tagline}</p>}
          {(ctaText1 || ctaText2) && (
            <div className="flex items-center justify-center gap-3 mt-6">
              {ctaText1 && <span className="px-4 py-2 bg-accent-gold/20 text-accent-gold text-sm rounded-lg">{ctaText1}</span>}
              {ctaText2 && <span className="px-4 py-2 border border-white/20 text-white/60 text-sm rounded-lg">{ctaText2}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  renderAboutPreview = (data) => {
    const badge = data.badge || '';
    const title = data.title || '';
    const location = data.location || '';
    const description = data.description || '';
    const image = data.image || '';
    const stats = [
      { value: data.stat1Value, label: data.stat1Label },
      { value: data.stat2Value, label: data.stat2Label },
      { value: data.stat3Value, label: data.stat3Label },
      { value: data.stat4Value, label: data.stat4Label },
    ].filter((s) => s.value || s.label);
    if (!badge && !title && !image) return <p className="text-white/30 italic text-center py-6">No content set</p>;
    return (
      <div>
        <div className={image ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start' : ''}>
          <div>
            {badge && <span className="inline-block px-3 py-1 bg-accent-gold/10 text-accent-gold text-xs font-semibold tracking-wider rounded-full mb-4">{badge}</span>}
            {title && <h3 className="text-2xl font-display font-bold text-white mb-2">Home of <span className="text-accent-gold">{title}</span></h3>}
            {location && <p className="text-white/50 mb-3">{location}</p>}
            {description && <p className="text-white/40 text-sm leading-relaxed">{description}</p>}
          </div>
          {image && (
            <div className="relative">
              <div className="aspect-[4/3] rounded-xl overflow-hidden">
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 border-2 border-accent-gold/20 rounded-xl" />
            </div>
          )}
        </div>
        {stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {stats.map((stat, i) => (
              <div key={i} className="p-3 bg-surface-dark rounded-lg border border-white/5 text-center">
                <div className="text-lg font-display font-bold text-accent-gold">{stat.value || '—'}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">{stat.label || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  renderGloryPreview = (data) => {
    const badge = data.badge || '';
    const heading = data.heading || '';
    const leagueTitle = data.leagueTitle || '';
    const achievementsBadge = data.achievementsBadge || '';
    const achievementsHeading = data.achievementsHeading || '';
    const shameBadge = data.shameBadge || '';
    const shameHeading = data.shameHeading || '';
    if (!badge && !heading) return <p className="text-white/30 italic text-center py-6">No content set</p>;
    return (
      <div className="space-y-4">
        {badge && <span className="inline-block px-3 py-1 bg-accent-gold/10 text-accent-gold text-xs font-semibold tracking-wider rounded-full">{badge}</span>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-dark rounded-xl border border-white/5">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">League</p>
            {heading && <p className="text-white font-bold">{heading}</p>}
            {leagueTitle && <p className="text-accent-gold text-sm mt-1">{leagueTitle}</p>}
          </div>
          <div className="p-4 bg-surface-dark rounded-xl border border-white/5">
            {achievementsBadge && <p className="text-accent-gold text-xs font-semibold tracking-wider mb-1">{achievementsBadge}</p>}
            {achievementsHeading && <p className="text-white font-bold">{achievementsHeading}</p>}
          </div>
          <div className="p-4 bg-surface-dark rounded-xl border border-white/5">
            {shameBadge && <p className="text-red-400 text-xs font-semibold tracking-wider mb-1">{shameBadge}</p>}
            {shameHeading && <p className="text-white font-bold">{shameHeading}</p>}
          </div>
        </div>
      </div>
    );
  };

  renderTrainingPreview = (data) => {
    const badge = data.badge || '';
    const title = data.title || '';
    const description = data.description || '';
    const image = data.image || '';
    const features = [data.feature1, data.feature2, data.feature3, data.feature4].filter(Boolean);
    const lat = data.lat || '';
    const lng = data.lng || '';
    const groundLabel = data.groundLabel || '';
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-800 via-green-700 to-green-900 flex items-center justify-center">
              <span className="text-white/30 text-sm">No photo uploaded</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/60 via-transparent to-transparent" />
          {groundLabel && (
            <div className="absolute bottom-3 left-3">
              <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg">
                <p className="text-white/90 text-xs font-medium">{groundLabel}</p>
              </div>
            </div>
          )}
        </div>
        {/* Content */}
        <div>
          {badge && <span className="inline-block px-3 py-1 bg-accent-gold/10 text-accent-gold text-xs font-semibold tracking-wider rounded-full mb-3">{badge}</span>}
          {title && <h3 className="text-xl font-display font-bold text-white mb-2">{title}</h3>}
          {description && <p className="text-white/40 text-sm leading-relaxed mb-4">{description}</p>}
          {features.length > 0 && (
            <div className="space-y-2 mb-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-accent-gold/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/60 text-sm">{f}</span>
                </div>
              ))}
            </div>
          )}
          {(lat || lng) && (
            <div className="p-3 bg-surface-dark rounded-lg border border-white/5">
              <p className="text-white/30 text-xs uppercase tracking-wider mb-1">GPS Coordinates</p>
              <p className="text-white/70 font-mono text-sm">
                {lat}&deg;{parseFloat(lat) >= 0 ? 'N' : 'S'}, {lng}&deg;{parseFloat(lng) >= 0 ? 'E' : 'W'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  renderTeamPreviewPreview = (data) => {
    const badge = data.badge || '';
    const heading = data.heading || '';
    const description = data.description || '';
    if (!badge && !heading && !description) return <p className="text-white/30 italic text-center py-6">No content set</p>;
    return (
      <div className="text-center py-4">
        {badge && <span className="inline-block px-3 py-1 bg-accent-gold/10 text-accent-gold text-xs font-semibold tracking-wider rounded-full mb-4">{badge}</span>}
        {heading && <h3 className="text-2xl font-display font-bold text-white mb-3">{heading}</h3>}
        {description && <p className="text-white/40 max-w-lg mx-auto">{description}</p>}
      </div>
    );
  };

  renderCtaPreview = (data) => {
    const badge = data.badge || '';
    const heading = data.heading || '';
    const description = data.description || '';
    const stats = [
      { value: data.stat1Value, label: data.stat1Label },
      { value: data.stat2Value, label: data.stat2Label },
      { value: data.stat3Value, label: data.stat3Label },
      { value: data.stat4Value, label: data.stat4Label },
    ].filter((s) => s.value || s.label);
    if (!badge && !heading) return <p className="text-white/30 italic text-center py-6">No content set</p>;
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          {badge && <span className="inline-block px-3 py-1 bg-white/5 text-white/50 text-xs font-semibold tracking-wider rounded-full mb-3">{badge}</span>}
          {heading && (
            <h3 className="text-2xl font-display font-bold text-white">
              {heading.includes('Pride') ? <>Join the <span className="text-accent-gold">Pride</span></> : heading}
            </h3>
          )}
          {description && <p className="text-white/40 text-sm mt-2 max-w-lg mx-auto">{description}</p>}
        </div>
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-accent-gold/10 to-transparent border border-accent-gold/20">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{data.card1Subtitle || ''}</p>
            <h4 className="text-lg font-display font-bold text-white mb-2">{data.card1Title || ''}</h4>
            <p className="text-white/40 text-xs leading-relaxed mb-3">{data.card1Description || ''}</p>
            {data.card1ButtonText && <span className="inline-block px-3 py-1.5 bg-accent-gold/20 text-accent-gold text-xs rounded-lg">{data.card1ButtonText}</span>}
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary-blue/10 to-transparent border border-secondary-blue/20">
            <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{data.card2Subtitle || ''}</p>
            <h4 className="text-lg font-display font-bold text-white mb-2">{data.card2Title || ''}</h4>
            <p className="text-white/40 text-xs leading-relaxed mb-3">{data.card2Description || ''}</p>
            {data.card2ButtonText && <span className="inline-block px-3 py-1.5 bg-secondary-blue/20 text-secondary-blue text-xs rounded-lg">{data.card2ButtonText}</span>}
          </div>
        </div>
        {/* Stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface-dark rounded-xl border border-white/5">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-display font-bold text-accent-gold">{s.value || '—'}</div>
                <div className="text-xs text-white/40 uppercase tracking-wider">{s.label || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────

  render() {
    const {
      activeTab, contentData, editingSection, editedValues, savingSection,
      loadingContent, contentError,
      staff, loadingStaff, staffError, draggedStaff,
      articles, loadingNews, newsError, editingArticle, articleForm, savingArticle,
      showNotification, notificationMessage, uploadingImage,
    } = this.state;

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold text-white">Content Management</h1>
          <p className="text-white/50 mt-1">Edit homepage content, manage news articles, and staff display</p>
        </motion.div>

        {/* Notification */}
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {notificationMessage}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-2">
          {[
            { id: 'content', label: 'Site Content' },
            { id: 'news', label: 'News Articles' },
            { id: 'staff', label: 'Coaches & Staff' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => this.setState({ activeTab: tab.id })}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent-gold text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* ═══════ SITE CONTENT TAB ═══════ */}
        {activeTab === 'content' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-6">
            {loadingContent ? this.renderLoading() : contentError ? this.renderError(contentError, this.fetchContent) : !this.hasContentData() ? (
              <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-display font-bold text-lg mb-2">No content configured</h3>
                <p className="text-white/50 mb-6">Get started by creating the default content sections for your site.</p>
                <button
                  onClick={this.createDefaultSections}
                  disabled={savingSection}
                  className="px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50"
                >
                  {savingSection ? 'Creating...' : 'Create Default Sections'}
                </button>
              </div>
            ) : (
              Object.entries(SECTION_DEFINITIONS).filter(([sectionKey]) => this.getAllowedSections().includes(sectionKey)).map(([sectionKey, definition]) => {
                const sectionValues = contentData[sectionKey] || {};
                const isEditing = editingSection === sectionKey;

                return (
                  <div key={sectionKey} className="bg-surface-dark-elevated rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-display font-bold text-white">{definition.name}</h3>
                        {SECTION_DESCRIPTIONS[sectionKey] && (
                          <p className="text-white/40 text-sm mt-0.5">{SECTION_DESCRIPTIONS[sectionKey]}</p>
                        )}
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => this.startEditing(sectionKey)}
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
                            disabled={savingSection}
                            className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={this.saveSection}
                            disabled={savingSection || uploadingImage}
                            className="px-4 py-2 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {savingSection && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                            {savingSection ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      {isEditing ? (
                        <div className="space-y-4">
                          {definition.fields.map((field) => (
                            <div key={field.key}>
                              <label className="block text-white/60 text-sm mb-2">{field.label}</label>
                              {field.type === 'image' ? (
                                this.renderImageField(
                                  field.key,
                                  editedValues[field.key],
                                  (file) => this.uploadSectionImage(sectionKey, field.key, file)
                                )
                              ) : field.type === 'textarea' ? (
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
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        this.renderSectionPreview(sectionKey, sectionValues)
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ═══════ NEWS ARTICLES TAB ═══════ */}
        {activeTab === 'news' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-6">
            {/* Article Form Modal */}
            {editingArticle && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={this.closeArticleForm}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface-dark-elevated rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-display font-bold text-white mb-6">
                    {editingArticle === 'new' ? 'New Article' : 'Edit Article'}
                  </h3>

                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Title</label>
                      <input
                        type="text"
                        value={articleForm.title}
                        onChange={(e) => this.handleArticleFieldChange('title', e.target.value)}
                        placeholder="Article title..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Description</label>
                      <textarea
                        value={articleForm.description}
                        onChange={(e) => this.handleArticleFieldChange('description', e.target.value)}
                        placeholder="Article content..."
                        rows={6}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold resize-none"
                      />
                    </div>

                    {/* Image */}
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Image</label>
                      {articleForm.image_url && (
                        <div className="mb-3 relative inline-block">
                          <img src={articleForm.image_url} alt="" className="h-40 rounded-lg object-cover" />
                          <button
                            onClick={() => this.handleArticleFieldChange('image_url', '')}
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
                          {uploadingImage ? 'Uploading...' : articleForm.image_url ? 'Change image' : 'Upload image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={(e) => {
                            if (e.target.files?.[0]) this.uploadArticleImage(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>

                    {/* Published Toggle */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => this.handleArticleFieldChange('is_published', !articleForm.is_published)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          articleForm.is_published ? 'bg-green-500' : 'bg-white/20'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          articleForm.is_published ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <span className="text-white/70 text-sm">
                        {articleForm.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                    <button
                      onClick={this.closeArticleForm}
                      className="px-5 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={this.saveArticle}
                      disabled={savingArticle || !articleForm.title.trim() || !articleForm.description.trim()}
                      className="px-5 py-2.5 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingArticle && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                      {savingArticle ? 'Saving...' : editingArticle === 'new' ? 'Create Article' : 'Save Changes'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Add Article Button */}
            <div className="flex justify-end">
              <button
                onClick={() => this.openArticleForm()}
                className="px-5 py-2.5 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Article
              </button>
            </div>

            {loadingNews ? this.renderLoading() : newsError ? this.renderError(newsError, this.fetchArticles) : articles.length === 0 ? (
              <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <h3 className="text-white font-display font-bold text-lg mb-2">No articles yet</h3>
                <p className="text-white/50 mb-4">Create your first news article for the Fan Portal.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-surface-dark-elevated rounded-xl border border-white/10 p-4 flex items-center gap-4 group"
                  >
                    {/* Thumbnail */}
                    {article.image_url ? (
                      <img src={article.image_url} alt="" className="w-20 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-14 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{article.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-white/40 text-xs">{this.formatDate(article.published_at)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          article.is_published
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {article.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => this.openArticleForm(article)}
                        className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => this.deleteArticle(article.id)}
                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════ STAFF TAB ═══════ */}
        {activeTab === 'staff' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {loadingStaff ? this.renderLoading() : staffError ? this.renderError(staffError, this.fetchStaff) : staff.length === 0 ? (
              <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-display font-bold text-lg mb-2">No staff members found</h3>
                <p className="text-white/50">Staff members will appear here once users are assigned roles.</p>
              </div>
            ) : (
              <div className="bg-surface-dark-elevated rounded-xl border border-white/10 p-6">
                <div className="mb-4">
                  <p className="text-white/60 text-sm">Drag and drop to reorder staff display</p>
                </div>
                <div className="space-y-3">
                  {staff.map((member, index) => (
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
                      <div className="text-white/30">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                      <div className="w-8 h-8 bg-accent-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-gold font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {member.profile_image_url ? (
                          <img src={member.profile_image_url} alt={member.full_name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{member.full_name || 'Unnamed'}</p>
                        <p className="text-white/50 text-sm">{this.getDisplayRole(member)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  }
}

export default ContentManagement;

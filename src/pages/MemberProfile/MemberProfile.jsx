import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';

/**
 * Public Member Profile page for non-player staff/owners
 * Shows profile info and a contact form
 */
class MemberProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: null,
      roles: [],
      isLoading: true,
      error: null,
      // Contact form
      senderName: '',
      senderEmail: '',
      message: '',
      sending: false,
      sent: false,
      sendError: null,
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.loadProfile();
  }

  getProfileId = () => {
    const path = window.location.pathname;
    const match = path.match(/\/member\/(.+)/);
    return match ? match[1] : null;
  };

  loadProfile = async () => {
    const profileId = this.getProfileId();
    if (!profileId) {
      this.setState({ error: 'Member not found', isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, roles, profile_image_url, bio')
        .eq('id', profileId)
        .single();

      if (error) throw error;

      // Also try to get player image as fallback
      let image = data.profile_image_url;
      if (!image) {
        const { data: playerImg } = await supabase
          .from('players')
          .select('image')
          .eq('user_id', profileId)
          .limit(1);
        if (playerImg?.[0]?.image) image = playerImg[0].image;
      }

      this.setState({
        profile: { ...data, image },
        roles: data.roles || [data.role].filter(Boolean),
        isLoading: false,
      });
    } catch (err) {
      console.error('Error loading member profile:', err);
      this.setState({ error: 'Member not found', isLoading: false });
    }
  };

  getRoleLabel = (role) => {
    const labels = {
      owner: 'Team Owner',
      admin: 'Administrator',
      manager: 'Manager',
      coach: 'Coach',
      editor: 'Content Manager',
      marketing: 'Marketing',
    };
    return labels[role] || role;
  };

  getRoleColor = (role) => {
    const colors = {
      owner: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/20',
      admin: 'bg-red-400/10 text-red-300 border-red-400/20',
      manager: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
      coach: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
      editor: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
      marketing: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
    };
    return colors[role] || 'bg-white/10 text-white/60 border-white/20';
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { senderName, senderEmail, message } = this.state;
    const profileId = this.getProfileId();

    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) return;

    this.setState({ sending: true, sendError: null });

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          recipient_id: profileId,
          sender_name: senderName.trim(),
          sender_email: senderEmail.trim(),
          message: message.trim(),
        });

      if (error) throw error;

      this.setState({
        sent: true,
        sending: false,
        senderName: '',
        senderEmail: '',
        message: '',
      });
    } catch (err) {
      console.error('Error sending message:', err);
      this.setState({ sendError: 'Failed to send message. Please try again.', sending: false });
    }
  };

  renderContactForm = () => {
    const { senderName, senderEmail, message, sending, sent, sendError } = this.state;

    if (sent) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface-dark-elevated rounded-xl p-8 border border-green-500/20 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-display font-bold text-white mb-2">Message Sent!</h3>
          <p className="text-gray-400 mb-4">Your message has been delivered successfully.</p>
          <button
            onClick={() => this.setState({ sent: false })}
            className="text-accent-gold hover:underline text-sm"
          >
            Send another message
          </button>
        </motion.div>
      );
    }

    return (
      <form onSubmit={this.handleSubmit} className="bg-surface-dark-elevated rounded-xl p-6 border border-white/5">
        <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Get in Touch
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Your Name</label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => this.setState({ senderName: e.target.value })}
              required
              className="w-full px-4 py-3 bg-surface-dark border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Your Email</label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => this.setState({ senderEmail: e.target.value })}
              required
              className="w-full px-4 py-3 bg-surface-dark border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold transition-colors"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => this.setState({ message: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-3 bg-surface-dark border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold transition-colors resize-none"
              placeholder="Write your message..."
            />
          </div>

          {sendError && (
            <p className="text-red-400 text-sm">{sendError}</p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </div>
      </form>
    );
  };

  render() {
    const { profile, roles, isLoading, error } = this.state;

    if (isLoading) {
      return (
        <div className="min-h-screen bg-surface-dark flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (error || !profile) {
      return (
        <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl font-display font-bold text-white mb-4">Member Not Found</h1>
          <p className="text-gray-400 mb-6">The member you're looking for doesn't exist.</p>
          <Link
            to="/our-team"
            className="px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold/90 transition-colors"
          >
            View Our Team
          </Link>
        </div>
      );
    }

    const primaryRole = roles.find(r => r === 'owner') || roles[0] || 'member';

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-20">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated to-surface-dark" />

          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Profile Image */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-shrink-0 mx-auto md:mx-0"
              >
                <div
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-4"
                  style={{ borderColor: primaryRole === 'owner' ? '#E8E4C9' : '#D4AF37' }}
                >
                  {profile.image ? (
                    <img
                      src={profile.image}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: primaryRole === 'owner'
                          ? 'linear-gradient(135deg, #F5F5DC 0%, #E8E4C9 100%)'
                          : 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                      }}
                    >
                      <span className="text-6xl font-display font-bold" style={{
                        color: primaryRole === 'owner' ? '#1a1a1a' : '#D4AF37'
                      }}>
                        {profile.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Profile Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-grow w-full"
              >
                {/* Role Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full border ${this.getRoleColor(role)}`}
                    >
                      {this.getRoleLabel(role)}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                  {profile.full_name}
                </h1>

                {/* Bio */}
                {profile.bio && (
                  <div className="bg-surface-dark-elevated rounded-xl p-6 mb-6 border border-white/5">
                    <h3 className="text-lg font-display text-accent-gold mb-2 uppercase tracking-wider">
                      About
                    </h3>
                    <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Contact Form */}
                {this.renderContactForm()}
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  currentUser: state.auth?.user,
});

export default connect(mapStateToProps)(MemberProfile);

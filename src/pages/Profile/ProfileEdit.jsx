import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PlayerFIFACard from './components/PlayerFIFACard';
import StatSlider from './components/StatSlider';

/**
 * Profile Edit page
 * Allows users to edit personal info, player info, and self-rated stats
 */
class ProfileEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      isSaving: false,
      hasChanges: false,
      formData: {
        // Personal Info
        name: '',
        email: '',
        profilePhoto: null,

        // Player Info
        position: 'CAM',
        number: 10,
        height: '',
        weight: '',
        preferredFoot: 'Right',
        country: 'gb',

        // Stats (self-rated)
        stats: {
          pace: 70,
          shooting: 70,
          passing: 70,
          dribbling: 70,
          defending: 50,
          physical: 60,
        },
      },
      errors: {},
    };
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.loadProfileData();
  }

  loadProfileData = () => {
    setTimeout(() => {
      const { user } = this.props;

      const mockData = {
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player',
        email: user?.email || 'player@kaboonafc.com',
        profilePhoto: null,
        position: 'CAM',
        number: 10,
        height: '178',
        weight: '72',
        preferredFoot: 'Right',
        country: 'gb',
        stats: {
          pace: 78,
          shooting: 82,
          passing: 85,
          dribbling: 80,
          defending: 45,
          physical: 68,
        },
      };

      this.setState({
        isLoading: false,
        formData: mockData,
      });
    }, 500);
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState((prevState) => ({
      formData: {
        ...prevState.formData,
        [name]: value,
      },
      hasChanges: true,
      errors: {
        ...prevState.errors,
        [name]: null,
      },
    }));
  };

  handleStatChange = (statName, value) => {
    this.setState((prevState) => ({
      formData: {
        ...prevState.formData,
        stats: {
          ...prevState.formData.stats,
          [statName]: value,
        },
      },
      hasChanges: true,
    }));
  };

  handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.setState((prevState) => ({
          formData: {
            ...prevState.formData,
            profilePhoto: reader.result,
          },
          hasChanges: true,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  validateForm = () => {
    const { formData } = this.state;
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (formData.number < 1 || formData.number > 99) {
      errors.number = 'Jersey number must be between 1-99';
    }

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    this.setState({ isSaving: true });

    // Simulate API call
    setTimeout(() => {
      this.setState({ isSaving: false, hasChanges: false });
      // Show success message or redirect
      console.log('Profile saved:', this.state.formData);
    }, 1000);
  };

  handleManageSubscription = () => {
    console.log('Managing subscription...');
  };

  renderLoadingState = () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4">
          <svg
            className="animate-spin w-full h-full text-accent-gold"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="text-white/60">Loading profile...</p>
      </motion.div>
    </div>
  );

  render() {
    const { isLoading, isSaving, hasChanges, formData, errors } = this.state;

    if (isLoading) {
      return this.renderLoadingState();
    }

    const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'];
    const isGoalkeeper = formData.position === 'GK';

    // Stats configuration based on position
    const statsConfig = isGoalkeeper
      ? [
          { name: 'diving', label: 'DIV - Diving', description: 'Shot stopping ability' },
          { name: 'handling', label: 'HAN - Handling', description: 'Ball control and catching' },
          { name: 'kicking', label: 'KIC - Kicking', description: 'Distribution with feet' },
          { name: 'reflexes', label: 'REF - Reflexes', description: 'Reaction speed' },
          { name: 'speed', label: 'SPD - Speed', description: 'Movement speed' },
          { name: 'positioning', label: 'POS - Positioning', description: 'Tactical positioning' },
        ]
      : [
          { name: 'pace', label: 'PAC - Pace', description: 'Sprint speed and acceleration' },
          { name: 'shooting', label: 'SHO - Shooting', description: 'Finishing and shot power' },
          { name: 'passing', label: 'PAS - Passing', description: 'Vision and passing accuracy' },
          { name: 'dribbling', label: 'DRI - Dribbling', description: 'Ball control and agility' },
          { name: 'defending', label: 'DEF - Defending', description: 'Tackling and interceptions' },
          { name: 'physical', label: 'PHY - Physical', description: 'Strength and stamina' },
        ];

    // Initialize GK stats if switching to goalkeeper
    const currentStats = isGoalkeeper
      ? {
          diving: formData.stats.diving || 70,
          handling: formData.stats.handling || 70,
          kicking: formData.stats.kicking || 70,
          reflexes: formData.stats.reflexes || 70,
          speed: formData.stats.speed || 60,
          positioning: formData.stats.positioning || 70,
        }
      : formData.stats;

    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        {/* Header */}
        <div className="bg-gradient-to-b from-accent-gold/10 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8">
            {/* Breadcrumb */}
            <motion.div
              className="flex items-center gap-2 text-sm mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Link to="/profile" className="text-white/60 hover:text-white transition-colors">
                Profile
              </Link>
              <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-accent-gold">Edit Profile</span>
            </motion.div>

            {/* Page Header */}
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div>
                <h1 className="text-4xl font-display font-bold text-white uppercase tracking-wider">
                  Edit Profile
                </h1>
                <p className="text-white/60 mt-2">
                  Update your player information and stats
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                <Link
                  to="/profile"
                  className="px-6 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </Link>
                <motion.button
                  onClick={this.handleSubmit}
                  disabled={isSaving || !hasChanges}
                  className={`px-6 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 ${
                    hasChanges
                      ? 'bg-accent-gold text-black hover:bg-accent-gold-light'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                  whileHover={hasChanges ? { scale: 1.02 } : {}}
                  whileTap={hasChanges ? { scale: 0.98 } : {}}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Live FIFA Card Preview */}
            <div className="lg:col-span-4">
              <motion.div
                className="sticky top-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4">
                  Live Preview
                </h3>
                <div className="flex justify-center">
                  <PlayerFIFACard
                    name={formData.name}
                    position={formData.position}
                    number={parseInt(formData.number) || 10}
                    country={formData.country}
                    image={formData.profilePhoto}
                    stats={currentStats}
                  />
                </div>
              </motion.div>
            </div>

            {/* Right Column - Edit Forms */}
            <div className="lg:col-span-8 space-y-8">
              {/* Personal Information */}
              <motion.div
                className="bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="px-6 py-4 border-b border-accent-gold/20">
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                    Personal Information
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Profile Photo */}
                  <div>
                    <label className="block text-white/60 text-sm mb-3">Profile Photo</label>
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-surface-dark border-2 border-accent-gold/30 overflow-hidden flex items-center justify-center">
                        {formData.profilePhoto ? (
                          <img
                            src={formData.profilePhoto}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={this.handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-white/40 text-xs mt-2">JPG, PNG or GIF. Max 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Display Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={this.handleInputChange}
                      className={`w-full px-4 py-3 bg-surface-dark border rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold transition-colors ${
                        errors.name ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Enter your name"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-4 py-3 bg-surface-dark border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                    />
                    <p className="text-white/40 text-xs mt-1">Email cannot be changed</p>
                  </div>
                </div>
              </motion.div>

              {/* Player Information */}
              <motion.div
                className="bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="px-6 py-4 border-b border-accent-gold/20">
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                    Player Information
                  </h3>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Position */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Position</label>
                    <select
                      name="position"
                      value={formData.position}
                      onChange={this.handleInputChange}
                      className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer"
                    >
                      {positions.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>

                  {/* Jersey Number */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Jersey Number</label>
                    <input
                      type="number"
                      name="number"
                      min="1"
                      max="99"
                      value={formData.number}
                      onChange={this.handleInputChange}
                      className={`w-full px-4 py-3 bg-surface-dark border rounded-lg text-white focus:outline-none focus:border-accent-gold transition-colors ${
                        errors.number ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {errors.number && (
                      <p className="text-red-400 text-sm mt-1">{errors.number}</p>
                    )}
                  </div>

                  {/* Height */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Height (cm)</label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={this.handleInputChange}
                      className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent-gold transition-colors"
                      placeholder="175"
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={this.handleInputChange}
                      className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent-gold transition-colors"
                      placeholder="70"
                    />
                  </div>

                  {/* Preferred Foot */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Preferred Foot</label>
                    <select
                      name="preferredFoot"
                      value={formData.preferredFoot}
                      onChange={this.handleInputChange}
                      className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Right">Right</option>
                      <option value="Left">Left</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Country</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={this.handleInputChange}
                      className="w-full px-4 py-3 bg-surface-dark border border-white/20 rounded-lg text-white focus:outline-none focus:border-accent-gold transition-colors appearance-none cursor-pointer"
                    >
                      <option value="gb">United Kingdom</option>
                      <option value="us">United States</option>
                      <option value="es">Spain</option>
                      <option value="de">Germany</option>
                      <option value="fr">France</option>
                      <option value="it">Italy</option>
                      <option value="br">Brazil</option>
                      <option value="ar">Argentina</option>
                      <option value="pt">Portugal</option>
                      <option value="nl">Netherlands</option>
                    </select>
                  </div>
                </div>
              </motion.div>

              {/* Self-Rated Stats */}
              <motion.div
                className="bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="px-6 py-4 border-b border-accent-gold/20">
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                    Self-Rated Stats
                  </h3>
                  <p className="text-white/50 text-sm mt-1">
                    Rate your own abilities (1-99). Be honest - your coach may adjust these!
                  </p>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {statsConfig.map((stat, index) => (
                    <motion.div
                      key={stat.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                    >
                      <StatSlider
                        name={stat.name}
                        label={stat.label}
                        description={stat.description}
                        value={currentStats[stat.name] || 50}
                        onChange={this.handleStatChange}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Subscription Management */}
              <motion.div
                className="bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="px-6 py-4 border-b border-accent-gold/20">
                  <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                    Subscription Management
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-surface-dark rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">Pro Player Plan</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                          Current
                        </span>
                      </div>
                      <p className="text-white/50 text-sm">$19.99/month - Next billing: Feb 15, 2024</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <motion.button
                      className="px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Upgrade Plan
                    </motion.button>
                    <motion.button
                      className="px-6 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Change Plan
                    </motion.button>
                    <motion.button
                      className="px-6 py-3 border border-red-500/30 text-red-400 font-medium rounded-lg hover:bg-red-500/10 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel Subscription
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(ProfileEdit);

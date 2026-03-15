import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PlayerFIFACard from './components/PlayerFIFACard';
import StatSlider from './components/StatSlider';
import { supabase } from '../../services/supabase';
import { setUser } from '../../redux/slices/authSlice';
import { createNotification } from '../../services/notificationService';
import CountrySelect from '../../components/common/CountrySelect';

/**
 * Profile Edit page
 * Allows users to edit personal info, player info, and self-rated stats
 * Supports wizard mode when ?setup=true is in URL
 */
class ProfileEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      isSaving: false,
      hasChanges: false,
      redirectToProfile: false,
      photoFile: null, // Store the actual file for upload
      isSetup: false,
      setupStep: 1,
      isPlayer: false,
      formData: {
        // Personal Info
        name: '',
        email: '',
        profilePhoto: null,

        // Player Info
        position: 'CAM',
        alternatePositions: [],
        number: 10,
        height: '',
        weight: '',
        preferredFoot: 'Right',
        country: 'gb',
        skillMoves: 3,
        weakFoot: 3,

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

    // Check for setup mode via URL param
    const searchParams = new URLSearchParams(window.location.search);
    const isSetup = searchParams.get('setup') === 'true';
    this.setState({ isSetup }, () => {
      this.loadProfileData();
    });
  }

  loadProfileData = async () => {
    const { user } = this.props;
    const metadata = user?.user_metadata || {};

    try {
      // Try to load from database first
      const { data: player } = await supabase
        .from('players_with_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_image_url, full_name, roles')
        .eq('id', user.id)
        .single();

      const userRoles = profile?.roles || [];
      const isPlayer = userRoles.includes('player');

      // Use database data if available, fallback to metadata
      const isGoalkeeper = (player?.position || metadata.position) === 'GK';

      const profileData = {
        name: player?.name || profile?.full_name || metadata.full_name || user?.email?.split('@')[0] || 'Player',
        email: user?.email || 'player@kaboona.com',
        profilePhoto: player?.image || profile?.profile_image_url || metadata.avatar_url || null,
        position: player?.position || metadata.position || 'CAM',
        number: player?.number || metadata.jersey_number || 10,
        height: player?.height || metadata.height || '',
        weight: player?.weight || metadata.weight || '',
        preferredFoot: player?.foot ? (player.foot.charAt(0).toUpperCase() + player.foot.slice(1)) : (metadata.preferred_foot || 'Right'),
        country: player?.country || metadata.nationality || metadata.country || 'gb',
        alternatePositions: player?.alternate_positions || metadata.alternate_positions || [],
        skillMoves: player?.skill_moves || metadata.skill_moves || 3,
        weakFoot: player?.weak_foot || metadata.weak_foot || 3,
        stats: player?.stats || metadata.stats || (isGoalkeeper ? {
          diving: 70,
          handling: 70,
          kicking: 70,
          reflexes: 70,
          speed: 60,
          positioning: 70,
        } : {
          pace: 70,
          shooting: 70,
          passing: 70,
          dribbling: 70,
          defending: 50,
          physical: 60,
        }),
      };

      this.setState({
        isLoading: false,
        isPlayer,
        formData: profileData,
      });
    } catch (error) {
      console.warn('Error loading from database, using metadata:', error);
      // Fallback to metadata
      const profileData = {
        name: metadata.full_name || user?.email?.split('@')[0] || 'Player',
        email: user?.email || 'player@kaboona.com',
        profilePhoto: metadata.avatar_url || null,
        position: metadata.position || 'CAM',
        number: metadata.jersey_number || 10,
        height: metadata.height || '',
        weight: metadata.weight || '',
        preferredFoot: metadata.preferred_foot || 'Right',
        country: metadata.country || 'gb',
        alternatePositions: metadata.alternate_positions || [],
        skillMoves: metadata.skill_moves || 3,
        weakFoot: metadata.weak_foot || 3,
        stats: metadata.stats || {
          pace: 70,
          shooting: 70,
          passing: 70,
          dribbling: 70,
          defending: 50,
          physical: 60,
        },
      };

      this.setState({
        isLoading: false,
        formData: profileData,
      });
    }
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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.setState((prevState) => ({
          errors: { ...prevState.errors, photo: 'File size must be less than 5MB' },
        }));
        return;
      }

      // Store file for upload and create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        this.setState((prevState) => ({
          photoFile: file, // Store actual file for upload
          formData: {
            ...prevState.formData,
            profilePhoto: reader.result, // Base64 for preview
          },
          hasChanges: true,
          errors: { ...prevState.errors, photo: null },
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

  validateSetupStep = () => {
    const { setupStep, formData } = this.state;
    const errors = {};

    if (setupStep === 1) {
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
      }
    }

    if (setupStep === 2) {
      if (formData.number < 1 || formData.number > 99) {
        errors.number = 'Jersey number must be between 1-99';
      }
    }

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  };

  handleSetupNext = () => {
    if (!this.validateSetupStep()) return;
    this.setState((prevState) => ({
      setupStep: Math.min(prevState.setupStep + 1, 3),
    }));
    window.scrollTo(0, 0);
  };

  handleSetupBack = () => {
    this.setState((prevState) => ({
      setupStep: Math.max(prevState.setupStep - 1, 1),
    }));
    window.scrollTo(0, 0);
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    this.setState({ isSaving: true });

    try {
      const { user } = this.props;
      const { formData, photoFile } = this.state;
      let avatarUrl = formData.profilePhoto;

      // Upload photo to Supabase Storage if a new file was selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        // Upload the file to the avatars bucket
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, photoFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Check for common storage errors
          if (uploadError.message?.includes('Bucket not found') ||
              uploadError.message?.includes('bucket') ||
              uploadError.statusCode === 404) {
            this.setState({
              errors: { photo: 'Storage bucket "avatars" not found. Please create it in Supabase dashboard.' },
              isSaving: false,
            });
            return;
          }
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update user metadata in Supabase Auth
      const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          avatar_url: avatarUrl,
          position: formData.position,
          jersey_number: formData.number,
          height: formData.height,
          weight: formData.weight,
          preferred_foot: formData.preferredFoot,
          country: formData.country,
          alternate_positions: formData.alternatePositions,
          skill_moves: formData.skillMoves,
          weak_foot: formData.weakFoot,
          stats: formData.stats,
        },
      });

      if (updateError) {
        throw updateError;
      }

      // Also update the profiles table in database
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.name,
          profile_image_url: avatarUrl,
          nationality: formData.country || null,
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Could not update profiles table:', profileError);
      }

      // Check if user has a player record and update it too
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Determine if GK stats or outfield stats
      const isGoalkeeper = formData.position === 'GK';
      const playerData = {
        name: formData.name,
        image: avatarUrl,
        position: formData.position,
        jersey_number: parseInt(formData.number) || 10,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        preferred_foot: formData.preferredFoot?.toLowerCase() || 'right',
        country: formData.country,
        alternate_positions: formData.alternatePositions || [],
        skill_moves: formData.skillMoves || 3,
        weak_foot_rating: formData.weakFoot || 3,
      };

      // Add stats based on position
      if (isGoalkeeper) {
        playerData.diving = formData.stats.diving || 50;
        playerData.handling = formData.stats.handling || 50;
        playerData.kicking = formData.stats.kicking || 50;
        playerData.reflexes = formData.stats.reflexes || 50;
        playerData.gk_speed = formData.stats.speed || 50;
        playerData.gk_positioning = formData.stats.positioning || 50;
      } else {
        playerData.pace = formData.stats.pace || 50;
        playerData.shooting = formData.stats.shooting || 50;
        playerData.passing = formData.stats.passing || 50;
        playerData.dribbling = formData.stats.dribbling || 50;
        playerData.defending = formData.stats.defending || 50;
        playerData.physical = formData.stats.physical || 50;
      }

      if (existingPlayer) {
        const { error: playerError } = await supabase
          .from('players')
          .update(playerData)
          .eq('user_id', user.id);

        if (playerError) {
          console.warn('Could not update players table:', playerError);
        }
      } else if (this.state.isSetup) {
        // Create new player record during setup wizard
        playerData.user_id = user.id;
        const { error: playerInsertError } = await supabase
          .from('players')
          .insert(playerData);

        if (playerInsertError) {
          console.warn('Could not create player record:', playerInsertError);
        }

        // Notify admin/coach about new player registration
        try {
          const { data: admins } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'coach']);

          if (admins && admins.length > 0) {
            for (const admin of admins) {
              await createNotification({
                userId: admin.id,
                title: 'New Player Registered',
                body: `New player registered: ${formData.name}`,
                type: 'info',
                referenceType: 'player',
                referenceId: user.id,
              });
            }
          }
        } catch (notifError) {
          console.warn('Could not send admin notifications:', notifError);
        }
      }

      // Update Redux state with the new user data
      if (updatedUserData?.user) {
        this.props.setUser(updatedUserData.user);
      }

      this.setState({
        isSaving: false,
        hasChanges: false,
        photoFile: null,
        formData: { ...formData, profilePhoto: avatarUrl },
        redirectToProfile: true,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      this.setState({
        isSaving: false,
        errors: { submit: error.message || 'Failed to save profile' },
      });
    }
  };

  handleSetupComplete = async (e) => {
    // Validate final step before submitting
    if (!this.validateSetupStep()) return;
    // Mark as having changes so submit proceeds
    this.setState({ hasChanges: true }, () => {
      this.handleSubmit(e);
    });
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

  renderStepIndicator = () => {
    const { setupStep } = this.state;
    const steps = [
      { num: 1, label: 'Basic Info' },
      { num: 2, label: 'Player Details' },
      { num: 3, label: 'Rate Stats' },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-center mb-2">
          <span className="text-accent-gold font-display font-bold text-lg">
            Step {setupStep} of 3
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    setupStep === step.num
                      ? 'bg-accent-gold text-black'
                      : setupStep > step.num
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {setupStep > step.num ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span className={`text-xs mt-1 ${
                  setupStep === step.num ? 'text-accent-gold' : 'text-white/40'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mt-[-16px] ${
                  setupStep > step.num ? 'bg-green-500' : 'bg-white/10'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  renderSetupWizard = () => {
    const { setupStep, formData, errors, isSaving } = this.state;

    const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'];
    const isGoalkeeper = formData.position === 'GK';

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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl font-display font-bold text-white uppercase tracking-wider">
                Complete Your Profile
              </h1>
              <p className="text-white/60 mt-2">
                Set up your player card to get started
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {/* Step Indicator */}
          {this.renderStepIndicator()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Live FIFA Card Preview */}
            <div className="lg:col-span-4">
              <motion.div
                className="sticky top-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-4 text-center">
                  Live Preview
                </h3>
                <div className="flex justify-center">
                  <PlayerFIFACard
                    name={formData.name}
                    position={formData.position}
                    alternate_positions={formData.alternatePositions}
                    number={parseInt(formData.number) || 10}
                    country={formData.country}
                    image={formData.profilePhoto}
                    stats={currentStats}
                    skill_moves={formData.skillMoves}
                    weak_foot={formData.weakFoot}
                  />
                </div>
              </motion.div>
            </div>

            {/* Right Column - Step Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Step 1: Photo + Name + Country */}
              {setupStep === 1 && (
                <motion.div
                  className="bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="px-6 py-4 border-b border-accent-gold/20">
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                      Basic Information
                    </h3>
                    <p className="text-white/50 text-sm mt-1">
                      Upload your photo and set your display name
                    </p>
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
                          {errors.photo && (
                            <p className="text-red-400 text-sm mt-1">{errors.photo}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Display Name *</label>
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

                    {/* Country */}
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Country</label>
                      <CountrySelect
                        name="country"
                        value={formData.country}
                        onChange={this.handleInputChange}
                        placeholder="Select your country"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Position + Jersey Number + Preferred Foot + Height + Weight */}
              {setupStep === 2 && (
                <motion.div
                  className="bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="px-6 py-4 border-b border-accent-gold/20">
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                      Player Details
                    </h3>
                    <p className="text-white/50 text-sm mt-1">
                      Tell us about your playing style
                    </p>
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
                  </div>
                </motion.div>
              )}

              {/* Step 3: Self-Rated Stats */}
              {setupStep === 3 && (
                <motion.div
                  className="bg-surface-dark-elevated rounded-xl border border-accent-gold/20 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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
                        transition={{ delay: 0.1 + index * 0.05 }}
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
              )}

              {/* Error display */}
              {errors.submit && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4">
                {setupStep > 1 ? (
                  <motion.button
                    type="button"
                    onClick={this.handleSetupBack}
                    className="px-6 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </motion.button>
                ) : (
                  <div />
                )}

                {setupStep < 3 ? (
                  <motion.button
                    type="button"
                    onClick={this.handleSetupNext}
                    className="px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Next
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    onClick={this.handleSetupComplete}
                    disabled={isSaving}
                    className="px-8 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={!isSaving ? { scale: 1.02 } : {}}
                    whileTap={!isSaving ? { scale: 0.98 } : {}}
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
                      <>
                        Complete Profile
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    const { isLoading, isSaving, hasChanges, formData, errors, redirectToProfile, isSetup, isPlayer } = this.state;

    if (redirectToProfile) {
      return <Navigate to="/profile" replace />;
    }

    if (isLoading) {
      return this.renderLoadingState();
    }

    // Setup wizard mode
    if (isSetup) {
      return this.renderSetupWizard();
    }

    // Normal edit mode (unchanged from original)
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
                  {isPlayer ? 'Update your player information and stats' : 'Update your profile information'}
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
          <div className={`grid grid-cols-1 ${isPlayer ? 'lg:grid-cols-12' : ''} gap-8`}>
            {/* Left Column - Live FIFA Card Preview (players only) */}
            {isPlayer && (
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
                      alternate_positions={formData.alternatePositions}
                      number={parseInt(formData.number) || 10}
                      country={formData.country}
                      image={formData.profilePhoto}
                      stats={currentStats}
                      skill_moves={formData.skillMoves}
                      weak_foot={formData.weakFoot}
                    />
                  </div>
                </motion.div>
              </div>
            )}

            {/* Right Column - Edit Forms */}
            <div className={`${isPlayer ? 'lg:col-span-8' : ''} space-y-8`}>
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

                  {/* Email (Disabled) */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 bg-surface-dark border border-white/10 rounded-lg text-white/50 cursor-not-allowed opacity-60"
                    />
                    <p className="text-white/40 text-xs mt-1">Email cannot be changed</p>
                  </div>

                  {/* Country (shown here for non-players, in player section for players) */}
                  {!isPlayer && (
                    <div>
                      <label className="block text-white/60 text-sm mb-2">Nationality</label>
                      <CountrySelect
                        name="country"
                        value={formData.country}
                        onChange={this.handleInputChange}
                        placeholder="Select your country"
                      />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Player Information (players only) */}
              {!isPlayer ? null : (
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

                  {/* Alternate Positions - Only for non-GK players */}
                  {formData.position !== 'GK' && (
                    <div className="sm:col-span-2">
                      <label className="block text-white/60 text-sm mb-2">
                        Alternate Positions
                        <span className="text-white/40 ml-2 text-xs">(positions you can also play)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {positions.filter(pos => pos !== 'GK' && pos !== formData.position).map((pos) => {
                          const isSelected = formData.alternatePositions.includes(pos);
                          return (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => {
                                const newAlts = isSelected
                                  ? formData.alternatePositions.filter(p => p !== pos)
                                  : [...formData.alternatePositions, pos];
                                this.setState(prev => ({
                                  formData: { ...prev.formData, alternatePositions: newAlts },
                                  hasChanges: true,
                                }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? 'bg-accent-gold text-black'
                                  : 'bg-surface-dark border border-white/20 text-white/60 hover:border-accent-gold/50 hover:text-white'
                              }`}
                            >
                              {pos}
                            </button>
                          );
                        })}
                      </div>
                      {formData.alternatePositions.length > 0 && (
                        <p className="text-accent-gold/70 text-xs mt-2">
                          Selected: {formData.alternatePositions.join(', ')}
                        </p>
                      )}
                    </div>
                  )}

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
                    <CountrySelect
                      name="country"
                      value={formData.country}
                      onChange={this.handleInputChange}
                      placeholder="Select your country"
                    />
                  </div>

                  {/* Skill Moves */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Skill Moves</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => this.setState(prev => ({
                            formData: { ...prev.formData, skillMoves: star },
                            hasChanges: true,
                          }))}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <svg
                            className={`w-8 h-8 ${star <= formData.skillMoves ? 'text-accent-gold' : 'text-white/20'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>
                      ))}
                      <span className="ml-2 text-white/50 text-sm">{formData.skillMoves} Star</span>
                    </div>
                    <p className="text-white/40 text-xs mt-1">Dribbling tricks & skill moves ability</p>
                  </div>

                  {/* Weak Foot */}
                  <div>
                    <label className="block text-white/60 text-sm mb-2">Weak Foot</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => this.setState(prev => ({
                            formData: { ...prev.formData, weakFoot: star },
                            hasChanges: true,
                          }))}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <svg
                            className={`w-8 h-8 ${star <= formData.weakFoot ? 'text-accent-gold' : 'text-white/20'}`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </button>
                      ))}
                      <span className="ml-2 text-white/50 text-sm">{formData.weakFoot} Star</span>
                    </div>
                    <p className="text-white/40 text-xs mt-1">Non-dominant foot ability</p>
                  </div>
                </div>
              </motion.div>
              )}

              {/* Self-Rated Stats (players only) */}
              {isPlayer && (
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
              )}

              {/* Subscription Management
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
              */}

              {/* Bottom Save Button */}
              <motion.div
                className="flex items-center justify-between pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  to="/profile"
                  className="px-6 py-3 border border-white/20 text-white font-medium rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </Link>
                <motion.button
                  onClick={this.handleSubmit}
                  disabled={isSaving || !hasChanges}
                  className={`px-8 py-3 font-bold rounded-lg transition-colors flex items-center gap-2 ${
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

const mapDispatchToProps = {
  setUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfileEdit);

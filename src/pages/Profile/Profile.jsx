import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PlayerFIFACard from './components/PlayerFIFACard';
import QuickStats from './components/QuickStats';
import UpcomingEvents from './components/UpcomingEvents';
import RecentMatches from './components/RecentMatches';
import AttendanceHistory from './components/AttendanceHistory';
// import SubscriptionCard from './components/SubscriptionCard';
import { supabase } from '../../services/supabase';
import { refreshUser } from '../../services/auth';
import { requestPlayerStatus } from '../../services/playerRequestService';
import { getActiveInjury, reportInjury, recoverInjury, notifyCoachesOfInjury } from '../../services/injuryService';
import { setUser } from '../../redux/slices/authSlice';

/**
 * Profile page (Player Dashboard)
 * Displays player's FIFA card, stats, recent matches, attendance, and subscription
 * Fetches data from database (players_with_profiles view)
 */
class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      playerData: null,
      error: null,
      requestingPlayer: false,
      // Injury state
      activeInjury: null,
      injuryNote: '',
      injuryReturnDate: '',
      reportingInjury: false,
      recoveringInjury: false,
    };
  }

  componentDidMount() {
    // Scroll to top
    window.scrollTo(0, 0);

    // Load player data from database
    this.loadPlayerData();
    this.fetchActiveInjury();
  }

  loadPlayerData = async () => {
    const { user } = this.props;

    if (!user?.id) {
      this.setState({ isLoading: false, error: 'Not logged in' });
      return;
    }

    try {
      // Fetch player data from database view
      const { data: player, error: playerError } = await supabase
        .from('players_with_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch profile data for subscription info
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, profile_image_url')
        .eq('id', user.id)
        .single();

      const metadata = user?.user_metadata || {};

      // Use database data if available, fallback to metadata
      const playerData = {
        id: player?.id || user.id,
        name: player?.name || metadata.full_name || user?.email?.split('@')[0] || 'Player',
        email: player?.email || user?.email || 'player@kaboona.com',
        position: player?.position || metadata.position || 'CAM',
        number: player?.number || metadata.jersey_number || 10,
        country: player?.country || metadata.nationality || metadata.country || 'gb',
        height: player?.height ? `${player.height} cm` : (metadata.height ? `${metadata.height} cm` : '-'),
        weight: player?.weight ? `${player.weight} kg` : (metadata.weight ? `${metadata.weight} kg` : '-'),
        preferredFoot: player?.foot ? (player.foot.charAt(0).toUpperCase() + player.foot.slice(1)) : (metadata.preferred_foot || 'Right'),
        image: player?.image || profile?.profile_image_url || metadata.avatar_url || null,
        stats: player?.stats || metadata.stats || {
          pace: 70,
          shooting: 70,
          passing: 70,
          dribbling: 70,
          defending: 50,
          physical: 60,
        },
        skill_moves: player?.skill_moves || 3,
        weak_foot: player?.weak_foot || 3,
        // Season stats would come from a separate database table in production
        seasonStats: metadata.season_stats || {
          matches: 0,
          gamesStarted: 0,
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          cleanSheetMinutes: 0,
          yellowCards: 0,
          redCards: 0,
        },
        subscription: {
          plan: profile?.subscription_status || metadata.subscription_plan || 'free',
          nextBillingDate: metadata.next_billing_date || null,
        },
        // Flag to know if data came from DB
        isFromDatabase: !!player,
      };

      this.setState({
        isLoading: false,
        playerData,
      });
    } catch (error) {
      console.error('Error loading player data:', error);
      // Fallback to metadata on error
      this.loadFromMetadata();
    }
  };

  loadFromMetadata = () => {
    const { user } = this.props;
    const metadata = user?.user_metadata || {};

    const playerData = {
      id: user?.id || '1',
      name: metadata.full_name || user?.email?.split('@')[0] || 'Player',
      email: user?.email || 'player@kaboona.com',
      position: metadata.position || 'CAM',
      number: metadata.jersey_number || 10,
      country: metadata.nationality || metadata.country || 'gb',
      height: metadata.height ? `${metadata.height} cm` : '-',
      weight: metadata.weight ? `${metadata.weight} kg` : '-',
      preferredFoot: metadata.preferred_foot || 'Right',
      image: metadata.avatar_url || null,
      stats: metadata.stats || {
        pace: 70,
        shooting: 70,
        passing: 70,
        dribbling: 70,
        defending: 50,
        physical: 60,
      },
      skill_moves: metadata.skill_moves || 3,
      weak_foot: metadata.weak_foot || 3,
      seasonStats: metadata.season_stats || {
        matches: 0,
        gamesStarted: 0,
        goals: 0,
        assists: 0,
        cleanSheets: 0,
        cleanSheetMinutes: 0,
        yellowCards: 0,
        redCards: 0,
      },
      subscription: {
        plan: metadata.subscription_plan || 'free',
        nextBillingDate: metadata.next_billing_date || null,
      },
      isFromDatabase: false,
    };

    this.setState({
      isLoading: false,
      playerData,
    });
  };

  handlePlayerRequest = async () => {
    const { user } = this.props;
    if (!user) return;

    this.setState({ requestingPlayer: true });

    const userName = user.user_metadata?.full_name || user.email;
    const { error } = await requestPlayerStatus(user.id, userName);

    if (error) {
      console.error('Failed to request player status:', error);
      this.setState({ requestingPlayer: false });
      return;
    }

    // Refresh user to get updated player_request_status
    const { user: updatedUser } = await refreshUser();
    if (updatedUser) {
      this.props.setUser(updatedUser);
    }

    this.setState({ requestingPlayer: false });
  };

  fetchActiveInjury = async () => {
    const { user } = this.props;
    if (!user?.id) return;
    try {
      const injury = await getActiveInjury(user.id);
      this.setState({ activeInjury: injury });
    } catch (err) {
      console.error('Error fetching active injury:', err);
    }
  };

  handleReportInjury = async () => {
    const { user } = this.props;
    const { injuryNote, injuryReturnDate } = this.state;
    if (!user?.id) return;

    this.setState({ reportingInjury: true });
    try {
      const injury = await reportInjury({
        playerId: user.id,
        reportedBy: user.id,
        injuryNote: injuryNote.trim() || null,
        expectedReturn: injuryReturnDate || null,
      });

      const playerName = user.user_metadata?.full_name || user.email;
      await notifyCoachesOfInjury(playerName);

      this.setState({
        activeInjury: injury,
        injuryNote: '',
        injuryReturnDate: '',
        reportingInjury: false,
      });
    } catch (err) {
      console.error('Error reporting injury:', err);
      this.setState({ reportingInjury: false });
    }
  };

  handleRecoverInjury = async () => {
    const { activeInjury } = this.state;
    if (!activeInjury) return;

    this.setState({ recoveringInjury: true });
    try {
      await recoverInjury(activeInjury.id);
      this.setState({ activeInjury: null, recoveringInjury: false });
    } catch (err) {
      console.error('Error marking recovery:', err);
      this.setState({ recoveringInjury: false });
    }
  };

  handleManageSubscription = () => {
    // Navigate to subscription management or open modal
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
        <p className="text-white/60">Loading your profile...</p>
      </motion.div>
    </div>
  );

  renderPlayerRequestCard() {
    const status = this.props.user?.profile?.player_request_status;

    if (status === 'pending') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-400/10 via-surface-dark-elevated to-surface-dark-elevated rounded-xl border border-yellow-400/20 p-8"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-1">Request Sent</h3>
              <p className="text-white/60 text-sm">Your request has been sent to the management and is waiting for approval. We'll notify you once a decision has been made.</p>
            </div>
          </div>
        </motion.div>
      );
    }

    if (status === 'declined') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-400/10 via-surface-dark-elevated to-surface-dark-elevated rounded-xl border border-red-400/20 p-8"
        >
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-400/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white mb-1">Request Not Approved</h3>
              <p className="text-white/60 text-sm mb-4">Your previous request wasn't approved this time, but you're welcome to try again.</p>
              <button
                onClick={this.handlePlayerRequest}
                disabled={this.state.requestingPlayer}
                className="px-5 py-2.5 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50"
              >
                {this.state.requestingPlayer ? 'Requesting...' : 'Request Again'}
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    // Default: no request yet
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-accent-gold/10 via-surface-dark-elevated to-surface-dark-elevated rounded-xl border border-accent-gold/20 p-8"
      >
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-14 h-14 rounded-full bg-accent-gold/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-display font-bold text-white mb-2">
              Are you playing for Kaboona FC?
            </h3>
            <p className="text-white/60 text-sm mb-5">
              If you're already part of the squad or would like to join the team, request player status below. Once approved by the coaching staff, you'll get your own FIFA-style player card, access to team stats, and more.
            </p>
            <button
              onClick={this.handlePlayerRequest}
              disabled={this.state.requestingPlayer}
              className="px-6 py-3 bg-accent-gold text-black font-semibold rounded-lg hover:bg-accent-gold-light transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {this.state.requestingPlayer ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending Request...
                </span>
              ) : (
                'Request to Join the Team'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  renderFanDashboard() {
    const { user } = this.props;
    const { playerData } = this.state;
    const name = playerData?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Fan';
    const avatarInitial = name.charAt(0).toUpperCase();
    const avatarUrl = playerData?.image || user?.user_metadata?.avatar_url || null;
    const status = user?.profile?.player_request_status;
    const isApproved = status === 'approved';

    const quickLinks = [
      { to: '/fan-portal', label: 'Fan Portal', desc: 'Predictions, voting, leaderboards', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )},
      { to: '/our-team', label: 'Our Team', desc: 'Meet the squad', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )},
      { to: '/stats', label: 'Stats', desc: 'Player & team statistics', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )},
      { to: '/shop', label: 'Shop', desc: 'Official merchandise', icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )},
    ];

    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-accent-gold/10 to-transparent h-80" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            {/* Welcome Section */}
            <motion.div
              className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-accent-gold flex items-center justify-center overflow-hidden flex-shrink-0 ring-4 ring-accent-gold/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-display font-bold text-black">{avatarInitial}</span>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white uppercase tracking-wider">
                  Welcome, {name}
                </h1>
                <p className="text-white/60 mt-2">
                  Kaboona FC Fan
                </p>
              </div>
              <div className="sm:ml-auto">
                <Link
                  to="/profile/edit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </Link>
              </div>
            </motion.div>

            {/* Player Request Card */}
            {!isApproved && this.renderPlayerRequestCard()}

            {/* Quick Links Grid */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group bg-surface-dark-elevated rounded-xl border border-white/10 p-6 hover:border-accent-gold/30 hover:bg-surface-dark-elevated/80 transition-all"
                >
                  <div className="text-accent-gold mb-3 group-hover:scale-110 transition-transform inline-block">
                    {link.icon}
                  </div>
                  <h3 className="text-white font-display font-bold text-lg">{link.label}</h3>
                  <p className="text-white/50 text-sm mt-1">{link.desc}</p>
                </Link>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <UpcomingEvents />
        </div>

        {/* Subscription Card
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <SubscriptionCard
            plan={playerData?.subscription?.plan || 'free'}
            nextBillingDate={playerData?.subscription?.nextBillingDate || null}
            onManageSubscription={this.handleManageSubscription}
          />
        </div>
        */}
      </div>
    );
  }

  renderPlayerDashboard() {
    const { playerData } = this.state;

    return (
      <div className="min-h-screen bg-surface-dark pb-20">
        {/* Header */}
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-b from-accent-gold/10 to-transparent h-96" />
          <div
            className="absolute inset-0 opacity-5 h-96"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            {/* Page Header */}
            <motion.div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div>
                <h1 className="text-4xl font-display font-bold text-white uppercase tracking-wider">
                  Player Dashboard
                </h1>
                <p className="text-white/60 mt-2">
                  Welcome back, <span className="text-accent-gold">{playerData.name}</span>
                </p>
              </div>
              <Link
                to="/profile/edit"
                className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column - FIFA Card */}
              <div className="lg:col-span-4 flex justify-center lg:justify-start">
                <PlayerFIFACard
                  name={playerData.name}
                  position={playerData.position}
                  number={playerData.number}
                  country={playerData.country}
                  image={playerData.image}
                  stats={playerData.stats}
                  skill_moves={playerData.skill_moves}
                  weak_foot={playerData.weak_foot}
                />
              </div>

              {/* Right Column - Stats & Info */}
              <div className="lg:col-span-8 space-y-8">
                {/* Quick Stats */}
                <QuickStats stats={playerData.seasonStats} position={playerData.position} />

                {/* Player Info Summary */}
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {[
                    { label: 'Position', value: playerData.position },
                    { label: 'Jersey #', value: playerData.number },
                    { label: 'Height', value: playerData.height },
                    { label: 'Preferred Foot', value: playerData.preferredFoot },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-surface-dark-elevated rounded-lg p-4 border border-white/10"
                    >
                      <p className="text-white/50 text-xs uppercase tracking-wider">{item.label}</p>
                      <p className="text-white font-display font-bold text-lg mt-1">{item.value}</p>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Injury Self-Report */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {this.state.activeInjury ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-display font-bold text-white mb-1">Currently Injured</h3>
                  {this.state.activeInjury.injury_note && (
                    <p className="text-white/60 text-sm mb-2">{this.state.activeInjury.injury_note}</p>
                  )}
                  {this.state.activeInjury.expected_return && (
                    <p className="text-white/50 text-sm">
                      Expected return: <span className="text-white/80">{new Date(this.state.activeInjury.expected_return + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </p>
                  )}
                  <button
                    onClick={this.handleRecoverInjury}
                    disabled={this.state.recoveringInjury}
                    className="mt-4 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {this.state.recoveringInjury ? 'Updating...' : 'Mark as Recovered'}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-dark-elevated border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-lg font-display font-bold text-white mb-4">Report an Injury</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1">Injury Details</label>
                  <input
                    type="text"
                    value={this.state.injuryNote}
                    onChange={(e) => this.setState({ injuryNote: e.target.value })}
                    placeholder="e.g. Hamstring strain"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-accent-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1">Expected Return</label>
                  <input
                    type="date"
                    value={this.state.injuryReturnDate}
                    onChange={(e) => this.setState({ injuryReturnDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>
              <button
                onClick={this.handleReportInjury}
                disabled={this.state.reportingInjury}
                className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {this.state.reportingInjury ? 'Reporting...' : 'Report Injury'}
              </button>
            </motion.div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <UpcomingEvents />
        </div>

        {/* Bottom Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Matches */}
            <RecentMatches />

            {/* Attendance History */}
            <AttendanceHistory />
          </div>

          {/* Subscription Card
          <div className="mt-8">
            <SubscriptionCard
              plan={playerData.subscription.plan}
              nextBillingDate={playerData.subscription.nextBillingDate}
              onManageSubscription={this.handleManageSubscription}
            />
          </div>
          */}
        </div>
      </div>
    );
  }

  render() {
    const { isLoading, playerData, error } = this.state;

    if (isLoading) {
      return this.renderLoadingState();
    }

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-dark">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={this.loadPlayerData}
              className="px-6 py-2 bg-accent-gold text-black font-bold rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    // Show fan dashboard if user is not an approved player
    const isPlayer = playerData?.isFromDatabase;
    if (!isPlayer) {
      return this.renderFanDashboard();
    }

    return this.renderPlayerDashboard();
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

const mapDispatchToProps = {
  setUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(Profile);

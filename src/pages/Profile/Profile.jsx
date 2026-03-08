import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PlayerFIFACard from './components/PlayerFIFACard';
import QuickStats from './components/QuickStats';
import RecentMatches from './components/RecentMatches';
import AttendanceHistory from './components/AttendanceHistory';
import SubscriptionCard from './components/SubscriptionCard';
import { supabase } from '../../services/supabase';

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
    };
  }

  componentDidMount() {
    // Scroll to top
    window.scrollTo(0, 0);

    // Load player data from database
    this.loadPlayerData();
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
        email: player?.email || user?.email || 'player@kaboonafc.com',
        position: player?.position || metadata.position || 'CAM',
        number: player?.number || metadata.jersey_number || 10,
        country: player?.country || metadata.country || 'gb',
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
      email: user?.email || 'player@kaboonafc.com',
      position: metadata.position || 'CAM',
      number: metadata.jersey_number || 10,
      country: metadata.country || 'gb',
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

        {/* Bottom Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Matches */}
            <RecentMatches />

            {/* Attendance History */}
            <AttendanceHistory />
          </div>

          {/* Subscription Card */}
          <div className="mt-8">
            <SubscriptionCard
              plan={playerData.subscription.plan}
              nextBillingDate={playerData.subscription.nextBillingDate}
              onManageSubscription={this.handleManageSubscription}
            />
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth?.user,
});

export default connect(mapStateToProps)(Profile);

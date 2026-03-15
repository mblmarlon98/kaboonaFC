import React, { Component } from 'react';
import { motion } from 'framer-motion';
import TeamHierarchy from './components/TeamHierarchy';
import SquadOverview from './components/SquadOverview';
import FootballField from './components/FootballField';
import AlumniSection from './components/AlumniSection';
import { supabase } from '../../services/supabase';

/**
 * Our Team page - Main component
 * Displays team hierarchy, squad overview, football field formation, and alumni
 */
class OurTeam extends Component {
  constructor(props) {
    super(props);
    this.state = {
      owners: [],
      coaches: [],
      management: [],
      marketing: [],
      players: [],
      alumni: [],
      isLoading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchTeamData();
    window.scrollTo(0, 0);
  }

  fetchTeamData = async () => {
    try {
      // Fetch staff from profiles based on real roles
      const [staffResponse, playersResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, role, roles, profile_image_url')
          .or('roles.cs.{owner},roles.cs.{coach},roles.cs.{manager},roles.cs.{editor},roles.cs.{marketing}'),
        supabase.from('players_with_profiles').select('*').order('number', { ascending: true }),
      ]);

      // Build hierarchy from real roles
      const staffProfiles = staffResponse.data || [];

      // Build player image lookup as fallback for staff without profile images
      const staffIds = staffProfiles.map(p => p.id);
      let playerImages = {};
      if (staffIds.length > 0) {
        const { data: playerImgs } = await supabase
          .from('players')
          .select('user_id, image')
          .in('user_id', staffIds);
        (playerImgs || []).forEach(p => { if (p.image) playerImages[p.user_id] = p.image; });
      }

      const getImage = (p) => p.profile_image_url || playerImages[p.id] || null;

      // Find all owners (role-based from profiles)
      const ownerProfiles = staffProfiles.filter(p => (p.roles || []).includes('owner'));
      const owners = ownerProfiles.map(p => ({
        id: p.id, name: p.full_name, role: 'Owner', image: getImage(p),
      }));

      // Find coaches
      const coachProfiles = staffProfiles.filter(p => (p.roles || []).includes('coach'));
      const coaches = coachProfiles.map(p => ({ id: p.id, name: p.full_name, role: 'Coach', image: getImage(p) }));

      // Find managers (for hierarchy display)
      const managementProfiles = staffProfiles.filter(p =>
        (p.roles || []).includes('manager') &&
        !(p.roles || []).includes('owner') &&
        !(p.roles || []).includes('coach')
      );

      // Find marketing & content staff
      const marketingProfiles = staffProfiles.filter(p =>
        ((p.roles || []).includes('marketing') || (p.roles || []).includes('editor')) &&
        !(p.roles || []).includes('owner') &&
        !(p.roles || []).includes('coach')
      );

      const hasPlayers = playersResponse.data && playersResponse.data.length > 0;

      // Separate active players from alumni
      const activePlayers = hasPlayers
        ? playersResponse.data.filter(p => !p.is_alumni && !p.is_retired)
        : [];
      const alumniPlayers = hasPlayers
        ? playersResponse.data.filter(p => p.is_alumni || p.is_retired)
        : [];

      this.setState({
        owners,
        coaches,
        management: managementProfiles.map(p => ({
          id: p.id,
          name: p.full_name,
          role: 'Manager',
          image: getImage(p),
        })),
        marketing: marketingProfiles.map(p => ({
          id: p.id,
          name: p.full_name,
          role: (p.roles || []).includes('marketing') ? 'Marketing' : 'Content Manager',
          image: getImage(p),
        })),
        players: activePlayers,
        alumni: alumniPlayers,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching team data:', error);
      this.setState({
        owners: [],
        coaches: [],
        management: [],
        marketing: [],
        players: [],
        alumni: [],
        isLoading: false,
        error: error.message,
      });
    }
  };

  render() {
    const {
      owners,
      coaches,
      management,
      marketing,
      players,
      alumni,
      isLoading,
    } = this.state;

    if (isLoading) {
      return (
        <div className="min-h-screen bg-surface-dark flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Hero Section */}
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated to-surface-dark" />

          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #D4AF37 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center px-4"
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4">
              Our Team
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The heart and soul of Kaboona FC. Meet the players, coaches, and legends who make our club great.
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mt-6" />
          </motion.div>

          {/* Bottom Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-dark to-transparent" />
        </section>

        {/* Team Hierarchy - Owner & Coaches */}
        <TeamHierarchy owners={owners} coaches={coaches} management={management || []} marketing={marketing || []} />

        {/* Squad Overview - Players by Position */}
        <SquadOverview players={players} />

        {/* Football Field Formation */}
        <FootballField
          players={players}
          isPlaceholder={players.length === 0}
        />

        {/* Alumni Section */}
        <AlumniSection alumni={alumni} />
      </div>
    );
  }
}

export default OurTeam;

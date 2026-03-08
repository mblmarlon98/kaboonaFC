import React, { Component } from 'react';
import { motion } from 'framer-motion';
import TeamHierarchy from './components/TeamHierarchy';
import SquadOverview from './components/SquadOverview';
import FootballField from './components/FootballField';
import AlumniSection from './components/AlumniSection';
import { supabase } from '../../services/supabase';

/**
 * Placeholder data when database is empty
 */
const PLACEHOLDER_OWNER = {
  id: 'placeholder-owner',
  name: 'Team Owner',
  role: 'Team Owner',
  bio: 'Add a team owner in the admin panel.',
  image: null,
  isPlaceholder: true,
};

const PLACEHOLDER_COACHES = [
  {
    id: 'placeholder-coach-1',
    name: 'Head Coach',
    role: 'Head Coach',
    specialization: 'Tactical Development',
    image: null,
    isPlaceholder: true,
  },
  {
    id: 'placeholder-coach-2',
    name: 'Assistant Coach',
    role: 'Assistant Coach',
    specialization: 'Player Development',
    image: null,
    isPlaceholder: true,
  },
  {
    id: 'placeholder-coach-3',
    name: 'GK Coach',
    role: 'Goalkeeping Coach',
    specialization: 'GK Training',
    image: null,
    isPlaceholder: true,
  },
];

/**
 * Generate John Doe placeholder players for all positions
 * Mix of bronze (avg <64), silver (64-74), and gold (75+) tiers
 */
const generatePlaceholderPlayers = () => {
  const positions = [
    // Goalkeeper - GOLD (avg 78)
    { position: 'GK', number: 1, stats: { diving: 82, handling: 80, kicking: 75, reflexes: 85, speed: 70, positioning: 78 } },
    // Defenders
    { position: 'RB', number: 2, stats: { pace: 58, shooting: 45, passing: 55, dribbling: 52, defending: 60, physical: 58 } }, // BRONZE (avg 55)
    { position: 'CB', number: 4, stats: { pace: 65, shooting: 45, passing: 62, dribbling: 55, defending: 78, physical: 80 } }, // SILVER (avg 64)
    { position: 'CB', number: 5, stats: { pace: 72, shooting: 48, passing: 70, dribbling: 65, defending: 82, physical: 85 } }, // GOLD (avg 70)
    { position: 'LB', number: 3, stats: { pace: 55, shooting: 40, passing: 52, dribbling: 50, defending: 58, physical: 55 } }, // BRONZE (avg 52)
    // Midfielders
    { position: 'CDM', number: 6, stats: { pace: 68, shooting: 58, passing: 74, dribbling: 70, defending: 75, physical: 76 } }, // SILVER (avg 70)
    { position: 'CM', number: 8, stats: { pace: 78, shooting: 75, passing: 82, dribbling: 80, defending: 70, physical: 75 } }, // GOLD (avg 77)
    { position: 'CM', number: 10, stats: { pace: 72, shooting: 72, passing: 80, dribbling: 78, defending: 55, physical: 65 } }, // SILVER (avg 70)
    { position: 'RM', number: 7, stats: { pace: 60, shooting: 55, passing: 58, dribbling: 62, defending: 45, physical: 52 } }, // BRONZE (avg 55)
    { position: 'LM', number: 11, stats: { pace: 84, shooting: 68, passing: 70, dribbling: 80, defending: 42, physical: 60 } }, // SILVER (avg 67)
    // Attackers
    { position: 'ST', number: 9, stats: { pace: 88, shooting: 85, passing: 72, dribbling: 82, defending: 35, physical: 78 } }, // GOLD (avg 73)
  ];

  // Placeholder images of football players in action (from Unsplash)
  const placeholderImages = [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=500&fit=crop&crop=top',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=500&fit=crop&crop=top',
    'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400&h=500&fit=crop&crop=top',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=500&fit=crop&crop=top',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=500&fit=crop&crop=top',
  ];

  return positions.map((pos, index) => ({
    id: `placeholder-${pos.position}-${index}`,
    name: 'John Doe',
    number: pos.number,
    position: pos.position,
    country: 'gb',
    countryName: 'England',
    age: 25,
    height: '180 cm',
    weight: '75 kg',
    foot: 'Right',
    bio: 'Placeholder player. Add real players in the admin panel.',
    skill_moves: 3,
    weak_foot: 3,
    stats: pos.stats,
    image: placeholderImages[index % placeholderImages.length],
    isPlaceholder: true,
  }));
};

const PLACEHOLDER_PLAYERS = generatePlaceholderPlayers();

/**
 * Placeholder alumni/legends
 */
const PLACEHOLDER_ALUMNI = [
  {
    id: 'placeholder-alumni-1',
    name: 'John Legend',
    number: 10,
    position: 'CAM',
    country: 'gb',
    countryName: 'England',
    yearsActive: '2015-2022',
    bio: 'Placeholder legend. Add real alumni in the admin panel.',
    skill_moves: 4,
    weak_foot: 4,
    stats: { pace: 75, shooting: 82, passing: 88, dribbling: 85, defending: 45, physical: 68 },
    image: null,
    isPlaceholder: true,
  },
  {
    id: 'placeholder-alumni-2',
    name: 'John Legend',
    number: 1,
    position: 'GK',
    country: 'gb',
    countryName: 'England',
    yearsActive: '2012-2020',
    bio: 'Placeholder legend. Add real alumni in the admin panel.',
    skill_moves: 1,
    weak_foot: 3,
    stats: { diving: 85, handling: 82, kicking: 78, reflexes: 88, speed: 65, positioning: 84 },
    image: null,
    isPlaceholder: true,
  },
  {
    id: 'placeholder-alumni-3',
    name: 'John Legend',
    number: 9,
    position: 'ST',
    country: 'gb',
    countryName: 'England',
    yearsActive: '2014-2021',
    bio: 'Placeholder legend. Add real alumni in the admin panel.',
    skill_moves: 4,
    weak_foot: 5,
    stats: { pace: 82, shooting: 88, passing: 70, dribbling: 80, defending: 30, physical: 75 },
    image: null,
    isPlaceholder: true,
  },
];

/**
 * Our Team page - Main component
 * Displays team hierarchy, squad overview, football field formation, and alumni
 */
class OurTeam extends Component {
  constructor(props) {
    super(props);
    this.state = {
      owner: null,
      coaches: [],
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
      // Fetch from Supabase using views that combine tables with profiles
      const [ownersResponse, coachesResponse, playersResponse] = await Promise.all([
        // Try the team_members view first, fallback to staff table
        supabase.from('team_members').select('*').eq('role', 'owner').limit(1).single(),
        supabase.from('team_members').select('*').eq('role', 'coach'),
        // Use players_with_profiles view for full player data with stats as JSONB
        supabase.from('players_with_profiles').select('*').order('number', { ascending: true }),
      ]);

      // Debug logging
      console.log('OurTeam - Players response:', playersResponse);
      console.log('OurTeam - Players data:', playersResponse.data);

      // Check if we got data from the database
      const hasOwner = ownersResponse.data && !ownersResponse.error;
      const hasCoaches = coachesResponse.data && coachesResponse.data.length > 0;
      const hasPlayers = playersResponse.data && playersResponse.data.length > 0;

      // Separate active players from alumni
      const activePlayers = hasPlayers
        ? playersResponse.data.filter(p => !p.is_alumni && !p.is_retired)
        : [];
      const alumniPlayers = hasPlayers
        ? playersResponse.data.filter(p => p.is_alumni || p.is_retired)
        : [];

      this.setState({
        owner: hasOwner ? ownersResponse.data : PLACEHOLDER_OWNER,
        coaches: hasCoaches ? coachesResponse.data : PLACEHOLDER_COACHES,
        players: activePlayers.length > 0 ? activePlayers : PLACEHOLDER_PLAYERS,
        alumni: alumniPlayers.length > 0 ? alumniPlayers : PLACEHOLDER_ALUMNI,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching team data:', error);
      // Show placeholder on error
      this.setState({
        owner: PLACEHOLDER_OWNER,
        coaches: PLACEHOLDER_COACHES,
        players: PLACEHOLDER_PLAYERS,
        alumni: PLACEHOLDER_ALUMNI,
        isLoading: false,
        error: error.message,
      });
    }
  };

  render() {
    const {
      owner,
      coaches,
      players,
      alumni,
      isLoading,
    } = this.state;

    if (isLoading) {
      return (
        <div className="min-h-screen bg-surface-dark flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-accent-gold border-t-transparent rounded-full"
          />
        </div>
      );
    }

    // Check if we have real players or just placeholders
    const hasRealPlayers = players.some(p => !p.isPlaceholder);

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
        <TeamHierarchy owner={owner} coaches={coaches} />

        {/* Squad Overview - Players by Position */}
        <SquadOverview players={players} />

        {/* Football Field Formation */}
        <FootballField
          players={players}
          isPlaceholder={!hasRealPlayers}
        />

        {/* Alumni Section */}
        <AlumniSection alumni={alumni} />
      </div>
    );
  }
}

export default OurTeam;

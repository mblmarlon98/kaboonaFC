import React, { Component } from 'react';
import { motion } from 'framer-motion';
import TeamHierarchy from './components/TeamHierarchy';
import FootballField from './components/FootballField';
import PlayerModal from './components/PlayerModal';
import AlumniSection from './components/AlumniSection';
import { supabase } from '../../services/supabase';

/**
 * Mock data for development (used when database is empty)
 */
const MOCK_OWNER = {
  id: 'owner-1',
  name: 'Marcus Wellington',
  role: 'Team Owner',
  bio: 'Visionary leader and passionate football enthusiast. Founded Kaboona FC with the dream of building a community-driven club that develops local talent.',
  image: null,
};

const MOCK_COACHES = [
  {
    id: 'coach-1',
    name: 'James Morrison',
    role: 'Head Coach',
    specialization: 'Tactical Development',
    image: null,
  },
  {
    id: 'coach-2',
    name: 'David Silva',
    role: 'Assistant Coach',
    specialization: 'Youth Development',
    image: null,
  },
  {
    id: 'coach-3',
    name: 'Michael Torres',
    role: 'Goalkeeping Coach',
    specialization: 'GK Training',
    image: null,
  },
];

const MOCK_PLAYERS = [
  // Goalkeeper
  {
    id: 'player-1',
    name: 'Erik Blackwood',
    number: 1,
    position: 'GK',
    country: 'gb',
    countryName: 'England',
    age: 28,
    height: "6'2\"",
    weight: '185 lbs',
    foot: 'Right',
    bio: 'Commanding presence in goal with exceptional reflexes and distribution.',
    stats: {
      diving: 85,
      handling: 82,
      kicking: 78,
      reflexes: 88,
      gk_speed: 72,
      gk_positioning: 84,
    },
    image: null,
  },
  // Defenders
  {
    id: 'player-2',
    name: 'Lucas Mendes',
    number: 2,
    position: 'RB',
    country: 'br',
    countryName: 'Brazil',
    age: 24,
    height: "5'10\"",
    weight: '165 lbs',
    foot: 'Right',
    bio: 'Dynamic right-back with explosive pace and excellent crossing ability.',
    stats: {
      pace: 89,
      shooting: 62,
      passing: 75,
      dribbling: 78,
      defending: 76,
      physical: 71,
    },
    image: null,
  },
  {
    id: 'player-3',
    name: 'Viktor Kozlov',
    number: 4,
    position: 'CB',
    country: 'ua',
    countryName: 'Ukraine',
    age: 27,
    height: "6'3\"",
    weight: '195 lbs',
    foot: 'Right',
    bio: 'Towering centre-back with aerial dominance and strong tackling.',
    stats: {
      pace: 68,
      shooting: 45,
      passing: 62,
      dribbling: 55,
      defending: 87,
      physical: 88,
    },
    image: null,
  },
  {
    id: 'player-4',
    name: 'Marco Rossi',
    number: 5,
    position: 'CB',
    country: 'it',
    countryName: 'Italy',
    age: 29,
    height: "6'1\"",
    weight: '187 lbs',
    foot: 'Left',
    bio: 'Experienced defender known for reading the game and leadership.',
    stats: {
      pace: 65,
      shooting: 48,
      passing: 72,
      dribbling: 60,
      defending: 85,
      physical: 82,
    },
    image: null,
  },
  {
    id: 'player-5',
    name: 'Andre Williams',
    number: 3,
    position: 'LB',
    country: 'gb',
    countryName: 'England',
    age: 23,
    height: "5'11\"",
    weight: '170 lbs',
    foot: 'Left',
    bio: 'Energetic left-back who loves to overlap and provide width.',
    stats: {
      pace: 86,
      shooting: 58,
      passing: 74,
      dribbling: 76,
      defending: 74,
      physical: 72,
    },
    image: null,
  },
  // Midfielders
  {
    id: 'player-6',
    name: 'Kenji Tanaka',
    number: 7,
    position: 'RM',
    country: 'jp',
    countryName: 'Japan',
    age: 22,
    height: "5'8\"",
    weight: '155 lbs',
    foot: 'Right',
    bio: 'Tricky winger with excellent dribbling and vision.',
    stats: {
      pace: 88,
      shooting: 72,
      passing: 78,
      dribbling: 86,
      defending: 45,
      physical: 58,
    },
    image: null,
  },
  {
    id: 'player-7',
    name: 'Samuel Okonkwo',
    number: 8,
    position: 'CM',
    country: 'ng',
    countryName: 'Nigeria',
    age: 26,
    height: "6'0\"",
    weight: '178 lbs',
    foot: 'Right',
    bio: 'Box-to-box midfielder with incredible stamina and work rate.',
    stats: {
      pace: 78,
      shooting: 70,
      passing: 80,
      dribbling: 76,
      defending: 75,
      physical: 82,
    },
    image: null,
  },
  {
    id: 'player-8',
    name: 'Pierre Dubois',
    number: 6,
    position: 'CM',
    country: 'fr',
    countryName: 'France',
    age: 25,
    height: "5'11\"",
    weight: '172 lbs',
    foot: 'Both',
    bio: 'Creative playmaker who dictates the tempo from deep.',
    stats: {
      pace: 72,
      shooting: 68,
      passing: 88,
      dribbling: 82,
      defending: 65,
      physical: 70,
    },
    image: null,
  },
  {
    id: 'player-9',
    name: 'Ryan O\'Brien',
    number: 11,
    position: 'LM',
    country: 'ie',
    countryName: 'Ireland',
    age: 24,
    height: "5'9\"",
    weight: '162 lbs',
    foot: 'Left',
    bio: 'Speedy winger who terrorizes defenses with his direct running.',
    stats: {
      pace: 91,
      shooting: 74,
      passing: 72,
      dribbling: 84,
      defending: 42,
      physical: 62,
    },
    image: null,
  },
  // Strikers
  {
    id: 'player-10',
    name: 'Carlos Rodriguez',
    number: 9,
    position: 'ST',
    country: 'es',
    countryName: 'Spain',
    age: 27,
    height: "6'0\"",
    weight: '175 lbs',
    foot: 'Right',
    bio: 'Clinical finisher with excellent movement and heading ability.',
    stats: {
      pace: 82,
      shooting: 88,
      passing: 68,
      dribbling: 80,
      defending: 35,
      physical: 76,
    },
    image: null,
  },
  {
    id: 'player-11',
    name: 'Jamal Sterling',
    number: 10,
    position: 'ST',
    country: 'jm',
    countryName: 'Jamaica',
    age: 23,
    height: "5'10\"",
    weight: '168 lbs',
    foot: 'Both',
    bio: 'Young talent with blistering pace and natural goalscoring instinct.',
    stats: {
      pace: 93,
      shooting: 84,
      passing: 65,
      dribbling: 85,
      defending: 30,
      physical: 68,
    },
    image: null,
  },
];

const MOCK_ALUMNI = [
  {
    id: 'alumni-1',
    name: 'Roberto Santos',
    number: 10,
    position: 'CAM',
    country: 'br',
    countryName: 'Brazil',
    yearsActive: '2015-2022',
    bio: 'Club legend who holds the all-time scoring record. His vision and creativity defined an era.',
    stats: {
      pace: 78,
      shooting: 85,
      passing: 92,
      dribbling: 90,
      defending: 42,
      physical: 65,
    },
    image: null,
  },
  {
    id: 'alumni-2',
    name: 'Thomas Mueller',
    number: 1,
    position: 'GK',
    country: 'de',
    countryName: 'Germany',
    yearsActive: '2012-2020',
    bio: 'The wall. 847 saves and 52 clean sheets. A true guardian of our goal.',
    stats: {
      diving: 88,
      handling: 86,
      kicking: 82,
      reflexes: 90,
      gk_speed: 68,
      gk_positioning: 88,
    },
    image: null,
  },
  {
    id: 'alumni-3',
    name: 'Yusuf Ibrahim',
    number: 5,
    position: 'CB',
    country: 'eg',
    countryName: 'Egypt',
    yearsActive: '2014-2021',
    bio: 'The rock at the back. Captain who led by example with unwavering dedication.',
    stats: {
      pace: 72,
      shooting: 52,
      passing: 68,
      dribbling: 58,
      defending: 91,
      physical: 89,
    },
    image: null,
  },
  {
    id: 'alumni-4',
    name: 'Lee Min-ho',
    number: 7,
    position: 'RW',
    country: 'kr',
    countryName: 'South Korea',
    yearsActive: '2016-2023',
    bio: 'Magician on the wing. His skills and crossing created countless goals.',
    stats: {
      pace: 90,
      shooting: 76,
      passing: 84,
      dribbling: 92,
      defending: 38,
      physical: 62,
    },
    image: null,
  },
  {
    id: 'alumni-5',
    name: 'Antonio Vargas',
    number: 9,
    position: 'ST',
    country: 'ar',
    countryName: 'Argentina',
    yearsActive: '2013-2019',
    bio: 'The poacher. 127 goals in 203 appearances. Always in the right place.',
    stats: {
      pace: 84,
      shooting: 92,
      passing: 70,
      dribbling: 82,
      defending: 28,
      physical: 74,
    },
    image: null,
  },
];

/**
 * Our Team page - Main component
 * Displays team hierarchy, football field formation, and alumni
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
      selectedPlayer: null,
      isModalOpen: false,
    };
  }

  componentDidMount() {
    this.fetchTeamData();
    window.scrollTo(0, 0);
  }

  fetchTeamData = async () => {
    try {
      // Try to fetch from Supabase
      const [ownersResponse, coachesResponse, playersResponse] = await Promise.all([
        supabase.from('team_members').select('*').eq('role', 'owner').single(),
        supabase.from('team_members').select('*').eq('role', 'coach'),
        supabase.from('players').select('*'),
      ]);

      // Check if we got data from the database
      const hasOwner = ownersResponse.data && !ownersResponse.error;
      const hasCoaches = coachesResponse.data && coachesResponse.data.length > 0;
      const hasPlayers = playersResponse.data && playersResponse.data.length > 0;

      // Use database data if available, otherwise use mock data
      this.setState({
        owner: hasOwner ? ownersResponse.data : MOCK_OWNER,
        coaches: hasCoaches ? coachesResponse.data : MOCK_COACHES,
        players: hasPlayers
          ? playersResponse.data.filter(p => !p.isAlumni)
          : MOCK_PLAYERS,
        alumni: hasPlayers
          ? playersResponse.data.filter(p => p.isAlumni)
          : MOCK_ALUMNI,
        isLoading: false,
      });
    } catch (error) {
      console.warn('Error fetching team data, using mock data:', error);
      // Fallback to mock data on error
      this.setState({
        owner: MOCK_OWNER,
        coaches: MOCK_COACHES,
        players: MOCK_PLAYERS,
        alumni: MOCK_ALUMNI,
        isLoading: false,
      });
    }
  };

  handlePlayerClick = (player) => {
    this.setState({
      selectedPlayer: player,
      isModalOpen: true,
    });
  };

  handleCloseModal = () => {
    this.setState({
      isModalOpen: false,
    });
  };

  render() {
    const {
      owner,
      coaches,
      players,
      alumni,
      isLoading,
      selectedPlayer,
      isModalOpen,
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

    return (
      <div className="min-h-screen bg-surface-dark">
        {/* Hero Section */}
        <section className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface-dark-elevated via-surface-dark to-surface-dark" />

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

        {/* Football Field Formation */}
        <FootballField
          players={players}
          onPlayerClick={this.handlePlayerClick}
        />

        {/* Alumni Section */}
        <AlumniSection
          alumni={alumni}
          onPlayerClick={this.handlePlayerClick}
        />

        {/* Player Modal */}
        <PlayerModal
          player={selectedPlayer}
          isOpen={isModalOpen}
          onClose={this.handleCloseModal}
        />
      </div>
    );
  }
}

export default OurTeam;

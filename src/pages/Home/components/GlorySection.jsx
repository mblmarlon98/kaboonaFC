import React, { Component, createRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import supabase from '../../../services/supabase';
import { PlayerFIFACard } from '../../../components/shared';
import { ALL_MATCHES, OVERALL_STATS, THIRD_DIV_LEAGUE_TABLE, TOURNAMENTS } from '../../../data/matches';
import liveData from '../../../data/league-live.json';
import { TeamLogo } from '../../../data/teamLogos';

gsap.registerPlugin(ScrollTrigger);

// Skeleton Loader Component
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-white/10 rounded" />
      <div className="h-4 bg-white/10 rounded w-5/6" />
      <div className="h-4 bg-white/10 rounded w-4/6" />
    </div>
  </div>
);

class GlorySection extends Component {
  constructor(props) {
    super(props);
    this.sectionRef = createRef();
    this.state = {
      leagueTable: [],
      topScorers: [],
      cleanSheets: [],
      mostAttendance: [],
      wallOfShame: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchGloryData();
    this.initScrollAnimation();
  }

  componentWillUnmount() {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }

  initScrollAnimation = () => {
    if (this.sectionRef.current) {
      gsap.fromTo(
        this.sectionRef.current.querySelectorAll('.glory-card'),
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: this.sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }
  };

  fetchGloryData = async () => {
    try {
      // Fetch league table data
      const { data: leagueData, error: leagueError } = await supabase
        .from('league_table')
        .select('*')
        .order('position', { ascending: true });

      if (leagueError && leagueError.code !== 'PGRST116') {
        console.warn('League table not available:', leagueError);
      }

      // Use live scraped data if available, fallback to static
      const liveStandings = liveData?.standings?.length > 0
        ? liveData.standings.map(t => ({ ...t, isKaboona: t.isKaboona || t.team?.toLowerCase().includes('kaboona') }))
        : null;
      const realLeagueTable = liveStandings || THIRD_DIV_LEAGUE_TABLE;

      // Fetch real player data from players_full view
      const [scorersRes, cleanSheetRes, attendanceRes, cardsRes] = await Promise.all([
        // Top scorers - players with most goals
        supabase
          .from('players_full')
          .select('id, name, position, jersey_number, country, pace, shooting, passing, dribbling, defending, physical, season_goals, profile_image_url')
          .gt('season_goals', 0)
          .order('season_goals', { ascending: false })
          .limit(3),
        // Clean sheets - GK players with clean sheet counts
        supabase
          .from('players_full')
          .select('id, name, position, jersey_number, country, diving, handling, kicking, reflexes, gk_speed, gk_positioning, profile_image_url')
          .eq('position', 'GK')
          .limit(5),
        // Attendance - count accepted event invitations per player
        supabase
          .from('event_invitations')
          .select('player_id, status, profiles(full_name, profile_image_url)')
          .in('status', ['accepted', 'pending', 'declined']),
        // Wall of shame - players with most cards
        supabase
          .from('players_full')
          .select('id, name, season_yellows, season_reds, profile_image_url')
          .or('season_yellows.gt.0,season_reds.gt.0')
          .order('season_reds', { ascending: false })
          .limit(5),
      ]);

      // Process top scorers
      let topScorers = [];
      if (scorersRes.data && scorersRes.data.length > 0) {
        topScorers = scorersRes.data.map((p) => ({
          name: p.name,
          goals: p.season_goals,
          position: p.position,
          number: p.jersey_number,
          country: p.country || 'my',
          image_url: p.profile_image_url,
          stats: { pace: p.pace || 50, shooting: p.shooting || 50, passing: p.passing || 50, dribbling: p.dribbling || 50, defending: p.defending || 50, physical: p.physical || 50 },
        }));
      }

      // Process clean sheets - need separate aggregation
      let cleanSheets = [];
      if (cleanSheetRes.data && cleanSheetRes.data.length > 0) {
        // Get clean sheet counts from player_stats for these GKs
        const gkIds = cleanSheetRes.data.map((p) => p.id);
        const { data: csData } = await supabase
          .from('player_stats')
          .select('player_id, clean_sheet')
          .in('player_id', gkIds)
          .eq('clean_sheet', true);
        const csCounts = {};
        (csData || []).forEach((row) => {
          csCounts[row.player_id] = (csCounts[row.player_id] || 0) + 1;
        });
        cleanSheets = cleanSheetRes.data
          .map((p) => ({
            name: p.name,
            cleanSheets: csCounts[p.id] || 0,
            position: p.position,
            number: p.jersey_number,
            country: p.country || 'my',
            image_url: p.profile_image_url,
            stats: { diving: p.diving || 50, handling: p.handling || 50, kicking: p.kicking || 50, reflexes: p.reflexes || 50, speed: p.gk_speed || 50, positioning: p.gk_positioning || 50 },
          }))
          .filter((p) => p.cleanSheets > 0)
          .sort((a, b) => b.cleanSheets - a.cleanSheets)
          .slice(0, 3);
      }

      // Process attendance
      let mostAttendance = [];
      if (attendanceRes.data && attendanceRes.data.length > 0) {
        const playerInvites = {};
        attendanceRes.data.forEach((inv) => {
          if (!playerInvites[inv.player_id]) {
            playerInvites[inv.player_id] = { total: 0, accepted: 0, name: inv.profiles?.full_name || 'Unknown', image_url: inv.profiles?.profile_image_url };
          }
          playerInvites[inv.player_id].total += 1;
          if (inv.status === 'accepted') playerInvites[inv.player_id].accepted += 1;
        });
        // Get player details for those with attendance
        const playerIds = Object.keys(playerInvites).filter((id) => playerInvites[id].accepted > 0);
        let playerDetails = {};
        if (playerIds.length > 0) {
          const { data: pData } = await supabase
            .from('players')
            .select('id, user_id, position, jersey_number, country, pace, shooting, passing, dribbling, defending, physical')
            .in('user_id', playerIds);
          (pData || []).forEach((p) => { playerDetails[p.user_id] = p; });
        }
        mostAttendance = playerIds
          .map((pid) => {
            const inv = playerInvites[pid];
            const p = playerDetails[pid] || {};
            const pct = inv.total > 0 ? Math.round((inv.accepted / inv.total) * 100) : 0;
            return {
              name: inv.name,
              sessions: inv.accepted,
              attendance: `${pct}%`,
              position: p.position || '',
              number: p.jersey_number || 0,
              country: p.country || 'my',
              image_url: inv.image_url,
              stats: { pace: p.pace || 50, shooting: p.shooting || 50, passing: p.passing || 50, dribbling: p.dribbling || 50, defending: p.defending || 50, physical: p.physical || 50 },
            };
          })
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 3);
      }

      // Process wall of shame
      let wallOfShame = [];
      if (cardsRes.data && cardsRes.data.length > 0) {
        wallOfShame = cardsRes.data
          .map((p) => ({
            name: p.name,
            yellowCards: p.season_yellows || 0,
            redCards: p.season_reds || 0,
            reason: '',
          }))
          .sort((a, b) => (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3))
          .slice(0, 3);
      }

      this.setState({
        leagueTable: (leagueData && leagueData.length > 0) ? leagueData : realLeagueTable,
        topScorers,
        cleanSheets,
        mostAttendance,
        wallOfShame,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching glory data:', error);
      this.setState({ error: error.message, loading: false });
    }
  };

  renderLeagueTable = () => {
    const { leagueTable, loading } = this.state;

    if (loading) return <SkeletonCard />;

    // Find Kaboona's position and get +-3 teams
    const kaboonaIndex = leagueTable.findIndex(
      (team) => team.isKaboona || team.team?.toLowerCase().includes('kaboona')
    );
    const startIndex = Math.max(0, kaboonaIndex - 3);
    const endIndex = Math.min(leagueTable.length, kaboonaIndex + 4);
    const visibleTeams = leagueTable.slice(startIndex, endIndex);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/50 text-xs uppercase tracking-wider border-b border-white/10">
              <th className="py-3 px-2 text-left">Pos</th>
              <th className="py-3 px-2 text-left">Team</th>
              <th className="py-3 px-2 text-center">P</th>
              <th className="py-3 px-2 text-center">GD</th>
              <th className="py-3 px-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {visibleTeams.map((team, index) => (
              <tr
                key={index}
                className={`border-b border-white/5 ${
                  team.isKaboona || team.team?.toLowerCase().includes('kaboona')
                    ? 'bg-accent-gold/10 text-accent-gold font-semibold'
                    : 'text-white/80'
                }`}
              >
                <td className="py-3 px-2">{team.position}</td>
                <td className="py-3 px-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <TeamLogo teamName={team.team} size={22} />
                    {team.team}
                  </div>
                </td>
                <td className="py-3 px-2 text-center">{team.played}</td>
                <td className="py-3 px-2 text-center">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                <td className="py-3 px-2 text-center font-bold">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  renderWallOfShame = () => {
    const { wallOfShame, loading } = this.state;

    if (loading) return <SkeletonCard />;

    return (
      <div className="space-y-4">
        {wallOfShame.map((player, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-surface-dark hover:bg-surface-dark-hover transition-colors border border-white/5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{player.name}</span>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-yellow-400 text-sm">
                  <span className="w-3 h-4 bg-yellow-400 rounded-sm" />
                  {player.yellowCards}
                </span>
                <span className="flex items-center gap-1 text-red-400 text-sm">
                  <span className="w-3 h-4 bg-red-500 rounded-sm" />
                  {player.redCards}
                </span>
              </div>
            </div>
            <p className="text-white/40 text-sm italic">"{player.reason}"</p>
          </div>
        ))}
      </div>
    );
  };

  render() {
    const { topScorers, cleanSheets, mostAttendance, wallOfShame, loading } = this.state;
    const c = this.props.content || {};
    const badge = c.badge || 'GLORY SECTION';
    const heading = c.heading || 'League Standing';
    const leagueTitle = c.leagueTitle || 'The New Camp Edition (Division 3)';
    const achievementsBadge = c.achievementsBadge || 'ACHIEVEMENTS';
    const achievementsHeading = c.achievementsHeading || 'Our Stars';
    const shameBadge = c.shameBadge || 'HALL OF INFAMY';
    const shameHeading = c.shameHeading || 'Wall of Shame';

    return (
      <section
        ref={this.sectionRef}
        className="py-20 md:py-32 bg-surface-dark relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.3) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* GLORY SECTION - League Table */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-accent-gold/10 text-accent-gold text-sm font-semibold tracking-wider rounded-full mb-6">
                {badge}
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
                {heading}
              </h2>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="glory-card p-6 bg-surface-dark-elevated rounded-2xl border border-white/5 hover:border-accent-gold/30 transition-all duration-300">
                <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {leagueTitle}
                </h3>
                {this.renderLeagueTable()}
              </div>
            </div>
          </div>

          {/* ACHIEVEMENTS SECTION */}
          <div className="mb-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-green-500/10 text-green-400 text-sm font-semibold tracking-wider rounded-full mb-6">
                {achievementsBadge}
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
                {achievementsHeading}
              </h2>
            </div>

            {/* Top Scorers */}
            {loading ? (
              <div className="mb-16"><SkeletonCard /></div>
            ) : topScorers.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-display font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                  <svg className="w-8 h-8 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Top Scorers
                </h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {topScorers.map((player, index) => (
                    <div key={index} className="glory-card">
                      <PlayerFIFACard
                        name={player.name}
                        position={player.position}
                        number={player.number}
                        country={player.country}
                        stats={player.stats}
                        imageUrl={player.image_url}
                        size="md"
                        badge={`${player.goals} Goals`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clean Sheets */}
            {loading ? (
              <div className="mb-16"><SkeletonCard /></div>
            ) : cleanSheets.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-display font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                  <svg className="w-8 h-8 text-secondary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Clean Sheets
                </h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {cleanSheets.map((player, index) => (
                    <div key={index} className="glory-card">
                      <PlayerFIFACard
                        name={player.name}
                        position={player.position}
                        number={player.number}
                        country={player.country}
                        stats={player.stats}
                        imageUrl={player.image_url}
                        size="md"
                        badge={`${player.cleanSheets} Clean Sheets`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Attendance */}
            {loading ? (
              <div className="mb-16"><SkeletonCard /></div>
            ) : mostAttendance.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-display font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Best Attendance
                </h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {mostAttendance.map((player, index) => (
                    <div key={index} className="glory-card">
                      <PlayerFIFACard
                        name={player.name}
                        position={player.position}
                        number={player.number}
                        country={player.country}
                        stats={player.stats}
                        imageUrl={player.image_url}
                        size="md"
                        badge={player.attendance}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No achievements message when all empty */}
            {!loading && topScorers.length === 0 && cleanSheets.length === 0 && mostAttendance.length === 0 && (
              <div className="text-center py-12">
                <p className="text-white/40 text-lg">No match data recorded yet. Stats will appear here once matches are played.</p>
              </div>
            )}
          </div>

          {/* WALL OF SHAME */}
          {(loading || wallOfShame.length > 0) && (
            <div>
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1 bg-red-500/10 text-red-400 text-sm font-semibold tracking-wider rounded-full mb-6">
                  {shameBadge}
                </span>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white">
                  {shameHeading}
                </h2>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="glory-card p-6 bg-surface-dark-elevated rounded-2xl border border-red-500/20 hover:border-red-500/40 transition-all duration-300">
                  {this.renderWallOfShame()}
                  <p className="text-white/30 text-xs mt-4 italic text-center">
                    * All in good fun! We love these guys.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }
}

export default GlorySection;

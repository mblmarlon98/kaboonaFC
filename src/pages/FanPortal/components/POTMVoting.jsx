import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import {
  getVotableMatches, getMatchPlayers, castPOTMVote,
  getMyVote, getVoteResults,
} from '../../../services/fanPortalService';

class POTMVoting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      matches: [],
      activeMatchId: null,
      players: [],
      myVote: null,
      results: {},
      loading: true,
      voting: false,
    };
  }

  async componentDidMount() {
    try {
      const matches = await getVotableMatches();
      this.setState({ matches, loading: false });
      if (matches.length > 0) {
        await this.loadMatchVoting(matches[0].id);
      }
    } catch (err) {
      console.error('POTM load error:', err);
      this.setState({ loading: false });
    }
  }

  loadMatchVoting = async (matchId) => {
    const userId = this.props.user?.id;
    this.setState({ activeMatchId: matchId, loading: true });
    try {
      const [players, results] = await Promise.all([
        getMatchPlayers(matchId),
        getVoteResults(matchId),
      ]);
      let myVote = null;
      if (userId) {
        myVote = await getMyVote(matchId, userId);
      }
      this.setState({ players, results, myVote, loading: false });
    } catch (err) {
      console.error('Load voting error:', err);
      this.setState({ loading: false });
    }
  };

  isVotingOpen = (match) => {
    if (!match.completed_at) return false;
    const deadline = new Date(match.completed_at).getTime() + 48 * 3600000;
    return Date.now() < deadline;
  };

  handleVote = async (playerId) => {
    const { activeMatchId, myVote } = this.state;
    const userId = this.props.user?.id;
    if (!userId || myVote) return;
    this.setState({ voting: true });
    try {
      await castPOTMVote(activeMatchId, userId, playerId);
      const results = await getVoteResults(activeMatchId);
      this.setState({ myVote: playerId, results, voting: false });
    } catch (err) {
      console.error('Vote error:', err);
      this.setState({ voting: false });
    }
  };

  render() {
    const { matches, activeMatchId, players, myVote, results, loading, voting } = this.state;
    const { user } = this.props;
    const activeMatch = matches.find((m) => m.id === activeMatchId);
    const isOpen = activeMatch ? this.isVotingOpen(activeMatch) : false;
    const totalVotes = Object.values(results).reduce((s, v) => s + v, 0);

    if (loading && matches.length === 0) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🏆</p>
          <h3 className="text-xl font-display font-bold text-white mb-2">No Votes Available</h3>
          <p className="text-gray-400">Voting opens after each completed match!</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Match Selector */}
        {matches.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {matches.slice(0, 5).map((m) => (
              <button
                key={m.id}
                onClick={() => this.loadMatchVoting(m.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  m.id === activeMatchId
                    ? 'bg-accent-gold text-black'
                    : 'bg-surface-dark-elevated text-gray-400 border border-gray-700 hover:text-white'
                }`}
              >
                vs {m.opponent} &middot; {m.score_for}-{m.score_against}
              </button>
            ))}
          </div>
        )}

        {/* Match Info */}
        {activeMatch && (
          <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4 text-center">
            <p className="text-gray-400 text-sm">{activeMatch.match_date}</p>
            <p className="text-xl font-display font-bold text-white">
              Kaboona FC {activeMatch.score_for} - {activeMatch.score_against} {activeMatch.opponent}
            </p>
            <p className={`text-sm mt-1 ${isOpen ? 'text-green-400' : 'text-gray-500'}`}>
              {isOpen ? 'Voting is open!' : 'Voting closed'}
            </p>
          </div>
        )}

        {/* Player Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {players.map((player) => {
            const voteCount = results[player.userId] || 0;
            const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isSelected = myVote === player.userId;
            const showResults = !isOpen || myVote;
            const isWinner = !isOpen && voteCount === Math.max(...Object.values(results), 0) && voteCount > 0;

            return (
              <motion.button
                key={player.userId}
                whileHover={isOpen && !myVote ? { scale: 1.05 } : {}}
                whileTap={isOpen && !myVote ? { scale: 0.95 } : {}}
                onClick={() => isOpen && !myVote && user && this.handleVote(player.userId)}
                disabled={!isOpen || !!myVote || !user || voting}
                className={`relative bg-surface-dark-elevated rounded-xl border p-4 text-center transition-all ${
                  isSelected
                    ? 'border-accent-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                    : 'border-gray-800 hover:border-gray-600'
                } ${isWinner ? 'ring-2 ring-accent-gold' : ''}`}
              >
                {isWinner && <span className="absolute -top-2 -right-2 text-2xl">👑</span>}
                <div className="w-14 h-14 rounded-full bg-surface-dark-hover mx-auto mb-2 overflow-hidden flex items-center justify-center">
                  {player.profileImageUrl ? (
                    <img src={player.profileImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-gray-500">{(player.fullName || '?')[0]}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white truncate">{player.fullName}</p>
                <p className="text-xs text-gray-500">{player.position || ''} {player.jerseyNumber ? `#${player.jerseyNumber}` : ''}</p>
                {showResults && totalVotes > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-surface-dark rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full bg-accent-gold rounded-full"
                      />
                    </div>
                    <p className="text-xs text-accent-gold mt-1">{pct}% ({voteCount})</p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {!user && isOpen && (
          <p className="text-center text-gray-400 text-sm">Log in to cast your vote</p>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(POTMVoting);

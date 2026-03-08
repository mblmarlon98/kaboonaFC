import React, { Component } from 'react';
import { motion } from 'framer-motion';

/**
 * Mock player data for match evaluation
 */
const MOCK_PLAYERS = [
  { id: 'player-1', name: 'Erik Blackwood', number: 1, position: 'GK' },
  { id: 'player-2', name: 'Lucas Mendes', number: 2, position: 'RB' },
  { id: 'player-3', name: 'Viktor Kozlov', number: 4, position: 'CB' },
  { id: 'player-4', name: 'Marco Rossi', number: 5, position: 'CB' },
  { id: 'player-5', name: 'Andre Williams', number: 3, position: 'LB' },
  { id: 'player-6', name: 'Kenji Tanaka', number: 7, position: 'RM' },
  { id: 'player-7', name: 'Samuel Okonkwo', number: 8, position: 'CM' },
  { id: 'player-8', name: 'Pierre Dubois', number: 6, position: 'CM' },
  { id: 'player-9', name: 'Ryan O\'Brien', number: 11, position: 'LM' },
  { id: 'player-10', name: 'Carlos Rodriguez', number: 9, position: 'ST' },
  { id: 'player-11', name: 'Jamal Sterling', number: 10, position: 'ST' },
];

/**
 * MatchEvaluation - Rate player performances after matches
 */
class MatchEvaluation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      matchDate: new Date().toISOString().split('T')[0],
      opponent: '',
      result: 'win',
      scoreFor: 0,
      scoreAgainst: 0,
      notes: '',
      playerRatings: {},
      isSaving: false,
      saveMessage: null,
    };

    // Initialize all player ratings to 6.0 (neutral)
    MOCK_PLAYERS.forEach(player => {
      this.state.playerRatings[player.id] = 6.0;
    });
  }

  handleInputChange = (field, value) => {
    this.setState({ [field]: value });
  };

  handleRatingChange = (playerId, rating) => {
    this.setState(prevState => ({
      playerRatings: {
        ...prevState.playerRatings,
        [playerId]: parseFloat(rating),
      },
    }));
  };

  handleSubmit = async () => {
    const { matchDate, opponent, playerRatings } = this.state;

    if (!matchDate || !opponent) {
      this.setState({
        saveMessage: { type: 'error', text: 'Please fill in all match details' },
      });
      return;
    }

    this.setState({ isSaving: true });

    // Simulate API call to record performances
    // In production, this would call batchRecordPerformances from performanceService
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Count good and poor performances
    const goodPerformances = Object.values(playerRatings).filter(r => r >= 7.0).length;
    const poorPerformances = Object.values(playerRatings).filter(r => r < 5.0).length;

    this.setState({
      isSaving: false,
      saveMessage: {
        type: 'success',
        text: `Match evaluation saved! ${goodPerformances} players with good performances, ${poorPerformances} with poor performances.`,
      },
    });

    setTimeout(() => {
      this.setState({ saveMessage: null });
    }, 5000);
  };

  getRatingColor = (rating) => {
    if (rating >= 8.0) return 'text-green-400 bg-green-500/20';
    if (rating >= 7.0) return 'text-lime-400 bg-lime-500/20';
    if (rating >= 6.0) return 'text-yellow-400 bg-yellow-500/20';
    if (rating >= 5.0) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  getRatingLabel = (rating) => {
    if (rating >= 9.0) return 'Outstanding';
    if (rating >= 8.0) return 'Excellent';
    if (rating >= 7.0) return 'Good';
    if (rating >= 6.0) return 'Average';
    if (rating >= 5.0) return 'Below Average';
    if (rating >= 4.0) return 'Poor';
    return 'Very Poor';
  };

  renderPlayerRating = (player) => {
    const { playerRatings } = this.state;
    const rating = playerRatings[player.id] || 6.0;
    const isGoodPerformance = rating >= 7.0;

    return (
      <motion.div
        key={player.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-lg p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Player Info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-accent-gold/20 rounded-lg flex items-center justify-center text-accent-gold font-bold">
              {player.number}
            </div>
            <div>
              <p className="font-medium text-primary-black dark:text-white">
                {player.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {player.position}
              </p>
            </div>
          </div>

          {/* Rating Slider */}
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={rating}
                onChange={(e) => this.handleRatingChange(player.id, e.target.value)}
                className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-gold"
              />
              <div className={`w-20 text-center py-1 px-2 rounded-lg font-bold ${this.getRatingColor(rating)}`}>
                {rating.toFixed(1)}
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>{this.getRatingLabel(rating)}</span>
              {isGoodPerformance && (
                <span className="text-green-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Streak continues
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  render() {
    const { matchDate, opponent, result, scoreFor, scoreAgainst, notes, isSaving, saveMessage } = this.state;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-display font-bold text-primary-black dark:text-white">
            Match Evaluation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Rate player performances to track streaks and progress
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              saveMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {saveMessage.text}
          </motion.div>
        )}

        {/* Match Details */}
        <div className="bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl p-4 sm:p-6">
          <h3 className="text-lg font-display font-bold text-primary-black dark:text-white mb-4">
            Match Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Match Date
              </label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => this.handleInputChange('matchDate', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg text-primary-black dark:text-white focus:ring-2 focus:ring-accent-gold focus:border-transparent"
              />
            </div>

            {/* Opponent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opponent
              </label>
              <input
                type="text"
                value={opponent}
                onChange={(e) => this.handleInputChange('opponent', e.target.value)}
                placeholder="Enter opponent name"
                className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg text-primary-black dark:text-white focus:ring-2 focus:ring-accent-gold focus:border-transparent"
              />
            </div>

            {/* Result */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Result
              </label>
              <select
                value={result}
                onChange={(e) => this.handleInputChange('result', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg text-primary-black dark:text-white focus:ring-2 focus:ring-accent-gold focus:border-transparent"
              >
                <option value="win">Win</option>
                <option value="draw">Draw</option>
                <option value="loss">Loss</option>
              </select>
            </div>

            {/* Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Score
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={scoreFor}
                  onChange={(e) => this.handleInputChange('scoreFor', parseInt(e.target.value) || 0)}
                  className="w-16 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg text-primary-black dark:text-white text-center focus:ring-2 focus:ring-accent-gold focus:border-transparent"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="number"
                  min="0"
                  value={scoreAgainst}
                  onChange={(e) => this.handleInputChange('scoreAgainst', parseInt(e.target.value) || 0)}
                  className="w-16 px-3 py-2 bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg text-primary-black dark:text-white text-center focus:ring-2 focus:ring-accent-gold focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Match Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => this.handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Add any notes about the match..."
              className="w-full px-4 py-2 bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 rounded-lg text-primary-black dark:text-white focus:ring-2 focus:ring-accent-gold focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Player Ratings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-display font-bold text-primary-black dark:text-white">
              Player Ratings
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Rating 7.0+ counts as good performance
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_PLAYERS.map(player => this.renderPlayerRating(player))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={this.handleSubmit}
            disabled={isSaving}
            className="px-8 py-3 bg-accent-gold text-black font-bold rounded-lg hover:bg-accent-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit Evaluation
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How ratings affect players
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Ratings of 7.0 or higher count as a good performance</li>
            <li>Consecutive good performances build a streak</li>
            <li>Reaching the streak threshold increases the player's overall rating by 1</li>
            <li>Poor performances (below 5.0) reset the streak</li>
            <li>Higher-rated players need more consecutive performances to earn upgrades</li>
          </ul>
        </div>
      </div>
    );
  }
}

export default MatchEvaluation;

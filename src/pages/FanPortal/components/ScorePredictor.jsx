import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { submitPrediction, getMyPrediction } from '../../../services/fanPortalService';

class ScorePredictor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scoreFor: 0,
      scoreAgainst: 0,
      submitted: null,
      submitting: false,
    };
  }

  async componentDidMount() {
    const { match, userId } = this.props;
    if (userId && match) {
      const existing = await getMyPrediction(match.id, userId);
      if (existing) {
        this.setState({
          submitted: existing,
          scoreFor: existing.score_for,
          scoreAgainst: existing.score_against,
        });
      }
    }
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.match?.id !== this.props.match?.id && this.props.userId) {
      const existing = await getMyPrediction(this.props.match.id, this.props.userId);
      if (existing) {
        this.setState({ submitted: existing, scoreFor: existing.score_for, scoreAgainst: existing.score_against });
      } else {
        this.setState({ submitted: null, scoreFor: 0, scoreAgainst: 0 });
      }
    }
  }

  handleSubmit = async () => {
    const { match, userId } = this.props;
    const { scoreFor, scoreAgainst } = this.state;
    if (!userId || !match) return;
    this.setState({ submitting: true });
    try {
      const result = await submitPrediction(match.id, userId, scoreFor, scoreAgainst);
      this.setState({ submitted: result, submitting: false });
    } catch (err) {
      console.error('Prediction error:', err);
      this.setState({ submitting: false });
    }
  };

  adjustScore = (field, delta) => {
    this.setState((prev) => ({
      [field]: Math.max(0, prev[field] + delta),
    }));
  };

  render() {
    const { match, userId } = this.props;
    const { scoreFor, scoreAgainst, submitted, submitting } = this.state;
    const isCompleted = match?.status === 'completed';

    if (!userId) {
      return (
        <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4 text-center">
          <p className="text-gray-400 text-sm">Log in to predict the score</p>
        </div>
      );
    }

    return (
      <div className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4">
        <h3 className="text-lg font-display font-bold text-white mb-4">Score Prediction</h3>

        {submitted ? (
          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Your prediction:</p>
            <p className="text-3xl font-display font-bold text-accent-gold">
              {submitted.score_for} - {submitted.score_against}
            </p>
            {isCompleted && (
              <div className="mt-3">
                <p className="text-sm text-gray-400">Actual: {match.score_for} - {match.score_against}</p>
                {match.score_for === submitted.score_for && match.score_against === submitted.score_against ? (
                  <span className="inline-block mt-1 text-green-400 font-semibold text-sm">Exact match! +20 pts</span>
                ) : Math.sign(match.score_for - match.score_against) === Math.sign(submitted.score_for - submitted.score_against) ? (
                  <span className="inline-block mt-1 text-yellow-400 font-semibold text-sm">Correct result! +10 pts</span>
                ) : (
                  <span className="inline-block mt-1 text-red-400 text-sm">Wrong prediction</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center gap-6">
              {/* Kaboona Score */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Kaboona FC</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => this.adjustScore('scoreFor', -1)} className="w-8 h-8 rounded-lg bg-surface-dark-hover text-white hover:bg-surface-dark transition-colors flex items-center justify-center">-</button>
                  <span className="text-3xl font-display font-bold text-white w-10 text-center">{scoreFor}</span>
                  <button onClick={() => this.adjustScore('scoreFor', 1)} className="w-8 h-8 rounded-lg bg-surface-dark-hover text-white hover:bg-surface-dark transition-colors flex items-center justify-center">+</button>
                </div>
              </div>

              <span className="text-2xl text-gray-600 font-display">-</span>

              {/* Opponent Score */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">{match?.opponent || 'Opponent'}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => this.adjustScore('scoreAgainst', -1)} className="w-8 h-8 rounded-lg bg-surface-dark-hover text-white hover:bg-surface-dark transition-colors flex items-center justify-center">-</button>
                  <span className="text-3xl font-display font-bold text-white w-10 text-center">{scoreAgainst}</span>
                  <button onClick={() => this.adjustScore('scoreAgainst', 1)} className="w-8 h-8 rounded-lg bg-surface-dark-hover text-white hover:bg-surface-dark transition-colors flex items-center justify-center">+</button>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={this.handleSubmit}
              disabled={submitting}
              className="w-full mt-4 py-3 bg-accent-gold text-black rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Lock In Prediction'}
            </motion.button>
          </div>
        )}
      </div>
    );
  }
}

export default ScorePredictor;

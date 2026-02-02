import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * Mock data for coach ratings - average player performance metrics
 */
const MOCK_RATINGS_DATA = [
  { attribute: 'Attacking', current: 78, previous: 72 },
  { attribute: 'Defending', current: 74, previous: 68 },
  { attribute: 'Possession', current: 82, previous: 78 },
  { attribute: 'Teamwork', current: 85, previous: 80 },
  { attribute: 'Fitness', current: 76, previous: 74 },
  { attribute: 'Discipline', current: 68, previous: 65 },
];

/**
 * Mock individual player ratings
 */
const MOCK_PLAYER_RATINGS = [
  { name: 'Carlos Rodriguez', rating: 8.4, matches: 14, trend: 'up' },
  { name: 'Pierre Dubois', rating: 8.2, matches: 13, trend: 'up' },
  { name: 'Samuel Okonkwo', rating: 8.0, matches: 14, trend: 'stable' },
  { name: 'Jamal Sterling', rating: 7.9, matches: 12, trend: 'up' },
  { name: 'Erik Blackwood', rating: 7.8, matches: 14, trend: 'stable' },
];

/**
 * Custom tooltip for radar chart
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-surface-dark-elevated border border-accent-gold/30 rounded-lg p-3 shadow-xl">
        <p className="text-white font-bold">{data.attribute}</p>
        <div className="mt-2 space-y-1">
          <p className="text-accent-gold">Current: {data.current}</p>
          <p className="text-white/60">Previous: {data.previous}</p>
          <p className={`text-sm ${data.current > data.previous ? 'text-green-400' : 'text-red-400'}`}>
            {data.current > data.previous ? '+' : ''}{data.current - data.previous} change
          </p>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * RatingsRadar - Radar chart showing average player ratings
 */
class RatingsRadar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ratingsData: [],
      playerRatings: [],
      isLoading: true,
      showPrevious: true,
    };
  }

  componentDidMount() {
    this.fetchRatingsData();
  }

  fetchRatingsData = async () => {
    try {
      setTimeout(() => {
        this.setState({
          ratingsData: MOCK_RATINGS_DATA,
          playerRatings: MOCK_PLAYER_RATINGS,
          isLoading: false,
        });
      }, 1000);
    } catch (error) {
      console.warn('Error fetching ratings data:', error);
      this.setState({
        ratingsData: MOCK_RATINGS_DATA,
        playerRatings: MOCK_PLAYER_RATINGS,
        isLoading: false,
      });
    }
  };

  togglePrevious = () => {
    this.setState((prevState) => ({ showPrevious: !prevState.showPrevious }));
  };

  renderTrendIcon = (trend) => {
    if (trend === 'up') {
      return (
        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      );
    } else if (trend === 'down') {
      return (
        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-white/40" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  getRatingColor = (rating) => {
    if (rating >= 8.0) return 'text-green-400';
    if (rating >= 7.0) return 'text-accent-gold';
    if (rating >= 6.0) return 'text-yellow-400';
    return 'text-orange-400';
  };

  render() {
    const { ratingsData, playerRatings, isLoading, showPrevious } = this.state;

    if (isLoading) {
      return (
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-64 bg-white/5 rounded-full mx-auto w-64" />
          </div>
        </div>
      );
    }

    // Calculate team average
    const teamAverage = (playerRatings.reduce((sum, p) => sum + p.rating, 0) / playerRatings.length).toFixed(1);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
              <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Coach Ratings
            </h3>
            <p className="text-white/50 text-sm mt-1">Team performance analysis</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-accent-gold">{teamAverage}</p>
            <p className="text-white/40 text-xs uppercase tracking-wider">Team Avg</p>
          </div>
        </div>

        {/* Toggle Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={this.togglePrevious}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              showPrevious
                ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30'
                : 'bg-surface-dark text-white/60 border border-white/10'
            }`}
          >
            {showPrevious ? 'Comparing with Previous Season' : 'Show Previous Season'}
          </button>
        </div>

        {/* Radar Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={ratingsData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis
                dataKey="attribute"
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                axisLine={false}
              />
              {showPrevious && (
                <Radar
                  name="Previous Season"
                  dataKey="previous"
                  stroke="rgba(255,255,255,0.3)"
                  fill="rgba(255,255,255,0.1)"
                  fillOpacity={0.3}
                  animationBegin={0}
                  animationDuration={1500}
                />
              )}
              <Radar
                name="Current Season"
                dataKey="current"
                stroke="#D4AF37"
                fill="#D4AF37"
                fillOpacity={0.3}
                animationBegin={300}
                animationDuration={1500}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-white/80">{value}</span>}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Improvement Summary */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ratingsData.map((item, index) => {
            const change = item.current - item.previous;
            return (
              <motion.div
                key={item.attribute}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-surface-dark rounded-lg p-3 text-center"
              >
                <p className="text-white/60 text-xs mb-1">{item.attribute}</p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg font-bold text-white">{item.current}</span>
                  <span className={`text-xs ${change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-white/40'}`}>
                    {change > 0 ? '+' : ''}{change}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Top Rated Players */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
            Highest Rated Players
          </h4>
          <div className="space-y-3">
            {playerRatings.map((player, index) => (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-dark hover:bg-surface-dark-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? 'bg-accent-gold text-black'
                        : index === 1
                        ? 'bg-white/20 text-white'
                        : index === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <span className="text-white/90 font-medium">{player.name}</span>
                    <p className="text-white/40 text-xs">{player.matches} matches rated</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {this.renderTrendIcon(player.trend)}
                  <span className={`text-xl font-bold ${this.getRatingColor(player.rating)}`}>
                    {player.rating}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
}

export default RatingsRadar;

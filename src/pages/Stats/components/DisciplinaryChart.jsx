import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * Mock data for disciplinary records - "Wall of Shame"
 */
const MOCK_DISCIPLINARY_DATA = [
  {
    name: 'Crazy Legs Kamal',
    yellowCards: 8,
    redCards: 1,
    fouls: 24,
    nickname: 'The Slide Tackle Specialist',
    quote: '"The ball was there... somewhere"',
  },
  {
    name: 'Hot Head Harris',
    yellowCards: 6,
    redCards: 2,
    fouls: 18,
    nickname: "Referee's Best Friend",
    quote: '"What do you mean that was a foul?"',
  },
  {
    name: 'Wild Card Wafi',
    yellowCards: 5,
    redCards: 0,
    fouls: 15,
    nickname: 'Creative Fouls Artist',
    quote: '"I barely touched him!"',
  },
  {
    name: 'Thunderfoot Tariq',
    yellowCards: 4,
    redCards: 1,
    fouls: 12,
    nickname: 'The Human Wrecking Ball',
    quote: '"I was going for the ball, I swear"',
  },
  {
    name: 'Danger Dan',
    yellowCards: 3,
    redCards: 0,
    fouls: 10,
    nickname: 'The Late Challenger',
    quote: '"My timing is just... unique"',
  },
];

/**
 * Custom tooltip component
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-surface-dark-elevated border border-red-500/30 rounded-lg p-4 shadow-xl">
        <p className="text-red-400 font-bold text-lg">{data.name}</p>
        <p className="text-white/60 italic text-sm mb-2">"{data.nickname}"</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
            <span className="text-white">Yellow Cards: {data.yellowCards}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-4 bg-red-500 rounded-sm" />
            <span className="text-white">Red Cards: {data.redCards}</span>
          </div>
          <p className="text-white/60 text-sm mt-2">Total Fouls: {data.fouls}</p>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * DisciplinaryChart - Yellow/Red cards chart (Wall of Shame)
 */
class DisciplinaryChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disciplinaryData: [],
      isLoading: true,
      selectedPlayer: null,
    };
  }

  componentDidMount() {
    this.fetchDisciplinaryData();
  }

  fetchDisciplinaryData = async () => {
    try {
      setTimeout(() => {
        this.setState({
          disciplinaryData: MOCK_DISCIPLINARY_DATA,
          isLoading: false,
        });
      }, 900);
    } catch (error) {
      console.warn('Error fetching disciplinary data:', error);
      this.setState({
        disciplinaryData: MOCK_DISCIPLINARY_DATA,
        isLoading: false,
      });
    }
  };

  handlePlayerClick = (player) => {
    this.setState({
      selectedPlayer: this.state.selectedPlayer?.name === player.name ? null : player
    });
  };

  render() {
    const { disciplinaryData, isLoading, selectedPlayer } = this.state;

    if (isLoading) {
      return (
        <div className="bg-surface-dark-elevated rounded-2xl border border-red-500/20 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-64 bg-white/5 rounded" />
          </div>
        </div>
      );
    }

    const totalYellows = disciplinaryData.reduce((sum, p) => sum + p.yellowCards, 0);
    const totalReds = disciplinaryData.reduce((sum, p) => sum + p.redCards, 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-surface-dark-elevated rounded-2xl border border-red-500/20 p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Wall of Shame
          </h3>
          <p className="text-white/50 text-sm mt-1">Our most... enthusiastic players</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-6 bg-yellow-400 rounded" />
              <span className="text-3xl font-bold text-yellow-400">{totalYellows}</span>
            </div>
            <p className="text-white/50 text-xs uppercase tracking-wider">Yellow Cards</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-6 bg-red-500 rounded" />
              <span className="text-3xl font-bold text-red-400">{totalReds}</span>
            </div>
            <p className="text-white/50 text-xs uppercase tracking-wider">Red Cards</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[250px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={disciplinaryData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend
                formatter={(value) => <span className="text-white/80">{value}</span>}
              />
              <Bar
                dataKey="yellowCards"
                name="Yellow Cards"
                fill="#FBBF24"
                radius={[4, 4, 0, 0]}
                animationBegin={0}
                animationDuration={1500}
              />
              <Bar
                dataKey="redCards"
                name="Red Cards"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                animationBegin={300}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Player Cards */}
        <div className="space-y-3">
          {disciplinaryData.map((player, index) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => this.handlePlayerClick(player)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                selectedPlayer?.name === player.name
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-surface-dark border-white/5 hover:border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-red-400">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{player.name}</p>
                    <p className="text-white/40 text-sm italic">{player.nickname}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
                    <span className="text-yellow-400 font-bold">{player.yellowCards}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-4 bg-red-500 rounded-sm" />
                    <span className="text-red-400 font-bold">{player.redCards}</span>
                  </div>
                </div>
              </div>

              {selectedPlayer?.name === player.name && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <p className="text-white/60 italic text-sm">{player.quote}</p>
                  <p className="text-white/40 text-xs mt-2">Total Fouls: {player.fouls}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-white/30 text-xs mt-6 text-center italic">
          * All in good fun! We love these guys (even when they get carded).
        </p>
      </motion.div>
    );
  }
}

export default DisciplinaryChart;

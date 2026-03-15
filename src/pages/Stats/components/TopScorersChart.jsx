import React, { Component } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { supabase } from '../../../services/supabase';

/**
 * Custom tooltip component
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface-dark-elevated border border-white/10 rounded-lg p-4 shadow-xl">
        <p className="text-accent-gold font-bold text-lg">{data.name}</p>
        <div className="mt-2 space-y-1">
          <p className="text-white">
            <span className="text-white/60">Goals:</span>{' '}
            <span className="font-bold">{data.goals}</span>
          </p>
          <p className="text-white">
            <span className="text-white/60">Assists:</span>{' '}
            <span className="font-bold">{data.assists}</span>
          </p>
          <p className="text-white">
            <span className="text-white/60">G+A:</span>{' '}
            <span className="font-bold text-accent-gold">{data.goals + data.assists}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

/**
 * TopScorersChart - Bar chart showing top goal scorers
 */
class TopScorersChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scorersData: [],
      isLoading: true,
      activeIndex: null,
    };
  }

  componentDidMount() {
    this.fetchScorersData();
  }

  fetchScorersData = async () => {
    try {
      const { data, error } = await supabase
        .from('players_full')
        .select('id, name, season_goals, season_assists, profile_image_url')
        .gt('season_goals', 0)
        .order('season_goals', { ascending: false })
        .limit(5);

      if (error) throw error;

      const scorersData = (data || []).map(p => ({
        name: p.name || 'Unknown',
        goals: p.season_goals || 0,
        assists: p.season_assists || 0,
        team: 'KABOONA FC',
        isKaboona: true,
      }));

      this.setState({ scorersData, isLoading: false });
    } catch (error) {
      console.warn('Error fetching scorers data:', error);
      this.setState({ scorersData: [], isLoading: false });
    }
  };

  handleMouseEnter = (data, index) => {
    this.setState({ activeIndex: index });
  };

  handleMouseLeave = () => {
    this.setState({ activeIndex: null });
  };

  render() {
    const { scorersData, isLoading, activeIndex } = this.state;

    if (isLoading) {
      return (
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6 h-[400px]">
          <div className="animate-pulse space-y-4 h-full">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-full bg-white/5 rounded" />
          </div>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-6"
      >
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            <svg className="w-6 h-6 text-accent-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Top Scorers
          </h3>
          <p className="text-white/50 text-sm mt-1">Goal contributions this season</p>
        </div>

        {/* Chart */}
        {scorersData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-white/40">No goals recorded yet this season.</p>
          </div>
        ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={scorersData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar
                dataKey="goals"
                radius={[0, 4, 4, 0]}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
              >
                {scorersData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={activeIndex === index ? '#FFD700' : '#D4AF37'}
                    style={{
                      filter: activeIndex === index ? 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        )}

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-surface-dark rounded-lg">
            <p className="text-2xl font-bold text-accent-gold">
              {scorersData.reduce((sum, p) => sum + p.goals, 0)}
            </p>
            <p className="text-white/50 text-xs uppercase tracking-wider">Total Goals</p>
          </div>
          <div className="text-center p-3 bg-surface-dark rounded-lg">
            <p className="text-2xl font-bold text-white">
              {scorersData.reduce((sum, p) => sum + p.assists, 0)}
            </p>
            <p className="text-white/50 text-xs uppercase tracking-wider">Total Assists</p>
          </div>
          <div className="text-center p-3 bg-surface-dark rounded-lg">
            <p className="text-2xl font-bold text-green-400">
              {scorersData.reduce((sum, p) => sum + p.goals + p.assists, 0)}
            </p>
            <p className="text-white/50 text-xs uppercase tracking-wider">Total G+A</p>
          </div>
        </div>
      </motion.div>
    );
  }
}

export default TopScorersChart;

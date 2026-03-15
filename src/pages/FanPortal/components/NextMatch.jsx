import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../services/supabase';

class NextMatch extends Component {
  state = {
    match: null,
    formation: null,
    players: [],
    countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
    loading: true,
  };

  countdownInterval = null;

  componentDidMount() {
    this.fetchNextMatch();
  }

  componentWillUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  fetchNextMatch = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('status', 'scheduled')
        .gte('match_date', today)
        .order('match_date', { ascending: true })
        .limit(1)
        .single();

      if (matchError || !match) {
        this.setState({ loading: false });
        return;
      }

      this.setState({ match });
      this.startCountdown(match);

      const { data: formation, error: formationError } = await supabase
        .from('formations')
        .select('*')
        .eq('match_id', match.id)
        .eq('published', true)
        .single();

      if (formationError || !formation) {
        this.setState({ loading: false });
        return;
      }

      const positions = formation.positions || [];
      const playerIds = positions
        .map((pos) => pos.player_id)
        .filter(Boolean);

      let players = [];
      if (playerIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', playerIds);

        players = profileData || [];
      }

      this.setState({ formation, players, loading: false });
    } catch {
      this.setState({ loading: false });
    }
  };

  startCountdown = (match) => {
    this.updateCountdown(match);
    this.countdownInterval = setInterval(() => {
      this.updateCountdown(match);
    }, 1000);
  };

  updateCountdown = (match) => {
    const matchDateStr = match.match_time
      ? `${match.match_date}T${match.match_time}`
      : `${match.match_date}T00:00:00`;

    const now = new Date().getTime();
    const target = new Date(matchDateStr).getTime();
    const diff = target - now;

    if (diff <= 0) {
      this.setState({
        countdown: { days: 0, hours: 0, minutes: 0, seconds: 0 },
      });
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
        this.countdownInterval = null;
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.setState({ countdown: { days, hours, minutes, seconds } });
  };

  formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  renderPitch = () => {
    const { players, formation } = this.state;
    const positions = formation.positions || [];

    return (
      <div
        className="relative bg-gradient-to-b from-green-900/40 to-green-800/40 rounded-2xl border border-green-700/30 overflow-hidden"
        style={{ paddingBottom: '140%' }}
      >
        {/* Pitch markings */}
        <div className="absolute inset-0">
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          {/* Center line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
          {/* Penalty areas */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[18%] border border-white/10 border-b-0" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[18%] border border-white/10 border-t-0" />
        </div>

        {/* Player dots */}
        {positions.map((pos, i) => {
          const player = players.find((p) => p.id === pos.player_id);
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${100 - pos.y}%` }}
            >
              <div className="w-10 h-10 rounded-full bg-accent-gold flex items-center justify-center border-2 border-white shadow-lg">
                <span className="text-black text-xs font-bold">
                  {pos.position || pos.label}
                </span>
              </div>
              <span className="text-white text-xs font-medium mt-1 text-center whitespace-nowrap bg-black/50 px-2 py-0.5 rounded">
                {player?.full_name || 'TBA'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  render() {
    const { match, formation, countdown, loading } = this.state;

    if (loading) {
      return (
        <div className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-8">
          <div className="animate-pulse space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-6 w-24 bg-white/5 rounded-full" />
              <div className="h-10 w-3/4 bg-white/5 rounded-lg" />
              <div className="h-4 w-1/2 bg-white/5 rounded" />
            </div>
            <div className="flex justify-center gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 w-20 bg-white/5 rounded-xl"
                />
              ))}
            </div>
            <div className="h-96 bg-white/5 rounded-2xl" />
          </div>
        </div>
      );
    }

    if (!match) {
      return (
        <div className="text-center py-12">
          <p className="text-white/40">No upcoming matches scheduled</p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-dark-elevated rounded-2xl border border-white/5 p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-accent-gold/10 text-accent-gold text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
            Next Match
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
            Our Starting 11 against{' '}
            <span className="text-accent-gold">{match.opponent}</span>
          </h2>
          <p className="text-white/50 mt-2">
            {this.formatDate(match.match_date)} &bull;{' '}
            {match.match_time || 'TBA'} &bull; {match.location || 'TBA'}
          </p>
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-4 mb-8">
          {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
            <div
              key={unit}
              className="bg-surface-dark rounded-xl border border-white/5 p-4 min-w-[80px] text-center"
            >
              <p className="text-2xl md:text-3xl font-bold text-accent-gold">
                {String(countdown[unit]).padStart(2, '0')}
              </p>
              <p className="text-white/40 text-xs uppercase tracking-wider">
                {unit}
              </p>
            </div>
          ))}
        </div>

        {/* Pitch Visualization or Lineup TBA */}
        {formation ? (
          this.renderPitch()
        ) : (
          <div className="bg-green-900/20 rounded-2xl border border-green-800/30 p-12 text-center">
            <p className="text-white/50 text-lg">Lineup TBA</p>
          </div>
        )}
      </motion.div>
    );
  }
}

export default NextMatch;

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getNextMatch } from '../../../services/fanPortalService';
import { getInvitationsForEvent } from '../../../services/schedulingService';
import ScorePredictor from './ScorePredictor';

class MatchDayHub extends Component {
  constructor(props) {
    super(props);
    this.state = {
      match: null,
      players: [],
      loading: true,
    };
  }

  async componentDidMount() {
    try {
      const match = await getNextMatch();
      let players = [];
      if (match) {
        const invitations = await getInvitationsForEvent('match', match.id);
        players = invitations
          .filter((inv) => inv.status === 'accepted')
          .map((inv) => ({
            name: inv.profiles?.full_name || 'Unknown',
            image: inv.profiles?.profile_image_url,
            position: inv.players?.position || null,
          }));
      }
      this.setState({ match, players, loading: false });
    } catch (err) {
      console.error('MatchDayHub error:', err);
      this.setState({ loading: false });
    }
  }

  render() {
    const { match, players, loading } = this.state;
    const { user } = this.props;
    const userId = user?.id;

    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!match) {
      return (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📍</p>
          <h3 className="text-xl font-display font-bold text-white mb-2">No Upcoming Match</h3>
          <p className="text-gray-400">Check back when the next match is scheduled.</p>
        </div>
      );
    }

    const hasCoords = match.location_lat && match.location_lng;
    const mapsUrl = hasCoords
      ? `https://www.google.com/maps/dir/?api=1&destination=${match.location_lat},${match.location_lng}`
      : null;

    return (
      <div className="space-y-6">
        {/* Match Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="bg-accent-gold/10 text-accent-gold text-xs font-semibold px-3 py-1 rounded-full border border-accent-gold/30">
              {match.match_type || 'League'}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
            Kaboona FC vs {match.opponent}
          </h2>
          <p className="text-gray-400 mt-1">
            {match.match_date} &middot; {match.match_time || 'TBD'} &middot; {match.location || 'TBD'}
          </p>
        </motion.div>

        {/* Score Prediction */}
        <ScorePredictor match={match} userId={userId} />

        {/* Who's Playing */}
        {players.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 p-4"
          >
            <h3 className="text-lg font-display font-bold text-white mb-3">
              Who's Playing ({players.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {players.map((p, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-surface-dark-hover">
                  <div className="w-8 h-8 rounded-full bg-surface-dark flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">{(p.name || '?')[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                    {p.position && <p className="text-[10px] text-accent-gold">{p.position}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Venue Map */}
        {hasCoords && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-dark-elevated rounded-xl border border-gray-800 overflow-hidden"
          >
            <div className="p-4 pb-2 flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-white">Venue</h3>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent-gold hover:underline"
                >
                  Get Directions →
                </a>
              )}
            </div>
            <div className="h-48 md:h-64">
              <MapContainer
                center={[match.location_lat, match.location_lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[match.location_lat, match.location_lng]}>
                  <Popup>{match.location || 'Match Venue'}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </motion.div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ user: state.auth?.user || null });
export default connect(mapStateToProps)(MatchDayHub);

import supabase from './supabase';

// ─── Match Center ────────────────────────────────────────────────

export const getNextMatch = async () => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'scheduled')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .order('match_time', { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
};

export const getRecentResults = async (limit = 5) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'completed')
    .order('match_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const getSeasonRecord = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('result, score_for, score_against')
    .eq('status', 'completed');
  if (error) throw error;
  const matches = data || [];
  return {
    played: matches.length,
    won: matches.filter((m) => m.result === 'win').length,
    drawn: matches.filter((m) => m.result === 'draw').length,
    lost: matches.filter((m) => m.result === 'loss').length,
    goalsFor: matches.reduce((s, m) => s + (m.score_for || 0), 0),
    goalsAgainst: matches.reduce((s, m) => s + (m.score_against || 0), 0),
  };
};

export const getPublishedLineup = async (matchId) => {
  const { data, error } = await supabase
    .from('formations')
    .select('*')
    .eq('match_id', matchId)
    .eq('published', true)
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
};

// ─── Fan Wall ────────────────────────────────────────────────────

export const getFanPosts = async (page = 0, pageSize = 20) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from('fan_posts')
    .select(`
      *,
      profiles:user_id ( full_name, profile_image_url, role )
    `)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return data || [];
};

export const createFanPost = async ({ userId, content, imageUrl, postType, matchId }) => {
  const { data, error } = await supabase
    .from('fan_posts')
    .insert({
      user_id: userId,
      content,
      image_url: imageUrl || null,
      post_type: postType || 'text',
      match_id: matchId || null,
    })
    .select(`*, profiles:user_id ( full_name, profile_image_url, role )`)
    .single();
  if (error) throw error;
  return data;
};

export const deleteFanPost = async (postId) => {
  const { error } = await supabase.from('fan_posts').delete().eq('id', postId);
  if (error) throw error;
};

export const toggleLike = async (postId, userId) => {
  // Check if already liked
  const { data: rows } = await supabase
    .from('fan_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .limit(1);
  const existing = rows?.[0];

  if (existing) {
    await supabase.from('fan_post_likes').delete().eq('id', existing.id);
    return false; // unliked
  } else {
    await supabase.from('fan_post_likes').insert({ post_id: postId, user_id: userId });
    return true; // liked
  }
};

export const getUserLikes = async (userId, postIds) => {
  if (!postIds.length) return [];
  const { data, error } = await supabase
    .from('fan_post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);
  if (error) throw error;
  return (data || []).map((l) => l.post_id);
};

export const getComments = async (postId) => {
  const { data, error } = await supabase
    .from('fan_post_comments')
    .select(`*, profiles:user_id ( full_name, profile_image_url, role )`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const addComment = async (postId, userId, content) => {
  const { data, error } = await supabase
    .from('fan_post_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`*, profiles:user_id ( full_name, profile_image_url, role )`)
    .single();
  if (error) throw error;
  return data;
};

// ─── POTM Voting ─────────────────────────────────────────────────

export const getVotableMatches = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'completed')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getMatchPlayers = async (matchId) => {
  // Primary: accepted invitations
  const { data: invitations } = await supabase
    .from('event_invitations')
    .select('player_id, profiles:player_id ( full_name, profile_image_url )')
    .eq('event_type', 'match')
    .eq('event_id', matchId)
    .eq('status', 'accepted');

  if (invitations && invitations.length > 0) {
    const userIds = invitations.map((i) => i.player_id);
    const { data: players } = await supabase
      .from('players')
      .select('user_id, position, jersey_number')
      .in('user_id', userIds);
    const playerMap = {};
    (players || []).forEach((p) => { playerMap[p.user_id] = p; });
    return invitations.map((i) => ({
      userId: i.player_id,
      fullName: i.profiles?.full_name,
      profileImageUrl: i.profiles?.profile_image_url,
      position: playerMap[i.player_id]?.position || null,
      jerseyNumber: playerMap[i.player_id]?.jersey_number || null,
    }));
  }

  // Fallback: published formation for this match
  const { data: formation } = await supabase
    .from('formations')
    .select('positions')
    .eq('match_id', matchId)
    .eq('published', true)
    .single();

  if (formation?.positions) {
    const posUserIds = formation.positions.map((p) => p.userId).filter(Boolean);
    if (posUserIds.length > 0) {
      const { data: players } = await supabase
        .from('players')
        .select('user_id, position, jersey_number, profiles:user_id ( full_name, profile_image_url )')
        .in('user_id', posUserIds);
      return (players || []).filter((p) => p.profiles).map((p) => ({
        userId: p.user_id,
        fullName: p.profiles.full_name,
        profileImageUrl: p.profiles.profile_image_url,
        position: p.position,
        jerseyNumber: p.jersey_number,
      }));
    }
  }

  return []; // No invitations and no published formation
};

export const castPOTMVote = async (matchId, voterId, playerId) => {
  const { data, error } = await supabase
    .from('potm_votes')
    .insert({ match_id: matchId, voter_id: voterId, player_id: playerId })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getMyVote = async (matchId, voterId) => {
  const { data } = await supabase
    .from('potm_votes')
    .select('player_id')
    .eq('match_id', matchId)
    .eq('voter_id', voterId)
    .limit(1);
  return data?.[0]?.player_id || null;
};

export const getVoteResults = async (matchId) => {
  const { data, error } = await supabase
    .from('potm_votes')
    .select('player_id')
    .eq('match_id', matchId);
  if (error) throw error;
  const counts = {};
  (data || []).forEach((v) => {
    counts[v.player_id] = (counts[v.player_id] || 0) + 1;
  });
  return counts;
};

// ─── Leaderboard ─────────────────────────────────────────────────

export const getLeaderboard = async () => {
  const { data, error } = await supabase
    .from('fan_leaderboard')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
};

// ─── Score Predictions ───────────────────────────────────────────

export const submitPrediction = async (matchId, userId, scoreFor, scoreAgainst) => {
  const { data, error } = await supabase
    .from('score_predictions')
    .insert({
      match_id: matchId,
      user_id: userId,
      score_for: scoreFor,
      score_against: scoreAgainst,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getMyPrediction = async (matchId, userId) => {
  const { data } = await supabase
    .from('score_predictions')
    .select('*')
    .eq('match_id', matchId)
    .eq('user_id', userId)
    .limit(1);
  return data?.[0] || null;
};

// ─── Gallery ─────────────────────────────────────────────────────

export const getAlbums = async () => {
  const { data, error } = await supabase
    .from('gallery_albums')
    .select(`
      *,
      profiles:created_by ( full_name ),
      photo_count:gallery_photos(count)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((a) => ({
    ...a,
    photoCount: a.photo_count?.[0]?.count || 0,
    createdByName: a.profiles?.full_name || 'Unknown',
  }));
};

export const getAlbumPhotos = async (albumId) => {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select(`*, profiles:user_id ( full_name, profile_image_url )`)
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createAlbum = async ({ title, description, createdBy, isOfficial = false }) => {
  const { data, error } = await supabase
    .from('gallery_albums')
    .insert({ title, description, created_by: createdBy, is_official: isOfficial })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const uploadPhoto = async ({ albumId, userId, file, caption }) => {
  const ext = file.name.split('.').pop();
  const path = `${userId}/${albumId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('fan-uploads')
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('fan-uploads').getPublicUrl(path);

  const { data, error } = await supabase
    .from('gallery_photos')
    .insert({
      album_id: albumId,
      user_id: userId,
      image_url: urlData.publicUrl,
      caption: caption || null,
    })
    .select(`*, profiles:user_id ( full_name, profile_image_url )`)
    .single();
  if (error) throw error;
  return data;
};

export const uploadFanPostImage = async (userId, file) => {
  const ext = file.name.split('.').pop();
  const path = `${userId}/posts/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('fan-uploads')
    .upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('fan-uploads').getPublicUrl(path);
  return data.publicUrl;
};

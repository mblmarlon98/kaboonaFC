import supabase from './supabase';

// Haversine formula to calculate distance between two lat/lng points in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get current GPS location
export async function getCurrentLocation() {
  // Try Capacitor Geolocation first (native)
  if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  }

  // Fall back to browser Geolocation API
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Check in to an event
export async function checkIn(userId, sessionType, sessionId, userLat, userLng, venueLat, venueLng) {
  const distance = calculateDistance(userLat, userLng, venueLat, venueLng);
  const status = distance <= 100 ? 'verified' : 'pending';

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      user_id: userId,
      session_type: sessionType,
      session_id: sessionId,
      latitude: userLat,
      longitude: userLng,
      distance_from_venue: Math.round(distance),
      status,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, distance: Math.round(distance) };
}

// Check if user already checked in
export async function getCheckInStatus(userId, sessionType, sessionId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .eq('session_type', sessionType)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Get all attendance for an event (coach view)
export async function getAttendanceForEvent(sessionType, sessionId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, profiles:user_id(full_name, profile_image_url)')
    .eq('session_type', sessionType)
    .eq('session_id', sessionId)
    .order('checked_in_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Coach: approve pending attendance
export async function approveAttendance(attendanceId) {
  const { data, error } = await supabase
    .from('attendance')
    .update({ status: 'manual_approved' })
    .eq('id', attendanceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Coach: reject pending attendance
export async function rejectAttendance(attendanceId) {
  const { data, error } = await supabase
    .from('attendance')
    .update({ status: 'rejected' })
    .eq('id', attendanceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

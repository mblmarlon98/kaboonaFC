export const formatCurrency = (amount, currency = 'MYR') => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
  }).format(new Date(date));
};

export const calculateOverallRating = (stats) => {
  const { pace, shooting, passing, dribbling, defending, physical } = stats;
  return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
};

export const calculateGKRating = (stats) => {
  const { diving, handling, kicking, reflexes, speed, positioning } = stats;
  return Math.round((diving + handling + kicking + reflexes + speed + positioning) / 6);
};

export const getDistanceFromCoords = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

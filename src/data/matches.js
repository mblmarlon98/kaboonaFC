/**
 * Real match data for Kaboona FC
 * Source: Friendly Matches and League from April 2025 till date
 */

export const FRIENDLY_MATCHES = [
  { id: 1, date: '2025-03-16', opponent: 'BBNU', score: '3-3', goalsFor: 3, goalsAgainst: 3, result: 'D', type: 'friendly' },
  { id: 2, date: '2025-04-06', opponent: 'Panna FC', score: '7-2', goalsFor: 7, goalsAgainst: 2, result: 'W', type: 'friendly' },
  { id: 3, date: '2025-04-20', opponent: 'UCSI', score: '7-2', goalsFor: 7, goalsAgainst: 2, result: 'W', type: 'friendly' },
  { id: 4, date: '2025-05-09', opponent: 'Kings FC', score: '3-2', goalsFor: 3, goalsAgainst: 2, result: 'W', type: 'friendly' },
  { id: 5, date: '2025-05-24', opponent: 'Aura FC', score: '13-1', goalsFor: 13, goalsAgainst: 1, result: 'W', type: 'friendly' },
  { id: 6, date: '2025-05-31', opponent: 'Phoenix Elite', score: '1-2', goalsFor: 1, goalsAgainst: 2, result: 'L', type: 'friendly' },
  { id: 7, date: '2025-06-08', opponent: 'BBNU FC', score: '2-3', goalsFor: 2, goalsAgainst: 3, result: 'L', type: 'friendly' },
  { id: 8, date: '2025-06-27', opponent: 'Open Heaven FC', score: '1-2', goalsFor: 1, goalsAgainst: 2, result: 'L', type: 'friendly' },
  { id: 9, date: '2025-07-05', opponent: 'Black Storm FC', score: '4-2', goalsFor: 4, goalsAgainst: 2, result: 'W', type: 'friendly' },
  { id: 10, date: '2025-07-19', opponent: 'Kings FC', score: '4-2', goalsFor: 4, goalsAgainst: 2, result: 'W', note: 'Second Leg', type: 'friendly' },
  { id: 11, date: '2025-07-26', opponent: 'Tibo FC', score: '4-2', goalsFor: 4, goalsAgainst: 2, result: 'W', type: 'friendly' },
  { id: 12, date: '2025-09-06', opponent: 'Phoenix Elite FC', score: '1-4', goalsFor: 1, goalsAgainst: 4, result: 'L', note: 'Second Leg', type: 'friendly' },
];

export const ALL_STARS_LEAGUE_SUNDAY = [
  { id: 13, date: '2025-09-21', opponent: 'KL Renegades FC', score: '3-2', goalsFor: 3, goalsAgainst: 2, result: 'W', type: 'league', competition: 'All Stars League (Sunday Edition)' },
  { id: 14, date: '2025-09-28', opponent: 'FC Segaioli', score: '2-0', goalsFor: 2, goalsAgainst: 0, result: 'W', type: 'league', competition: 'All Stars League (Sunday Edition)' },
  { id: 15, date: '2025-10-05', opponent: 'Menjarala FC', score: '1-1', goalsFor: 1, goalsAgainst: 1, result: 'D', type: 'league', competition: 'All Stars League (Sunday Edition)' },
  { id: 16, date: '2025-10-12', opponent: 'Belarau FC', score: '1-3', goalsFor: 1, goalsAgainst: 3, result: 'L', type: 'league', competition: 'All Stars League (Sunday Edition)' },
  { id: 17, date: '2025-10-26', opponent: 'Phoenix Elite FC', score: '1-2', goalsFor: 1, goalsAgainst: 2, result: 'L', type: 'league', competition: 'All Stars League (Sunday Edition)' },
  { id: 18, date: '2025-11-02', opponent: 'De One FC', score: '5-4', goalsFor: 5, goalsAgainst: 4, result: 'W', type: 'league', competition: 'All Stars League (Sunday Edition)' },
  { id: 19, date: '2025-11-09', opponent: 'Rajawali FC', score: '1-2', goalsFor: 1, goalsAgainst: 2, result: 'L', type: 'league', competition: 'All Stars League (Sunday Edition)' },
];

export const ALL_STARS_LEAGUE_THIRD_DIV = [
  { id: 20, date: '2026-01-16', opponent: 'CIC X RA Raptor FC', score: '1-2', goalsFor: 1, goalsAgainst: 2, result: 'L', type: 'league', competition: 'The New Camp Edition (Division 3)' },
  { id: 21, date: '2026-01-23', opponent: 'Scarecrow FC', score: '3-2', goalsFor: 3, goalsAgainst: 2, result: 'W', type: 'league', competition: 'The New Camp Edition (Division 3)' },
  { id: 22, date: '2026-01-30', opponent: 'SIU FC', score: '1-3', goalsFor: 1, goalsAgainst: 3, result: 'L', type: 'league', competition: 'The New Camp Edition (Division 3)' },
  { id: 23, date: '2026-02-06', opponent: 'Kelbros FC', score: '3-1', goalsFor: 3, goalsAgainst: 1, result: 'W', type: 'league', competition: 'The New Camp Edition (Division 3)' },
  { id: 24, date: '2026-02-13', opponent: 'BBNU FC B', score: '3-0', goalsFor: 3, goalsAgainst: 0, result: 'W', type: 'league', competition: 'The New Camp Edition (Division 3)' },
];

export const TOURNAMENTS = [
  { name: 'MMU Tournament', result: 'Champions - 1st Place', year: 2025 },
];

// All matches combined, sorted by date descending (most recent first)
export const ALL_MATCHES = [
  ...FRIENDLY_MATCHES,
  ...ALL_STARS_LEAGUE_SUNDAY,
  ...ALL_STARS_LEAGUE_THIRD_DIV,
].sort((a, b) => new Date(b.date) - new Date(a.date));

// Computed stats
const computeStats = (matches) => {
  const wins = matches.filter(m => m.result === 'W').length;
  const draws = matches.filter(m => m.result === 'D').length;
  const losses = matches.filter(m => m.result === 'L').length;
  const goalsFor = matches.reduce((sum, m) => sum + m.goalsFor, 0);
  const goalsAgainst = matches.reduce((sum, m) => sum + m.goalsAgainst, 0);

  return {
    played: matches.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    points: wins * 3 + draws,
    winRate: Math.round((wins / matches.length) * 100),
  };
};

export const OVERALL_STATS = computeStats(ALL_MATCHES);
export const FRIENDLY_STATS = computeStats(FRIENDLY_MATCHES);
export const SUNDAY_LEAGUE_STATS = computeStats(ALL_STARS_LEAGUE_SUNDAY);
export const THIRD_DIV_STATS = computeStats(ALL_STARS_LEAGUE_THIRD_DIV);

// The New Camp Edition (Division 3) - Ongoing league table
// Source: https://agdsports.com/tournament/the-new-camp-edition-division-3/
// Last updated: 2026-03-08
export const THIRD_DIV_LEAGUE_TABLE = [
  { position: 1, team: 'SIU FC', played: 6, won: 6, drawn: 0, lost: 0, goalsFor: 23, goalsAgainst: 6, gd: 17, points: 18, form: 'WWWWW' },
  { position: 2, team: 'CIC X RA Raptor FC', played: 6, won: 3, drawn: 1, lost: 2, goalsFor: 17, goalsAgainst: 11, gd: 6, points: 10, form: 'LDWLW' },
  { position: 3, team: 'Menjalara City FC', played: 4, won: 3, drawn: 0, lost: 1, goalsFor: 13, goalsAgainst: 8, gd: 5, points: 9, form: 'LWWW' },
  { position: 4, team: 'KABOONA FC', played: 5, won: 3, drawn: 0, lost: 2, goalsFor: 11, goalsAgainst: 8, gd: 3, points: 9, isKaboona: true, form: 'LWLWW' },
  { position: 5, team: 'Susu XI', played: 6, won: 3, drawn: 0, lost: 3, goalsFor: 13, goalsAgainst: 18, gd: -5, points: 9, form: 'WWLLL' },
  { position: 6, team: 'Kelbros FC', played: 5, won: 2, drawn: 1, lost: 2, goalsFor: 9, goalsAgainst: 9, gd: 0, points: 7, form: 'LDLWW' },
  { position: 7, team: 'BBNU FC B', played: 6, won: 2, drawn: 0, lost: 4, goalsFor: 14, goalsAgainst: 16, gd: -2, points: 6, form: 'WWLLL' },
  { position: 8, team: 'Scarecrow FC', played: 4, won: 0, drawn: 0, lost: 4, goalsFor: 4, goalsAgainst: 12, gd: -8, points: 0, form: 'LLLL' },
  { position: 9, team: 'Ampang Rangers', played: 4, won: 0, drawn: 0, lost: 4, goalsFor: 5, goalsAgainst: 21, gd: -16, points: 0, form: 'LLLL' },
];

// All Stars League (Sunday Edition) - Completed league table
export const SUNDAY_LEAGUE_TABLE = [
  { position: 1, team: 'Belarau FC', played: 7, won: 5, drawn: 1, lost: 1, goalsFor: 18, goalsAgainst: 8, gd: 10, points: 16 },
  { position: 2, team: 'Phoenix Elite FC', played: 7, won: 5, drawn: 0, lost: 2, goalsFor: 16, goalsAgainst: 10, gd: 6, points: 15 },
  { position: 3, team: 'KL Renegades FC', played: 7, won: 4, drawn: 1, lost: 2, goalsFor: 14, goalsAgainst: 11, gd: 3, points: 13 },
  { position: 4, team: 'KABOONA FC', played: 7, won: 3, drawn: 1, lost: 3, goalsFor: 14, goalsAgainst: 14, gd: 0, points: 10, isKaboona: true },
  { position: 5, team: 'Rajawali FC', played: 7, won: 3, drawn: 0, lost: 4, goalsFor: 12, goalsAgainst: 14, gd: -2, points: 9 },
  { position: 6, team: 'De One FC', played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 13, goalsAgainst: 16, gd: -3, points: 7 },
  { position: 7, team: 'FC Segaioli', played: 7, won: 2, drawn: 1, lost: 4, goalsFor: 9, goalsAgainst: 13, gd: -4, points: 7 },
  { position: 8, team: 'Menjarala FC', played: 7, won: 1, drawn: 1, lost: 5, goalsFor: 8, goalsAgainst: 18, gd: -10, points: 4 },
];

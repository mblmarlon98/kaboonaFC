import React from 'react';

/**
 * Team logo mapping for all Division 3 teams.
 * Logos sourced from AGD Sports tournament page.
 */

const TEAM_LOGOS = {
  'SIU FC': '/team-logos/siu-fc.jpeg',
  'CIC X RA RAPTOR FC': '/team-logos/cic-raptor-fc.jpeg',
  'Menjalara city FC': '/team-logos/menjalara-city-fc.webp',
  'Kaboona FC': '/kaboona-logo.png',
  'Susu XI': '/team-logos/susu-xi.png',
  'Kelbros FC': '/team-logos/kelbros-fc.jpeg',
  'BBNU FC B': '/team-logos/bbnu-fc-b.png',
  'Scarecrow Fc': '/team-logos/scarecrow-fc.jpg',
  'Ampang Rangers': '/team-logos/ampang-rangers.jpeg',
};

function getLogoPath(teamName) {
  if (!teamName) return null;
  // Exact match first
  if (TEAM_LOGOS[teamName]) return TEAM_LOGOS[teamName];
  // Case-insensitive search
  const key = Object.keys(TEAM_LOGOS).find(
    k => k.toLowerCase() === teamName.toLowerCase()
  );
  return key ? TEAM_LOGOS[key] : null;
}

function getInitials(teamName) {
  if (!teamName) return '??';
  return teamName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
}

export function TeamLogo({ teamName, size = 28 }) {
  const logoPath = getLogoPath(teamName);

  if (logoPath) {
    return (
      <img
        src={logoPath}
        alt={teamName}
        className="rounded-full object-cover shrink-0 bg-white/10"
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback for unknown teams
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 bg-white/10 text-white/60"
      style={{
        width: size,
        height: size,
        fontSize: `${size * 0.32}px`,
        lineHeight: 1,
      }}
    >
      {getInitials(teamName)}
    </div>
  );
}

export default TeamLogo;

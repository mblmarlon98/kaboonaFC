#!/usr/bin/env node
/**
 * Scrape league standings and Kaboona FC match results from AGD Sports
 * Run weekly: node scripts/scrape-league.mjs
 *
 * Source: https://agdsports.com/tournament/the-new-camp-edition-division-3/
 */

const TOURNAMENT_URL = 'https://agdsports.com/tournament/the-new-camp-edition-division-3/';
const TEAM_URL = 'https://agdsports.com/team/kaboona-fc-the-new-camp-edition-division-3/';
const OUTPUT_PATH = './src/data/league-live.json';

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function fetchHTML(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

function parseStandings(html) {
  const standings = [];
  // Match table rows: position, team name, P, W, D, L, GF, GA, GD, PTS
  const rowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>(\d+)<\/td>\s*<td[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>[\s\S]*?<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>(-?\d+)<\/td>\s*<td[^>]*>(\d+)<\/td>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const teamName = match[2]
      .replace(/ \(The New Camp Edition \(Division 3\)\)/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    standings.push({
      position: parseInt(match[1]),
      team: teamName,
      played: parseInt(match[3]),
      won: parseInt(match[4]),
      drawn: parseInt(match[5]),
      lost: parseInt(match[6]),
      goalsFor: parseInt(match[7]),
      goalsAgainst: parseInt(match[8]),
      gd: parseInt(match[9]),
      points: parseInt(match[10]),
      isKaboona: teamName.toLowerCase().includes('kaboona'),
    });
  }

  return standings;
}

function parseKaboonaMatches(html) {
  const matches = [];

  // Structure: <li class="mini-match-row">
  //   <div><span class="mm-date">13 Feb</span> vs <strong>OPPONENT (league)</strong></div>
  //   <span class="mm-score">0 - 3</span>
  // </li>
  const fixtureRegex = /<li[^>]*class=['"]mini-match-row['"][^>]*>[\s\S]*?<span[^>]*class=['"]mm-date['"][^>]*>(.*?)<\/span>[\s\S]*?vs\s*<strong[^>]*>(.*?)<\/strong>[\s\S]*?<span[^>]*class=['"]mm-score['"][^>]*>(.*?)<\/span>/g;

  let match;
  while ((match = fixtureRegex.exec(html)) !== null) {
    const dateStr = match[1].trim();
    const opponent = match[2]
      .replace(/ \(The New Camp Edition \(Division 3\)\)/g, '')
      .trim();
    const scoreRaw = match[3].trim();
    const scoreParts = scoreRaw.split('-').map(s => parseInt(s.trim()));

    if (scoreParts.length === 2) {
      // Score format on team page is "OpponentGoals - KaboonaGoals"
      const goalsAgainst = scoreParts[0];
      const goalsFor = scoreParts[1];
      const result = goalsFor > goalsAgainst ? 'W' : goalsFor < goalsAgainst ? 'L' : 'D';

      matches.push({
        date: dateStr,
        opponent,
        score: `${goalsFor}-${goalsAgainst}`,
        goalsFor,
        goalsAgainst,
        result,
        type: 'league',
        competition: 'The New Camp Edition (Division 3)',
      });
    }
  }

  return matches;
}

function parseSquad(html) {
  const squad = [];
  const rowRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const name = match[1].replace(/<[^>]*>/g, '').trim();
    const pos = match[2].replace(/<[^>]*>/g, '').trim();
    const age = match[3].replace(/<[^>]*>/g, '').trim();
    const goals = match[4].replace(/<[^>]*>/g, '').trim();
    const assists = match[5].replace(/<[^>]*>/g, '').trim();
    const yellow = match[6].replace(/<[^>]*>/g, '').trim();
    const red = match[7].replace(/<[^>]*>/g, '').trim();

    if (name && name !== 'Name' && ['FWD', 'MID', 'DEF', 'GK'].includes(pos)) {
      squad.push({
        name,
        position: pos,
        age: parseInt(age) || null,
        goals: goals === '-' ? 0 : parseInt(goals) || 0,
        assists: assists === '-' ? 0 : parseInt(assists) || 0,
        yellowCards: yellow === '-' ? 0 : parseInt(yellow) || 0,
        redCards: red === '-' ? 0 : parseInt(red) || 0,
      });
    }
  }

  return squad;
}

async function main() {
  console.log('Scraping AGD Sports league data...\n');

  try {
    // Fetch both pages in parallel
    const [tournamentHTML, teamHTML] = await Promise.all([
      fetchHTML(TOURNAMENT_URL),
      fetchHTML(TEAM_URL),
    ]);

    // Parse data
    const standings = parseStandings(tournamentHTML);
    const matches = parseKaboonaMatches(teamHTML);
    const squad = parseSquad(teamHTML);

    // Find Kaboona's position
    const kaboonaEntry = standings.find(t => t.isKaboona);

    const data = {
      lastUpdated: new Date().toISOString(),
      source: TOURNAMENT_URL,
      competition: 'The New Camp Edition (Division 3)',
      standings,
      kaboonaMatches: matches,
      kaboonaSquad: squad,
      kaboonaStats: kaboonaEntry || null,
    };

    // Write to JSON file
    const outputPath = resolve(__dirname, '..', OUTPUT_PATH);
    writeFileSync(outputPath, JSON.stringify(data, null, 2));

    // Summary
    console.log(`Standings: ${standings.length} teams`);
    if (kaboonaEntry) {
      console.log(`Kaboona FC: Position ${kaboonaEntry.position} | ${kaboonaEntry.points} pts | ${kaboonaEntry.played}P ${kaboonaEntry.won}W ${kaboonaEntry.drawn}D ${kaboonaEntry.lost}L | GD: ${kaboonaEntry.gd > 0 ? '+' : ''}${kaboonaEntry.gd}`);
    }
    console.log(`Matches found: ${matches.length}`);
    console.log(`Squad: ${squad.length} players`);

    const scorers = squad.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals);
    if (scorers.length > 0) {
      console.log(`\nTop scorers:`);
      scorers.forEach(p => console.log(`  ${p.name}: ${p.goals} goals`));
    }

    console.log(`\nData written to ${OUTPUT_PATH}`);
    console.log('Done!');
  } catch (error) {
    console.error('Scrape failed:', error.message);
    process.exit(1);
  }
}

main();

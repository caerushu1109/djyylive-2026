#!/usr/bin/env node
/**
 * Fetch team statistics from SportMonks API and compute attack/defense strengths
 * for the Poisson probability model.
 *
 * API approach: GET /teams/{id}?include=statistics.details.type;statistics.season.league
 *   - Each team has multiple seasons of statistics
 *   - statistics.details contains GOALS, GOALS_CONCEDED, WIN, DRAW, LOST etc.
 *   - statistics.season.league tells us tournament type for weighting
 *
 * For each WC2026 team:
 *   1. Fetch team with statistics include (single API call per team)
 *   2. Extract GOALS, GOALS_CONCEDED, WIN/DRAW/LOST from each season
 *   3. Apply time-decay and tournament-type weighting
 *   4. Compute attack_strength and defense_strength relative to tournament average
 *   5. Output public/data/team-strengths.json
 *
 * Usage: SPORTMONKS_API_TOKEN=xxx node scripts/fetch_team_strengths.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUTPUT = resolve(ROOT, "public/data/team-strengths.json");

const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
if (!API_TOKEN) {
  console.error("SPORTMONKS_API_TOKEN not set");
  process.exit(1);
}

const BASE = "https://api.sportmonks.com/v3/football";

// Time decay: weight = decay^(yearsAgo)
const TIME_DECAY = 0.75;
const CURRENT_YEAR = 2026;

// Known type_ids from SportMonks
const TYPE_GOALS = 52;
const TYPE_GOALS_CONCEDED = 88;
const TYPE_WIN = 214;
const TYPE_DRAW = 215;
const TYPE_LOST = 216;
const TYPE_CORNERS = 56;

// League-based tournament weight multipliers
const LEAGUE_WEIGHTS = {
  732: 3.0,   // World Cup
  720: 2.0,   // WC Qualification Europe
  // WC Qualification regions
  849: 2.0,   // WC Qual South America
  848: 2.0,   // WC Qual Asia
  850: 2.0,   // WC Qual Africa
  // Continental tournaments
  335: 1.8,   // Euro Championship
  390: 1.8,   // Copa America
  397: 1.5,   // AFCON
  396: 1.5,   // Asian Cup
  382: 1.3,   // Gold Cup
  // Nations Leagues
  341: 1.2,   // UEFA Nations League
  427: 1.0,   // CONCACAF Nations League
};
const DEFAULT_LEAGUE_WEIGHT = 0.8; // friendlies, minor tournaments

// ── API Fetch ────────────────────────────────────────────────────────────
let lastRequestTime = 0;
let requestCount = 0;

async function fetchApi(path, params = {}) {
  // Rate limit: ~2.5 req/sec
  const now = Date.now();
  const wait = Math.max(0, 400 - (now - lastRequestTime));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestTime = Date.now();
  requestCount++;

  const url = new URL(`${BASE}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  url.searchParams.set("api_token", API_TOKEN);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SportMonks ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();

  // Log rate limit info periodically
  if (json.rate_limit && requestCount % 10 === 0) {
    console.log(`  [API] ${json.rate_limit.remaining} calls remaining, resets in ${json.rate_limit.resets_in_seconds}s`);
  }

  return json;
}

// ── Step 1: Get WC2026 team IDs from fixtures ────────────────────────────
async function getWc2026Teams() {
  console.log("📋 Fetching WC2026 fixtures to identify teams...");
  let allFixtures = [];
  let page = 1;

  while (page <= 3) {
    const res = await fetchApi(
      `fixtures/between/2026-06-11/2026-07-19`,
      { include: "participants", per_page: 100, page }
    );
    allFixtures = allFixtures.concat(res.data || []);
    if (!res.pagination?.has_more) break;
    page++;
  }

  const teams = new Map();
  for (const fixture of allFixtures) {
    for (const p of fixture.participants || []) {
      if (p.id && p.name && !teams.has(p.id)) {
        // Skip placeholder/TBD teams
        if (p.name.includes("/") && p.name.length > 30) continue;
        teams.set(p.id, {
          id: p.id,
          name: p.name,
          shortCode: p.short_code || null,
        });
      }
    }
  }

  console.log(`  Found ${teams.size} teams (including TBD placeholders)\n`);
  return [...teams.values()];
}

// ── Step 2: Fetch team stats (single call per team) ──────────────────────
async function getTeamWithStats(teamId) {
  const res = await fetchApi(`teams/${teamId}`, {
    include: "statistics.details.type;statistics.season.league",
  });
  return res.data;
}

// ── Step 3: Parse statistics from team data ──────────────────────────────
function parseTeamStats(teamData) {
  const statistics = teamData?.statistics || [];
  const seasonResults = [];

  for (const stat of statistics) {
    if (!stat.has_values) continue;

    const details = stat.details || [];
    const season = stat.season || {};
    const league = season.league || {};
    const seasonId = stat.season_id;

    // Extract year from season name
    const yearMatch = String(season.name || "").match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;

    // Extract key stats by type_id
    let goals = null, goalsConceded = null;
    let wins = 0, draws = 0, losses = 0;
    let corners = null;

    for (const d of details) {
      const typeId = d.type_id || d.type?.id;
      const typeName = d.type?.developer_name || "";
      const val = d.value;

      switch (typeId) {
        case TYPE_GOALS:
          goals = extractCount(val);
          break;
        case TYPE_GOALS_CONCEDED:
          goalsConceded = extractCount(val);
          break;
        case TYPE_WIN:
          wins = extractCount(val);
          break;
        case TYPE_DRAW:
          draws = extractCount(val);
          break;
        case TYPE_LOST:
          losses = extractCount(val);
          break;
        case TYPE_CORNERS:
          corners = extractCount(val);
          break;
        default:
          // Also match by developer_name as fallback
          if (typeName === "GOALS") goals = extractCount(val);
          else if (typeName === "GOALS_CONCEDED") goalsConceded = extractCount(val);
          else if (typeName === "WIN") wins = extractCount(val);
          else if (typeName === "DRAW") draws = extractCount(val);
          else if (typeName === "LOST") losses = extractCount(val);
          else if (typeName === "CORNERS") corners = extractCount(val);
      }
    }

    const matches = wins + draws + losses;
    if (matches === 0 || goals === null || goalsConceded === null) continue;

    // Determine tournament weight from league
    const leagueId = league.id || season.league_id;
    const leagueWeight = LEAGUE_WEIGHTS[leagueId] || DEFAULT_LEAGUE_WEIGHT;

    seasonResults.push({
      seasonId,
      seasonName: season.name || "unknown",
      leagueName: league.name || "unknown",
      leagueId,
      year: year || CURRENT_YEAR - 1,
      matches,
      goals,
      goalsConceded,
      corners,
      avgScored: goals / matches,
      avgConceded: goalsConceded / matches,
      avgCorners: corners ? corners / matches : null,
      leagueWeight,
    });
  }

  return seasonResults;
}

function extractCount(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (typeof val === "object") {
    // Try common paths: val.all.count, val.count, val.all
    if (val.all && typeof val.all === "object") return val.all.count ?? null;
    if (val.count !== undefined) return val.count;
    return null;
  }
  return null;
}

// ── Step 4: Compute weighted strength ────────────────────────────────────
function computeStrength(seasonResults) {
  if (!seasonResults || seasonResults.length === 0) return null;

  let wScored = 0, wConceded = 0, wCorners = 0;
  let totalWeight = 0, cornerWeight = 0;

  for (const s of seasonResults) {
    const yearsAgo = Math.max(0, CURRENT_YEAR - s.year);
    const timeWeight = Math.pow(TIME_DECAY, yearsAgo);
    const weight = timeWeight * s.leagueWeight * s.matches;

    wScored += s.avgScored * weight;
    wConceded += s.avgConceded * weight;
    totalWeight += weight;

    if (s.avgCorners !== null) {
      wCorners += s.avgCorners * weight;
      cornerWeight += weight;
    }
  }

  if (totalWeight === 0) return null;

  return {
    avgScored: wScored / totalWeight,
    avgConceded: wConceded / totalWeight,
    avgCorners: cornerWeight > 0 ? wCorners / cornerWeight : null,
    totalSeasons: seasonResults.length,
    totalMatches: seasonResults.reduce((sum, s) => sum + s.matches, 0),
  };
}

// ── Step 5: Normalize to attack/defense indices ──────────────────────────
function normalizeAll(results) {
  const withStats = Object.values(results).filter(t => t.strength);
  if (withStats.length === 0) return null;

  const avgScored = withStats.reduce((s, t) => s + t.strength.avgScored, 0) / withStats.length;
  const avgConceded = withStats.reduce((s, t) => s + t.strength.avgConceded, 0) / withStats.length;
  const cornersTeams = withStats.filter(t => t.strength.avgCorners !== null);
  const avgCorners = cornersTeams.length > 0
    ? cornersTeams.reduce((s, t) => s + t.strength.avgCorners, 0) / cornersTeams.length
    : 5.0;

  for (const team of withStats) {
    team.attack = team.strength.avgScored / avgScored;
    team.defense = team.strength.avgConceded / avgConceded;
    team.cornerRate = team.strength.avgCorners !== null
      ? team.strength.avgCorners / avgCorners
      : 1.0;
  }

  return { avgScored, avgConceded, avgCorners };
}

// ── ELO fallback ─────────────────────────────────────────────────────────
function loadEloFallback() {
  try {
    const pred = JSON.parse(readFileSync(resolve(ROOT, "public/data/predictions.json"), "utf-8"));
    const map = {};
    for (const t of pred.teams || []) {
      map[t.name] = t.elo;
      if (t.code) map[t.code] = t.elo;
    }
    return map;
  } catch { return {}; }
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("🏟️  Team Strength Builder (Poisson Model)\n");

  const teams = await getWc2026Teams();
  const eloMap = loadEloFallback();

  const results = {};
  let successCount = 0;
  let fallbackCount = 0;

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${teams.length}] ${team.name.padEnd(25)}  `);

    // Skip TBD placeholder teams
    if (team.name.includes("/")) {
      results[team.name] = {
        id: team.id, name: team.name, shortCode: team.shortCode,
        strength: null, isTbd: true,
      };
      console.log("⏭️  TBD placeholder");
      fallbackCount++;
      continue;
    }

    try {
      const teamData = await getTeamWithStats(team.id);
      const seasonResults = parseTeamStats(teamData);
      const strength = computeStrength(seasonResults);

      results[team.name] = {
        id: team.id,
        name: team.name,
        shortCode: team.shortCode,
        strength,
        seasonCount: seasonResults.length,
      };

      if (strength) {
        successCount++;
        console.log(`✅ G=${strength.avgScored.toFixed(2)} GA=${strength.avgConceded.toFixed(2)} (${strength.totalSeasons}s/${strength.totalMatches}m)`);
      } else {
        fallbackCount++;
        console.log("⚠️  No usable stats");
      }
    } catch (err) {
      results[team.name] = {
        id: team.id, name: team.name, shortCode: team.shortCode,
        strength: null,
      };
      fallbackCount++;
      console.log(`❌ ${err.message.slice(0, 60)}`);
    }
  }

  // Normalize all teams with stats
  const avgData = normalizeAll(results);
  if (avgData) {
    console.log(`\n📊 Averages: scored=${avgData.avgScored.toFixed(2)} conceded=${avgData.avgConceded.toFixed(2)} corners=${avgData.avgCorners.toFixed(1)}`);
  }

  // Apply ELO fallback for teams without stats
  for (const [name, team] of Object.entries(results)) {
    if (team.attack === undefined || team.attack === null) {
      const elo = eloMap[name] || eloMap[team.shortCode] || 1500;
      const eloAvg = 1750;
      const ratio = Math.pow(10, (elo - eloAvg) / 600);
      team.attack = Math.max(0.5, Math.min(2.0, ratio));
      team.defense = Math.max(0.5, Math.min(2.0, 1.0 / ratio));
      team.cornerRate = 1.0;
      team.fallback = true;
    }
  }

  // Build output
  const output = {
    generatedAt: new Date().toISOString(),
    method: "Poisson hybrid model",
    description: "Attack/defense strengths computed from SportMonks season statistics with time-decay weighting. ELO-based fallback for teams without sufficient data.",
    parameters: {
      timeDecay: TIME_DECAY,
      wcAverageGoals: 2.6,
      dixonColesRho: -0.04,
    },
    tournamentAverages: avgData,
    teams: Object.values(results)
      .filter(t => !t.isTbd)
      .map(t => ({
        id: t.id,
        name: t.name,
        shortCode: t.shortCode,
        attack: Math.round((t.attack || 1) * 1000) / 1000,
        defense: Math.round((t.defense || 1) * 1000) / 1000,
        cornerRate: Math.round((t.cornerRate || 1) * 1000) / 1000,
        avgScored: t.strength?.avgScored ? Math.round(t.strength.avgScored * 100) / 100 : null,
        avgConceded: t.strength?.avgConceded ? Math.round(t.strength.avgConceded * 100) / 100 : null,
        totalMatches: t.strength?.totalMatches || 0,
        totalSeasons: t.strength?.totalSeasons || 0,
        fallback: !!t.fallback,
      })),
  };

  writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`\n✅ Output: ${OUTPUT}`);
  console.log(`   ${successCount} SportMonks stats + ${fallbackCount} ELO fallback`);
  console.log(`   Total API calls: ${requestCount}`);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});

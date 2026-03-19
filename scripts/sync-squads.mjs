/**
 * scripts/sync-squads.mjs
 *
 * Fetches WC2026 squad rosters from SportMonks and writes one JSON file per
 * team to public/data/squads/{ISO}.json.
 *
 * Usage:
 *   SPORTMONKS_API_TOKEN=xxx node scripts/sync-squads.mjs
 *
 * Environment variables:
 *   SPORTMONKS_API_TOKEN   – required
 *   SPORTMONKS_BASE_URL    – optional, defaults to https://api.sportmonks.com/v3/football
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const OUT_DIR   = path.join(ROOT, "public", "data", "squads");

const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;
const BASE_URL  = (process.env.SPORTMONKS_BASE_URL || "https://api.sportmonks.com/v3/football").replace(/\/$/, "");
const SEASON_ID = 26618; // FIFA World Cup 2026

// ISO alpha-2 → SportMonks team name (used for matching)
const WC2026_TEAMS = {
  AR: "Argentina",   AT: "Austria",      AU: "Australia",   BE: "Belgium",
  BR: "Brazil",      CA: "Canada",       CI: "Côte d'Ivoire", CO: "Colombia",
  CV: "Cape Verde",  CW: "Curaçao",      DE: "Germany",     DZ: "Algeria",
  EC: "Ecuador",     EG: "Egypt",        EN: "England",     ES: "Spain",
  FR: "France",      GH: "Ghana",        HR: "Croatia",     HT: "Haiti",
  IR: "Iran",        JO: "Jordan",       JP: "Japan",       KR: "Korea Republic",
  MA: "Morocco",     MX: "Mexico",       NL: "Netherlands", NO: "Norway",
  NZ: "New Zealand", PA: "Panama",       PT: "Portugal",    PY: "Paraguay",
  QA: "Qatar",       SA: "Saudi Arabia", SC: "Scotland",    SN: "Senegal",
  TN: "Tunisia",     US: "United States", UY: "Uruguay",    UZ: "Uzbekistan",
  ZA: "South Africa", CH: "Switzerland",
};

// Reverse map: name → ISO (handles aliases)
const NAME_TO_ISO = {};
for (const [iso, name] of Object.entries(WC2026_TEAMS)) {
  NAME_TO_ISO[name] = iso;
}
NAME_TO_ISO["USA"]                = "US";
NAME_TO_ISO["Ivory Coast"]        = "CI";
NAME_TO_ISO["Cape Verde Islands"] = "CV";
NAME_TO_ISO["South Korea"]        = "KR";

function smUrl(path, params = {}) {
  const url = new URL(`${BASE_URL}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("api_token", API_TOKEN);
  return url.toString();
}

async function smFetch(path, params = {}) {
  const url = smUrl(path, params);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SportMonks ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Fetch all squad members for the season, paginated */
async function fetchAllSquads() {
  const players = [];
  let page = 1;
  while (true) {
    console.log(`  Fetching squad page ${page}…`);
    const json = await smFetch(`squads/seasons/${SEASON_ID}`, {
      include: "player;position",
      per_page: 100,
      page,
    });
    const data = json.data || [];
    players.push(...data);
    if (!json.pagination?.has_more || data.length === 0) break;
    page++;
    await new Promise((r) => setTimeout(r, 300)); // rate-limit courtesy
  }
  return players;
}

/** Fetch all season participants and return a map: teamId → { name, iso } */
async function fetchTeamMap() {
  const json = await smFetch(`seasons/${SEASON_ID}/participants`, {
    include: "participant",
    per_page: 100,
  });
  const teamMap = {};
  for (const row of json.data || []) {
    const id   = row.participant_id || row.id;
    const name = row.participant?.name || row.name || "";
    const iso  = NAME_TO_ISO[name] || null;
    if (id && iso) teamMap[id] = { name, iso };
  }
  return teamMap;
}

function positionCode(player) {
  const name = String(player.position?.name || "").toLowerCase();
  if (name.includes("goalkeeper") || name.includes("keeper"))  return "GK";
  if (name.includes("defender")  || name.includes("back"))     return "DF";
  if (name.includes("midfielder") || name.includes("midfield")) return "MF";
  if (name.includes("forward")   || name.includes("striker") || name.includes("winger")) return "FW";
  return player.position?.developer_name?.toUpperCase()?.slice(0, 2) || "MF";
}

async function run() {
  if (!API_TOKEN) {
    console.error("Error: SPORTMONKS_API_TOKEN is not set");
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("Fetching team roster from SportMonks…");
  const teamMap = await fetchTeamMap();
  console.log(`Found ${Object.keys(teamMap).length} WC2026 teams`);

  console.log("Fetching squad data…");
  const squadRows = await fetchAllSquads();
  console.log(`Fetched ${squadRows.length} player-team associations`);

  // Group by team ISO
  const byIso = {};
  for (const row of squadRows) {
    const team = teamMap[row.team_id] || teamMap[row.squad?.team_id];
    if (!team) continue;
    const { iso } = team;
    if (!byIso[iso]) byIso[iso] = [];
    byIso[iso].push({
      id:           row.player?.id     || row.player_id,
      name:         row.player?.name   || row.player?.display_name || "Unknown",
      position:     positionCode(row),
      shirtNumber:  row.jersey_number  ?? row.player?.shirt_number ?? null,
    });
  }

  const fetchedAt = new Date().toISOString();
  let written = 0;

  for (const [iso, name] of Object.entries(WC2026_TEAMS)) {
    const players = (byIso[iso] || []).sort((a, b) => {
      const posOrder = { GK: 0, DF: 1, MF: 2, FW: 3 };
      const pd = (posOrder[a.position] ?? 9) - (posOrder[b.position] ?? 9);
      if (pd !== 0) return pd;
      return (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99);
    });

    const payload = {
      isoCode:    iso,
      shortCode:  iso + (iso.length < 3 ? "A" : ""), // rough 3-letter fallback
      players,
      fetchedAt,
    };

    const outPath = path.join(OUT_DIR, `${iso}.json`);
    await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf-8");
    written++;
    console.log(`  ✓ ${iso} (${name}) – ${players.length} players`);
  }

  console.log(`\nDone. Wrote ${written} squad files to public/data/squads/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

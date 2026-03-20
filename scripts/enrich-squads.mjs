/**
 * scripts/enrich-squads.mjs
 *
 * Enriches existing squad JSON files with detailed player data from SportMonks:
 * Chinese name, date of birth, age, height, weight, photo URL, and current club.
 *
 * Usage:
 *   node scripts/enrich-squads.mjs          # enrich all teams
 *   node scripts/enrich-squads.mjs AR       # enrich only Argentina
 *   node scripts/enrich-squads.mjs AR BR    # enrich Argentina and Brazil
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const SQUAD_DIR = path.join(ROOT, "public", "data", "squads");

const API_TOKEN = "rdtldrpYZuNO4sjYZk02uwEwpNkzn30MjDsT10NIeZaRapT9Gn1PWcEFjFoW";
const BASE_URL  = "https://api.sportmonks.com/v3/football";

const WC_START  = new Date("2026-06-11");
const RATE_MS   = 300;

// ---------------------------------------------------------------------------
// API helpers (matching sync-squads.mjs patterns)
// ---------------------------------------------------------------------------

function smUrl(apiPath, params = {}) {
  const url = new URL(`${BASE_URL}/${apiPath.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("api_token", API_TOKEN);
  return url.toString();
}

async function smFetch(apiPath, params = {}) {
  const url = smUrl(apiPath, params);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SportMonks ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Age calculation
// ---------------------------------------------------------------------------

function calcAge(dateOfBirth, asOf = WC_START) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  let age = asOf.getFullYear() - dob.getFullYear();
  const monthDiff = asOf.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// ---------------------------------------------------------------------------
// Fetch player details (English + Chinese)
// ---------------------------------------------------------------------------

async function fetchPlayerDetails(playerId) {
  // Fetch English data with nested team details
  const enJson = await smFetch(`players/${playerId}`, {
    include: "teams.team;nationality",
  });

  // Rate-limit before next request
  await sleep(RATE_MS);

  // Fetch Chinese locale for display_name
  const zhJson = await smFetch(`players/${playerId}`, {
    locale: "zh",
  });

  const en = enJson.data || {};
  const zh = zhJson.data || {};

  // Extract current club: pick the domestic team (skip national teams)
  let club = null;
  const teams = en.teams || [];
  for (const entry of teams) {
    const t = entry.team || {};
    if (t.type === "national") continue;
    club = t.name || null;
    break;
  }
  // Fallback: just use first team if no domestic club found
  if (!club && teams.length > 0) {
    club = teams[0].team?.name || null;
  }

  return {
    nameZh:       zh.display_name || zh.name || null,
    dateOfBirth:  en.date_of_birth || null,
    age:          calcAge(en.date_of_birth),
    height:       en.height ? Number(en.height) : null,
    weight:       en.weight ? Number(en.weight) : null,
    image:        en.image_path || null,
    club:         club,
  };
}

// ---------------------------------------------------------------------------
// Enrich a single squad file
// ---------------------------------------------------------------------------

async function enrichSquad(iso) {
  const filePath = path.join(SQUAD_DIR, `${iso}.json`);
  let squad;
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    squad = JSON.parse(raw);
  } catch (err) {
    console.error(`  ✗ Could not read ${iso}.json: ${err.message}`);
    return false;
  }

  const players = squad.players || [];
  if (players.length === 0) {
    console.log(`  ⚠ ${iso}: no players, skipping`);
    return true;
  }

  console.log(`\nEnriching ${iso}: ${players.length} players`);

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const label = `  ${iso}: ${i + 1}/${players.length} – ${player.name}`;

    try {
      process.stdout.write(`${label} … `);
      const details = await fetchPlayerDetails(player.id);

      // Merge enriched fields into player, keeping existing data
      player.nameZh       = details.nameZh       ?? player.nameZh       ?? null;
      player.dateOfBirth  = details.dateOfBirth  ?? player.dateOfBirth  ?? null;
      player.age          = details.age          ?? player.age          ?? null;
      player.height       = details.height       ?? player.height       ?? null;
      player.weight       = details.weight       ?? player.weight       ?? null;
      player.image        = details.image        ?? player.image        ?? null;
      player.club         = details.club         ?? player.club         ?? null;

      console.log("✓");
    } catch (err) {
      // Keep existing data, skip enrichment for this player
      console.log(`✗ (${err.message.slice(0, 80)})`);
    }

    // Rate-limit between players (the fetch function already sleeps between
    // the EN and ZH calls, but we add a gap between players too)
    if (i < players.length - 1) {
      await sleep(RATE_MS);
    }
  }

  // Write enriched data back
  squad.enrichedAt = new Date().toISOString();
  await fs.writeFile(filePath, JSON.stringify(squad, null, 2), "utf-8");
  console.log(`  ✓ ${iso}: saved ${players.length} enriched players`);
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  // Determine which teams to process
  const args = process.argv.slice(2).map((a) => a.toUpperCase());

  let isoList;
  if (args.length > 0) {
    // Validate requested ISOs exist as files
    isoList = [];
    for (const iso of args) {
      try {
        await fs.access(path.join(SQUAD_DIR, `${iso}.json`));
        isoList.push(iso);
      } catch {
        console.error(`  ✗ No squad file for ${iso}, skipping`);
      }
    }
  } else {
    // All squad files
    const files = await fs.readdir(SQUAD_DIR);
    isoList = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
  }

  if (isoList.length === 0) {
    console.error("No squad files to enrich.");
    process.exit(1);
  }

  console.log(`Enriching ${isoList.length} team(s): ${isoList.join(", ")}`);

  let success = 0;
  for (const iso of isoList) {
    const ok = await enrichSquad(iso);
    if (ok) success++;
  }

  console.log(`\nDone. Enriched ${success}/${isoList.length} squad files.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

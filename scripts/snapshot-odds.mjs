#!/usr/bin/env node
/**
 * Fetches current Polymarket odds and saves a baseline snapshot
 * to public/data/odds-baseline.json.
 * Run at build time so the ticker can show deltas immediately.
 */

const GAMMA_URL =
  "https://gamma-api.polymarket.com/events?slug=2026-fifa-world-cup-winner-595";

const PROXY_URLS = [
  `https://api.allorigins.win/get?url=${encodeURIComponent(GAMMA_URL)}`,
  `https://corsproxy.io/?${encodeURIComponent(GAMMA_URL)}`,
];

async function fetchEvents() {
  // Try direct first
  try {
    const res = await fetch(GAMMA_URL, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return await res.json();
  } catch {}

  // Try proxies
  for (const url of PROXY_URLS) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const wrapper = await res.json();
      if (typeof wrapper.contents === "string") return JSON.parse(wrapper.contents);
      return Array.isArray(wrapper) ? wrapper : [wrapper];
    } catch {}
  }
  return null;
}

function parseEvents(events) {
  const map = {};
  for (const event of Array.isArray(events) ? events : []) {
    for (const market of Array.isArray(event.markets) ? event.markets : []) {
      try {
        const outcomes = JSON.parse(market.outcomes || "[]");
        const prices = JSON.parse(market.outcomePrices || "[]");
        if (!outcomes.length || outcomes.length !== prices.length) continue;

        const lower = outcomes.map((o) => String(o).toLowerCase());
        const isYesNo =
          outcomes.length === 2 && lower.includes("yes") && lower.includes("no");

        if (isYesNo) {
          const name =
            market.groupItemTitle?.trim() ||
            (market.question || "").match(/Will\s+(.+?)\s+win/i)?.[1]?.trim();
          if (!name) continue;
          const yesIdx = lower.indexOf("yes");
          const prob = Math.round(parseFloat(prices[yesIdx] || 0) * 1000) / 10;
          if (prob > 0 && (!map[name] || prob > map[name])) map[name] = prob;
        } else {
          outcomes.forEach((name, i) => {
            const prob = Math.round(parseFloat(prices[i] || 0) * 1000) / 10;
            if (prob > 0 && (!map[name] || prob > map[name])) map[name] = prob;
          });
        }
      } catch {}
    }
  }
  return map;
}

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "data", "odds-baseline.json");

async function main() {
  console.log("[odds-snapshot] Fetching Polymarket data...");
  const events = await fetchEvents();
  if (!events) {
    console.warn("[odds-snapshot] Failed to fetch — keeping existing baseline");
    process.exit(0);
  }

  const odds = parseEvents(events);
  const count = Object.keys(odds).length;
  if (count === 0) {
    console.warn("[odds-snapshot] No odds parsed — keeping existing baseline");
    process.exit(0);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ ts: Date.now(), odds }, null, 2));
  console.log(`[odds-snapshot] Saved ${count} teams to odds-baseline.json`);
}

main().catch((e) => {
  console.error("[odds-snapshot]", e.message);
  process.exit(0); // Don't fail the build
});

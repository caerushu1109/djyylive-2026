import { NextResponse } from "next/server";

const GROUPS = ["a","b","c","d","e","f","g","h","i","j","k","l"];
const GAMMA_BASE = "https://gamma-api.polymarket.com/events";

function parseGroupEvent(event) {
  const teams = {};
  for (const market of Array.isArray(event?.markets) ? event.markets : []) {
    try {
      const name = market.groupItemTitle?.trim();
      if (!name || name === "Other") continue;
      const outcomes = JSON.parse(market.outcomes || "[]");
      const prices = JSON.parse(market.outcomePrices || "[]");
      const lower = outcomes.map((o) => String(o).toLowerCase());
      const yesIdx = lower.indexOf("yes");
      if (yesIdx === -1) continue;
      const prob = Math.round(parseFloat(prices[yesIdx] || 0) * 1000) / 10;
      if (prob > 0) teams[name] = prob;
    } catch { /* skip */ }
  }
  return teams;
}

export async function GET() {
  const groups = {};
  let fetchedCount = 0;

  // Fetch all 12 groups in parallel
  const results = await Promise.allSettled(
    GROUPS.map(async (letter) => {
      const slug = `fifa-world-cup-group-${letter}-winner`;
      const res = await fetch(`${GAMMA_BASE}?slug=${slug}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const events = await res.json();
      const event = Array.isArray(events) ? events[0] : events;
      return { letter: letter.toUpperCase(), teams: parseGroupEvent(event) };
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      const { letter, teams } = r.value;
      if (Object.keys(teams).length > 0) {
        groups[letter] = teams;
        fetchedCount++;
      }
    }
  }

  return NextResponse.json(
    { groups, fetchedAt: new Date().toISOString(), count: fetchedCount },
    {
      headers: {
        "cache-control": fetchedCount > 0
          ? "public, s-maxage=600, stale-while-revalidate=1200"
          : "public, s-maxage=60",
      },
    }
  );
}

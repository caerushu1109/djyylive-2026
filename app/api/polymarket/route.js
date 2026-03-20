import { NextResponse } from "next/server";
import { extractTeamName, parseEvents } from "@/lib/polymarket-parser";

// 正确的事件 slug（对应 polymarket.com/event/2026-fifa-world-cup-winner-595）
const EVENT_SLUG = "2026-fifa-world-cup-winner-595";
const GAMMA_URL  = `https://gamma-api.polymarket.com/events?slug=${EVENT_SLUG}`;

// Multiple CORS proxies for redundancy
const PROXY_URLS = [
  `https://api.allorigins.win/get?url=${encodeURIComponent(GAMMA_URL)}`,
  `https://corsproxy.io/?${encodeURIComponent(GAMMA_URL)}`,
];

async function fetchDirect() {
  const res = await fetch(GAMMA_URL, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`direct ${res.status}`);
  return res.json();
}

async function fetchViaProxy(proxyUrl, index) {
  const res = await fetch(proxyUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`proxy${index} ${res.status}`);
  const wrapper = await res.json();
  // allorigins wraps in .contents, corsproxy returns directly
  if (typeof wrapper.contents === "string") return JSON.parse(wrapper.contents);
  return Array.isArray(wrapper) ? wrapper : [wrapper];
}

export async function GET() {
  let teams = [];
  let usedMethod = "none";

  try {
    const events = await fetchDirect();
    teams = parseEvents(events);
    usedMethod = "direct";
  } catch (e1) {
    console.warn("[polymarket] direct failed:", e1.message, "→ trying proxies");
    for (let i = 0; i < PROXY_URLS.length; i++) {
      try {
        const events = await fetchViaProxy(PROXY_URLS[i], i);
        teams = parseEvents(events);
        usedMethod = `proxy${i}`;
        break;
      } catch (e2) {
        console.warn(`[polymarket] proxy${i} failed:`, e2.message);
      }
    }
    if (usedMethod === "none") {
      console.error("[polymarket] all methods failed");
    }
  }

  return NextResponse.json(
    { teams, fetchedAt: new Date().toISOString(), source: "polymarket", method: usedMethod },
    {
      headers: {
        "cache-control": teams.length > 0
          ? "public, s-maxage=300, stale-while-revalidate=600"
          : "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

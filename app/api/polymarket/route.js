import { NextResponse } from "next/server";

// 正确的事件 slug（对应 polymarket.com/event/2026-fifa-world-cup-winner-595）
const EVENT_SLUG = "2026-fifa-world-cup-winner-595";
const GAMMA_URL  = `https://gamma-api.polymarket.com/events?slug=${EVENT_SLUG}`;

// allorigins.win 是公共 CORS/IP 代理，绕过 Cloudflare 被 Polymarket 封锁的问题
const PROXY_URL  = `https://api.allorigins.win/get?url=${encodeURIComponent(GAMMA_URL)}`;

/**
 * 解析 Polymarket events 响应
 * 结构: [ { markets: [ { outcomes: '["Spain","France",...]', outcomePrices: '["0.23","0.15",...]' } ] } ]
 */
function parseEvents(events) {
  const map = {};
  for (const event of Array.isArray(events) ? events : []) {
    for (const market of Array.isArray(event.markets) ? event.markets : []) {
      try {
        const outcomes = JSON.parse(market.outcomes     || "[]");
        const prices   = JSON.parse(market.outcomePrices || "[]");
        if (!outcomes.length || outcomes.length !== prices.length) continue;
        outcomes.forEach((name, i) => {
          const prob = Math.round(parseFloat(prices[i] || 0) * 1000) / 10;
          if (prob > 0 && (!map[name] || prob > map[name])) {
            map[name] = prob;
          }
        });
      } catch { /* 单个 market 解析失败不影响其他 */ }
    }
  }
  return Object.entries(map)
    .map(([name, probability]) => ({ name, probability }))
    .sort((a, b) => b.probability - a.probability);
}

async function fetchDirect() {
  const res = await fetch(GAMMA_URL, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`direct ${res.status}`);
  return res.json(); // 返回 events 数组
}

async function fetchViaProxy() {
  const res = await fetch(PROXY_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`proxy ${res.status}`);
  const wrapper = await res.json();
  // allorigins 把原始内容放在 wrapper.contents（字符串）
  return JSON.parse(wrapper.contents);
}

export async function GET() {
  let teams = [];
  let usedMethod = "none";

  try {
    const events = await fetchDirect();
    teams = parseEvents(events);
    usedMethod = "direct";
  } catch (e1) {
    console.warn("[polymarket] direct failed:", e1.message, "→ trying proxy");
    try {
      const events = await fetchViaProxy();
      teams = parseEvents(events);
      usedMethod = "proxy";
    } catch (e2) {
      console.error("[polymarket] proxy also failed:", e2.message);
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

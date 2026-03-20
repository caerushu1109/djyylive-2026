import { NextResponse } from "next/server";

// 正确的事件 slug（对应 polymarket.com/event/2026-fifa-world-cup-winner-595）
const EVENT_SLUG = "2026-fifa-world-cup-winner-595";
const GAMMA_URL  = `https://gamma-api.polymarket.com/events?slug=${EVENT_SLUG}`;

// allorigins.win 是公共 CORS/IP 代理，绕过 Cloudflare 被 Polymarket 封锁的问题
const PROXY_URL  = `https://api.allorigins.win/get?url=${encodeURIComponent(GAMMA_URL)}`;

/**
 * 从市场 question 中提取球队名
 * Polymarket 格式通常为 "Will Spain win the 2026 FIFA World Cup?"
 * 或 groupItemTitle 字段直接是球队名
 */
function extractTeamName(market) {
  // 优先用 groupItemTitle（Polymarket 多结果市场的单项标题）
  if (market.groupItemTitle && market.groupItemTitle.trim()) {
    return market.groupItemTitle.trim();
  }
  // 从 question 中提取：匹配 "Will X win..."
  const q = market.question || market.title || "";
  const m = q.match(/Will\s+(.+?)\s+win/i);
  if (m) return m[1].trim();
  return null;
}

/**
 * 解析 Polymarket events 响应
 * 支持两种市场结构：
 * A) 多结果市场：outcomes = '["Spain","France",...]'，outcomePrices 一一对应
 * B) 二元市场：每支球队一个 Yes/No 市场，从 question/groupItemTitle 取球队名，用 Yes 价格
 */
function parseEvents(events) {
  const map = {};
  for (const event of Array.isArray(events) ? events : []) {
    for (const market of Array.isArray(event.markets) ? event.markets : []) {
      try {
        const outcomes = JSON.parse(market.outcomes      || "[]");
        const prices   = JSON.parse(market.outcomePrices || "[]");
        if (!outcomes.length || outcomes.length !== prices.length) continue;

        const lower = outcomes.map((o) => String(o).toLowerCase());
        const isYesNo = outcomes.length === 2 &&
          lower.includes("yes") && lower.includes("no");

        if (isYesNo) {
          // 二元市场：从 question 或 groupItemTitle 取球队名
          const teamName = extractTeamName(market);
          if (!teamName) continue;
          const yesIdx = lower.indexOf("yes");
          const prob = Math.round(parseFloat(prices[yesIdx] || 0) * 1000) / 10;
          if (prob > 0 && (!map[teamName] || prob > map[teamName])) {
            map[teamName] = prob;
          }
        } else {
          // 多结果市场：直接以 outcome 为球队名
          outcomes.forEach((name, i) => {
            const prob = Math.round(parseFloat(prices[i] || 0) * 1000) / 10;
            if (prob > 0 && (!map[name] || prob > map[name])) {
              map[name] = prob;
            }
          });
        }
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

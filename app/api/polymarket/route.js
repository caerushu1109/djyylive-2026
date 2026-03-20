import { NextResponse } from "next/server";

const POLYMARKET_API =
  "https://gamma-api.polymarket.com/markets?q=2026+FIFA+World+Cup+Winner&active=true";

/**
 * 解析 Polymarket 返回的市场数据，提取球队名与概率
 * outcomePrices 格式通常为 JSON 字符串数组，如 '["0.23","0.15",...]'
 * outcomes 格式为 JSON 字符串数组，如 '["Spain","France",...]'
 */
function parseMarket(market) {
  try {
    const outcomes = JSON.parse(market.outcomes || "[]");
    const prices = JSON.parse(market.outcomePrices || "[]");

    if (!outcomes.length || outcomes.length !== prices.length) return [];

    return outcomes.map((name, i) => ({
      name: String(name),
      probability: Math.round(parseFloat(prices[i] || 0) * 1000) / 10, // 转为百分比，保留1位小数
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const res = await fetch(POLYMARKET_API, {
      next: { revalidate: 300 }, // Next.js 数据缓存 5 分钟
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; djyylive-bot/1.0)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000), // 8 秒超时
    });

    if (!res.ok) {
      throw new Error(`Polymarket API responded ${res.status}`);
    }

    const markets = await res.json();

    // 找到最相关的单场市场（包含最多球队的那个）
    const allTeams = [];
    for (const market of Array.isArray(markets) ? markets : []) {
      const teams = parseMarket(market);
      if (teams.length > allTeams.length) {
        allTeams.splice(0, allTeams.length, ...teams);
      }
    }

    // 按概率降序排列
    allTeams.sort((a, b) => b.probability - a.probability);

    return NextResponse.json(
      {
        teams: allTeams,
        fetchedAt: new Date().toISOString(),
        source: "polymarket",
      },
      {
        headers: {
          "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[polymarket] fetch failed:", err.message);
    // 优雅降级：返回空数据，不白屏
    return NextResponse.json(
      {
        teams: [],
        fetchedAt: new Date().toISOString(),
        source: "polymarket",
        error: "unavailable",
      },
      {
        status: 200, // 仍返回 200，让前端优雅展示
        headers: {
          "cache-control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  }
}

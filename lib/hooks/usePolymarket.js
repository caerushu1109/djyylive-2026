"use client";
import { useState, useEffect } from "react";

// 直接从浏览器请求 Polymarket Gamma API，绕过 Cloudflare Workers 服务端 IP 封锁
// event slug 对应 https://polymarket.com/event/2026-fifa-world-cup-winner-595
const GAMMA_EVENT_URL =
  "https://gamma-api.polymarket.com/events?slug=2026-fifa-world-cup-winner-595";

function parsePolymarketEvent(events) {
  const teams = [];
  for (const event of Array.isArray(events) ? events : []) {
    for (const market of Array.isArray(event.markets) ? event.markets : []) {
      try {
        const outcomes = JSON.parse(market.outcomes || "[]");
        const prices   = JSON.parse(market.outcomePrices || "[]");
        if (outcomes.length !== prices.length || outcomes.length === 0) continue;
        outcomes.forEach((name, i) => {
          const prob = Math.round(parseFloat(prices[i] || 0) * 1000) / 10;
          if (prob > 0) teams.push({ name: String(name), probability: prob });
        });
      } catch {
        // 单个 market 解析失败不影响其他
      }
    }
  }
  // 去重（同名球队取最高概率）后降序排列
  const map = {};
  for (const t of teams) {
    if (!map[t.name] || t.probability > map[t.name].probability) map[t.name] = t;
  }
  return Object.values(map).sort((a, b) => b.probability - a.probability);
}

export function usePolymarket() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);

    fetch(GAMMA_EVENT_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Polymarket HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const teams = parsePolymarketEvent(json);
        setData({ teams, fetchedAt: new Date().toISOString(), source: "polymarket" });
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
        // 即使出错也结束 loading，页面优雅降级
        setLoading(false);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  return { data, loading, error };
}

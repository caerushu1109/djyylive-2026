"use client";
import { useState, useEffect } from "react";

// 备用：直接从浏览器请求 Polymarket（若服务端代理也挂了）
const GAMMA_EVENT_URL =
  "https://gamma-api.polymarket.com/events?slug=2026-fifa-world-cup-winner-595";

function extractTeamName(market) {
  if (market.groupItemTitle && market.groupItemTitle.trim()) return market.groupItemTitle.trim();
  const q = market.question || market.title || "";
  const m = q.match(/Will\s+(.+?)\s+win/i);
  return m ? m[1].trim() : null;
}

function parseEvents(events) {
  const map = {};
  for (const event of Array.isArray(events) ? events : []) {
    for (const market of Array.isArray(event.markets) ? event.markets : []) {
      try {
        const outcomes = JSON.parse(market.outcomes      || "[]");
        const prices   = JSON.parse(market.outcomePrices || "[]");
        if (!outcomes.length || outcomes.length !== prices.length) continue;

        const lower = outcomes.map((o) => String(o).toLowerCase());
        const isYesNo = outcomes.length === 2 && lower.includes("yes") && lower.includes("no");

        if (isYesNo) {
          const teamName = extractTeamName(market);
          if (!teamName) continue;
          const yesIdx = lower.indexOf("yes");
          const prob = Math.round(parseFloat(prices[yesIdx] || 0) * 1000) / 10;
          if (prob > 0 && (!map[teamName] || prob > map[teamName])) map[teamName] = prob;
        } else {
          outcomes.forEach((name, i) => {
            const prob = Math.round(parseFloat(prices[i] || 0) * 1000) / 10;
            if (prob > 0 && (!map[name] || prob > map[name])) map[name] = prob;
          });
        }
      } catch { /* ignore */ }
    }
  }
  return Object.entries(map)
    .map(([name, probability]) => ({ name, probability }))
    .sort((a, b) => b.probability - a.probability);
}

export function usePolymarket() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 1️⃣ 优先用服务端代理（绕 CORS，且有双重兜底）
      try {
        const res = await fetch("/api/polymarket");
        if (!res.ok) throw new Error(`server ${res.status}`);
        const json = await res.json();
        if (!cancelled && json.teams?.length > 0) {
          setData(json);
          setLoading(false);
          return;
        }
      } catch { /* fall through */ }

      // 2️⃣ 服务端无数据时，浏览器直接请求（可能受 CORS 限制）
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(GAMMA_EVENT_URL, { signal: controller.signal });
        clearTimeout(t);
        if (!res.ok) throw new Error(`browser ${res.status}`);
        const events = await res.json();
        const teams  = parseEvents(events);
        if (!cancelled) {
          setData({ teams, fetchedAt: new Date().toISOString(), source: "polymarket-browser" });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

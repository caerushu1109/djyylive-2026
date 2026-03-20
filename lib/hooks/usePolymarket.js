"use client";
import { useState, useEffect } from "react";
import { parseEvents } from "@/lib/polymarket-parser";

// 备用：直接从浏览器请求 Polymarket（若服务端代理也挂了）
const GAMMA_EVENT_URL =
  "https://gamma-api.polymarket.com/events?slug=2026-fifa-world-cup-winner-595";

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

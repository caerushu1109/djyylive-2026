"use client";
import { useState, useEffect } from "react";

/**
 * Fetches ELO trend history from /data/elo-trends.json (public static file).
 * Returns a lookup map: { [nameZh]: [{label, elo},...], [nameEn]: [...] }
 * so callers can look up by either Chinese or English team name.
 */
export function useEloTrends() {
  const [trendMap, setTrendMap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/elo-trends.json")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const map = {};
        (d.teams || []).forEach((t) => {
          const points = t.points || [];
          if (t.name)         map[t.name]         = points;
          if (t.originalName) map[t.originalName] = points;
        });
        setTrendMap(map);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { trendMap, loading };
}

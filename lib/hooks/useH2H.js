"use client";
import { useState, useEffect } from "react";
import { h2hKey } from "@/lib/utils/teamIso";

/**
 * Load head-to-head World Cup history between two teams (by ISO alpha-2 code).
 * Data is served from /data/h2h/{KEY}.json where KEY = sorted "XX_XX".
 *
 * Returns: { data, loading }
 *   data = {
 *     team1, team2,
 *     summary: { [iso1]: wins, [iso2]: wins, draws },
 *     matches: [{ date, tournament, stage, home, away, homeScore, awayScore, winner?, et?, pen? }]
 *   }
 */
export function useH2H(iso1, iso2) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!iso1 || !iso2 || iso1 === iso2) {
      setLoading(false);
      return;
    }
    const key = h2hKey(iso1, iso2);
    let cancelled = false;
    fetch(`/data/h2h/${key}.json`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [iso1, iso2]);

  return { data, loading };
}

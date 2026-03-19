"use client";
import { useState, useEffect } from "react";
import { nameToIso } from "@/lib/utils/teamIso";

/**
 * Load WC history for a team identified by its SportMonks originalName.
 * Data is served from /data/wc-team-history.json (public/data/).
 *
 * Returns: { data, loading }
 *   data = { isoCode, appearances, titles, titleYears, bestResult, history[] }
 */
export function useTeamHistory(teamName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamName) {
      setLoading(false);
      return;
    }
    const iso = nameToIso(teamName);
    if (!iso) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch("/data/wc-team-history.json")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setData(json[iso] || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [teamName]);

  return { data, loading };
}

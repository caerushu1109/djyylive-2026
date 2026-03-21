"use client";
import { useState, useEffect } from "react";

let cache = null;

export function useTeamStrengths() {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    fetch("/api/team-strengths")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        cache = json;
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

/**
 * Find team strength by name (supports both English name and Chinese name matching)
 */
export function findTeamStrength(strengths, teamName) {
  if (!strengths?.teams) return null;
  return strengths.teams.find(
    (t) =>
      t.name === teamName ||
      t.shortCode === teamName ||
      t.name?.toLowerCase() === teamName?.toLowerCase()
  );
}

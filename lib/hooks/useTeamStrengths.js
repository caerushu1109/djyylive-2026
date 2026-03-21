"use client";
import { useState, useEffect } from "react";
import { toEnglishName } from "@/src/lib/team-meta";

let cache = null;

export function useTeamStrengths() {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    fetch("/data/team-strengths.json")
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
 * Find team strength by name (supports English, Chinese, and shortCode)
 */
export function findTeamStrength(strengths, teamName) {
  if (!strengths?.teams || !teamName) return null;

  // Try direct match first
  const direct = strengths.teams.find(
    (t) =>
      t.name === teamName ||
      t.shortCode === teamName ||
      t.name?.toLowerCase() === teamName?.toLowerCase()
  );
  if (direct) return direct;

  // Try converting Chinese name to English
  const enName = toEnglishName(teamName);
  if (enName !== teamName) {
    const exact = strengths.teams.find(
      (t) =>
        t.name === enName ||
        t.name?.toLowerCase() === enName?.toLowerCase()
    );
    if (exact) return exact;

    // Fuzzy: "Cape Verde" matches "Cape Verde Islands", "Korea Republic" matches "South Korea" etc.
    const enLower = enName.toLowerCase();
    return strengths.teams.find(
      (t) => t.name?.toLowerCase().includes(enLower) || enLower.includes(t.name?.toLowerCase())
    ) || null;
  }

  return null;
}

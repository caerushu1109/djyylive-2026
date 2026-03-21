"use client";
import { useState, useEffect } from "react";

let indexCache = null;
let birthCache = null; // P-XXXXX -> birthDate

/**
 * Loads the player name → historical ID index.
 * Returns { lookup, loading } where lookup(name, birthYear?) returns player_id or null.
 */
export function usePlayerIndex() {
  const [index, setIndex] = useState(indexCache);
  const [births, setBirths] = useState(birthCache);
  const [loading, setLoading] = useState(!indexCache);

  useEffect(() => {
    if (indexCache) return;
    Promise.all([
      fetch("/data/players/index.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/data/players/births.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([idx, bth]) => {
      if (idx) { indexCache = idx; setIndex(idx); }
      if (bth) { birthCache = bth; setBirths(bth); }
      setLoading(false);
    });
  }, []);

  /**
   * Look up player name → historical ID.
   * @param {string} name - Player name (from squad/event data)
   * @param {string} [birthYear] - Optional 4-digit birth year for disambiguation
   */
  function lookup(name, birthYear) {
    if (!index || !name) return null;
    const trimmed = name.trim();

    // 1. Exact match (trimmed)
    if (index[trimmed]) return index[trimmed];

    // 2. Family name fallback — only if we can verify via birth year
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      const family = parts[parts.length - 1];
      const pid = index[family];
      if (pid) {
        // If caller provided birthYear, verify before returning
        if (birthYear && births) {
          const histBirth = births[pid];
          if (histBirth && histBirth.substring(0, 4) === birthYear) {
            return pid; // Birth year matches — safe
          }
          // Birth year mismatch — don't return wrong player
          return null;
        }
        // No birth year to verify — still return (better than nothing)
        return pid;
      }
    }

    return null;
  }

  return { lookup, loading };
}

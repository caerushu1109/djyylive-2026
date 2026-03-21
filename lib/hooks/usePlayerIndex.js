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
    const exactPid = index[trimmed];
    if (exactPid) {
      // If caller provided birthYear AND we have birth data, verify to catch same-name collisions
      if (birthYear && births) {
        const histBirth = births[exactPid];
        if (histBirth && histBirth.substring(0, 4) !== birthYear) {
          // Wrong player — try birth-year-keyed lookup (e.g. "Luis Suárez|1987")
          const byKey = index[`${trimmed}|${birthYear}`];
          if (byKey) return byKey;
          return null; // Don't return wrong player
        }
      }
      return exactPid;
    }

    // 2. Birth-year-keyed lookup (for duplicate names added as "Name|Year")
    if (birthYear) {
      const byKey = index[`${trimmed}|${birthYear}`];
      if (byKey) return byKey;
    }

    // 3. Family name fallback — only if we can verify via birth year
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      const family = parts[parts.length - 1];
      const pid = index[family];
      if (pid) {
        if (birthYear && births) {
          const histBirth = births[pid];
          if (histBirth && histBirth.substring(0, 4) === birthYear) {
            return pid;
          }
          return null;
        }
        return pid;
      }
    }

    return null;
  }

  return { lookup, loading };
}

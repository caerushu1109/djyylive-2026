"use client";
import { useState, useEffect } from "react";

let indexCache = null;

/**
 * Loads the player name → historical ID index.
 * Returns { lookup, loading } where lookup(name, birthYear?) returns player_id or null.
 */
export function usePlayerIndex() {
  const [index, setIndex] = useState(indexCache);
  const [loading, setLoading] = useState(!indexCache);

  useEffect(() => {
    if (indexCache) return;
    fetch("/data/players/index.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((idx) => {
        if (idx) { indexCache = idx; setIndex(idx); }
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

    // 1. If birthYear provided, try "Name|Year" key first (handles same-name players)
    if (birthYear) {
      const byKey = index[`${trimmed}|${birthYear}`];
      if (byKey) return byKey;
    }

    // 2. Exact match
    if (index[trimmed]) return index[trimmed];

    // 3. Family name fallback
    const parts = trimmed.split(/\s+/);
    if (parts.length > 1) {
      const family = parts[parts.length - 1];
      if (birthYear) {
        const famKey = index[`${family}|${birthYear}`];
        if (famKey) return famKey;
      }
      if (index[family]) return index[family];
    }

    return null;
  }

  return { lookup, loading };
}

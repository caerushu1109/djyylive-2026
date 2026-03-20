"use client";
import { useState, useEffect } from "react";

let indexCache = null;

/**
 * Loads the player name → historical ID index.
 * Returns { lookup, loading } where lookup(name) returns player_id or null.
 */
export function usePlayerIndex() {
  const [index, setIndex] = useState(indexCache);
  const [loading, setLoading] = useState(!indexCache);

  useEffect(() => {
    if (indexCache) return;
    fetch("/data/players/index.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((data) => {
        if (data) {
          indexCache = data;
          setIndex(data);
        }
        setLoading(false);
      });
  }, []);

  function lookup(name) {
    if (!index || !name) return null;
    // Try exact match first
    if (index[name]) return index[name];
    // Try family name (last word)
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      const family = parts[parts.length - 1];
      if (index[family]) return index[family];
    }
    return null;
  }

  return { lookup, loading };
}

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
    const trimmed = name.trim();
    // Try exact match (trimmed)
    if (index[trimmed]) return index[trimmed];
    // Try full name match only — do NOT fallback to family name alone.
    // Family name collisions (e.g. "Romero" → wrong Pedro Romero) cause
    // showing completely wrong player data. Better to return null and let
    // the caller use the SportMonks ID directly.
    return null;
  }

  return { lookup, loading };
}

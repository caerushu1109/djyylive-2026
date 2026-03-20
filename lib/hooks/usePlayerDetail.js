"use client";
import { useState, useEffect } from "react";

const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  // Cache entries expire after 5 minutes
  if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function usePlayerDetail(playerId) {
  const [historical, setHistorical] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playerId) {
      setHistorical(null);
      setLive(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = `player-${playerId}`;
    const cached = getCached(cacheKey);

    if (cached) {
      setHistorical(cached.historical);
      setLive(cached.live);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchData() {
      const [historicalResult, liveResult] = await Promise.allSettled([
        fetch(`/data/players/${playerId}.json`).then((res) => {
          if (!res.ok) throw new Error(`Historical: ${res.status}`);
          return res.json();
        }),
        fetch(`/api/player/${playerId}`).then((res) => {
          if (!res.ok) throw new Error(`Live: ${res.status}`);
          return res.json();
        }),
      ]);

      if (cancelled) return;

      const historicalData =
        historicalResult.status === "fulfilled" ? historicalResult.value : null;
      const liveData =
        liveResult.status === "fulfilled" ? liveResult.value : null;

      // Only set error if both sources failed
      if (!historicalData && !liveData) {
        const historicalError =
          historicalResult.status === "rejected" ? historicalResult.reason : null;
        const liveError =
          liveResult.status === "rejected" ? liveResult.reason : null;
        setError(
          historicalError?.message || liveError?.message || "Failed to load player data"
        );
      } else {
        setError(null);
        setCache(cacheKey, { historical: historicalData, live: liveData });
      }

      setHistorical(historicalData);
      setLive(liveData);
      setLoading(false);
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [playerId]);

  return { historical, live, loading, error };
}

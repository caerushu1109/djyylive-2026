"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const MAX_INTERVAL = 300000; // 5 min max backoff

// Module-level cache: avoids re-fetching when navigating back
const matchCache = new Map();
const CACHE_TTL_NS = 30000;   // 30s for pre-match
const CACHE_TTL_FT = 3600000; // 1hr for finished matches

function getCached(id) {
  const entry = matchCache.get(id);
  if (!entry) return null;
  const age = Date.now() - entry.ts;
  const ttl = entry.status === "FT" ? CACHE_TTL_FT : CACHE_TTL_NS;
  if (age > ttl) {
    matchCache.delete(id);
    return null;
  }
  return entry.data;
}

function setCache(id, data) {
  matchCache.set(id, {
    data,
    ts: Date.now(),
    status: data?.fixture?.status || "NS",
  });
  // Keep cache size bounded
  if (matchCache.size > 50) {
    const oldest = matchCache.keys().next().value;
    matchCache.delete(oldest);
  }
}

export function useMatchDetail(id, { pollInterval = 30000 } = {}) {
  const cached = id ? getCached(id) : null;
  const [data, setData] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const failCount = useRef(0);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const r = await fetch(`/api/match/${id}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      setData(json);
      setCache(id, json);
      setError(null);
      failCount.current = 0;
      setLoading(false);
    } catch (e) {
      failCount.current++;
      setError(e.message);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    // If we have cached data, show it immediately
    const c = getCached(id);
    if (c) {
      setData(c);
      setLoading(false);
      // Still refresh in background for freshness
      fetchData();
    } else {
      setLoading(true);
      fetchData();
    }
  }, [id, fetchData]);

  // Poll when match is live, with exponential backoff on failures
  useEffect(() => {
    if (!data?.fixture || data.fixture.status !== "LIVE") return;

    function schedule() {
      const backoff = Math.min(
        pollInterval * Math.pow(2, failCount.current),
        MAX_INTERVAL
      );
      timerRef.current = setTimeout(() => {
        fetchData().then(schedule);
      }, backoff);
    }
    schedule();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [data?.fixture?.status, fetchData, pollInterval]);

  return { data, loading, error };
}

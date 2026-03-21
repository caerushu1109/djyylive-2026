"use client";
import { useState, useEffect } from "react";

// Shared in-memory cache — survives client-side navigations
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 60000; // 60s — predictions rarely change

export function usePredictions() {
  const hasFresh = _cache && Date.now() - _cacheTs < CACHE_TTL;
  const [data, setData] = useState(hasFresh ? _cache : null);
  const [loading, setLoading] = useState(!hasFresh);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
      setData(_cache);
      setLoading(false);
      return;
    }
    fetch("/api/predictions")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { _cache = json; _cacheTs = Date.now(); setData(json); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  return { data, loading, error };
}

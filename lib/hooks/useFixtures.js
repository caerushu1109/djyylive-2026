"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const WC_END = new Date("2026-07-20T06:00:00+08:00");
const MAX_INTERVAL = 300000;

// Shared in-memory cache — survives client-side navigations
let _cache = null;
let _cacheTs = 0;
const CACHE_TTL = 30000; // 30s

export function useFixtures({ pollInterval = 30000 } = {}) {
  const hasFreshCache = _cache && Date.now() - _cacheTs < CACHE_TTL;
  const [data, setData] = useState(hasFreshCache ? _cache : null);
  const [loading, setLoading] = useState(!hasFreshCache);
  const [error, setError] = useState(null);
  const failCount = useRef(0);
  const timerRef = useRef(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/fixtures");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      _cache = json;
      _cacheTs = Date.now();
      setData(json);
      setError(null);
      failCount.current = 0;
    } catch (e) {
      failCount.current++;
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (_cache && Date.now() - _cacheTs < CACHE_TTL) {
      setData(_cache);
      setLoading(false);
    } else {
      fetch_();
    }

    function schedule() {
      if (Date.now() > WC_END.getTime()) return;
      const backoff = Math.min(
        pollInterval * Math.pow(2, failCount.current),
        MAX_INTERVAL
      );
      timerRef.current = setTimeout(() => {
        fetch_().then(schedule);
      }, backoff);
    }
    schedule();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fetch_, pollInterval]);

  return { data, loading, error, refetch: fetch_ };
}

"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const WC_END = new Date("2026-07-20T06:00:00+08:00"); // day after final, BJT
const MAX_INTERVAL = 300000; // 5 min max backoff

export function useFixtures({ pollInterval = 30000 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const failCount = useRef(0);
  const timerRef = useRef(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/fixtures");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
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
    fetch_();

    function schedule() {
      // Stop polling after World Cup ends
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

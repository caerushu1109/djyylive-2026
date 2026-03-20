"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const MAX_INTERVAL = 300000; // 5 min max backoff

export function useMatchDetail(id, { pollInterval = 30000 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    fetchData();
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

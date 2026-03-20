"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export function useMatchDetail(id, { pollInterval = 30000 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const fetchData = useCallback(() => {
    if (!id) return;
    fetch(`/api/match/${id}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchData();
  }, [id, fetchData]);

  // Poll when match is live
  useEffect(() => {
    if (!data?.fixture || data.fixture.status !== "LIVE") return;
    timerRef.current = setInterval(fetchData, pollInterval);
    return () => clearInterval(timerRef.current);
  }, [data?.fixture?.status, fetchData, pollInterval]);

  return { data, loading, error };
}

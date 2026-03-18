"use client";
import { useState, useEffect, useCallback } from "react";

export function useFixtures({ pollInterval = 30000 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/fixtures");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const timer = setInterval(fetch_, pollInterval);
    return () => clearInterval(timer);
  }, [fetch_, pollInterval]);

  return { data, loading, error, refetch: fetch_ };
}

"use client";
import { useState, useEffect } from "react";

export function useEloTrends() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/data/elo-trends.json")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { setData(json.teams); setError(null); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  return { data, loading, error };
}

export function getTeamTrend(data, code) {
  if (!data) return null;
  return data.find((t) => t.code === code) || null;
}

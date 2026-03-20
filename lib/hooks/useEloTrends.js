"use client";
import { useState, useEffect } from "react";

export function useEloTrends() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/elo-trends.json")
      .then((r) => r.json())
      .then((json) => { setData(json.teams); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function getTeamTrend(data, code) {
  if (!data) return null;
  return data.find((t) => t.code === code) || null;
}

"use client";
import { useState, useEffect } from "react";

export function useMatchDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/match/${id}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [id]);

  return { data, loading, error };
}

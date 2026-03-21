"use client";
import { useState, useEffect } from "react";

// Shared in-memory cache — ELO data is static, cache for entire session
let _cache = null;

export function useElo() {
  const [data, setData] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_cache) { setData(_cache); setLoading(false); return; }
    fetch("/api/elo")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { _cache = json; setData(json); setError(null); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  return { data, loading, error };
}

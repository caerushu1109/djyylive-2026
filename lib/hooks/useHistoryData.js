"use client";
import { useState, useEffect } from "react";

const cache = {};

export function useHistoryData(file) {
  const [data, setData] = useState(cache[file] || null);
  const [loading, setLoading] = useState(!cache[file]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache[file]) return;
    fetch(`/data/history/${file}.json`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { cache[file] = d; setData(d); setError(null); })
      .catch((e) => { setError(e.message); })
      .finally(() => setLoading(false));
  }, [file]);

  return { data, loading, error };
}

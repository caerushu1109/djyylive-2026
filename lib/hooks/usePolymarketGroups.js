"use client";
import { useState, useEffect } from "react";

let cache = null;

export function usePolymarketGroups() {
  const [data, setData] = useState(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    fetch("/api/polymarket-groups")
      .then((r) => r.json())
      .then((json) => { cache = json; setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}

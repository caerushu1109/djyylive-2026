"use client";
import { useState, useEffect } from "react";
import { h2hKey } from "@/lib/canonical-names";

export function useH2H(iso1, iso2) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!iso1 || !iso2 || iso1 === iso2) { setLoading(false); return; }
    const key = h2hKey(iso1, iso2);
    let cancelled = false;
    fetch(`/data/h2h/${key}.json`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { if (!cancelled) { setData(json); setError(null); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [iso1, iso2]);

  return { data, loading, error };
}

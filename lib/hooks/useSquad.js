"use client";
import { useState, useEffect } from "react";
import { nameToIso } from "@/lib/utils/teamIso";

export function useSquad(teamName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamName) { setLoading(false); return; }
    const iso = nameToIso(teamName);
    if (!iso) { setLoading(false); return; }

    let cancelled = false;
    fetch(`/data/squads/${iso}.json`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { if (!cancelled) { setData(json); setError(null); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [teamName]);

  return { data, loading, error };
}

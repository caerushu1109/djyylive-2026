import { useState, useEffect } from "react";
import { nameToIso, getEntry } from "@/lib/canonical-names";

/**
 * Loads per-team detail JSON from /data/team-detail/{ISO}.json
 * Contains: confederation, totalStats, topPlayers, tournaments (with matches, goals, squads, group standings)
 * Falls back to alias codes if primary ISO file not found.
 */
export function useTeamDetail(teamName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamName) { setLoading(false); return; }
    const iso = nameToIso(teamName);
    if (!iso) { setLoading(false); return; }

    // Build candidate ISOs: primary iso + any alias codes that look like ISO codes
    const entry = getEntry(teamName);
    const candidates = [iso];
    if (entry?.aliases) {
      for (const a of entry.aliases) {
        if (/^[A-Z]{2,3}$/.test(a) && a !== iso && !candidates.includes(a)) {
          candidates.push(a);
        }
      }
    }

    setLoading(true);

    // Try each candidate until one succeeds
    (async () => {
      for (const code of candidates) {
        try {
          const r = await fetch(`/data/team-detail/${code}.json`);
          if (!r.ok) continue;
          const d = await r.json();
          setData(d);
          setLoading(false);
          return;
        } catch { /* try next */ }
      }
      setData(null);
      setLoading(false);
    })();
  }, [teamName]);

  return { data, loading };
}

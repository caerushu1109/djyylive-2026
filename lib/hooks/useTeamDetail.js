import { useState, useEffect } from "react";
import { nameToIso } from "@/lib/canonical-names";

/**
 * Loads per-team detail JSON from /data/team-detail/{ISO}.json
 * Contains: confederation, totalStats, topPlayers, tournaments (with matches, goals, squads, group standings)
 */
export function useTeamDetail(teamName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamName) { setLoading(false); return; }
    const iso = nameToIso(teamName);
    if (!iso) { setLoading(false); return; }

    setLoading(true);
    fetch(`/data/team-detail/${iso}.json`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [teamName]);

  return { data, loading };
}

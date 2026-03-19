"use client";
import { useState, useEffect } from "react";
import { nameToIso } from "@/lib/utils/teamIso";

/**
 * Load the squad roster for a team identified by its SportMonks originalName.
 * Data is served from /data/squads/{ISO}.json (public/data/squads/).
 *
 * Returns: { data, loading }
 *   data = { isoCode, shortCode, players: [{id, name, position, shirtNumber}], fetchedAt }
 */
export function useSquad(teamName) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamName) {
      setLoading(false);
      return;
    }
    const iso = nameToIso(teamName);
    if (!iso) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetch(`/data/squads/${iso}.json`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [teamName]);

  return { data, loading };
}

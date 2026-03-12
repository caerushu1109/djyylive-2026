export function coerceStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (["live", "inplay", "in_play", "1h", "2h", "ht", "et", "pen_live"].includes(normalized)) {
    return "live";
  }
  if (["ft", "aet", "pen", "finished", "full_time", "after_extra_time"].includes(normalized)) {
    return "finished";
  }
  if (["postponed", "delayed", "cancelled", "abandoned"].includes(normalized)) {
    return "postponed";
  }
  return "scheduled";
}

export function inferPhase(status, kickoff) {
  const mapped = coerceStatus(status);
  if (mapped === "live") {
    return "in_match";
  }
  if (mapped === "finished") {
    return "post_match";
  }
  const kickoffTime = kickoff ? new Date(kickoff).getTime() : null;
  if (!kickoffTime || Number.isNaN(kickoffTime)) {
    return "pre_match";
  }
  return kickoffTime > Date.now() ? "pre_match" : "post_match";
}

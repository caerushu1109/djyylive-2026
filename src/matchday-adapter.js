import { wc2026Groups, wc2026Matches } from "./wc2026-data.js";
import { coerceStatus, inferPhase } from "./matchday-normalizers.js";

const stageOrder = {
  "A组": 10,
  "B组": 11,
  "C组": 12,
  "D组": 13,
  "E组": 14,
  "F组": 15,
  "G组": 16,
  "H组": 17,
  "I组": 18,
  "J组": 19,
  "K组": 20,
  "L组": 21,
  "32强": 30,
  "16强": 40,
  "八强": 50,
  "半决赛": 60,
  "三四名决赛": 70,
  "决赛": 80,
};

const localMatchDetails = {
  "wc26-mex-rsa": {
    timeline: [
      { minute: 0, type: "context", team: "墨西哥", detail: "揭幕战已经进入官方赛程，主办氛围会是这场的最大看点。" },
      { minute: 0, type: "lineup", team: "墨西哥", detail: "阵容、首发与球场信息会在接入实时 API 后替换这里。" },
      { minute: 0, type: "angle", team: "南非", detail: "这页后续会承接实时事件流、首发、换人和黄红牌。" },
    ],
    stats: { possession_home: 54, possession_away: 46, shots_home: 13, shots_away: 10, shots_on_target_home: 6, shots_on_target_away: 4, corners_home: 5, corners_away: 4, yellowcards_home: 1, yellowcards_away: 2, xg_home: 1.4, xg_away: 1.1 },
  },
  "wc26-eng-cro": {
    timeline: [
      { minute: 0, type: "context", team: "英格兰", detail: "英格兰与克罗地亚会是首轮最受关注的强强对话之一。" },
      { minute: 0, type: "angle", team: "克罗地亚", detail: "模型页可以先看双方 Elo 差值，再回到这里看事件流。" },
      { minute: 0, type: "lineup", team: "英格兰", detail: "接入 API 后，这里会替换成首发、事件、实时分钟和关键节点。" },
    ],
    stats: { possession_home: 57, possession_away: 43, shots_home: 15, shots_away: 9, shots_on_target_home: 5, shots_on_target_away: 3, corners_home: 6, corners_away: 2, yellowcards_home: 1, yellowcards_away: 1, xg_home: 1.6, xg_away: 0.9 },
  },
  "wc26-fra-sen": {
    timeline: [
      { minute: 0, type: "context", team: "法国", detail: "法国 vs 塞内加尔适合承接赛前预期和历史记忆的双重叙事。" },
      { minute: 0, type: "angle", team: "塞内加尔", detail: "如果 API 覆盖事件流，这页会成为比赛期间的高频入口。" },
    ],
    stats: { possession_home: 61, possession_away: 39, shots_home: 16, shots_away: 8, shots_on_target_home: 7, shots_on_target_away: 2, corners_home: 7, corners_away: 3, yellowcards_home: 0, yellowcards_away: 2, xg_home: 1.8, xg_away: 0.7 },
  },
};

function scoreParts(score) {
  if (!score || score === "vs") {
    return { home: null, away: null, display: "vs" };
  }
  const match = String(score).match(/(\d+)\s*[:|-]\s*(\d+)/);
  if (!match) {
    return { home: null, away: null, display: String(score) };
  }
  return { home: Number(match[1]), away: Number(match[2]), display: `${match[1]}:${match[2]}` };
}

function inferGroup(stage) {
  const match = String(stage || "").match(/^([A-L])组$/);
  return match ? match[1] : null;
}

export function normalizeMatch(rawMatch) {
  const score = scoreParts(rawMatch.score);
  const kickoff = rawMatch.kickoff || rawMatch.starting_at || "";
  const status = coerceStatus(rawMatch.status);
  return {
    id: rawMatch.id,
    status,
    phase: rawMatch.phase || inferPhase(status, kickoff),
    stage: rawMatch.stage,
    stage_order: stageOrder[rawMatch.stage] || 999,
    group: inferGroup(rawMatch.stage),
    kickoff,
    home: rawMatch.home,
    away: rawMatch.away,
    home_score: score.home,
    away_score: score.away,
    score: score.display,
    minute: rawMatch.minute || "",
    venue: rawMatch.venue,
    city: rawMatch.city || rawMatch.venue,
    country: rawMatch.country || "",
    meta: rawMatch.meta || "",
    source: "local-fixture-seed",
  };
}

export function normalizeStandings(rawGroups) {
  return Object.fromEntries(
    Object.entries(rawGroups).map(([group, rows]) => [
      group,
      rows.map((row) => ({
        group,
        team: row.team,
        played: row.played ?? 0,
        win: row.win ?? row.wins ?? 0,
        draw: row.draw ?? row.draws ?? 0,
        loss: row.loss ?? row.losses ?? 0,
        points: row.points ?? 0,
        goals_for: row.goals_for ?? row.gf ?? 0,
        goals_against: row.goals_against ?? row.ga ?? 0,
        goal_difference:
          row.goal_difference ??
          ((row.goals_for ?? row.gf ?? 0) - (row.goals_against ?? row.ga ?? 0)),
      })),
    ])
  );
}

export function normalizeTimelineEvent(rawEvent, index = 0) {
  return {
    event_id: rawEvent.event_id || `local-event-${index}`,
    minute: rawEvent.minute ?? 0,
    stoppage_minute: rawEvent.stoppage_minute ?? null,
    type: rawEvent.type || "context",
    team: rawEvent.team || "",
    player: rawEvent.player || "",
    detail: rawEvent.detail || "",
  };
}

export function normalizeMatchStats(rawStats = {}) {
  return {
    possession_home: rawStats.possession_home ?? 50,
    possession_away: rawStats.possession_away ?? 50,
    shots_home: rawStats.shots_home ?? 0,
    shots_away: rawStats.shots_away ?? 0,
    shots_on_target_home: rawStats.shots_on_target_home ?? 0,
    shots_on_target_away: rawStats.shots_on_target_away ?? 0,
    corners_home: rawStats.corners_home ?? 0,
    corners_away: rawStats.corners_away ?? 0,
    yellowcards_home: rawStats.yellowcards_home ?? 0,
    yellowcards_away: rawStats.yellowcards_away ?? 0,
    xg_home: rawStats.xg_home ?? 0,
    xg_away: rawStats.xg_away ?? 0,
  };
}

export function getMatchDetail(matchId, normalizedMatches) {
  const baseMatch = normalizedMatches.find((match) => match.id === matchId) || normalizedMatches[0];
  const local = localMatchDetails[baseMatch.id] || {
    timeline: [
      { minute: 0, type: "context", team: baseMatch.home, detail: `${baseMatch.home} vs ${baseMatch.away} 已进入官方赛程。` },
      { minute: 0, type: "angle", team: baseMatch.away, detail: "接入 API 后，这里会替换成实时事件流、首发和关键节点。" },
    ],
    stats: { possession_home: 50, possession_away: 50, shots_home: 0, shots_away: 0, shots_on_target_home: 0, shots_on_target_away: 0, corners_home: 0, corners_away: 0, yellowcards_home: 0, yellowcards_away: 0, xg_home: 0, xg_away: 0 },
  };

  return {
    match: baseMatch,
    timeline: local.timeline.map(normalizeTimelineEvent),
    stats: normalizeMatchStats(local.stats),
  };
}

export function createMatchdayState({ matches = [], groups = {}, detailsByMatch = {} }) {
  const normalizedMatches = matches.map(normalizeMatch);
  const normalizedGroups = normalizeStandings(groups);

  return {
    matches: normalizedMatches,
    groups: normalizedGroups,
    getMatchDetail: (matchId) => {
      const fallback = getMatchDetail(matchId, normalizedMatches);
      const detail = detailsByMatch[matchId];
      if (!detail) {
        return fallback;
      }
      return {
        match: fallback.match,
        timeline: (detail.timeline || []).map(normalizeTimelineEvent),
        stats: normalizeMatchStats(detail.stats || {}),
      };
    },
  };
}

export const matchdayState = createMatchdayState({
  matches: wc2026Matches,
  groups: wc2026Groups,
});

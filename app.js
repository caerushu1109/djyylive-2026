import { TEAM_ALIASES, TEAM_ELO, TEAM_HISTORY } from "./opinion-data.js";

const LIVE_RUNTIME_URL =
  "/api/sportmonks/runtime?fixtureId=19609127&seasonId=26618&fixtureInclude=participants;scores;state;venue;events.type;lineups.details.type;statistics.type&standingsInclude=participant;rule;details";
const SAMPLE_URL = "./data/provider-samples/sportmonks-worldcup-sample.json";

const ADVANCED_SPORTMONKS_FIELDS = [
  "expectedLineups",
  "sidelined",
  "predictions",
  "odds",
];

function parseDate(value) {
  if (!value) return null;
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date || Number.isNaN(date.getTime())) return value || "未知时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatMinute(match) {
  const minute = match.time?.minute;
  if (minute == null) return "即将开始";
  return `${minute}'`;
}

function toArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function normalizeState(match) {
  const raw = String(match.state?.developer_name || match.state?.state || match.state || "").toLowerCase();
  if (["live", "inplay"].includes(raw) || match.time?.minute != null) return "live";
  if (["ft", "finished", "post_match"].includes(raw)) return "post";
  return "pre";
}

function getParticipants(match) {
  const home = (match.participants || []).find((row) => row.meta?.location === "home") || match.participants?.[0] || {};
  const away = (match.participants || []).find((row) => row.meta?.location === "away") || match.participants?.[1] || {};
  return { home, away };
}

function getParticipantSide(match, participantId) {
  const { home, away } = getParticipants(match);
  if (String(home.id || "") === String(participantId || "")) return "home";
  if (String(away.id || "") === String(participantId || "")) return "away";
  return null;
}

function resolveTeamKey(name) {
  if (!name) return "";
  return TEAM_ALIASES[name] || name;
}

function getScore(match) {
  const homeGoals = (match.scores || []).find((row) => row.score?.participant === "home")?.score?.goals;
  const awayGoals = (match.scores || []).find((row) => row.score?.participant === "away")?.score?.goals;
  if (homeGoals == null || awayGoals == null) return null;
  return `${homeGoals} : ${awayGoals}`;
}

function extractNumericValue(value) {
  if (value == null || value === "") return null;
  const number = Number(String(value).replace("%", "").trim());
  return Number.isFinite(number) ? number : null;
}

function extractStandingDetailValue(details, typeIds) {
  const detail = toArray(details).find((row) => typeIds.includes(Number(row.type_id)));
  return extractNumericValue(detail?.value);
}

function normalizeStatBucket(raw, match) {
  if (!raw) return null;
  if (!Array.isArray(raw) && typeof raw === "object") return raw;

  const bucket = {};
  const typeMap = {
    possession: ["ball possession", "possession"],
    shots: ["shots total", "total shots", "shots"],
    shots_on_target: ["shots on target", "shots on goal"],
    corners: ["corners", "corner kicks"],
    yellow_cards: ["yellowcards", "yellow cards"],
    xg: ["expected goals", "xg"],
  };

  toArray(raw).forEach((row) => {
    const typeName = String(row.type?.developer_name || row.type?.name || row.name || "").toLowerCase();
    const value = extractNumericValue(row.data?.value ?? row.value ?? row.detail?.value);
    if (value == null) return;

    const side =
      row.location ||
      row.participant?.meta?.location ||
      getParticipantSide(match, row.participant_id || row.participant?.id);
    if (!side || !["home", "away"].includes(side)) return;

    const targetKey = Object.entries(typeMap).find(([, labels]) =>
      labels.some((label) => typeName.includes(label))
    )?.[0];

    if (!targetKey) return;
    if (!bucket[targetKey]) bucket[targetKey] = { home: 0, away: 0 };
    bucket[targetKey][side] = value;
  });

  return bucket;
}

function getExpectedLineups(match) {
  return toArray(match.expectedLineups || match.expected_lineups);
}

function getSidelined(match) {
  return toArray(match.sidelined || match.sidelineds);
}

function getReferees(match) {
  return toArray(match.referees);
}

function getWeatherSummary(match) {
  const weather = match.weatherReport || match.weather_report;
  if (!weather) return null;
  const summary = [weather.description, weather.temperature && `${weather.temperature}°C`, weather.wind && `${weather.wind}风`]
    .filter(Boolean)
    .join(" · ");
  return summary || null;
}

function getFormation(match, side) {
  return toArray(match.formations).find((row) => row.participant?.meta?.location === side)?.formation || null;
}

function normalizePayload(payload) {
  if (Array.isArray(payload.matches)) {
    return {
      matches: payload.matches,
      standings: payload.standings || [],
      eventsByMatch: payload.eventsByMatch || {},
      statsByMatch: payload.statsByMatch || {},
      fixture: payload.matches[0] || null,
      mode: "sample",
    };
  }

  const primary = payload.fixture ? [payload.fixture] : [];
  const matches = [...primary, ...(payload.matches || [])].reduce((acc, row) => {
    if (!acc.find((item) => String(item.id) === String(row.id))) acc.push(row);
    return acc;
  }, []);

  const eventsByMatch = payload.fixture?.events?.length
    ? { [payload.fixture.id]: payload.fixture.events }
    : {};

  const statsByMatch = payload.fixture?.statistics?.length
    ? { [payload.fixture.id]: payload.fixture.statistics }
    : {};

  return {
    matches,
    standings: payload.standingsRows || [],
    eventsByMatch,
    statsByMatch,
    fixture: payload.fixture || matches[0] || null,
    mode: "live",
  };
}

async function loadData() {
  const useLive = window.location.hostname.includes("djyylive.com");
  const response = await fetch(useLive ? LIVE_RUNTIME_URL : SAMPLE_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`数据请求失败：${response.status}`);
  }
  return normalizePayload(await response.json());
}

function sortMatches(matches) {
  return [...matches].sort((a, b) => {
    const aTime = parseDate(a.starting_at)?.getTime() || 0;
    const bTime = parseDate(b.starting_at)?.getTime() || 0;
    return aTime - bTime;
  });
}

function summarizeEvents(events = []) {
  return {
    goals: events.filter((row) => row.type?.developer_name === "goal").length,
    cards: events.filter((row) => String(row.type?.developer_name || "").includes("card")).length,
    changes: events.filter((row) => row.type?.developer_name === "substitution").length,
  };
}

function buildLiveOpinion(match, stats, events) {
  const { home, away } = getParticipants(match);
  if (stats?.possession?.home != null && stats?.possession?.away != null) {
    const edge = stats.possession.home - stats.possession.away;
    if (edge >= 8) return `${home.name} 目前控球更稳，场面主动权更明显。`;
    if (edge <= -8) return `${away.name} 目前控球更稳，比赛节奏更像在对方脚下。`;
  }

  const summary = summarizeEvents(events);
  if (summary.goals > 0) return `这场已经出现进球，接下来更值得盯住节奏变化和换人。`;
  return `这场目前还在试探阶段，先看谁能把第一波攻势转成射门质量。`;
}

function buildLiveInfoCards(match, stats) {
  const expectedLineups = getExpectedLineups(match);
  const sidelined = getSidelined(match);
  const referees = getReferees(match);
  const weather = getWeatherSummary(match);

  const infoCards = [
    {
      title: "比赛信息",
      body: [
        match.venue?.name || "场地待定",
        match.venue?.city_name,
        match.details || match.round?.name || "比赛阶段待定",
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      title: "官方现场数据",
      body: [
        "比分与状态已接入",
        (match.events || []).length ? `事件流 ${match.events.length} 条` : "事件流等待更新",
        stats ? "技术统计已接入" : "技术统计等待更新",
      ].join(" · "),
    },
  ];

  if (referees.length) {
    infoCards.push({
      title: "裁判信息",
      body: referees.map((row) => row.name).filter(Boolean).join("、"),
    });
  }

  if (weather) {
    infoCards.push({
      title: "现场天气",
      body: weather,
    });
  }

  if (expectedLineups.length || sidelined.length) {
    infoCards.push({
      title: "赛前名单",
      body: [
        expectedLineups.length ? `预计首发 ${expectedLineups.length} 条` : null,
        sidelined.length ? `缺席信息 ${sidelined.length} 条` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }

  return infoCards;
}

function buildPreOpinion(match, standings) {
  const { home, away } = getParticipants(match);
  const homeKey = resolveTeamKey(home.name);
  const awayKey = resolveTeamKey(away.name);
  const homeElo = TEAM_ELO[homeKey]?.elo;
  const awayElo = TEAM_ELO[awayKey]?.elo;
  const groupName = match.group?.name || null;
  const groupRows = groupName
    ? standings.filter((row) => (row.group?.name || row.group_id) === groupName)
    : [];

  if (home.placeholder || away.placeholder) {
    return `这场还带附加赛席位占位，先看最终参赛队确定后再判断节奏会更稳。`;
  }

  if (homeElo != null && awayElo != null) {
    const gap = homeElo - awayElo;
    if (Math.abs(gap) <= 35) {
      return `两队历史强度接近，这场更像五五开的赛前阅读。`;
    }
    return gap > 0
      ? `${home.name} 的历史强度略高，赛前基线稍占上风。`
      : `${away.name} 的历史强度略高，赛前基线稍占上风。`;
  }

  if (groupRows.length) {
    return `这场会直接影响 ${groupName} 组的开局节奏，适合先看分组背景再做判断。`;
  }

  return `先看双方开球时间、场地和阶段位置，这场更适合当作赛前主推入口。`;
}

function buildCoreOpinionCards(match, standings) {
  const { home, away } = getParticipants(match);
  const groupName = match.group?.name ? `${match.group.name} 组` : null;
  const opener = match.details?.includes("Match 1") || match.details?.includes("揭幕");
  const rows = groupName
    ? standings.filter((row) => (row.group?.name || row.group_id) === match.group.name).slice(0, 4)
    : [];

  return [
    {
      title: "核心判断",
      body: opener
        ? `这场会承担本届开局的第一波注意力，先看 ${home.name || "主队"} 能不能把节奏握在自己手里，再看 ${away.name || "客队"} 会不会把比赛拖进更胶着的走势。`
        : buildPreOpinion(match, standings),
    },
    {
      title: "先看哪里",
      body: rows.length
        ? `${groupName} 的已知球队包括 ${rows.map((row) => row.participant?.name || "待定球队").join("、")}，先把这场当作这一组的开局样本去读。`
        : groupName
          ? `${groupName} 已经落位，但完整上下文还在形成，这场先看双方强度和赛前名单。`
          : "这场先按比赛阶段和两队履历来判断，不急着把重点放在分组变量上。",
    },
    {
      title: "比赛背景",
      body: `${formatDate(match.starting_at)}${match.venue?.name ? ` · ${match.venue.name}` : ""}${match.venue?.city_name ? ` · ${match.venue.city_name}` : ""}。${match.details || match.round?.name || "赛前"}阶段，适合先看基线判断，再看阵容信息。`,
    },
  ];
}

function summarizeStandingDetails(row) {
  const details = row.details || [];
  const played = extractStandingDetailValue(details, [129]) ?? 0;
  const won = extractStandingDetailValue(details, [130]) ?? 0;
  const drawn = extractStandingDetailValue(details, [131]) ?? 0;
  const lost = extractStandingDetailValue(details, [132]) ?? 0;
  const goalsFor = extractStandingDetailValue(details, [133, 139]) ?? 0;
  const goalsAgainst = extractStandingDetailValue(details, [134, 140]) ?? 0;

  return {
    played,
    record: `${won}胜 ${drawn}平 ${lost}负`,
    goals: `${goalsFor}:${goalsAgainst}`,
  };
}

function buildHistoryCard(teamName) {
  const teamKey = resolveTeamKey(teamName);
  const history = TEAM_HISTORY[teamKey];
  const elo = TEAM_ELO[teamKey];

  if (!history && !elo) {
    return {
      title: teamName,
      body: "这支球队的历史档案还没有补齐，当前先按分组位置和赛程背景来读这场比赛。",
    };
  }

  if (!history && elo) {
    return {
      title: `${teamName} · 历史强度`,
      body: `最近一版世界杯 Elo 为 ${elo.elo}，共 ${elo.appearances} 次参赛，适合先当作赛前强弱参考。`,
    };
  }

  return {
    title: `${teamName} · 世界杯履历`,
    body: `世界杯 ${history.matches} 场，${history.wins} 胜 ${history.draws} 平 ${history.losses} 负，峰值 Elo ${history.peakElo}，最近世界杯强度 ${history.latestElo}。`,
  };
}

function buildHistoryNotes(match) {
  const { home, away } = getParticipants(match);
  const cards = [buildHistoryCard(home.name || "主队"), buildHistoryCard(away.name || "客队")];
  const homeHistory = TEAM_HISTORY[resolveTeamKey(home.name)];
  const awayHistory = TEAM_HISTORY[resolveTeamKey(away.name)];

  if (homeHistory?.biggestUpsetWin || awayHistory?.biggestUpsetWin) {
    cards.push({
      title: "历史亮点",
      body: `${home.name || "主队"}：${homeHistory?.biggestUpsetWin || "档案待补"}；${away.name || "客队"}：${awayHistory?.biggestUpsetWin || "档案待补"}。`,
    });
  }

  return cards;
}

function buildEloDeck(match) {
  const { home, away } = getParticipants(match);
  const homeKey = resolveTeamKey(home.name);
  const awayKey = resolveTeamKey(away.name);
  const homeElo = TEAM_ELO[homeKey];
  const awayElo = TEAM_ELO[awayKey];

  if (!homeElo && !awayElo) {
    return null;
  }

  const gap = homeElo && awayElo ? homeElo.elo - awayElo.elo : null;
  const leadName = gap == null ? (homeElo ? home.name : away.name) : gap >= 0 ? home.name : away.name;
  const gapValue = gap == null ? null : Math.abs(gap);
  const tone =
    gapValue == null ? "单边参考" : gapValue <= 35 ? "胶着" : gapValue <= 90 ? "轻优势" : "明显优势";
  const toneBody =
    gapValue == null
      ? `${leadName} 目前是这场唯一有 Elo 档案的一边，赛前先把它当作基线。`
      : gapValue <= 35
      ? "两边的历史强度贴得很近，这场更适合先看分组背景和首发。"
      : gapValue <= 90
      ? `${leadName} 的赛前基线更高，但还没到可以忽略分组和名单信息的程度。`
      : `${leadName} 的历史强度拉开了明显差距，这场赛前第一判断先落在这一边。`;

  return {
    tone,
    leadName,
    toneBody,
    cards: [
      {
        team: home.name || "主队",
        elo: homeElo?.elo ?? "待补",
        note: homeElo ? `世界杯样本 ${homeElo.appearances} 场` : "当前没有 Elo 档案",
      },
      {
        team: away.name || "客队",
        elo: awayElo?.elo ?? "待补",
        note: awayElo ? `世界杯样本 ${awayElo.appearances} 场` : "当前没有 Elo 档案",
      },
    ],
    gapLabel: gapValue == null ? "单边参考" : `差值 ${gapValue}`,
  };
}

function buildHistorySummary(match) {
  const { home, away } = getParticipants(match);
  const homeHistory = TEAM_HISTORY[resolveTeamKey(home.name)];
  const awayHistory = TEAM_HISTORY[resolveTeamKey(away.name)];

  if (!homeHistory && !awayHistory) {
    return null;
  }

  const richerSide =
    (homeHistory?.matches || 0) === (awayHistory?.matches || 0)
      ? null
      : (homeHistory?.matches || 0) > (awayHistory?.matches || 0)
      ? home.name
      : away.name;

  const rows = [
    {
      team: home.name || "主队",
      matches: homeHistory?.matches ?? "待补",
      record: homeHistory ? `${homeHistory.wins}胜 ${homeHistory.draws}平 ${homeHistory.losses}负` : "履历待补",
      subline: homeHistory ? `峰值 Elo ${homeHistory.peakElo} · 最近 ${homeHistory.latestYear}` : "等待补充",
    },
    {
      team: away.name || "客队",
      matches: awayHistory?.matches ?? "待补",
      record: awayHistory ? `${awayHistory.wins}胜 ${awayHistory.draws}平 ${awayHistory.losses}负` : "履历待补",
      subline: awayHistory ? `峰值 Elo ${awayHistory.peakElo} · 最近 ${awayHistory.latestYear}` : "等待补充",
    },
  ];

  const headline = richerSide
    ? `${richerSide} 的世界杯样本更厚，这场先把它当作历史背景的主参考。`
    : "两边都有可读的世界杯履历，先对照样本量，再看历史亮点和峰值强度。";

  return {
    title: "历史对照",
    body: headline,
    rows,
  };
}

function describeEloGap(match) {
  const { home, away } = getParticipants(match);
  const homeKey = resolveTeamKey(home.name);
  const awayKey = resolveTeamKey(away.name);
  const homeElo = TEAM_ELO[homeKey];
  const awayElo = TEAM_ELO[awayKey];

  if (!homeElo && !awayElo) {
    return {
      title: "Elo 对比",
      body: "这场暂时没有可直接引用的 Elo 档案，先看分组背景和阵容信息。",
    };
  }

  if (!homeElo || !awayElo) {
    const known = homeElo ? home.name : away.name;
    const knownElo = homeElo || awayElo;
    return {
      title: "Elo 对比",
      body: `${known} 的最近世界杯 Elo 为 ${knownElo.elo}，另一边当前先按历史背景和名单信息来读。`,
    };
  }

  const gap = homeElo.elo - awayElo.elo;
  const leadName = gap >= 0 ? home.name : away.name;
  const gapValue = Math.abs(gap);
  let summary = `${home.name} ${homeElo.elo} vs ${away.name} ${awayElo.elo}。`;

  if (gapValue <= 35) {
    summary += " 两队历史强度接近，这场更像胶着型对局。";
  } else if (gapValue <= 90) {
    summary += ` ${leadName} 的历史强度略高，赛前基线稍占上风。`;
  } else {
    summary += ` ${leadName} 的历史强度明显更高，赛前更值得先看这一侧的节奏。`;
  }

  return {
    title: "Elo 对比",
    body: summary,
  };
}

function buildHeaderContext(match) {
  const groupName = match.group?.name ? `${match.group.name} 组` : "分组待定";
  const stageName = match.details || match.round?.name || "赛前";
  return [
    { label: "时间", value: formatDate(match.starting_at) },
    { label: "场地", value: match.venue?.name || "场地待定" },
    { label: "阶段", value: stageName },
    { label: "分组", value: groupName },
  ];
}

function buildLineupCard(match) {
  const lineups = match.lineups || [];
  const homePlayers = lineups.filter((row) => row.participant?.meta?.location === "home");
  const awayPlayers = lineups.filter((row) => row.participant?.meta?.location === "away");
  const lineupReady = homePlayers.length || awayPlayers.length;

  if (!lineupReady) {
    return {
      title: "阵容与可用信息",
      body: "首发名单通常会在开球前更新；当前先把这场当作赛前观点页来读。",
    };
  }

  return {
    title: "阵容与可用信息",
    body: `当前已拿到部分名单信息：${homePlayers.length ? `${homePlayers.length} 名主队球员` : "主队名单待补"}，${awayPlayers.length ? `${awayPlayers.length} 名客队球员` : "客队名单待补"}。`,
  };
}

function buildSquadAvailabilityCard(match) {
  const expectedLineups = getExpectedLineups(match);
  const sidelined = getSidelined(match);
  const refs = getReferees(match);
  const weather = getWeatherSummary(match);

  const notes = [];
  if (expectedLineups.length) notes.push(`预计首发 ${expectedLineups.length} 条`);
  if (sidelined.length) notes.push(`缺席/伤停 ${sidelined.length} 条`);
  if (refs.length) notes.push(`裁判信息 ${refs.length} 条`);
  if (weather) notes.push(`天气：${weather}`);

  return {
    title: "附加可用信息",
    body: notes.length ? notes.join(" · ") : "这场当前还没有 expectedLineups、sidelined、天气或裁判信息。",
  };
}

function buildLineupInfoCards(match) {
  const expectedLineups = getExpectedLineups(match);
  const sidelined = getSidelined(match);
  const referees = getReferees(match);
  const weather = getWeatherSummary(match);
  const cards = [buildLineupCard(match), buildSquadAvailabilityCard(match)];

  cards.push({
    title: "首发准备度",
    body: expectedLineups.length
      ? `当前已经拿到 ${expectedLineups.length} 条预计首发信息，临近开球前可以重点看有没有临时调整。`
      : "这场预计首发还没放出来，赛前先把注意力放在 Elo 差值和世界杯履历上。",
  });

  if (sidelined.length) {
    cards.push({
      title: "缺席与变动",
      body: sidelined
        .slice(0, 3)
        .map((item) => item.player_name || item.player?.name || item.participant?.name || "缺席信息")
        .join("、"),
    });
  }

  if (referees.length || weather) {
    cards.push({
      title: "场外信息",
      body: [referees[0]?.name ? `裁判 ${referees[0].name}` : null, weather ? `天气 ${weather}` : null]
        .filter(Boolean)
        .join(" · "),
    });
  }

  return cards;
}

function buildGroupCard(match, standings) {
  const groupName = match.group?.name || null;
  if (!groupName) {
    return {
      title: "分组背景",
      body: "这场当前没有明确小组信息，先按比赛阶段和场地来理解这场的重要性。",
    };
  }

  const rows = standings.filter((row) => (row.group?.name || row.group_id) === groupName).slice(0, 4);
  if (!rows.length) {
    return {
      title: "分组背景",
      body: `${groupName} 组的完整分组信息还没整理出来，这场先按赛程时间线来读。`,
    };
  }

  const names = rows.map((row) => row.participant?.name || "待定球队").join("、");
  return {
    title: "分组背景",
    body: `${groupName} 组当前已知球队包括：${names}。这场会直接影响这一组的开局阅读顺序。`,
  };
}

function buildGroupInsightCards(match, standings) {
  const groupName = match.group?.name || null;
  if (!groupName) {
    return [
      {
        title: "分组背景",
        body: "这场当前还没有明确小组信息，先把重点放在比赛阶段、场地和双方履历。",
      },
    ];
  }

  const rows = standings.filter((row) => (row.group?.name || row.group_id) === groupName).slice(0, 4);
  if (!rows.length) {
    return [
      {
        title: "分组背景",
        body: `${groupName} 组的完整上下文还没完全整理出来，这场先按赛程时间线和两队历史强度去读。`,
      },
    ];
  }

  const leadCard = {
    title: `${groupName} 组 · 开局背景`,
    body: `这场会先给 ${groupName} 组定下第一印象。先看已确定球队谁最稳，再看附加赛待定席位会不会拉高不确定性。`,
  };

  const rowCards = rows.map((row) => {
    const summary = summarizeStandingDetails(row);
    return {
      title: `${row.position || "-"} · ${row.participant?.name || "待定球队"}`,
      body: `积分 ${row.points ?? 0} · ${summary.record} · 进失球 ${summary.goals}`,
    };
  });

  return [leadCard, ...rowCards];
}

function computeEloWinProbability(homeName, awayName) {
  const homeElo = TEAM_ELO[resolveTeamKey(homeName)]?.elo;
  const awayElo = TEAM_ELO[resolveTeamKey(awayName)]?.elo;
  if (homeElo == null || awayElo == null) return null;
  const homeProb = 1 / (1 + 10 ** ((awayElo - homeElo) / 400));
  const awayProb = 1 - homeProb;
  return {
    home: Math.round(homeProb * 100),
    away: Math.round(awayProb * 100),
  };
}

function getStageBucket(match) {
  const text = `${match.details || ""} ${match.round?.name || ""} ${match.stage?.name || ""}`.toLowerCase();
  if (text.includes("final")) return "决赛";
  if (text.includes("semi")) return "半决赛";
  if (text.includes("quarter")) return "八强";
  if (text.includes("round of 16") || text.includes("round of 32") || text.includes("knockout")) return "淘汰赛";
  return "小组赛";
}

function formatPlaceholderName(name) {
  if (!name) return "待定";
  if (!name.includes("/")) return name;
  return `附加赛待定（${name}）`;
}

function getGroupKey(row) {
  return row.group_id || row.group?.name || null;
}

function getGroupLabel(row) {
  if (row.group?.name) return `${row.group.name} 组`;
  return row.group_id ? `分组 ${row.group_id}` : "分组待定";
}

function getGroupedStandings(standings) {
  return [...new Map(
    standings
      .filter((row) => getGroupKey(row))
      .map((row) => [getGroupKey(row), row])
  ).values()]
    .map((seed) => {
      const key = getGroupKey(seed);
      const rows = standings
        .filter((row) => getGroupKey(row) === key)
        .sort((a, b) => (a.position || 99) - (b.position || 99));
      return {
        key,
        label: getGroupLabel(seed),
        rows,
      };
    })
    .sort((a, b) => String(a.label).localeCompare(String(b.label), "zh-CN"));
}

function getTeamEloValue(teamName) {
  return TEAM_ELO[resolveTeamKey(teamName)]?.elo ?? null;
}

function countResolvedTeams(rows) {
  return rows.filter((row) => !row.participant?.placeholder).length;
}

function countPlaceholderTeams(rows) {
  return rows.filter((row) => row.participant?.placeholder).length;
}

function findTitleFavorite(rows) {
  return rows
    .map((row) => ({
      row,
      elo: getTeamEloValue(row.participant?.name),
    }))
    .filter((item) => item.elo != null)
    .sort((a, b) => b.elo - a.elo)[0];
}

function findToughestGroup(groups) {
  return groups
    .map((group) => ({
      ...group,
      avgElo:
        group.rows
          .map((row) => getTeamEloValue(row.participant?.name))
          .filter((value) => value != null)
          .reduce((sum, value) => sum + value, 0) /
          Math.max(
            1,
            group.rows.map((row) => getTeamEloValue(row.participant?.name)).filter((value) => value != null).length
          ),
    }))
    .filter((group) => Number.isFinite(group.avgElo))
    .sort((a, b) => b.avgElo - a.avgElo)[0];
}

function buildFixtureChooserNote(match) {
  const { home, away } = getParticipants(match);
  const probs = computeEloWinProbability(home.name, away.name);
  const bucket = getStageBucket(match);
  const homeHistory = TEAM_HISTORY[resolveTeamKey(home.name)];
  const awayHistory = TEAM_HISTORY[resolveTeamKey(away.name)];

  if (bucket !== "小组赛") {
    return `${bucket}阶段，先看 ${formatPlaceholderName(home.name)} 和 ${formatPlaceholderName(away.name)} 谁更接近走到下一轮。`;
  }

  if (home.participant?.placeholder || away.participant?.placeholder || home.placeholder || away.placeholder) {
    return "这一场还带附加赛待定席位，适合先看签位和落位影响。";
  }

  if (probs) {
    const diff = Math.abs(probs.home - probs.away);
    if (diff <= 8) {
      return "这场更像五五开，先看分组背景和两队近几届世界杯走势。";
    }
    const favorite = probs.home > probs.away ? formatPlaceholderName(home.name) : formatPlaceholderName(away.name);
    return `${favorite} 的历史强度更高，但这类世界杯首轮比赛仍有变数。`;
  }

  if (homeHistory || awayHistory) {
    return "先看双方世界杯履历，再判断这场是不是传统强队压制局。";
  }

  return "先看这场的分组背景和基础强弱差。";
}

function buildTournamentOverview(match, matches, standings) {
  const totalMatches = matches.length;
  const liveCount = matches.filter((item) => normalizeState(item) === "live").length;
  const upcomingCount = matches.filter((item) => normalizeState(item) === "pre").length;
  const groups = getGroupedStandings(standings);
  const groupCount = groups.length;
  const opener = sortMatches(matches).find((item) => normalizeState(item) === "pre") || matches[0];
  const openerParticipants = getParticipants(opener);
  const toughestGroup = findToughestGroup(groups);
  const titleFavorite = standings.length
    ? standings
        .map((row) => ({
          row,
          elo: getTeamEloValue(row.participant?.name),
        }))
        .filter((item) => item.elo != null && !item.row.participant?.placeholder)
        .sort((a, b) => b.elo - a.elo)[0]
    : null;
  const selectedGroup = groups.find((group) =>
    group.rows.some((row) => String(row.participant_id) === String(match.participants?.[0]?.id) || String(row.participant_id) === String(match.participants?.[1]?.id))
  );
  const resolvedCount = standings.filter((row) => !row.participant?.placeholder).length;
  const placeholderCount = standings.filter((row) => row.participant?.placeholder).length;

  return [
    {
      title: "本届节奏",
      value: `${totalMatches} 场`,
      body: `当前已经接入 ${totalMatches} 场 2026 世界杯比赛，${groupCount} 个小组全部落位。已确定球队 ${resolvedCount} 支，仍有 ${placeholderCount} 个附加赛待定席位。`,
    },
    {
      title: "第一焦点",
      value: `${formatDate(opener.starting_at)}`,
      body: `${formatPlaceholderName(openerParticipants.home.name)} vs ${formatPlaceholderName(openerParticipants.away.name)} 是揭幕战。${formatDate(opener.starting_at)} 开球，这场会先定下整届比赛的第一层情绪。`,
    },
    {
      title: "整体格局",
      value: titleFavorite ? formatPlaceholderName(titleFavorite.row.participant?.name) : `${upcomingCount} 场待开赛`,
      body: titleFavorite
        ? `${formatPlaceholderName(titleFavorite.row.participant?.name)} 目前仍是纸面强度最高的一档，Elo ${titleFavorite.elo}。${toughestGroup ? `${toughestGroup.label} 目前是纸面最硬的一组。` : ""}`
        : liveCount
          ? `现在有 ${liveCount} 场正在进行，另外 ${upcomingCount} 场还在等待开球。`
          : `当前没有比赛进行中，接下来有 ${upcomingCount} 场比赛排在时间线前面。`,
    },
    {
      title: "当前主看点",
      value: selectedGroup ? selectedGroup.label : "当前焦点",
      body: selectedGroup
        ? `${selectedGroup.label} 是当前先看的主视角。这组里 ${countResolvedTeams(selectedGroup.rows)} 支球队已经确认，${countPlaceholderTeams(selectedGroup.rows)} 个席位仍待附加赛落位。`
        : "先看当前主推比赛，再顺着下面的小组卡和晋级树往下读。",
    },
  ];
}

function buildGroupOverviewCards(standings) {
  const groups = getGroupedStandings(standings);

  return groups.map((group) => ({
    title: group.label,
    value: `${countResolvedTeams(group.rows)} / 4 已确认`,
    entries: group.rows.slice(0, 4).map((row) => ({
      position: row.position || "-",
      team: formatPlaceholderName(row.participant?.name || "待定"),
      elo: getTeamEloValue(row.participant?.name),
      placeholder: !!row.participant?.placeholder,
    })),
    body: (() => {
      const favorite = findTitleFavorite(group.rows);
      const placeholderCount = countPlaceholderTeams(group.rows);
      const names = group.rows
        .slice(0, 4)
        .map((row) => `${row.position || "-"} · ${formatPlaceholderName(row.participant?.name || "待定")}`)
        .join(" / ");
      if (favorite && placeholderCount) {
        return `${names}。${formatPlaceholderName(favorite.row.participant?.name)} 是纸面强度最高的一队，但这组还有 ${placeholderCount} 个待定席位。`;
      }
      if (favorite) {
        return `${names}。${formatPlaceholderName(favorite.row.participant?.name)} 是这一组的纸面领跑者。`;
      }
      if (placeholderCount) {
        return `${names}。这组还有 ${placeholderCount} 个席位等附加赛结果落位。`;
      }
      return names;
    })(),
  }));
}

function buildBracketStages(matches) {
  const stageOrder = ["淘汰赛", "八强", "半决赛", "决赛"];
  const buckets = new Map(stageOrder.map((item) => [item, []]));

  sortMatches(matches).forEach((match) => {
    const bucket = getStageBucket(match);
    if (buckets.has(bucket)) buckets.get(bucket).push(match);
  });

  return stageOrder
    .map((stage) => ({
      stage,
      matches: buckets.get(stage) || [],
    }))
    .filter((item) => item.matches.length);
}

function buildFixtureChooser(matches) {
  return sortMatches(matches)
    .filter((match) => normalizeState(match) === "pre")
    .slice(0, 8);
}

function renderMatchCard(match, type) {
  const { home, away } = getParticipants(match);
  const score = getScore(match);
  const state = normalizeState(match);
  const liveEvents = window.__data.eventsByMatch[String(match.id)] || [];
  const summary = summarizeEvents(liveEvents);
  const stateLabel =
    state === "live" ? `进行中 · ${formatMinute(match)}` : state === "post" ? "完场" : `即将开始 · ${formatDate(match.starting_at)}`;
  const emphasis =
    type === "live"
      ? buildLiveOpinion(match, window.__data.statsByMatch[String(match.id)], liveEvents)
      : buildPreOpinion(match, window.__data.standings);

  const href = type === "live" ? `./live.html?id=${match.id}` : `./opinion.html?id=${match.id}`;
  const buttonLabel = type === "live" ? "看直播" : "看观点";
  const secondaryLabel = type === "live" ? "看观点" : "看背景";
  const secondaryHref = `./opinion.html?id=${match.id}`;
  const scoreMarkup = score ? `<div class="score-box">${score}</div>` : `<div class="score-box">${formatDate(match.starting_at).slice(6)}</div>`;
  const eventLine =
    type === "live"
      ? `进球 ${summary.goals} · 红黄牌 ${summary.cards} · 换人 ${summary.changes}`
      : `${match.venue?.name || "场地待定"} · ${match.details || match.round?.name || "赛前"}`
  ;

  return `
    <article class="match-card ${type === "live" ? "match-card-primary" : ""}">
      <span class="state-badge ${state === "live" ? "state-live" : state === "post" ? "state-post" : "state-pre"}">${stateLabel}</span>
      <div class="match-row">
        <div class="teams">
          <div class="team-line"><span>${home.name || "主队"}</span><span class="vs-mark">×</span><span>${away.name || "客队"}</span></div>
          <div class="match-meta">${eventLine}</div>
        </div>
        ${scoreMarkup}
      </div>
      <div class="opinion-line">${emphasis}</div>
      <div class="match-actions">
        <a class="button-link primary" href="${href}">${buttonLabel}</a>
        <a class="button-link" href="${secondaryHref}">${secondaryLabel}</a>
      </div>
    </article>
  `;
}

function renderHome() {
  const matches = sortMatches(window.__data.matches);
  const liveMatches = matches.filter((row) => normalizeState(row) === "live");
  const upcomingMatches = matches.filter((row) => normalizeState(row) === "pre").slice(0, 4);

  document.getElementById("live-count").textContent = String(liveMatches.length);
  document.getElementById("upcoming-count").textContent = String(upcomingMatches.length);
  document.getElementById("topbar-note").textContent =
    liveMatches.length > 0 ? `现在有 ${liveMatches.length} 场比赛进行中。` : `现在没有比赛进行中，先看最近即将开始的场次。`;

  if (!liveMatches.length) {
    document.getElementById("live-empty").hidden = false;
  } else {
    document.getElementById("live-empty").hidden = true;
    document.getElementById("live-list").innerHTML = liveMatches.slice(0, 2).map((match) => renderMatchCard(match, "live")).join("");
  }

  document.getElementById("upcoming-list").innerHTML = upcomingMatches.map((match) => renderMatchCard(match, "pre")).join("");
}

function renderLivePage() {
  const matches = sortMatches(window.__data.matches);
  const params = new URLSearchParams(window.location.search);
  const selectedId = params.get("id");
  const fallback = matches.find((row) => normalizeState(row) === "live") || matches[0];
  const match = matches.find((row) => String(row.id) === String(selectedId)) || fallback;
  const { home, away } = getParticipants(match);
  const score = getScore(match) || "- : -";
  const events = window.__data.eventsByMatch[String(match.id)] || [];
  const stats = normalizeStatBucket(window.__data.statsByMatch[String(match.id)] || match.statistics || null, match);

  document.getElementById("live-hero").innerHTML = `
    <p class="eyebrow">Match</p>
    <h2>${home.name || "主队"} vs ${away.name || "客队"}</h2>
    <p class="supporting">${formatDate(match.starting_at)} · ${match.venue?.name || "场地待定"} · ${match.details || match.round?.name || "比赛中"}</p>
    <div class="match-row">
      <div class="teams">
        <div class="team-line"><span>${home.name || "主队"}</span><span class="vs-mark">×</span><span>${away.name || "客队"}</span></div>
        <div class="state-line">当前状态：${normalizeState(match) === "live" ? `进行中 ${formatMinute(match)}` : normalizeState(match) === "post" ? "完场" : "即将开始"}</div>
      </div>
      <div class="score-box">${score}</div>
    </div>
    <div class="hero-detail-grid">
      <div class="hero-detail-card"><span>比赛状态</span><strong>${normalizeState(match) === "live" ? `进行中 ${formatMinute(match)}` : normalizeState(match) === "post" ? "比赛已结束" : "赛前"}</strong></div>
      <div class="hero-detail-card"><span>比赛阶段</span><strong>${match.details || match.round?.name || "世界杯比赛"}</strong></div>
      <div class="hero-detail-card"><span>场地</span><strong>${match.venue?.name || "场地待定"}</strong></div>
      <div class="hero-detail-card"><span>开球时间</span><strong>${formatDate(match.starting_at)}</strong></div>
      ${
        getReferees(match)[0]?.name
          ? `<div class="hero-detail-card"><span>裁判</span><strong>${getReferees(match)[0].name}</strong></div>`
          : ""
      }
      ${
        getWeatherSummary(match)
          ? `<div class="hero-detail-card"><span>天气</span><strong>${getWeatherSummary(match)}</strong></div>`
          : ""
      }
    </div>
  `;

  const liveOpinionCards = [
    {
      title: "现场观点",
      body: buildLiveOpinion(match, stats, events),
    },
    {
      title: "当前节奏",
      body:
        normalizeState(match) === "live"
          ? `先看比分，再看 ${home.name || "主队"} 和 ${away.name || "客队"} 的射门质量、控球差和事件流。`
          : "比赛还没进入实时阶段，先关注首发、场地和开球前的最后状态。",
    },
  ];

  const summary = summarizeEvents(events);
  const homeWinLean = (() => {
    const homeElo = TEAM_ELO[resolveTeamKey(home.name)]?.elo;
    const awayElo = TEAM_ELO[resolveTeamKey(away.name)]?.elo;
    if (homeElo != null && awayElo != null) {
      const diff = Math.max(-180, Math.min(180, homeElo - awayElo));
      return Math.round(50 + diff / 9);
    }
    return 50;
  })();
  const drawLean = normalizeState(match) === "live" ? Math.max(14, 34 - Math.abs(homeWinLean - 50) / 2) : 26;
  const awayWinLean = Math.max(8, 100 - homeWinLean - drawLean);
  const goalsChance = normalizeState(match) === "live" ? Math.min(72, 22 + summary.goals * 14 + (stats?.shots_on_target?.home || 0) + (stats?.shots_on_target?.away || 0)) : 34;
  const cornersChance = normalizeState(match) === "live" ? Math.min(78, 28 + (stats?.shots?.home || 0) + (stats?.shots?.away || 0)) : 49;

  const probabilityCards = [
    { title: "主队优势", value: `${homeWinLean}%`, meter: homeWinLean, text: `${home.name || "主队"} 当前更可能把优势带到终场。` },
    { title: "平局倾向", value: `${drawLean}%`, meter: drawLean, text: "如果节奏继续胶着，平局会一直留在比赛里。" },
    { title: "客队空间", value: `${awayWinLean}%`, meter: awayWinLean, text: `${away.name || "客队"} 仍有明显反击或追平空间。` },
    { title: "15 分钟内进球", value: `${goalsChance}%`, meter: goalsChance, text: "用当前节奏和事件密度估算接下来出现进球的可能。" },
    { title: "15 分钟内角球", value: `${cornersChance}%`, meter: cornersChance, text: "用当前攻势频率估算接下来出现角球的可能。" },
  ];

  const probabilityMarkup = `
    <div class="panel-stack">
      ${probabilityCards
        .map(
          (item) => `
            <article class="probability-card">
              <p class="notice-tag">${item.title}</p>
              <h3>${item.title}</h3>
              <div class="probability-value">${item.value}</div>
              <div class="probability-meter"><span style="width:${item.meter}%"></span></div>
              <p>${item.text}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  const eventsMarkup = events.length
    ? events
        .map((event) => {
          const eventType = event.type?.name || event.type?.developer_name || "比赛事件";
          const eventTeam = event.participant?.name || "";
          const eventPerson =
            event.player_name ||
            event.player?.name ||
            event.related_player_name ||
            event.relatedplayer?.name ||
            "";
          const detailParts = [
            eventTeam,
            event.detail,
            event.result,
            event.info,
          ].filter(Boolean);
          return `
            <article class="event-card">
              <p class="notice-tag">${eventType} · ${event.minute ?? "-"}'</p>
              <h3>${eventPerson || eventTeam || "现场事件"}</h3>
              <p>${detailParts.length ? detailParts.join(" · ") : "现场信息已更新。"}</p>
            </article>
          `;
        })
        .join("")
    : `<div class="empty-state">这场当前还没有可展示的事件流。</div>`;

  const statRows = [];
  if (stats?.possession) statRows.push({ label: "控球", value: `${stats.possession.home}% / ${stats.possession.away}%` });
  if (stats?.shots) statRows.push({ label: "射门", value: `${stats.shots.home} / ${stats.shots.away}` });
  if (stats?.shots_on_target) statRows.push({ label: "射正", value: `${stats.shots_on_target.home} / ${stats.shots_on_target.away}` });
  if (stats?.xg) statRows.push({ label: "xG", value: `${stats.xg.home} / ${stats.xg.away}` });
  if (stats?.corners) statRows.push({ label: "角球", value: `${stats.corners.home} / ${stats.corners.away}` });
  if (stats?.yellow_cards) statRows.push({ label: "黄牌", value: `${stats.yellow_cards.home} / ${stats.yellow_cards.away}` });

  const statsMarkup = statRows.length
    ? statRows
        .map(
          (row) => `
            <article class="stat-card">
              <strong>${row.value}</strong>
              <span>${row.label}</span>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">这场现在还没有完整统计，开赛后会逐步出现。</div>`;

  const lineups = match.lineups || [];
  const homeLineup = lineups.filter((row) => row.participant?.meta?.location === "home").slice(0, 6);
  const awayLineup = lineups.filter((row) => row.participant?.meta?.location === "away").slice(0, 6);

  const availabilityRow = buildSquadAvailabilityCard(match);
  const infoCards = buildLiveInfoCards(match, stats);

  const lineupMarkup = `
    <div class="panel-stack">
      <article class="detail-card">
        <p class="notice-tag">${availabilityRow.title}</p>
        <h3>${availabilityRow.title}</h3>
        <p>${availabilityRow.body}</p>
      </article>
    </div>
    <div class="lineup-grid">
      <article class="lineup-section">
        <p class="notice-tag">${home.name || "主队"} · 阵容</p>
        <h3>${home.name || "主队"}</h3>
        ${getFormation(match, "home") ? `<p class="detail-line">阵型 ${getFormation(match, "home")}</p>` : ""}
        <div class="lineup-list">
          ${
            homeLineup.length
              ? homeLineup
                  .map(
                    (player) => `
                      <div class="lineup-item">
                        <strong>${player.player_name || player.player?.name || "球员待定"}</strong>
                        <span>${player.type?.name || "名单"}</span>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="empty-state">当前还没有主队首发名单，开球前更新。</div>`
          }
        </div>
      </article>
      <article class="lineup-section">
        <p class="notice-tag">${away.name || "客队"} · 阵容</p>
        <h3>${away.name || "客队"}</h3>
        ${getFormation(match, "away") ? `<p class="detail-line">阵型 ${getFormation(match, "away")}</p>` : ""}
        <div class="lineup-list">
          ${
            awayLineup.length
              ? awayLineup
                  .map(
                    (player) => `
                      <div class="lineup-item">
                        <strong>${player.player_name || player.player?.name || "球员待定"}</strong>
                        <span>${player.type?.name || "名单"}</span>
                      </div>
                    `
                  )
                  .join("")
              : `<div class="empty-state">当前还没有客队首发名单，开球前更新。</div>`
          }
        </div>
      </article>
    </div>
  `;

  const infoMarkup = `
    <div class="panel-stack">
      ${infoCards
        .map(
          (row) => `
            <article class="detail-card">
              <p class="notice-tag">${row.title}</p>
              <h3>${row.title}</h3>
              <p>${row.body}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  const panelMap = {
    opinion: `
      <div class="panel-stack">
        ${liveOpinionCards
          .map(
            (item) => `
              <article class="detail-card">
                <p class="notice-tag">${item.title}</p>
                <h3>${item.title}</h3>
                <p>${item.body}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `,
    probability: probabilityMarkup,
    events: `<div class="panel-stack">${eventsMarkup}</div>`,
    stats: `<div class="mini-grid">${statsMarkup}</div>`,
    lineup: lineupMarkup,
    info: infoMarkup,
  };

  const tabs = Array.from(document.querySelectorAll("[data-live-tab]"));
  const panel = document.getElementById("live-panel");
  const activeTab = tabs.find((tab) => tab.classList.contains("is-active"))?.dataset.liveTab || "opinion";

  function renderLivePanel(tabName) {
    panel.innerHTML = panelMap[tabName] || panelMap.opinion;
    tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.liveTab === tabName);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => renderLivePanel(tab.dataset.liveTab));
  });

  renderLivePanel(activeTab);
}

function renderOpinionPage() {
  const matches = sortMatches(window.__data.matches);
  const params = new URLSearchParams(window.location.search);
  const selectedId = params.get("id");
  const fallback = matches.find((row) => normalizeState(row) === "pre") || matches[0];
  const match = matches.find((row) => String(row.id) === String(selectedId)) || fallback;
  const { home, away } = getParticipants(match);
  const headerContext = buildHeaderContext(match);
  const historyRows = buildHistoryNotes(match);
  const eloRow = describeEloGap(match);
  const eloDeck = buildEloDeck(match);
  const historySummary = buildHistorySummary(match);
  const lineupCards = buildLineupInfoCards(match);
  const groupCards = buildGroupInsightCards(match, window.__data.standings);
  const overviewCards = buildTournamentOverview(match, matches, window.__data.standings);
  const groupOverviewCards = buildGroupOverviewCards(window.__data.standings);
  const bracketStages = buildBracketStages(matches);
  const fixtureChoices = buildFixtureChooser(matches);
  const heroEl = document.getElementById("opinion-hero");
  const overviewEl = document.getElementById("opinion-overview");
  const groupsRailEl = document.querySelector("#opinion-groups .card-rail");
  const bracketEl = document.getElementById("opinion-bracket");
  const fixturesRailEl = document.querySelector("#opinion-fixtures .card-rail");
  const diagnostics = [
    { label: "比赛", value: `${matches.length} 场` },
    { label: "分组行", value: `${window.__data.standings.length} 条` },
    { label: "焦点比赛", value: `${formatPlaceholderName(home.name || "主队")} × ${formatPlaceholderName(away.name || "客队")}` },
    { label: "数据源", value: window.__data.sourceLabel || "sample" },
  ];

  heroEl.innerHTML = `
    <p class="eyebrow">本届前瞻</p>
    <h2>先看这届世界杯怎么展开</h2>
    <p class="supporting">这页先看整体格局、小组分布和晋级树，再点一场比赛进入具体观点。</p>
    <div class="compare-grid">
      ${diagnostics
        .map(
          (item) => `
            <div class="compare-card">
              <span>${item.label}</span>
              <strong>${item.value}</strong>
            </div>
          `
        )
        .join("")}
    </div>
    <div class="detail-grid">
      ${headerContext
        .map(
          (row) => `
            <div class="detail-pair">
              <span>${row.label}</span>
              <strong>${row.value}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;

  overviewEl.innerHTML = overviewCards.length
    ? overviewCards
        .map(
          (item) => `
            <article class="detail-card">
              <p class="notice-tag">${item.title}</p>
              <h3>${item.title}</h3>
              ${item.value ? `<div class="stat-pill">${item.value}</div>` : ""}
              <p>${item.body}</p>
            </article>
          `
        )
        .join("")
    : `<article class="detail-card"><p class="notice-tag">本届格局</p><h3>暂时没有可展示的数据</h3><p>这里至少应该显示比赛数量、揭幕战和当前主看点。</p></article>`;

  groupsRailEl.innerHTML = groupOverviewCards.length
    ? groupOverviewCards
        .map(
          (item) => `
            <article class="context-card rail-card">
              <p class="notice-tag">${item.title}</p>
              <h3>${item.title}</h3>
              ${item.value ? `<div class="stat-pill">${item.value}</div>` : ""}
              <div class="group-mini-list">
                ${item.entries
                  .map(
                    (entry) => `
                      <div class="group-mini-row">
                        <span class="group-mini-pos">${entry.position}</span>
                        <strong>${entry.team}</strong>
                        <small>${entry.placeholder ? "附加赛待定" : entry.elo ? `Elo ${entry.elo}` : "历史强度待补"}</small>
                      </div>
                    `
                  )
                  .join("")}
              </div>
              <p>${item.body}</p>
            </article>
          `
        )
        .join("")
    : `<article class="context-card rail-card"><p class="notice-tag">分组</p><h3>小组数据未加载</h3><p>这里至少应该出现每组四队和基本强度信息。</p></article>`;

  bracketEl.innerHTML = bracketStages.length
    ? bracketStages
        .map((stage) => {
      const stageNote =
        stage.stage === "淘汰赛"
          ? "先看哪些小组会把最强球队送进同一半区。"
          : stage.stage === "八强"
            ? "这一轮开始，强队相遇的概率会明显提高。"
            : stage.stage === "半决赛"
              ? "到了这里，赛程路径和体能消耗会同样重要。"
              : "决赛更适合看当届状态，而不是只看名气。";
      const cards = stage.matches
        .slice(0, 4)
        .map((item) => {
          const pair = getParticipants(item);
          const probs = computeEloWinProbability(pair.home.name, pair.away.name);
          return `
            <article class="bracket-match">
              <p class="notice-tag">${stage.stage}</p>
              <h3>${formatPlaceholderName(pair.home.name || "主队")} × ${formatPlaceholderName(pair.away.name || "客队")}</h3>
              <p>${formatDate(item.starting_at)}${item.venue?.name ? ` · ${item.venue.name}` : ""}</p>
              <p class="bracket-probability">${
                probs
                  ? `${formatPlaceholderName(pair.home.name)} ${probs.home}% · ${formatPlaceholderName(pair.away.name)} ${probs.away}%`
                  : "概率会在球队完全落位后更稳定"
              }</p>
            </article>
          `;
        })
        .join("");

      return `
        <section class="bracket-stage">
          <div class="section-head bracket-head">
            <div>
              <p class="eyebrow">${stage.stage}</p>
              <h3>${stage.stage}</h3>
              <p>${stageNote}</p>
            </div>
          </div>
          <div class="panel-stack">${cards}</div>
        </section>
      `;
        })
        .join("")
    : `<section class="bracket-stage"><div class="section-head bracket-head"><div><p class="eyebrow">淘汰赛</p><h3>晋级树数据未加载</h3><p>这里至少应该有淘汰赛轮次和焦点对阵。</p></div></div></section>`;

  fixturesRailEl.innerHTML = fixtureChoices.length
    ? fixtureChoices
        .map((item) => {
      const pair = getParticipants(item);
      const probs = computeEloWinProbability(pair.home.name, pair.away.name);
      return `
        <button class="fixture-choice rail-card${String(item.id) === String(match.id) ? " is-selected" : ""}" type="button" data-opinion-fixture="${item.id}">
          <span class="notice-tag">${item.group?.name ? `${item.group.name} 组` : item.details || item.round?.name || "赛前"}</span>
          <strong>${formatPlaceholderName(pair.home.name || "主队")} × ${formatPlaceholderName(pair.away.name || "客队")}</strong>
          <small>${formatDate(item.starting_at)}</small>
          <small>${
            probs
              ? `${formatPlaceholderName(pair.home.name)} ${probs.home}% · ${formatPlaceholderName(pair.away.name)} ${probs.away}%`
              : "先看履历，再等完整落位"
          }</small>
          <small class="fixture-note">${buildFixtureChooserNote(item)}</small>
        </button>
      `;
        })
        .join("")
    : `<article class="context-card rail-card"><p class="notice-tag">焦点比赛</p><h3>还没有可点击的比赛</h3><p>这里至少应该有几场赛前值得点开的比赛。</p></article>`;

  const opinionItems = buildCoreOpinionCards(match, window.__data.standings);

  const coreMarkup = `
    <div class="panel-stack">
      ${opinionItems
        .map(
          (item) => `
            <article class="detail-card">
              <p class="notice-tag">${item.title}</p>
              <h3>${item.title}</h3>
              <p>${item.body}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  const eloMarkup = `
    <div class="panel-stack">
      <article class="detail-card">
        <p class="notice-tag">${eloRow.title}</p>
        <h3>${eloRow.title}</h3>
        <p>${eloRow.body}</p>
      </article>
      ${
        eloDeck
          ? `
            <article class="detail-card">
              <div class="compare-head">
                <div>
                  <p class="notice-tag">强度判断</p>
                  <h3>${eloDeck.tone}</h3>
                </div>
                <span class="compare-badge">${eloDeck.gapLabel}</span>
              </div>
              <p>${eloDeck.toneBody}</p>
              <div class="compare-grid">
                ${eloDeck.cards
                  .map(
                    (item) => `
                      <div class="compare-card">
                        <span>${item.team}</span>
                        <strong>${item.elo}</strong>
                        <small>${item.note}</small>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </article>
          `
          : ""
      }
    </div>
  `;

  const historyMarkup = `
    <div class="panel-stack">
      ${
        historySummary
          ? `
            <article class="detail-card">
              <p class="notice-tag">${historySummary.title}</p>
              <h3>${historySummary.title}</h3>
              <p>${historySummary.body}</p>
              <div class="compare-grid">
                ${historySummary.rows
                  .map(
                    (item) => `
                      <div class="compare-card">
                        <span>${item.team}</span>
                        <strong>${item.matches}</strong>
                        <small>${item.record}</small>
                        <small>${item.subline}</small>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </article>
          `
          : ""
      }
      ${historyRows
        .map(
          (item) => `
            <article class="detail-card">
              <p class="notice-tag">${item.title}</p>
              <h3>${item.title}</h3>
              <p>${item.body}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  const lineupMarkup = `
    <div class="panel-stack">
      ${lineupCards
        .map(
          (item) => `
            <article class="detail-card">
              <p class="notice-tag">${item.title}</p>
              <h3>${item.title}</h3>
              <p>${item.body}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  const groupMarkup = `
    <div class="panel-stack">
      ${groupCards
        .map(
          (item) => `
            <article class="detail-card">
              <p class="notice-tag">${item.title}</p>
              <h3>${item.title}</h3>
              <p>${item.body}</p>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  const panelMap = {
    core: coreMarkup,
    elo: eloMarkup,
    history: historyMarkup,
    lineup: lineupMarkup,
    group: groupMarkup,
  };

  const tabs = Array.from(document.querySelectorAll("[data-opinion-tab]"));
  const panel = document.getElementById("opinion-panel");
  const activeTab = tabs.find((tab) => tab.classList.contains("is-active"))?.dataset.opinionTab || "elo";

  function renderOpinionPanel(tabName) {
    panel.innerHTML = panelMap[tabName] || panelMap.elo;
    tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.opinionTab === tabName);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => renderOpinionPanel(tab.dataset.opinionTab));
  });

  document.querySelectorAll("[data-opinion-fixture]").forEach((button) => {
    button.addEventListener("click", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("id", button.dataset.opinionFixture);
      window.location.href = url.toString();
    });
  });

  renderOpinionPanel(activeTab);
}

async function boot() {
  try {
    window.__data = await loadData();
    const page = document.body.dataset.page;
    if (page === "home") renderHome();
    if (page === "live") renderLivePage();
    if (page === "opinion") renderOpinionPage();
  } catch (error) {
    document.querySelector(".app-shell").insertAdjacentHTML(
      "beforeend",
      `<section class="notice-card"><p class="notice-tag">加载失败</p><h3>当前数据没有成功加载</h3><p>${error.message}</p></section>`
    );
  }
}

boot();

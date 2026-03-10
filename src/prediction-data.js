export const predictionTeams = [
  { team: "Argentina", elo: 2144, updated: "2022-12-18", appearances: 88 },
  { team: "Brazil", elo: 2134, updated: "2022-12-09", appearances: 114 },
  { team: "France", elo: 2082, updated: "2022-12-18", appearances: 73 },
  { team: "Netherlands", elo: 2073, updated: "2022-12-09", appearances: 55 },
  { team: "Portugal", elo: 1998, updated: "2022-12-10", appearances: 35 },
  { team: "Spain", elo: 1997, updated: "2022-12-06", appearances: 67 },
  { team: "England", elo: 1966, updated: "2022-12-10", appearances: 74 },
  { team: "Germany", elo: 1955, updated: "2022-12-01", appearances: 50 },
  { team: "Croatia", elo: 1950, updated: "2022-12-17", appearances: 30 },
  { team: "Belgium", elo: 1947, updated: "2022-12-01", appearances: 51 },
  { team: "Uruguay", elo: 1904, updated: "2022-12-02", appearances: 59 },
  { team: "Denmark", elo: 1882, updated: "2022-11-30", appearances: 23 },
  { team: "Switzerland", elo: 1878, updated: "2022-12-06", appearances: 41 },
  { team: "Morocco", elo: 1865, updated: "2022-12-17", appearances: 23 },
  { team: "Japan", elo: 1852, updated: "2022-12-05", appearances: 25 },
  { team: "United States", elo: 1817, updated: "2022-12-03", appearances: 37 },
];

export const titleOdds = [
  { team: "Argentina", probability: 24.42 },
  { team: "Brazil", probability: 23.04 },
  { team: "France", probability: 15.03 },
  { team: "Netherlands", probability: 13.97 },
  { team: "Portugal", probability: 7.14 },
  { team: "Spain", probability: 6.93 },
  { team: "England", probability: 5.02 },
  { team: "Germany", probability: 4.44 },
];

export const modelAssumptions = [
  "使用这份 Excel 中各队最近一次世界杯比赛后的 ELO 作为基础强度。",
  "默认中立场，不额外加入主场优势。",
  "三项结果概率包含平局；淘汰赛晋级概率按平局后双方 50% 点球胜率处理。",
  "争冠概率来自 8 支高 ELO 球队的简化淘汰赛模拟，用于展示模型思路，不代表真实官方赔率。",
];

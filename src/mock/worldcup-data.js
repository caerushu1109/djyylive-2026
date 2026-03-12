export const quickStats = [
  { value: "48", label: "参赛球队" },
  { value: "104", label: "场次" },
  { value: "16", label: "比赛城市" },
  { value: "39", label: "天赛期" },
  { value: "06.11", label: "开幕日", compact: true },
];

export const homeFixtures = [
  {
    id: "ger-esp",
    stage: "D组 第2轮",
    group: "D 组",
    status: "LIVE",
    minute: "73'",
    kickoff: "03:00",
    home: { flag: "🇩🇪", name: "德国", elo: 2021 },
    away: { flag: "🇪🇸", name: "西班牙", elo: 1998 },
    homeScore: 2,
    awayScore: 1,
    venue: "洛杉矶",
    isLive: true,
  },
  {
    id: "eng-fra",
    stage: "C组 第2轮",
    group: "C 组",
    status: "FT",
    minute: "",
    kickoff: "已结束",
    home: { flag: "🏴", name: "英格兰", elo: 2041 },
    away: { flag: "🇫🇷", name: "法国", elo: 2034 },
    homeScore: 1,
    awayScore: 1,
    venue: "纽约",
  },
  {
    id: "bra-arg",
    stage: "B组 第2轮",
    group: "B 组",
    status: "NS",
    minute: "06:00",
    kickoff: "06:00",
    home: { flag: "🇧🇷", name: "巴西", elo: 2192 },
    away: { flag: "🇦🇷", name: "阿根廷", elo: 2184 },
    homeScore: null,
    awayScore: null,
    venue: "达拉斯",
  },
  {
    id: "jpn-usa",
    stage: "A组 第2轮",
    group: "A 组",
    status: "NS",
    minute: "09:00",
    kickoff: "09:00",
    home: { flag: "🇯🇵", name: "日本", elo: 1895 },
    away: { flag: "🇺🇸", name: "美国", elo: 1862 },
    homeScore: null,
    awayScore: null,
    venue: "西雅图",
  },
];

export const fixturesByDate = [
  { key: "today", day: "今", label: "今天", active: true },
  { key: "22", day: "22", label: "周六" },
  { key: "23", day: "23", label: "周日" },
  { key: "24", day: "24", label: "周一" },
  { key: "25", day: "25", label: "周二" },
  { key: "26", day: "26", label: "周三" },
];

export const groupedFixtures = [
  { label: "D 组", matches: [homeFixtures[0]] },
  { label: "C 组", matches: [homeFixtures[1]] },
  { label: "B 组", matches: [homeFixtures[2]] },
  { label: "A 组", matches: [homeFixtures[3]] },
];

export const eloRankings = [
  { rank: 1, flag: "🇧🇷", name: "巴西", elo: 2192, width: 96 },
  { rank: 2, flag: "🇦🇷", name: "阿根廷", elo: 2184, width: 92 },
  { rank: 3, flag: "🏴", name: "英格兰", elo: 2041, width: 78 },
  { rank: 4, flag: "🇫🇷", name: "法国", elo: 2034, width: 76 },
  { rank: 5, flag: "🇩🇪", name: "德国", elo: 2021, width: 73 },
];

export const groupLegend = [
  { label: "出线区", tone: "q1" },
  { label: "附加赛区", tone: "q2" },
  { label: "淘汰区", tone: "out" },
];

export const standings = [
  {
    group: "A 组",
    rows: [
      { pos: 1, tone: "q1", flag: "🇺🇸", name: "美国", p: 3, w: 2, d: 0, l: 1, pts: 6 },
      { pos: 2, tone: "q2", flag: "🇲🇽", name: "墨西哥", p: 3, w: 1, d: 1, l: 1, pts: 4 },
      { pos: 3, tone: "out", flag: "🇯🇲", name: "牙买加", p: 3, w: 0, d: 1, l: 2, pts: 1 },
      { pos: 4, tone: "out danger", flag: "🇵🇦", name: "巴拿马", p: 3, w: 0, d: 0, l: 3, pts: 0 },
    ],
  },
  {
    group: "B 组",
    rows: [
      { pos: 1, tone: "q1", flag: "🇧🇷", name: "巴西", p: 2, w: 2, d: 0, l: 0, pts: 6 },
      { pos: 2, tone: "q2", flag: "🇵🇹", name: "葡萄牙", p: 2, w: 1, d: 0, l: 1, pts: 3 },
      { pos: 3, tone: "out", flag: "🇺🇾", name: "乌拉圭", p: 2, w: 1, d: 0, l: 1, pts: 3 },
      { pos: 4, tone: "out danger", flag: "🇷🇸", name: "塞尔维亚", p: 2, w: 0, d: 0, l: 2, pts: 0 },
    ],
  },
  {
    group: "C 组",
    rows: [
      { pos: 1, tone: "q1", flag: "🇫🇷", name: "法国", p: 2, w: 1, d: 1, l: 0, pts: 4 },
      { pos: 2, tone: "q2", flag: "🏴", name: "英格兰", p: 2, w: 1, d: 1, l: 0, pts: 4 },
      { pos: 3, tone: "out", flag: "🇳🇱", name: "荷兰", p: 2, w: 0, d: 1, l: 1, pts: 1 },
      { pos: 4, tone: "out danger", flag: "🇸🇳", name: "塞内加尔", p: 2, w: 0, d: 1, l: 1, pts: 1 },
    ],
  },
  {
    group: "D 组",
    rows: [
      { pos: 1, tone: "q1", flag: "🇩🇪", name: "德国", p: 2, w: 1, d: 1, l: 0, pts: 4 },
      { pos: 2, tone: "q2", flag: "🇯🇵", name: "日本", p: 2, w: 1, d: 0, l: 1, pts: 3 },
      { pos: 3, tone: "out", flag: "🇪🇸", name: "西班牙", p: 2, w: 1, d: 0, l: 1, pts: 3 },
      { pos: 4, tone: "out danger", flag: "🇨🇷", name: "哥斯达黎加", p: 2, w: 0, d: 0, l: 2, pts: 0 },
    ],
  },
];

export const predictions = [
  { rank: 1, flag: "🇧🇷", name: "巴西", pct: "22.3%", width: 100 },
  { rank: 2, flag: "🇦🇷", name: "阿根廷", pct: "19.1%", width: 86 },
  { rank: 3, flag: "🏴", name: "英格兰", pct: "12.4%", width: 56 },
  { rank: 4, flag: "🇫🇷", name: "法国", pct: "11.2%", width: 50 },
  { rank: 5, flag: "🇩🇪", name: "德国", pct: "9.6%", width: 43 },
  { rank: 6, flag: "🇵🇹", name: "葡萄牙", pct: "7.3%", width: 33 },
  { rank: 7, flag: "🇳🇱", name: "荷兰", pct: "5.1%", width: 23 },
  { rank: 8, flag: "🇯🇵", name: "日本", pct: "3.2%", width: 14 },
  { rank: 9, flag: "🇺🇸", name: "美国", pct: "2.8%", width: 13 },
  { rank: 10, flag: "🇺🇾", name: "乌拉圭", pct: "2.1%", width: 9 },
];

export const historyTournaments = [
  { year: "2022", host: "🇶🇦 卡塔尔", champion: "🏆 🇦🇷 阿根廷" },
  { year: "2018", host: "🇷🇺 俄罗斯", champion: "🏆 🇫🇷 法国" },
  { year: "2014", host: "🇧🇷 巴西", champion: "🏆 🇩🇪 德国" },
  { year: "2010", host: "🇿🇦 南非", champion: "🏆 🇪🇸 西班牙" },
  { year: "2006", host: "🇩🇪 德国", champion: "🏆 🇮🇹 意大利" },
  { year: "2002", host: "🇰🇷🇯🇵 韩日", champion: "🏆 🇧🇷 巴西" },
  { year: "1998", host: "🇫🇷 法国", champion: "🏆 🇫🇷 法国" },
  { year: "1994", host: "🇺🇸 美国", champion: "🏆 🇧🇷 巴西" },
  { year: "1990", host: "🇮🇹 意大利", champion: "🏆 🇩🇪 西德" },
  { year: "1986", host: "🇲🇽 墨西哥", champion: "🏆 🇦🇷 阿根廷" },
  { year: "1930", host: "🇺🇾 乌拉圭", champion: "🏆 🇺🇾 乌拉圭" },
];

export const eloMethodNote =
  "基于 1872 年以来的 Elo 历史评分，结合 2026 赛制（48队、小组赛到淘汰赛）通过蒙特卡洛模拟 10,000 次计算得出。";

export const detailTabs = [
  { id: "live", label: "实时" },
  { id: "predict", label: "预测 & 赔率" },
  { id: "h2h", label: "历史对阵" },
  { id: "stats", label: "数据统计" },
];

export const simulatorScenarios = [
  {
    group: "A 组",
    note: "输入最后一轮假设比分，实时查看出线顺位变化。",
    teams: [
      { name: "美国", flag: "🇺🇸", p: 2, w: 1, d: 1, l: 0, gf: 3, ga: 1, pts: 4 },
      { name: "墨西哥", flag: "🇲🇽", p: 2, w: 1, d: 1, l: 0, gf: 2, ga: 1, pts: 4 },
      { name: "牙买加", flag: "🇯🇲", p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 2, pts: 1 },
      { name: "巴拿马", flag: "🇵🇦", p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 3, pts: 1 },
    ],
    matches: [
      {
        id: "usa-pan",
        home: { name: "美国", flag: "🇺🇸" },
        away: { name: "巴拿马", flag: "🇵🇦" },
        homeScore: 1,
        awayScore: 0,
      },
      {
        id: "mex-jam",
        home: { name: "墨西哥", flag: "🇲🇽" },
        away: { name: "牙买加", flag: "🇯🇲" },
        homeScore: 1,
        awayScore: 1,
      },
    ],
  },
  {
    group: "B 组",
    note: "适合测试强队同分和净胜球变化。",
    teams: [
      { name: "巴西", flag: "🇧🇷", p: 2, w: 1, d: 1, l: 0, gf: 4, ga: 2, pts: 4 },
      { name: "葡萄牙", flag: "🇵🇹", p: 2, w: 1, d: 0, l: 1, gf: 3, ga: 3, pts: 3 },
      { name: "乌拉圭", flag: "🇺🇾", p: 2, w: 1, d: 0, l: 1, gf: 2, ga: 2, pts: 3 },
      { name: "塞尔维亚", flag: "🇷🇸", p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 3, pts: 1 },
    ],
    matches: [
      {
        id: "bra-ser",
        home: { name: "巴西", flag: "🇧🇷" },
        away: { name: "塞尔维亚", flag: "🇷🇸" },
        homeScore: 2,
        awayScore: 1,
      },
      {
        id: "por-uru",
        home: { name: "葡萄牙", flag: "🇵🇹" },
        away: { name: "乌拉圭", flag: "🇺🇾" },
        homeScore: 1,
        awayScore: 1,
      },
    ],
  },
  {
    group: "D 组",
    note: "这个组适合观察末轮爆冷后的排名翻转。",
    teams: [
      { name: "德国", flag: "🇩🇪", p: 2, w: 1, d: 1, l: 0, gf: 3, ga: 2, pts: 4 },
      { name: "日本", flag: "🇯🇵", p: 2, w: 1, d: 0, l: 1, gf: 2, ga: 2, pts: 3 },
      { name: "西班牙", flag: "🇪🇸", p: 2, w: 1, d: 0, l: 1, gf: 2, ga: 2, pts: 3 },
      { name: "哥斯达黎加", flag: "🇨🇷", p: 2, w: 0, d: 1, l: 1, gf: 1, ga: 2, pts: 1 },
    ],
    matches: [
      {
        id: "ger-crc",
        home: { name: "德国", flag: "🇩🇪" },
        away: { name: "哥斯达黎加", flag: "🇨🇷" },
        homeScore: 2,
        awayScore: 0,
      },
      {
        id: "jpn-esp",
        home: { name: "日本", flag: "🇯🇵" },
        away: { name: "西班牙", flag: "🇪🇸" },
        homeScore: 1,
        awayScore: 1,
      },
    ],
  },
];

export const simulatorFallbackNote = "输入最后一轮假设比分，实时查看出线顺位变化。";

export const liveStats = [
  { label: "控球率", left: "58%", right: "42%", leftWidth: 58, rightWidth: 42 },
  { label: "射门", left: "12", right: "8", leftWidth: 60, rightWidth: 40 },
  { label: "xG", left: "1.87", right: "1.12", leftWidth: 63, rightWidth: 37 },
  { label: "传球成功率", left: "84%", right: "88%", leftWidth: 49, rightWidth: 51 },
];

export const eventTimeline = [
  { minute: "14'", icon: "⚽", title: "穆西亚拉", subtitle: "🇩🇪 德国 1-0" },
  { minute: "31'", icon: "🟨", title: "罗德里", subtitle: "🇪🇸 西班牙" },
  { minute: "55'", icon: "⚽", title: "亚马尔", subtitle: "🇪🇸 西班牙 1-1" },
  { minute: "68'", icon: "⚽", title: "维尔茨", subtitle: "🇩🇪 德国 2-1" },
  { minute: "71'", icon: "🔄", title: "换人", subtitle: "🇪🇸 莫拉塔 → 奥利亚萨瓦尔" },
];

export const h2hSummary = [
  { value: 5, label: "🇩🇪 德国胜", tone: "blue" },
  { value: 3, label: "平局", tone: "gray" },
  { value: 4, label: "🇪🇸 西班牙胜", tone: "red" },
];

export const h2hMatches = [
  { year: "2024", event: "欧洲杯 四分之一决赛", score: "1-2", tone: "red" },
  { year: "2022", event: "欧国联", score: "1-1", tone: "dim" },
  { year: "2010", event: "世界杯 半决赛", score: "0-1", tone: "red" },
];

export const statGrid = [
  { value: "12", label: "🇩🇪射门" },
  { value: "546", label: "🇩🇪传球" },
  { value: "1.87", label: "🇩🇪 xG" },
  { value: "8", label: "🇪🇸射门" },
  { value: "487", label: "🇪🇸传球" },
  { value: "1.12", label: "🇪🇸 xG" },
];

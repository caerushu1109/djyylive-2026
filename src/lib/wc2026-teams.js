/**
 * 2026 FIFA World Cup — 48 团队名单配置
 *
 * status:
 *   "confirmed"  — 已正式确认参赛
 *   "uncertain"  — 资格存疑（政治/地缘原因，官方未最终确定）
 *   "tbd"        — 名额待定（附加赛/预选赛尚未结束）
 *
 * nameZh 必须与 predictions.json 中的 name 字段完全匹配
 */

export const WC2026_TEAMS = [
  // ── 东道主 (3) ──────────────────────────────────────
  { nameZh: "美国",       status: "confirmed", conf: "CONCACAF", note: "" },
  { nameZh: "加拿大",     status: "confirmed", conf: "CONCACAF", note: "" },
  { nameZh: "墨西哥",     status: "confirmed", conf: "CONCACAF", note: "" },

  // ── 欧洲 UEFA (16) ───────────────────────────────────
  { nameZh: "西班牙",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "法国",       status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "英格兰",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "德国",       status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "葡萄牙",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "荷兰",       status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "比利时",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "意大利",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "瑞士",       status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "奥地利",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "丹麦",       status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "土耳其",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "克罗地亚",   status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "苏格兰",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "乌克兰",     status: "confirmed", conf: "UEFA",     note: "" },
  { nameZh: "塞尔维亚",   status: "confirmed", conf: "UEFA",     note: "" },

  // ── 南美 CONMEBOL (6) ────────────────────────────────
  { nameZh: "阿根廷",     status: "confirmed", conf: "CONMEBOL", note: "" },
  { nameZh: "巴西",       status: "confirmed", conf: "CONMEBOL", note: "" },
  { nameZh: "乌拉圭",     status: "confirmed", conf: "CONMEBOL", note: "" },
  { nameZh: "哥伦比亚",   status: "confirmed", conf: "CONMEBOL", note: "" },
  { nameZh: "厄瓜多尔",   status: "confirmed", conf: "CONMEBOL", note: "" },
  { nameZh: "委内瑞拉",   status: "confirmed", conf: "CONMEBOL", note: "" },

  // ── 非洲 CAF (9) ─────────────────────────────────────
  { nameZh: "摩洛哥",     status: "confirmed", conf: "CAF",      note: "" },
  { nameZh: "塞内加尔",   status: "confirmed", conf: "CAF",      note: "" },
  { nameZh: "尼日利亚",   status: "confirmed", conf: "CAF",      note: "" },
  { nameZh: "埃及",       status: "confirmed", conf: "CAF",      note: "" },
  { nameZh: "科特迪瓦",   status: "confirmed", conf: "CAF",      note: "" },
  { nameZh: "刚果（金）", status: "confirmed", conf: "CAF",      note: "" },
  { nameZh: "南非",       status: "confirmed", conf: "CAF",      note: "" },
  { nameZh: "喀麦隆",     status: "confirmed", conf: "CAF",      note: "" },
  { nameZh: "阿尔及利亚", status: "confirmed", conf: "CAF",      note: "" },

  // ── 亚洲 AFC (8) ──────────────────────────────────────
  { nameZh: "日本",       status: "confirmed", conf: "AFC",      note: "" },
  { nameZh: "韩国",       status: "confirmed", conf: "AFC",      note: "" },
  { nameZh: "澳大利亚",   status: "confirmed", conf: "AFC",      note: "" },
  { nameZh: "沙特阿拉伯", status: "confirmed", conf: "AFC",      note: "" },
  { nameZh: "约旦",       status: "confirmed", conf: "AFC",      note: "" },
  { nameZh: "伊拉克",     status: "confirmed", conf: "AFC",      note: "" },
  { nameZh: "乌兹别克斯坦", status: "confirmed", conf: "AFC",    note: "" },
  // 伊朗：战争局势导致参赛资格存疑
  { nameZh: "伊朗",       status: "uncertain", conf: "AFC",      note: "因地区冲突资格存疑" },

  // ── 北中美 CONCACAF (3，东道主已计) ──────────────────
  { nameZh: "巴拿马",     status: "confirmed", conf: "CONCACAF", note: "" },
  { nameZh: "洪都拉斯",   status: "confirmed", conf: "CONCACAF", note: "" },
  { nameZh: "牙买加",     status: "confirmed", conf: "CONCACAF", note: "" },

  // ── 大洋洲 OFC (1) ───────────────────────────────────
  { nameZh: "新西兰",     status: "confirmed", conf: "OFC",      note: "" },

  // ── 跨洲附加赛 (2席尚未确定) ─────────────────────────
  { nameZh: "",           status: "tbd",       conf: "附加赛",   note: "跨洲附加赛席位1" },
  { nameZh: "",           status: "tbd",       conf: "附加赛",   note: "跨洲附加赛席位2" },
];

/** 返回一个 Set，包含所有已确认/存疑球队的中文名 */
export const WC2026_NAMES = new Set(
  WC2026_TEAMS.filter(t => t.nameZh).map(t => t.nameZh)
);

/** 按中文名查找配置 */
export const WC2026_MAP = Object.fromEntries(
  WC2026_TEAMS.filter(t => t.nameZh).map(t => [t.nameZh, t])
);

/** TBD 占位槽 */
export const WC2026_TBD = WC2026_TEAMS.filter(t => t.status === "tbd");

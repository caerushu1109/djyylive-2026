/**
 * Canonical Name Registry — single source of truth for all team name matching
 *
 * Each entry maps: canonical English name -> all known aliases from every data source.
 * Sources cross-referenced:
 *   - team-meta.js      (Chinese shortNames, flags)
 *   - predictions.json   (zh names, ISO-2 codes)
 *   - elo.json           (eloratings.net originalName, codes)
 *   - polymarket-names.js (Polymarket English variants)
 *   - worldcup-teams.json (SportMonks names)
 *   - wc2026-participants.json (SportMonks nameEn/nameZh)
 *   - poisson.js         (HOST_TEAMS mapping)
 *
 * Used by: MatchCard, team detail, Polymarket parser, ELO lookup, strength matching
 */

// Registry format: canonical -> { zh, iso, flag, aliases: [...all known variants] }
export const TEAM_REGISTRY = {
  "Spain": {
    zh: "西班牙",
    iso: "ES",
    flag: "🇪🇸",
    aliases: ["ESP", "ES"]
  },
  "Argentina": {
    zh: "阿根廷",
    iso: "AR",
    flag: "🇦🇷",
    aliases: ["ARG", "AR"]
  },
  "France": {
    zh: "法国",
    iso: "FR",
    flag: "🇫🇷",
    aliases: ["FRA", "FR"]
  },
  "England": {
    zh: "英格兰",
    iso: "EN",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    aliases: ["ENG", "EN"]
  },
  "Colombia": {
    zh: "哥伦比亚",
    iso: "CO",
    flag: "🇨🇴",
    aliases: ["COL", "CO"]
  },
  "Brazil": {
    zh: "巴西",
    iso: "BR",
    flag: "🇧🇷",
    aliases: ["BRA", "BR"]
  },
  "Portugal": {
    zh: "葡萄牙",
    iso: "PT",
    flag: "🇵🇹",
    aliases: ["POR", "PT"]
  },
  "Netherlands": {
    zh: "荷兰",
    iso: "NL",
    flag: "🇳🇱",
    aliases: ["NED", "NL", "Holland", "The Netherlands"]
  },
  "Ecuador": {
    zh: "厄瓜多尔",
    iso: "EC",
    flag: "🇪🇨",
    aliases: ["ECU", "EC"]
  },
  "Croatia": {
    zh: "克罗地亚",
    iso: "HR",
    flag: "🇭🇷",
    aliases: ["CRO", "HR", "HRV"]
  },
  "Norway": {
    zh: "挪威",
    iso: "NO",
    flag: "🇳🇴",
    aliases: ["NOR", "NO"]
  },
  "Germany": {
    zh: "德国",
    iso: "DE",
    flag: "🇩🇪",
    aliases: ["GER", "DE", "DEU", "Deutschland", "West Germany", "Germany FR"]
  },
  "Switzerland": {
    zh: "瑞士",
    iso: "CH",
    flag: "🇨🇭",
    aliases: ["SUI", "CH", "CHE", "Suisse", "Schweiz"]
  },
  "Uruguay": {
    zh: "乌拉圭",
    iso: "UY",
    flag: "🇺🇾",
    aliases: ["URU", "UY", "URY"]
  },
  "Japan": {
    zh: "日本",
    iso: "JP",
    flag: "🇯🇵",
    aliases: ["JPN", "JP"]
  },
  "Senegal": {
    zh: "塞内加尔",
    iso: "SN",
    flag: "🇸🇳",
    aliases: ["SEN", "SN"]
  },
  "Mexico": {
    zh: "墨西哥",
    iso: "MX",
    flag: "🇲🇽",
    aliases: ["MEX", "MX"]
  },
  "Belgium": {
    zh: "比利时",
    iso: "BE",
    flag: "🇧🇪",
    aliases: ["BEL", "BE"]
  },
  "Paraguay": {
    zh: "巴拉圭",
    iso: "PY",
    flag: "🇵🇾",
    aliases: ["PAR", "PY", "PRY"]
  },
  "Austria": {
    zh: "奥地利",
    iso: "AT",
    flag: "🇦🇹",
    aliases: ["AUT", "AT"]
  },
  "Morocco": {
    zh: "摩洛哥",
    iso: "MA",
    flag: "🇲🇦",
    aliases: ["MAR", "MA"]
  },
  "Canada": {
    zh: "加拿大",
    iso: "CA",
    flag: "🇨🇦",
    aliases: ["CAN", "CA"]
  },
  "Scotland": {
    zh: "苏格兰",
    iso: "SQ",
    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    aliases: ["SCO", "SQ", "SCT", "SC"]
  },
  "South Korea": {
    zh: "韩国",
    iso: "KR",
    flag: "🇰🇷",
    aliases: ["Korea Republic", "Korea Rep.", "Korea, Republic of", "KOR", "KR", "대한민국", "韩国队"]
  },
  "Australia": {
    zh: "澳大利亚",
    iso: "AU",
    flag: "🇦🇺",
    aliases: ["AUS", "AU", "Socceroos"]
  },
  "Iran": {
    zh: "伊朗",
    iso: "IR",
    flag: "🇮🇷",
    aliases: ["IRN", "IR", "Iran, Islamic Republic of", "IR Iran"]
  },
  "United States": {
    zh: "美国",
    iso: "US",
    flag: "🇺🇸",
    aliases: ["USA", "US", "United States of America", "U.S.A.", "U.S."]
  },
  "Panama": {
    zh: "巴拿马",
    iso: "PA",
    flag: "🇵🇦",
    aliases: ["PAN", "PA"]
  },
  "Algeria": {
    zh: "阿尔及利亚",
    iso: "DZ",
    flag: "🇩🇿",
    aliases: ["ALG", "DZ", "DZA"]
  },
  "Uzbekistan": {
    zh: "乌兹别克斯坦",
    iso: "UZ",
    flag: "🇺🇿",
    aliases: ["UZB", "UZ"]
  },
  "Jordan": {
    zh: "约旦",
    iso: "JO",
    flag: "🇯🇴",
    aliases: ["JOR", "JO"]
  },
  "Egypt": {
    zh: "埃及",
    iso: "EG",
    flag: "🇪🇬",
    aliases: ["EGY", "EG"]
  },
  "Ivory Coast": {
    zh: "科特迪瓦",
    iso: "CI",
    flag: "🇨🇮",
    aliases: ["Côte d'Ivoire", "Cote d'Ivoire", "CIV", "CI", "Côte d'Ivoire"]
  },
  "Tunisia": {
    zh: "突尼斯",
    iso: "TN",
    flag: "🇹🇳",
    aliases: ["TUN", "TN"]
  },
  "Saudi Arabia": {
    zh: "沙特阿拉伯",
    iso: "SA",
    flag: "🇸🇦",
    aliases: ["KSA", "SA", "SAU", "沙特"]
  },
  "New Zealand": {
    zh: "新西兰",
    iso: "NZ",
    flag: "🇳🇿",
    aliases: ["NZL", "NZ", "All Whites"]
  },
  "Cape Verde": {
    zh: "佛得角",
    iso: "CV",
    flag: "🇨🇻",
    aliases: ["Cape Verde Islands", "Cabo Verde", "CPV", "CV"]
  },
  "Haiti": {
    zh: "海地",
    iso: "HT",
    flag: "🇭🇹",
    aliases: ["HAI", "HT", "HTI"]
  },
  "South Africa": {
    zh: "南非",
    iso: "ZA",
    flag: "🇿🇦",
    aliases: ["RSA", "ZA", "ZAF", "Bafana Bafana"]
  },
  "Ghana": {
    zh: "加纳",
    iso: "GH",
    flag: "🇬🇭",
    aliases: ["GHA", "GH"]
  },
  "Curacao": {
    zh: "库拉索",
    iso: "CW",
    flag: "🇨🇼",
    aliases: ["Curaçao", "CUR", "CW", "CUW"]
  },
  "Qatar": {
    zh: "卡塔尔",
    iso: "QA",
    flag: "🇶🇦",
    aliases: ["QAT", "QA"]
  },

  // ── Historical / non-2026 World Cup teams ───────────────────────────────────
  "Italy": {
    zh: "意大利", iso: "IT", flag: "🇮🇹",
    aliases: ["ITA", "IT"]
  },
  "Sweden": {
    zh: "瑞典", iso: "SE", flag: "🇸🇪",
    aliases: ["SWE", "SE"]
  },
  "Poland": {
    zh: "波兰", iso: "PL", flag: "🇵🇱",
    aliases: ["POL", "PL"]
  },
  "Nigeria": {
    zh: "尼日利亚", iso: "NG", flag: "🇳🇬",
    aliases: ["NGA", "NG"]
  },
  "Russia": {
    zh: "俄罗斯", iso: "RU", flag: "🇷🇺",
    aliases: ["RUS", "RU"]
  },
  "Denmark": {
    zh: "丹麦", iso: "DK", flag: "🇩🇰",
    aliases: ["DEN", "DK"]
  },
  "Hungary": {
    zh: "匈牙利", iso: "HU", flag: "🇭🇺",
    aliases: ["HUN", "HU"]
  },
  "Romania": {
    zh: "罗马尼亚", iso: "RO", flag: "🇷🇴",
    aliases: ["ROU", "RO"]
  },
  "Serbia": {
    zh: "塞尔维亚", iso: "RS", flag: "🇷🇸",
    aliases: ["SRB", "RS"]
  },
  "Chile": {
    zh: "智利", iso: "CL", flag: "🇨🇱",
    aliases: ["CHI", "CL"]
  },
  "Cameroon": {
    zh: "喀麦隆", iso: "CM", flag: "🇨🇲",
    aliases: ["CMR", "CM"]
  },
  "Costa Rica": {
    zh: "哥斯达黎加", iso: "CR", flag: "🇨🇷",
    aliases: ["CRC", "CR"]
  },
  "Peru": {
    zh: "秘鲁", iso: "PE", flag: "🇵🇪",
    aliases: ["PER", "PE"]
  },
  "Turkey": {
    zh: "土耳其", iso: "TR", flag: "🇹🇷",
    aliases: ["TUR", "TR"]
  },
  "Bulgaria": {
    zh: "保加利亚", iso: "BG", flag: "🇧🇬",
    aliases: ["BUL", "BG"]
  },
  "Ukraine": {
    zh: "乌克兰", iso: "UA", flag: "🇺🇦",
    aliases: ["UKR", "UA"]
  },
  "China": {
    zh: "中国", iso: "CN", flag: "🇨🇳",
    aliases: ["CHN", "CN", "China PR"]
  },
  "Greece": {
    zh: "希腊", iso: "GR", flag: "🇬🇷",
    aliases: ["GRE", "GR"]
  },
  "Bolivia": {
    zh: "玻利维亚", iso: "BO", flag: "🇧🇴",
    aliases: ["BOL", "BO"]
  },
  "Honduras": {
    zh: "洪都拉斯", iso: "HN", flag: "🇭🇳",
    aliases: ["HON", "HN"]
  },
  "Iceland": {
    zh: "冰岛", iso: "IS", flag: "🇮🇸",
    aliases: ["ISL", "IS"]
  },
  "Cuba": {
    zh: "古巴", iso: "CU", flag: "🇨🇺",
    aliases: ["CUB", "CU"]
  },
  "Slovenia": {
    zh: "斯洛文尼亚", iso: "SI", flag: "🇸🇮",
    aliases: ["SVN", "SI"]
  },
  "Slovakia": {
    zh: "斯洛伐克", iso: "SK", flag: "🇸🇰",
    aliases: ["SVK", "SK"]
  },
  "North Korea": {
    zh: "朝鲜", iso: "KP", flag: "🇰🇵",
    aliases: ["PRK", "KP", "Korea DPR"]
  },
  "Republic of Ireland": {
    zh: "爱尔兰", iso: "IE", flag: "🇮🇪",
    aliases: ["IRL", "IE", "Ireland"]
  },
  "Israel": {
    zh: "以色列", iso: "IL", flag: "🇮🇱",
    aliases: ["ISR", "IL"]
  },
  "Iraq": {
    zh: "伊拉克", iso: "IQ", flag: "🇮🇶",
    aliases: ["IRQ", "IQ"]
  },
  "Jamaica": {
    zh: "牙买加", iso: "JM", flag: "🇯🇲",
    aliases: ["JAM", "JM"]
  },
  "Kuwait": {
    zh: "科威特", iso: "KW", flag: "🇰🇼",
    aliases: ["KUW", "KW"]
  },
  "Bosnia and Herzegovina": {
    zh: "波黑", iso: "BA", flag: "🇧🇦",
    aliases: ["BIH", "BA", "Bosnia"]
  },
  "United Arab Emirates": {
    zh: "阿联酋", iso: "AE", flag: "🇦🇪",
    aliases: ["UAE", "AE"]
  },
  "Angola": {
    zh: "安哥拉", iso: "AO", flag: "🇦🇴",
    aliases: ["ANG", "AO"]
  },
  "Wales": {
    zh: "威尔士", iso: "WL", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    aliases: ["WAL", "WL"]
  },
  "Northern Ireland": {
    zh: "北爱尔兰", iso: "NIR", flag: "🇬🇧",
    aliases: ["NIR"]
  },
  "Togo": {
    zh: "多哥", iso: "TG", flag: "🇹🇬",
    aliases: ["TOG", "TG"]
  },
  "Trinidad and Tobago": {
    zh: "特立尼达和多巴哥", iso: "TT", flag: "🇹🇹",
    aliases: ["TRI", "TT"]
  },
  "El Salvador": {
    zh: "萨尔瓦多", iso: "SV", flag: "🇸🇻",
    aliases: ["SLV", "SV"]
  },

  // ── Historical dissolved nations ────────────────────────────────────────────
  "Yugoslavia": {
    zh: "南斯拉夫", iso: "YU", flag: "🇷🇸",
    aliases: ["YUG", "YU"]
  },
  "Soviet Union": {
    zh: "苏联", iso: "SU", flag: "🇷🇺",
    aliases: ["USSR", "SU", "URS"]
  },
  "Czechoslovakia": {
    zh: "捷克斯洛伐克", iso: "CZ", flag: "🇨🇿",
    aliases: ["TCH", "CZ", "CSK"]
  },
  "East Germany": {
    zh: "东德", iso: "DD", flag: "🇩🇪",
    aliases: ["GDR", "DD", "Germany DR"]
  },
  "Serbia and Montenegro": {
    zh: "塞黑", iso: "SCG", flag: "🇷🇸",
    aliases: ["SCG"]
  },
  "Zaire": {
    zh: "扎伊尔", iso: "ZR", flag: "🇨🇩",
    aliases: ["ZAI", "ZR"]
  },
  "Dutch East Indies": {
    zh: "荷属东印度", iso: "DEI", flag: "🇮🇩",
    aliases: ["DEI"]
  },
};

// ---------------------------------------------------------------------------
// Internal lookup table: lowercased alias/name/zh/iso -> canonical English name
// Built once at module load time for O(1) lookups
// ---------------------------------------------------------------------------
const _lookup = new Map();

function _register(key, canonical) {
  if (key) _lookup.set(String(key).toLowerCase(), canonical);
}

for (const [canonical, meta] of Object.entries(TEAM_REGISTRY)) {
  // canonical name itself
  _register(canonical, canonical);
  // Chinese name
  _register(meta.zh, canonical);
  // ISO code
  _register(meta.iso, canonical);
  // all aliases
  for (const alias of meta.aliases) {
    _register(alias, canonical);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fast lookup: any name, code, or alias -> canonical English name.
 * Case-insensitive. Returns the input unchanged if no match is found.
 *
 * @param {string} input - Team name, code, or alias in any language
 * @returns {string} Canonical English name (e.g. "South Korea")
 */
export function toCanonical(input) {
  if (!input) return input;
  const key = String(input).trim().toLowerCase();
  return _lookup.get(key) || input;
}

/**
 * Fast lookup: any name, code, or alias -> Chinese display name.
 * Case-insensitive. Returns the input unchanged if no match is found.
 *
 * @param {string} input - Team name, code, or alias in any language
 * @returns {string} Chinese display name (e.g. "韩国")
 */
export function toZhName(input) {
  if (!input) return input;
  const canonical = toCanonical(input);
  const entry = TEAM_REGISTRY[canonical];
  return entry ? entry.zh : input;
}

/**
 * Fast lookup: any name, code, or alias -> ISO code.
 * Case-insensitive. Returns null if no match is found.
 *
 * @param {string} input - Team name, code, or alias in any language
 * @returns {string|null} ISO code (e.g. "KR") or null
 */
export function toIsoCode(input) {
  if (!input) return null;
  const canonical = toCanonical(input);
  const entry = TEAM_REGISTRY[canonical];
  return entry ? entry.iso : null;
}

/**
 * Fast lookup: any name, code, or alias -> flag emoji.
 * Case-insensitive. Returns "🏳️" if no match is found.
 *
 * @param {string} input - Team name, code, or alias in any language
 * @returns {string} Flag emoji
 */
export function toFlag(input) {
  if (!input) return "🏳️";
  const canonical = toCanonical(input);
  const entry = TEAM_REGISTRY[canonical];
  return entry ? entry.flag : "🏳️";
}

/**
 * Fast lookup: any name, code, or alias -> full registry entry.
 * Case-insensitive. Returns null if no match is found.
 *
 * @param {string} input - Team name, code, or alias in any language
 * @returns {{ zh: string, iso: string, flag: string, aliases: string[] }|null}
 */
export function getEntry(input) {
  if (!input) return null;
  const canonical = toCanonical(input);
  return TEAM_REGISTRY[canonical] || null;
}

// ---------------------------------------------------------------------------
// ELO slug: canonical name -> eloratings.net TSV filename (without .tsv)
// ---------------------------------------------------------------------------
const _ACCENT_RE = /[àáâãäåÀÁÂÃÄÅçÇèéêëÈÉÊËìíîïÌÍÎÏòóôõöÒÓÔÕÖùúûüÙÚÛÜñÑ]/g;
const _ACCENT_MAP = {
  "à":"a","á":"a","â":"a","ã":"a","ä":"a","å":"a",
  "À":"A","Á":"A","Â":"A","Ã":"A","Ä":"A","Å":"A",
  "ç":"c","Ç":"C",
  "è":"e","é":"e","ê":"e","ë":"e",
  "È":"E","É":"E","Ê":"E","Ë":"E",
  "ì":"i","í":"i","î":"i","ï":"i",
  "Ì":"I","Í":"I","Î":"I","Ï":"I",
  "ò":"o","ó":"o","ô":"o","õ":"o","ö":"o",
  "Ò":"O","Ó":"O","Ô":"O","Õ":"O","Ö":"O",
  "ù":"u","ú":"u","û":"u","ü":"u",
  "Ù":"U","Ú":"U","Û":"U","Ü":"U",
  "ñ":"n","Ñ":"N",
};

/**
 * Convert any team name/alias to the eloratings.net TSV slug.
 * Resolves to canonical name first, then converts spaces to underscores
 * and strips diacritics. Works for all 42 WC2026 teams.
 *
 * @param {string} input - Team name in any format
 * @returns {string} Slug for eloratings.net (e.g. "South_Korea", "Ivory_Coast")
 */
export function toEloSlug(input) {
  const canonical = toCanonical(input);
  return canonical
    .replace(_ACCENT_RE, (ch) => _ACCENT_MAP[ch] || ch)
    .replace(/ /g, "_");
}

// ---------------------------------------------------------------------------
// Compatibility / migrated from lib/utils/teamIso.js
// ---------------------------------------------------------------------------

/** Alias for toIsoCode — same as nameToIso from the old teamIso module */
export const nameToIso = toIsoCode;

/** Convert ISO alpha-2 to Chinese display name */
const _isoToZh = new Map();
for (const [, meta] of Object.entries(TEAM_REGISTRY)) {
  _isoToZh.set(meta.iso, meta.zh);
}
export function isoToName(iso) {
  return _isoToZh.get(iso) || iso;
}

/** Compute the sorted H2H file key from two ISO codes */
export function h2hKey(iso1, iso2) {
  return [iso1, iso2].sort().join("_");
}

/** Position display names (Chinese) */
export const POSITION_LABEL = {
  GK: "门将", DF: "后卫", MF: "中场", FW: "前锋",
};

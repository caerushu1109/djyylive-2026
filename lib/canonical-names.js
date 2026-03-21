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
    aliases: ["GER", "DE", "DEU", "Deutschland"]
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
    aliases: ["SCO", "SQ", "SCT"]
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

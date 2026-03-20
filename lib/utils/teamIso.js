/**
 * Maps SportMonks team names → ISO alpha-2 codes for the 42 WC2026 teams.
 * Used to look up squad, WC history, and H2H static JSON files.
 */
const NAME_TO_ISO = {
  // Primary SportMonks names
  Argentina:              "AR",
  Austria:                "AT",
  Australia:              "AU",
  Belgium:                "BE",
  Brazil:                 "BR",
  Canada:                 "CA",
  "Côte d'Ivoire":        "CI",
  "Ivory Coast":          "CI",
  Colombia:               "CO",
  "Cape Verde":           "CV",
  "Cape Verde Islands":   "CV",
  "Curaçao":              "CW",
  Curacao:                "CW",
  Germany:                "DE",
  Algeria:                "DZ",
  Ecuador:                "EC",
  Egypt:                  "EG",
  England:                "EN",
  Spain:                  "ES",
  France:                 "FR",
  Ghana:                  "GH",
  Croatia:                "HR",
  Haiti:                  "HT",
  Iran:                   "IR",
  Jordan:                 "JO",
  Japan:                  "JP",
  "Korea Republic":       "KR",
  "South Korea":          "KR",
  Morocco:                "MA",
  Mexico:                 "MX",
  Netherlands:            "NL",
  Norway:                 "NO",
  "New Zealand":          "NZ",
  Panama:                 "PA",
  Portugal:               "PT",
  Paraguay:               "PY",
  Qatar:                  "QA",
  "Saudi Arabia":         "SA",
  Scotland:               "SC",
  Senegal:                "SN",
  Tunisia:                "TN",
  "United States":        "US",
  USA:                    "US",
  Uruguay:                "UY",
  Uzbekistan:             "UZ",
  "South Africa":         "ZA",
  Switzerland:            "CH",
};

/** ISO → display name (Chinese) */
const ISO_TO_NAME = {
  AR: "阿根廷", AT: "奥地利", AU: "澳大利亚", BE: "比利时",
  BR: "巴西",   CA: "加拿大", CI: "科特迪瓦", CO: "哥伦比亚",
  CV: "佛得角", CW: "库拉索", DE: "德国",     DZ: "阿尔及利亚",
  EC: "厄瓜多尔", EG: "埃及", EN: "英格兰",  ES: "西班牙",
  FR: "法国",   GH: "加纳",   HR: "克罗地亚", HT: "海地",
  IR: "伊朗",   JO: "约旦",   JP: "日本",     KR: "韩国",
  MA: "摩洛哥", MX: "墨西哥", NL: "荷兰",     NO: "挪威",
  NZ: "新西兰", PA: "巴拿马", PT: "葡萄牙",   PY: "巴拉圭",
  QA: "卡塔尔", SA: "沙特阿拉伯", SC: "苏格兰", SN: "塞内加尔",
  TN: "突尼斯", US: "美国",   UY: "乌拉圭",   UZ: "乌兹别克斯坦",
  ZA: "南非",
  CH: "瑞士",
};

/** ISO → position display names */
export const POSITION_LABEL = {
  GK: "门将", DF: "后卫", MF: "中场", FW: "前锋",
};

// Reverse map: Chinese name → ISO
const ZH_TO_ISO = {};
for (const [iso, zh] of Object.entries(ISO_TO_NAME)) {
  ZH_TO_ISO[zh] = iso;
}

/** Convert a team name (English, Chinese, or ISO code) to ISO alpha-2, or null if unknown */
export function nameToIso(name) {
  return NAME_TO_ISO[name] || ZH_TO_ISO[name] || null;
}

/** Convert ISO alpha-2 to Chinese display name */
export function isoToName(iso) {
  return ISO_TO_NAME[iso] || iso;
}

/** Compute the sorted H2H file key from two ISO codes */
export function h2hKey(iso1, iso2) {
  return [iso1, iso2].sort().join("_");
}

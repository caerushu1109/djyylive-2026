import { NextResponse } from "next/server";

const RSS_SOURCES = [
  {
    name: "懂球帝",
    url: "https://rsshub.rssforever.com/dongqiudi/top_news",
    icon: "懂球帝",
  },
  {
    name: "BBC",
    url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    icon: "BBC",
  },
  {
    name: "ESPN",
    url: "https://www.espn.com/espn/rss/soccer/news",
    icon: "ESPN",
  },
];

// In-memory cache
let cache = { items: [], ts: 0 };
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// ── World Cup / international football relevance filter ──
// English keywords
const EN_KEYWORDS = [
  "world cup", "2026", "fifa",
  "qualifier", "qualifying", "nations league",
  "international", "national team", "friendly", "friendlies",
  // 48 WC teams — country/team names likely in WC context
  "argentina", "brazil", "france", "germany", "england", "spain",
  "portugal", "netherlands", "belgium", "croatia", "uruguay",
  "mexico", "usa", "usmnt", "canada", "japan", "south korea",
  "australia", "saudi", "qatar", "iran", "morocco", "senegal",
  "cameroon", "ghana", "nigeria", "egypt", "tunisia",
  "colombia", "ecuador", "chile", "peru", "paraguay",
  "serbia", "switzerland", "denmark", "poland", "austria",
  "wales", "scotland", "ukraine", "italy", "sweden",
  "costa rica", "panama", "honduras", "jamaica",
  // Key terms
  "call-up", "called up", "squad announcement", "roster",
  "injury update", "ruled out", "miss world",
  "draw", "group stage", "knockout", "host city", "host nation",
  "mbappe", "messi", "haaland", "bellingham", "vinicius",
  "neymar", "salah", "de bruyne",
];
// Chinese keywords
const ZH_KEYWORDS = [
  "世界杯", "2026", "世预赛", "预选赛",
  "国家队", "国足", "国际比赛", "热身赛", "友谊赛",
  "欧国联", "欧洲杯", "美洲杯", "亚洲杯", "非洲杯",
  "FIFA", "国际足联",
  "征召", "入选", "大名单", "集训",
  "伤缺", "伤退", "无缘", "缺席",
  "阿根廷", "巴西", "法国", "德国", "英格兰", "西班牙",
  "葡萄牙", "荷兰", "比利时", "克罗地亚", "乌拉圭",
  "墨西哥", "美国", "加拿大", "日本", "韩国",
  "澳大利亚", "沙特", "卡塔尔", "伊朗", "摩洛哥",
  "塞内加尔", "喀麦隆", "加纳", "尼日利亚",
  "哥伦比亚", "厄瓜多尔", "塞尔维亚", "瑞士", "丹麦", "波兰",
  "意大利", "中国队",
  "姆巴佩", "梅西", "哈兰德", "贝林厄姆", "维尼修斯",
  "内马尔", "萨拉赫", "德布劳内",
  // General international football context
  "国脚", "主帅", "主教练任命", "换帅",
];

// Exclude non-football content (esports, basketball, etc.)
const EXCLUDE_KEYWORDS = [
  // Esports / League of Legends
  "lpl", "lck", "lec", "msi", "jdg", "blg", "t1", "geng", "tes", "lng",
  "edg", "rng", "fpx", "we ", "ig ", "上单", "打野", "中单", "下路", "辅助",
  "英雄联盟", "lol", "dota", "csgo", "valorant", "电竞",
  // Basketball
  "nba", "cba", "篮球",
  // Other sports
  "f1", "网球", "高尔夫", "nfl", "mlb",
];

function isRelevant(item) {
  const text = `${item.title} ${item.description || ""}`.toLowerCase();
  const rawText = `${item.title} ${item.description || ""}`;

  // Exclude non-football content first
  if (EXCLUDE_KEYWORDS.some((kw) => text.includes(kw) || rawText.includes(kw))) return false;

  // Check English keywords
  if (EN_KEYWORDS.some((kw) => text.includes(kw))) return true;
  // Check Chinese keywords
  if (ZH_KEYWORDS.some((kw) => rawText.includes(kw))) return true;
  return false;
}

/**
 * Minimal RSS XML parser — no dependencies.
 */
function parseRSS(xml, sourceName) {
  const items = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const tag = (name) => {
      const m = block.match(new RegExp(`<${name}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${name}>`, "i"));
      return m ? m[1].trim() : "";
    };
    const title = tag("title");
    const link = tag("link") || tag("guid");
    const pubDate = tag("pubDate");
    // Short description — strip HTML tags
    let desc = tag("description").replace(/<[^>]*>/g, "").trim();
    if (desc.length > 120) desc = desc.slice(0, 120) + "...";
    // Media thumbnail
    const thumbMatch = block.match(/(?:media:thumbnail|media:content)[^>]*url=["']([^"']+)["']/i);
    const thumbnail = thumbMatch ? thumbMatch[1] : null;

    if (title && link) {
      items.push({
        title,
        link,
        pubDate: pubDate ? new Date(pubDate).toISOString() : null,
        description: desc || null,
        thumbnail,
        source: sourceName,
      });
    }
  }
  return items;
}

async function fetchAllNews() {
  const now = Date.now();
  if (cache.items.length > 0 && now - cache.ts < CACHE_TTL) {
    return cache.items;
  }

  const results = await Promise.allSettled(
    RSS_SOURCES.map(async (src) => {
      const res = await fetch(src.url, {
        headers: { "User-Agent": "DJYY-NewsBot/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`${src.name} HTTP ${res.status}`);
      const xml = await res.text();
      return parseRSS(xml, src.name);
    })
  );

  let allItems = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      allItems.push(...r.value);
    } else {
      console.warn(`[news] ${RSS_SOURCES[i].name} failed:`, r.reason?.message || r.reason);
    }
  }

  // Step 1: Filter relevant items only
  const relevant = allItems.filter((item) => item.pubDate && isRelevant(item));

  // Step 2: Interleave sources for balance
  const bySource = {};
  for (const item of relevant) {
    if (!bySource[item.source]) bySource[item.source] = [];
    bySource[item.source].push(item);
  }
  let merged = [];
  const sourceCount = Object.keys(bySource).length || 1;
  const perSource = Math.max(4, Math.ceil(12 / sourceCount));
  for (const src of Object.keys(bySource)) {
    bySource[src].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    merged.push(...bySource[src].slice(0, perSource));
  }

  // Step 3: If too few relevant items (<5), backfill with latest non-relevant
  if (merged.length < 5) {
    const backfill = allItems
      .filter((item) => item.pubDate && !isRelevant(item))
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 5 - merged.length);
    merged.push(...backfill);
  }

  allItems = merged
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .filter((item, i, arr) => {
      const prev = arr.slice(0, i);
      return !prev.some((p) => p.title.toLowerCase() === item.title.toLowerCase());
    })
    .slice(0, 10);

  cache = { items: allItems, ts: now };
  return allItems;
}

export async function GET() {
  try {
    const items = await fetchAllNews();
    return NextResponse.json(
      { news: items, count: items.length },
      { headers: { "cache-control": "public, max-age=1800, s-maxage=1800" } }
    );
  } catch (e) {
    console.error("[news] error:", e.message);
    return NextResponse.json(
      { error: "Failed to fetch news", detail: e.message, news: [] },
      { status: 500 }
    );
  }
}

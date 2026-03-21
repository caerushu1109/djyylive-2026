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

/**
 * Minimal RSS XML parser — no dependencies.
 * Extracts <item> elements with title, link, pubDate, description, and media thumbnail.
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
    if (desc.length > 100) desc = desc.slice(0, 100) + "...";
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

  // Interleave sources: take top N per source, merge, sort, dedupe, limit 10
  // Ensures each source gets representation
  const bySource = {};
  for (const item of allItems) {
    if (!item.pubDate) continue;
    if (!bySource[item.source]) bySource[item.source] = [];
    bySource[item.source].push(item);
  }
  let merged = [];
  const perSource = Math.max(4, Math.ceil(12 / Object.keys(bySource).length));
  for (const src of Object.keys(bySource)) {
    bySource[src].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    merged.push(...bySource[src].slice(0, perSource));
  }
  allItems = merged
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    // Dedupe by similar titles
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

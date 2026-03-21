#!/usr/bin/env python3
"""
DJYY 世界杯新闻简报生成器
- 抓取 RSS 源（懂球帝、BBC、ESPN）
- 过滤世界杯/国际足球相关内容
- 调用 ChatGPT API 生成中文简报 + 结构化情报
- 输出到 public/data/news-digest.json
"""

import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

# ── Config ──
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = "gpt-4o-mini"
MAX_TOKENS = 800
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "news-digest.json"

RSS_SOURCES = [
    ("懂球帝", "https://rsshub.rssforever.com/dongqiudi/top_news"),
    ("BBC", "https://feeds.bbci.co.uk/sport/football/rss.xml"),
    ("ESPN", "https://www.espn.com/espn/rss/soccer/news"),
]

# ── Relevance keywords ──
EN_KEYWORDS = [
    "world cup", "2026", "fifa",
    "qualifier", "qualifying", "nations league",
    "international", "national team", "friendly", "friendlies",
    "call-up", "called up", "squad", "roster",
    "injury", "ruled out", "injured", "miss",
    "argentina", "brazil", "france", "germany", "england", "spain",
    "portugal", "netherlands", "belgium", "croatia", "uruguay",
    "mexico", "usa", "usmnt", "canada", "japan", "south korea",
    "australia", "saudi", "morocco", "senegal", "cameroon",
    "colombia", "ecuador", "serbia", "switzerland", "denmark", "poland",
    "italy", "sweden", "nigeria", "ghana", "tunisia",
    "costa rica", "panama", "jamaica",
    "mbappe", "messi", "haaland", "bellingham", "vinicius",
    "neymar", "salah", "de bruyne", "kane", "saka",
]

ZH_KEYWORDS = [
    "世界杯", "2026", "世预赛", "预选赛",
    "国家队", "国足", "国际比赛", "热身赛", "友谊赛",
    "欧国联", "欧洲杯", "美洲杯", "亚洲杯", "非洲杯",
    "FIFA", "国际足联",
    "征召", "入选", "大名单", "集训",
    "伤缺", "伤退", "无缘", "缺席", "受伤", "伤病",
    "阿根廷", "巴西", "法国", "德国", "英格兰", "西班牙",
    "葡萄牙", "荷兰", "比利时", "克罗地亚", "乌拉圭",
    "墨西哥", "美国", "加拿大", "日本", "韩国",
    "澳大利亚", "沙特", "摩洛哥", "哥伦比亚", "塞尔维亚",
    "意大利", "尼日利亚",
    "姆巴佩", "梅西", "哈兰德", "贝林厄姆", "维尼修斯",
    "内马尔", "萨拉赫", "德布劳内", "凯恩",
    "国脚", "主帅", "换帅",
]

EXCLUDE_KEYWORDS = [
    "lpl", "lck", "lec", "msi", "jdg", "blg", "tes", "lng",
    "edg", "rng", "fpx", "上单", "打野", "中单", "下路",
    "英雄联盟", "lol", "dota", "csgo", "valorant", "电竞",
    "nba", "cba", "篮球", "nfl", "mlb", "f1", "网球",
]


def fetch_rss(name, url):
    """Fetch and parse RSS feed, return list of items."""
    items = []
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DJYY-NewsBot/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            xml_bytes = resp.read()
    except Exception as e:
        print(f"  [WARN] {name} fetch failed: {e}")
        return items

    try:
        # Parse XML — handle encoding issues
        xml_text = xml_bytes.decode("utf-8", errors="replace")
        # Remove XML declaration to avoid encoding conflicts
        xml_text = re.sub(r'<\?xml[^?]*\?>', '', xml_text, count=1).strip()
        root = ET.fromstring(xml_text)
    except ET.ParseError as e:
        print(f"  [WARN] {name} XML parse failed: {e}")
        return items

    ns = {
        "media": "http://search.yahoo.com/mrss/",
        "dc": "http://purl.org/dc/elements/1.1/",
    }

    for item in root.iter("item"):
        title = item.findtext("title", "").strip()
        link = item.findtext("link", "").strip()
        pub_date = item.findtext("pubDate", "").strip()
        desc = item.findtext("description", "").strip()
        # Strip HTML from description
        desc = re.sub(r'<[^>]+>', '', desc).strip()
        if len(desc) > 150:
            desc = desc[:150] + "..."

        if not title:
            continue

        items.append({
            "title": title,
            "link": link,
            "pubDate": pub_date,
            "description": desc,
            "source": name,
        })

    print(f"  {name}: {len(items)} items fetched")
    return items


def is_relevant(item):
    """Check if item is relevant to World Cup / international football."""
    text = f"{item['title']} {item['description']}".lower()
    raw = f"{item['title']} {item['description']}"

    # Exclude non-football
    for kw in EXCLUDE_KEYWORDS:
        if kw in text or kw in raw:
            return False

    # Check English keywords
    for kw in EN_KEYWORDS:
        if kw in text:
            return True

    # Check Chinese keywords
    for kw in ZH_KEYWORDS:
        if kw in raw:
            return True

    return False


def call_chatgpt(news_items):
    """Call ChatGPT API to generate digest."""
    if not OPENAI_API_KEY:
        print("  [ERROR] OPENAI_API_KEY not set")
        return None

    # Build input: titles + descriptions
    today = datetime.now(timezone.utc).strftime("%Y年%m月%d日")
    news_text = "\n".join(
        f"[{it['source']}] {it['title']}" + (f" — {it['description'][:80]}" if it['description'] else "")
        for it in news_items[:20]  # Max 20 items to keep token usage low
    )

    prompt = f"""你是 DJYY 世界杯情报站的编辑。根据以下今天（{today}）的足球新闻，生成一份 JSON 格式的简报。

要求：
1. "briefing": 用中文写一段 100-150 字的世界杯/国际足球每日简报，概括今天最重要的 3-5 件事。语气专业简洁，像体育媒体编辑。如果没有直接相关世界杯的新闻，就总结国际足球动态。
2. "alerts": 提取重要情报，每条包含 type（"injury"伤病/"squad"大名单/"result"赛果/"transfer"转会/"coach"换帅）、player（球员名，中文）、team（球队名，中文）、detail（一句话描述，中文）。最多 5 条，没有就空数组。
3. "keyMatches": 值得关注的近期比赛或赛果，每条包含 home、away、detail（中文）。最多 3 条，没有就空数组。

只输出纯 JSON，不要 markdown 代码块，不要任何其他文字。

今日新闻：
{news_text}"""

    payload = json.dumps({
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": MAX_TOKENS,
        "temperature": 0.3,
    })

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload.encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  [ERROR] ChatGPT API call failed: {e}")
        return None

    # Extract usage for cost tracking
    usage = result.get("usage", {})
    input_tokens = usage.get("prompt_tokens", 0)
    output_tokens = usage.get("completion_tokens", 0)
    # gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output
    cost = (input_tokens * 0.15 + output_tokens * 0.60) / 1_000_000
    print(f"  Token usage: {input_tokens} in + {output_tokens} out = ${cost:.4f}")

    content = result["choices"][0]["message"]["content"].strip()
    # Remove markdown code block if present
    content = re.sub(r'^```json\s*', '', content)
    content = re.sub(r'\s*```$', '', content)

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        print(f"  [ERROR] Failed to parse ChatGPT response as JSON: {e}")
        print(f"  Response: {content[:500]}")
        return None


def main():
    print(f"=== DJYY News Digest Generator ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")

    # Step 1: Fetch all RSS
    print("\n[1/4] Fetching RSS feeds...")
    all_items = []
    for name, url in RSS_SOURCES:
        items = fetch_rss(name, url)
        all_items.extend(items)
    print(f"  Total: {len(all_items)} items")

    # Step 2: Filter relevant
    print("\n[2/4] Filtering relevant news...")
    relevant = [it for it in all_items if is_relevant(it)]
    print(f"  Relevant: {len(relevant)} / {len(all_items)}")

    # Backfill if too few
    if len(relevant) < 5:
        backfill = [it for it in all_items if not is_relevant(it)][:5 - len(relevant)]
        relevant.extend(backfill)
        print(f"  Backfilled to {len(relevant)} items")

    # Step 3: Call ChatGPT
    print("\n[3/4] Generating digest with ChatGPT...")
    digest = call_chatgpt(relevant)

    if not digest:
        print("  [WARN] ChatGPT failed, creating fallback digest")
        digest = {
            "briefing": "暂无世界杯相关重大新闻，请稍后刷新。",
            "alerts": [],
            "keyMatches": [],
        }

    # Step 4: Write output
    print("\n[4/4] Writing output...")
    output = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "briefing": digest.get("briefing", ""),
        "alerts": digest.get("alerts", []),
        "keyMatches": digest.get("keyMatches", []),
        "sourceCount": len(relevant),
        "sources": list(set(it["source"] for it in relevant)),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"  Saved to {OUTPUT_PATH}")
    print(f"  Briefing: {output['briefing'][:80]}...")
    print(f"  Alerts: {len(output['alerts'])}")
    print(f"  Key matches: {len(output['keyMatches'])}")
    print("\n=== Done ===")


if __name__ == "__main__":
    main()

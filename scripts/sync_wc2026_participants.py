#!/usr/bin/env python3
"""
sync_wc2026_participants.py

每天从 Sportmonks API 拉取 2026 世界杯 (season_id=26618) 参赛队名单，
结合 team-meta 中英文映射，写入 public/data/wc2026-participants.json。

特殊状态覆盖（伊朗等）在 src/lib/wc2026-overrides.json 中维护，
不受自动化影响。

用法:
    SPORTMONKS_API_TOKEN=xxx python3 scripts/sync_wc2026_participants.py
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

# ── 配置 ──────────────────────────────────────────────────────────────────────
SEASON_ID        = 26618   # 2026 FIFA World Cup on Sportmonks
BASE_URL         = "https://api.sportmonks.com/v3/football"
OUTPUT_PATH      = Path(__file__).parent.parent / "public" / "data" / "wc2026-participants.json"
OVERRIDES_PATH   = Path(__file__).parent.parent / "src" / "lib" / "wc2026-overrides.json"
TEAM_META_PATH   = Path(__file__).parent.parent / "src" / "lib" / "team-meta.js"

# ── 从 team-meta.js 中提取英文名 → 中文名映射 ─────────────────────────────────
def load_team_meta():
    """
    解析 team-meta.js 中的 TEAM_META 对象，
    返回 { "English Name": { "shortName": "中文名", "flag": "🏳️" } }
    """
    text = TEAM_META_PATH.read_text(encoding="utf-8")
    meta = {}
    import re
    # 匹配每行: "England": { shortName: "英格兰", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }
    pattern = re.compile(
        r'["\']([^"\']+)["\']:\s*\{\s*shortName:\s*["\']([^"\']+)["\'],\s*flag:\s*["\']([^"\']+)["\']'
    )
    for m in pattern.finditer(text):
        en, zh, flag = m.group(1), m.group(2), m.group(3)
        meta[en] = {"shortName": zh, "flag": flag}
    return meta


# ── Sportmonks API 请求 ────────────────────────────────────────────────────────
def fetch_json(url: str, token: str) -> dict:
    sep = "&" if "?" in url else "?"
    full = f"{url}{sep}api_token={token}"
    req = urllib.request.Request(full, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        raise RuntimeError(f"HTTP {e.code}: {body}") from e


def fetch_all_pages(base_url: str, path: str, token: str) -> list:
    """自动翻页，合并所有 data"""
    results = []
    page = 1
    while True:
        url = f"{base_url}/{path}?page={page}"
        data = fetch_json(url, token)
        items = data.get("data", [])
        results.extend(items)
        pagination = data.get("pagination", {})
        if not pagination.get("has_more", False):
            break
        page += 1
        time.sleep(0.3)   # 礼貌性延迟，避免触发限速
    return results


# ── 加载 overrides（手动维护的特殊状态） ──────────────────────────────────────
def load_overrides() -> dict:
    """
    格式: { "伊朗": { "status": "uncertain", "note": "因地区冲突资格存疑" } }
    """
    if OVERRIDES_PATH.exists():
        return json.loads(OVERRIDES_PATH.read_text(encoding="utf-8"))
    return {}


# ── 主逻辑 ─────────────────────────────────────────────────────────────────────
def main():
    token = os.environ.get("SPORTMONKS_API_TOKEN", "").strip()
    if not token:
        print("❌  缺少环境变量 SPORTMONKS_API_TOKEN", file=sys.stderr)
        sys.exit(1)

    print(f"⬇️   拉取 Sportmonks season {SEASON_ID} 参赛队名单...")
    try:
        teams_raw = fetch_all_pages(
            BASE_URL, f"teams/seasons/{SEASON_ID}", token
        )
    except RuntimeError as e:
        print(f"❌  Sportmonks 请求失败: {e}", file=sys.stderr)
        sys.exit(1)

    if not teams_raw:
        print("⚠️   Sportmonks 返回空列表，可能名单尚未录入。保留现有文件。")
        sys.exit(0)

    print(f"✅  获取到 {len(teams_raw)} 支球队")

    team_meta = load_team_meta()
    overrides = load_overrides()

    participants = []
    unmatched = []

    for team in teams_raw:
        en_name = team.get("name", "").strip()
        sm_id   = team.get("id")

        # 尝试查找中文名（支持多个英文别名）
        meta = team_meta.get(en_name)
        if not meta:
            # 常见别名兜底
            aliases = {
                "Congo DR": "DR Congo",
                "Côte d'Ivoire": "Ivory Coast",
                "Cote d'Ivoire": "Ivory Coast",
                "South Korea": "Korea Republic",
                "Korea Republic": "Korea Republic",
            }
            meta = team_meta.get(aliases.get(en_name, ""))

        if not meta:
            unmatched.append(en_name)
            zh_name = en_name  # 无中文映射时用英文名兜底
            flag    = "🏳️"
        else:
            zh_name = meta["shortName"]
            flag    = meta["flag"]

        # 应用 overrides（伊朗等特殊状态）
        override = overrides.get(zh_name, {})
        status   = override.get("status", "confirmed")
        note     = override.get("note", "")

        participants.append({
            "sportmonksId": sm_id,
            "nameEn":  en_name,
            "nameZh":  zh_name,
            "flag":    flag,
            "status":  status,
            "note":    note,
        })

    # 已确认排前面，存疑次之，待定最后
    STATUS_ORDER = {"confirmed": 0, "uncertain": 1, "tbd": 2}
    participants.sort(key=lambda t: STATUS_ORDER.get(t["status"], 9))

    output = {
        "updatedAt":    datetime.now(timezone.utc).isoformat(),
        "seasonId":     SEASON_ID,
        "totalCount":   len(participants),
        "participants": participants,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"💾  已写入 {OUTPUT_PATH}  ({len(participants)} 队)")

    if unmatched:
        print(f"⚠️   以下球队无中文映射（用英文名兜底）：{unmatched}")
        print("    请在 src/lib/team-meta.js 中补充对应条目。")

    confirmed = sum(1 for t in participants if t["status"] == "confirmed")
    uncertain = sum(1 for t in participants if t["status"] == "uncertain")
    print(f"📊  已确认 {confirmed} · 存疑 {uncertain}")


if __name__ == "__main__":
    main()

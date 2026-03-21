# 世界杯开赛前检查清单

> 世界杯开赛日期：2026年6月11日
> 最迟执行时间：2026年6月4日（开赛前一周）
> 本文档创建于：2026年3月21日

---

## 一、必须执行的数据刷新（按顺序）

### 第1步：确认参赛名额（附加赛结果）

目前 `wc2026-groups.json` 中有 4 个 TBD 名额（A组、B组、D组、F组、I组、K组）。
附加赛结果出来后必须更新。

```bash
# 更新参赛队伍列表
SPORTMONKS_API_TOKEN=xxx python3 scripts/sync_wc2026_participants.py

# 手动更新 public/data/wc2026-groups.json 中的 TBD 为确定队名
# 同时在 lib/canonical-names.js 中为新队伍添加注册条目
```

**验证**：打开首页，确认 12 个小组各有 4 支队伍，无 TBD。

### 第2步：刷新球员名单

各国家队公布正式 23-26 人大名单后执行。

```bash
SPORTMONKS_API_TOKEN=xxx node scripts/sync-squads.mjs
SPORTMONKS_API_TOKEN=xxx node scripts/enrich-squads.mjs
```

**验证**：进入任意球队详情 → 球员 tab，确认人数从 ~50 人缩减到 23-26 人，号码正确。

### 第3步：刷新 ELO 排名

```bash
python3 scripts/update_elo_from_eloratings.py
```

**验证**：进入任意球队详情，ELO 分数和排名应为最新。

### 第4步：刷新球队攻防强度

```bash
SPORTMONKS_API_TOKEN=xxx node scripts/fetch_team_strengths.mjs
```

**验证**：进入比赛详情页，泊松模型预测概率应有合理变化。

### 第5步：重新生成预测

```bash
python3 scripts/generate_predictions.py
```

**验证**：首页预测排名、球队详情的晋级漏斗数据应更新。

### 第6步：快照 Polymarket 赔率

```bash
node scripts/snapshot-odds.mjs
```

**验证**：球队详情概览 → 模型/市场对比卡，Polymarket 列有数值。

### 第7步：部署

```bash
npx next build
find .next/cache -name "*.pack" -size +20M -delete
npx wrangler pages deploy .next --project-name djyyhub
git add -A && git commit -m "Pre-tournament data refresh" && git push
```

---

## 二、必须测试的内容

### 页面加载测试
- [ ] 首页加载正常，48 支球队均显示
- [ ] 赛程页面显示所有 48 场小组赛 + 淘汰赛
- [ ] 小组积分榜 12 个组都有数据
- [ ] 预测页面排名展示正常

### 球队详情页
- [ ] 随机选 5 个球队，检查概览/赛程/历史/球员 4 个 tab
- [ ] 新加入的 TBD 球队（附加赛胜出队）页面正常
- [ ] ELO 走势图有真实曲线（非平线）
- [ ] 同组对手卡片正确显示（含交锋记录）

### 比赛详情页
- [ ] 点击任意比赛进入详情，加载速度 < 2 秒
- [ ] 泊松模型概率合理（不应出现 0% 或 100%）
- [ ] 亚盘/大小盘显示正确
- [ ] 比赛开始后，LIVE 状态自动轮询刷新

### 球员系统
- [ ] 球员名单数量正确（23-26 人/队）
- [ ] 球员头像能加载
- [ ] 点击球员弹出详情卡

### 数据源验证
- [ ] `/api/fixtures` 返回有效数据
- [ ] `/api/elo` 返回最新排名
- [ ] `/api/polymarket` 返回赔率数据
- [ ] `/api/predictions` 返回预测数据

---

## 三、赛中维护事项

| 任务 | 频率 | 命令 |
|------|------|------|
| 刷新 ELO 排名 | 每日 | `python3 scripts/update_elo_from_eloratings.py` |
| 重新生成预测 | 每日 | `python3 scripts/generate_predictions.py` |
| 刷新攻防强度 | 每轮结束后 | `SPORTMONKS_API_TOKEN=xxx node scripts/fetch_team_strengths.mjs` |
| 快照赔率 | 按需 | `node scripts/snapshot-odds.mjs` |
| 部署 | 数据刷新后 | `npx next build && npx wrangler pages deploy .next --project-name djyyhub` |

**注意**：比分、积分榜、射手榜等实时数据通过 SportMonks API 自动获取，无需手动刷新。

---

## 四、已知待处理项

1. **Polymarket 单场赛事赔率**：目前 gamma API 只能查到 29 个锦标赛级别事件，单场赛事市场未开放。开赛前一周重试。
2. **GitHub 仓库清理**：删除旧仓库 `djyylive-site` 和 `djyy-2026worldcup`（需手动在 GitHub UI 操作，token 缺 `delete_repo` 权限）。
3. **venue 地图重复键**：VENUE_COUNTRY 中 Zapopan 有重复键（无害警告）。

---

## 五、关键配置一览

| 配置项 | 值 | 位置 |
|--------|-----|------|
| SportMonks 赛季 ID | 26618 | 多个脚本 |
| 世界杯开始日期 | 2026-06-11 | `src/lib/worldcup-data.js` |
| 世界杯结束日期 | 2026-07-19 | `src/lib/worldcup-data.js` |
| 泊松模型参数 | ELO_DIVISOR=300, rho=-0.15 | `lib/poisson.js` |
| 模拟次数 | 10,000 | `scripts/generate_predictions.py` |
| Cloudflare 项目名 | djyyhub | Wrangler 部署 |
| GitHub 仓库 | caerushu1109/djyylive-2026 | main 分支 |

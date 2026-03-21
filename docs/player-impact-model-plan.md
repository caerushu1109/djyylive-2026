# 球员影响力模型 — 实施计划

> 状态：规划中，待确认方案后启动
> 来源文档：`~/Documents/stocks app/博彩模式构建/docs/player-impact-lineup-probability-method.md`

## 核心思路

把球员的边际影响系统地传导到比赛概率：

```
球员影响力 → 首发阵容强度 → 修正 xG → Poisson → 比赛概率
```

## 三个复用场景

| 场景 | 触发时机 | 修正方式 |
|------|----------|----------|
| 赛前首发修正 | 赛前 1 小时首发公布 | lineup_delta → 修正 baseline xG |
| 滚球换人修正 | 比赛中换人事件 | lineup_delta × (remaining_minutes / 90) |
| 红牌影响 | 比赛中红牌事件 | 该球员 impact 归零 + 少一人惩罚系数 |

## 与现有模型的对接

现有模型（hybridLambda）已经输出 xG/lambda，球员模型作为"首发修正器"叠加在前面：

```
ELO + Strength → hybridLambda (baseline xG)
                      ↓
              球员首发修正 (lineup_delta)
                      ↓
              adjusted xG → Poisson → 胜平负/大小球概率
```

## 分阶段实施

### Phase 1：FBref 俱乐部数据抓取 + 自动化子分数（优先）
- **放弃手动评分方案**（人为因素导致不准确）
- 用 Python 脚本从 FBref 抓取球员近 2 年俱乐部赛季数据
- 自动计算 5 维子分数：finishing, chance_creation, ball_progression, pressing_defense, aerial_duel
- SportMonks 国家队数据作为交叉验证/补充（42 种统计项可用，但样本少）
- 建立 48 队完整参考阵容（标准最强首发）
- **预计工作量：1-2 周**

### Phase 2：首发修正 + 滚球换人
- 首发公布 → 自动读取 SportMonks lineups API → 重算概率
- 换人事件 → 实时修正滚球概率（lineup_delta × remaining_minutes/90）
- 红牌 → 球员 impact 归零 + 少一人惩罚系数
- **预计工作量：3-5 天（Phase 1 数据就绪后）**

### Phase 3：参数标定（长期）
- 用历史首发 + 赛果回归 lineup_scale 等参数
- 攻/防 ELO 分离（已在 MEMORY.md 待办）
- 俱乐部→国家队角色映射优化

## 数据需求

### Phase 1 需要（FBref 数据抓取）
- [ ] FBref 抓取脚本：球员近 2 赛季俱乐部数据（Goals, xG, Assists, xA, Key Passes, Tackles, Interceptions, Aerial Duels, Progressive Passes/Carries 等）
- [ ] 子分数自动计算逻辑（FBref 原始数据 → 5 维标准化分数）
- [ ] 48 队参考阵容 JSON
- [ ] SportMonks 国家队数据作为补充验证

### Phase 2 需要（实时修正）
- [ ] SportMonks lineups API 首发读取
- [ ] 换人事件 webhook 或轮询机制
- [ ] 滚球概率修正逻辑（时间衰减系数）

### SportMonks 已确认可用数据（国家队）
- 42 种统计项：Goals, Assists, Shots, Key Passes, Tackles, Interceptions, Clearances, Aerials Won, Dribbles, Passes, Rating 等
- 仅覆盖 WC 相关赛季（2018/2022/2026 预选赛+决赛圈），无俱乐部数据
- 每球员约 10-20 场国家队样本，不足以单独支撑模型

## 额外创意

1. **赛中 Momentum 曲线** — 用实时事件（射门、角球、控球）做攻势动量可视化
2. **赛前首发预测** — 赛前 24h 基于伤停/轮换规律预测首发，提前展示概率影响
3. **社交分享卡片** — 自动生成"本场关键变量：姆巴佩是否首发，影响胜率 ±X%"

## 关键决策点

- [x] ~~Phase 1 的球员评分由谁来做？~~ → **FBref 自动抓取，不做手动版**
- [ ] FBref 抓取频率？（每周一次 vs 赛前按需）
- [ ] 前端展示放在哪里？（MatchCard 内 / 比赛详情页新 Tab / 独立面板）
- [ ] SportMonks 试用期 3/26 到期，是否续费？

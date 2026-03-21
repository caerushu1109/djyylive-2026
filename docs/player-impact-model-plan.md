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

### Phase 1：关键球员简化版（建议赛前完成）
- 每支队标记 3-5 名关键球员
- 手动给定 attack_impact / defense_impact（无需子分数）
- 首发公布后，检测关键球员在/不在，做简单 xG 修正
- 前端：MatchCard 或比赛详情页加"阵容影响"提示
- **预计工作量：3-5 天**
- **数据量：48 队 × ~4 人 = ~200 条球员记录**

### Phase 2：全量球员 + 自动化（赛中迭代）
- 接入 SportMonks 球员赛季统计，自动计算 5 维子分数
  - finishing, chance_creation, ball_progression, pressing_defense, aerial_duel
- 建立 48 队完整参考阵容（标准最强首发）
- 首发公布 → 自动读取 lineups API → 重算概率
- 换人事件 → 实时修正滚球概率
- **预计工作量：1-2 周（数据准备是大头）**

### Phase 3：参数标定（长期）
- 用历史首发 + 赛果回归 lineup_scale 等参数
- 攻/防 ELO 分离（已在 MEMORY.md 待办）
- 俱乐部→国家队角色映射优化

## 数据需求

### Phase 1 需要
- [ ] 48 队关键球员名单（3-5 人/队）
- [ ] 每人 attack_impact / defense_impact 手动评分
- [ ] SportMonks lineups API 确认可用

### Phase 2 需要
- [ ] SportMonks 球员赛季统计 API（确认字段覆盖度）
- [ ] FBref 数据备选方案（如 SportMonks 不够细）
- [ ] 48 队参考阵容 JSON
- [ ] 换人事件 webhook 或轮询机制

## 额外创意

1. **赛中 Momentum 曲线** — 用实时事件（射门、角球、控球）做攻势动量可视化
2. **赛前首发预测** — 赛前 24h 基于伤停/轮换规律预测首发，提前展示概率影响
3. **社交分享卡片** — 自动生成"本场关键变量：姆巴佩是否首发，影响胜率 ±X%"

## 关键决策点

- [ ] Phase 1 的球员评分由谁来做？（人工 vs 半自动）
- [ ] 是否优先做关键球员简化版，还是直接上全量？
- [ ] 前端展示放在哪里？（MatchCard 内 / 比赛详情页新 Tab / 独立面板）

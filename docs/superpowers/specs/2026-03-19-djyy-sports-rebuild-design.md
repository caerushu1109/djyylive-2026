# DJYY Sports — 重建设计规格 v1.0

**日期：** 2026-03-19
**状态：** 已确认，进入实现规划
**设计稿：** `outputs/djyy-design.html`

---

## 一、产品定位

面向足球博彩职业选手及其粉丝的**大型杯赛数据平台**。以 2026 FIFA 世界杯为 MVP，后续扩展至欧洲杯、欧冠、美洲杯、非洲杯、亚冠等。

核心差异化：**ELO 预测模型 × 市场赔率对比（Polymarket/博彩公司）× 实时滚球预测**。

---

## 二、设计风格

- **参考：** FotMob / Sofascore
- **主题：** 深色底（#090a0c），数据优先
- **移动优先 PWA**（Phase 1 支持安装，不上架 App Store）
- **图标库：** Lucide React（已安装），全套统一线条粗细

### 色彩系统

| Token | 色值 | 用途 |
|-------|------|------|
| `--bg` | #090a0c | 页面背景 |
| `--surface` | #13141a | 导航栏/顶栏 |
| `--card` | #1c1e26 | 卡片背景 |
| `--green` | #00e676 | 进球/晋级/正向 |
| `--blue` | #5c9eff | 数据/预测/主色 |
| `--gold` | #ffc107 | 冠军/奖项/排名 |
| `--red` | #ff4d6d | 失球/出局/负向 |
| `--live` | #ff3d3d | 直播红点 |
| `--purple` | #b388ff | 市场/Polymarket |

### 底部导航图标

| Tab | 图标 | 路由 |
|-----|------|------|
| 首页 | `LayoutDashboard` | `/wc2026` |
| 赛程 | `CalendarDays` | `/wc2026/fixtures` |
| 积分 | `BarChart3` | `/wc2026/groups` |
| 预测 | `TrendingUp` | `/wc2026/predict` |
| 市场 | `Activity` | `/wc2026/markets` |

---

## 三、页面架构

### 路由结构

```
/                          → 赛事选择首页（或重定向至当前活跃赛事）
/wc2026                    → 世界杯首页仪表盘
/wc2026/fixtures           → 赛程列表（按日期分页）
/wc2026/groups             → 小组积分榜 + 模拟器 + 淘汰赛图
/wc2026/predict            → 夺冠概率 + 各阶段晋级率
/wc2026/markets            → 赔率对比 + 价值发现
/match/[id]                → 比赛详情（共享）
/team/[id]                 → 球队主页（共享）
/player/[id]               → 球员主页（共享，Phase 3）
```

### 组件分层

**共享组件（所有赛事通用）**
- `MatchCard` — 比赛卡片（赛程列表用）
- `MatchDetail` — 比赛详情面板（滑出式）
- `TeamCard` / `TeamPage` — 球队信息
- `PredictionChart` — 概率可视化
- `MarketOddsRow` — 赔率对比行
- `EloSparkline` — ELO走势迷你图
- `LiveProbBar` — 实时胜负概率条
- `BottomNav` — 底部导航
- `CompetitionSwitcher` — 赛事切换 Sheet

**世界杯专属组件**
- `GroupTable` — 小组积分榜（12组）
- `GroupSimulator` — 出线模拟器
- `KnockoutBracket` — 淘汰赛对阵图（32→16→8→4→决赛）

---

## 四、数据层

### API 端点

| 路由 | 数据源 | 说明 |
|------|--------|------|
| `/api/fixtures` | SportMonks | 赛程、实时比分 |
| `/api/match/[id]` | SportMonks | 比赛详情、事件流、统计 |
| `/api/standings` | SportMonks | 小组积分榜 |
| `/api/elo` | 本地 JSON | ELO排名（Python日更） |
| `/api/predictions` | 本地 JSON | 蒙特卡洛结果（赛前/日更） |
| `/api/markets` | Polymarket REST | 去中心化预测市场 |
| `/api/odds` | SportMonks Odds | 博彩公司赔率 |

### 预测模型规格

**Phase 1 — 赛前夺冠概率**
- 完整 48 队赛程路径 Monte Carlo（10万次模拟）
- 每场比赛用 Dixon-Coles 泊松模型计算进球分布
- ELO 差值驱动进球率参数
- 输出：夺冠概率、各阶段晋级率

**Phase 2 — 实时滚球预测**
- 赛中比分 + 剩余时间 + 射门数动态调整泊松参数
- 每 30 秒更新胜/平/负概率
- 与博彩赔率实时对比，输出价值信号

---

## 五、功能分阶段

### Phase 1 · MVP（世界杯前上线）
- 实时比分 / 赛程 / 积分榜
- 比赛详情（事件流、统计）
- ELO 夺冠概率（Monte Carlo 完整版）
- 小组出线模拟器
- 球队主页 + ELO 走势图
- PWA 安装支持（manifest + service worker）
- 赛事切换框架（空状态）

### Phase 2 · 赛事进行中
- Polymarket 夺冠市场对比
- 单场比赛博彩赔率聚合（SportMonks Odds）
- 实时滚球胜负概率
- 大小球 / 角球 / 亚盘预测
- 价值发现信号（模型 vs 市场）
- 淘汰赛对阵图可视化

### Phase 3 · 赛后 / 扩展
- 球员详情页
- 裁判历史数据
- Kalshi 市场接入
- 欧冠 / 欧洲杯赛事配置

---

## 六、技术选型（保留现有）

- **框架：** Next.js 15 + App Router
- **部署：** Cloudflare Workers via OpenNext
- **样式：** Tailwind CSS + CSS custom properties（设计 tokens）
- **图标：** Lucide React
- **数据获取：** SWR / 原生 fetch + Cloudflare KV 缓存
- **PWA：** next-pwa 或手写 service worker

---

## 七、重建策略

不迁移旧代码，**全新目录结构**：

```
app/
  (competition)/
    [comp]/
      page.jsx              ← 首页
      fixtures/page.jsx
      groups/page.jsx
      predict/page.jsx
      markets/page.jsx
  match/[id]/page.jsx
  team/[id]/page.jsx
  layout.jsx

components/
  shared/                   ← 所有赛事通用
    MatchCard.jsx
    MatchDetail.jsx
    LiveProbBar.jsx
    EloSparkline.jsx
    MarketOddsRow.jsx
    BottomNav.jsx
    CompetitionSwitcher.jsx
  wc/                       ← 世界杯专属
    GroupTable.jsx
    GroupSimulator.jsx
    KnockoutBracket.jsx
  ui/                       ← 基础 UI 原语
    Card.jsx
    Badge.jsx
    TabBar.jsx
    SectionTitle.jsx

lib/
  api/                      ← API 调用封装
  models/                   ← 预测模型（Monte Carlo）
  hooks/                    ← useFixtures, usePredictions...
  team-meta.js              ← 已有，保留

scripts/
  update_elo_from_eloratings.py   ← 已有，保留
  generate_predictions.py         ← 重写（完整蒙特卡洛）
```

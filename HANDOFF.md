# 项目交接文档 · DJYY 2026世界杯

> 最后更新：2026-03-20  
> 当前稳定版本 tag：`v0.3-phase1-complete`（commit `32f74c6`）  
> 线上地址：https://2026.djyylive.com

---

## 一、项目概览

这是一个面向中文用户的 **2026世界杯实时追踪 PWA**，移动端优先（最大宽度 480px），部署在 Cloudflare Workers 上。

核心功能：
- 赛程实时数据（SportMonks API，30秒轮询）
- ELO 排名 + 夺冠概率预测
- 球队详情页（历史战绩 / 球员大名单 / ELO走势）
- 小组赛模拟器
- Polymarket 市场信号展示区（数据待接入）
- 全站球队搜索弹窗

---

## 二、技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 15.5.10 + React 19.2.4 |
| 部署运行时 | Cloudflare Workers（通过 OpenNext 1.17.1 适配） |
| 样式 | CSS Variables（globals.css）+ 少量 Tailwind |
| 图标 | lucide-react 0.577.0 |
| 构建工具 | wrangler 4.55.0 |
| 数据自动化 | Python 3 脚本 + GitHub Actions |

---

## 三、仓库信息

- **GitHub 仓库**：https://github.com/caerushu1109/djyylive-2026（私有）
- **默认分支**：main
- **Cloudflare 项目名**：djyylive-2026
- **自定义域名**：2026.djyylive.com
- **部署方式**：push 到 main → Cloudflare 自动触发构建并部署

---

## 四、环境变量 / Secrets

### 本地开发（.env.local）
```
SPORTMONKS_API_TOKEN=<你的SportMonks token>
SPORTMONKS_BASE_URL=https://api.sportmonks.com/v3/football
```

### Cloudflare Workers 生产环境
需在 Cloudflare Dashboard → Workers → djyylive-2026 → Settings 中配置：

| Key | 类型 | 说明 |
|-----|------|------|
| SPORTMONKS_API_TOKEN | Secret（加密） | SportMonks API 访问令牌 |
| SPORTMONKS_BASE_URL | Variable（明文） | https://api.sportmonks.com/v3/football |

> ⚠️ 如果线上数据回退为 mock，第一步先检查这两个值是否存在于 Cloudflare Secrets。

### GitHub Actions Secrets
| Key | 用途 |
|-----|------|
| SPORTMONKS_API_TOKEN | 每周球员名单同步 workflow 使用 |

---

## 五、目录结构

```
djyylive-2026/
├── app/
│   ├── (competition)/[comp]/      # 赛事主页（首页）
│   │   ├── page.jsx               # ★ 最常修改的文件
│   │   ├── layout.jsx             # 底部导航栏挂载点
│   │   ├── fixtures/page.jsx      # 赛程列表页
│   │   ├── groups/page.jsx        # 小组赛页面
│   │   ├── markets/page.jsx       # Polymarket市场页（待完善）
│   │   └── predict/page.jsx       # ELO预测榜
│   ├── team/[id]/page.jsx         # 球队详情页
│   ├── match/[id]/page.jsx        # 比赛详情页
│   ├── api/
│   │   ├── fixtures/route.js      # 赛程API（SportMonks）
│   │   ├── elo/route.js           # ELO排名API（静态JSON）
│   │   ├── predictions/route.js   # 夺冠概率API（Monte Carlo）
│   │   ├── standings/route.js     # 积分榜API
│   │   └── match/[id]/route.js    # 比赛详情API
│   ├── globals.css                # 全局CSS变量（主题色/字体/间距）
│   └── layout.jsx                 # 根布局
├── components/
│   ├── shared/
│   │   ├── MatchCard.jsx          # 比赛卡片（全站通用）
│   │   ├── TeamSearchModal.jsx    # 球队搜索弹窗
│   │   ├── EloSparkline.jsx       # ELO折线图（SVG）
│   │   ├── BottomNav.jsx          # 底部导航栏
│   │   └── PredictionChart.jsx    # 概率分布图
│   ├── ui/                        # 基础UI组件（Badge/Card/等）
│   └── wc/
│       └── GroupSimulator.jsx     # 小组赛模拟器
├── lib/
│   ├── hooks/                     # 所有数据Hook
│   │   ├── useFixtures.js         # 赛程数据（30s轮询）
│   │   ├── useElo.js              # ELO排名
│   │   ├── usePredictions.js      # 夺冠概率
│   │   ├── useTeamHistory.js      # 球队世界杯历史
│   │   ├── useSquad.js            # 球员大名单
│   │   └── useEloTrends.js        # ELO历史趋势
│   └── utils/
│       └── teamIso.js             # 球队ISO码/位置映射
├── public/data/                   # 静态JSON数据
│   ├── elo-rankings.json          # ELO快照（每周脚本更新）
│   ├── wc2026-predictions.json    # 夺冠概率（Monte Carlo结果）
│   ├── wc2026-groups.json         # 小组分组数据
│   ├── wc2026-history.json        # 各队世界杯历史战绩
│   ├── elo-trends/                # 各队ELO历史走势（JSON per team）
│   └── squads/                    # 各队球员名单（每周同步）
├── scripts/                       # Python 数据维护脚本
│   ├── update_elo_from_eloratings.py
│   ├── archive_elo_history_from_eloratings.py
│   └── generate_elo_trends.py
├── .github/workflows/
│   ├── sync-data.yml              # 每周一凌晨2点(UTC)同步球员名单
│   └── daily-elo-sync.yml         # ELO每日同步（待确认是否启用）
├── wrangler.jsonc                 # Cloudflare Workers 配置
├── open-next.config.ts            # OpenNext 适配层配置
└── HANDOFF.md                     # 本文件
```

---

## 六、页面清单 & 完成状态

| 路由 | 页面 | 状态 | 备注 |
|------|------|------|------|
| /wc2026 | 赛事首页 | ✅ 基本完成 | 需精修各模块细节 |
| /wc2026/fixtures | 赛程列表 | ✅ 可用 | 待精修 |
| /wc2026/predict | ELO预测榜 | ✅ 可用 | 待精修 |
| /wc2026/groups | 小组赛 + 模拟器 | ✅ 可用 | 待精修 |
| /wc2026/markets | Polymarket市场 | 🔲 壳子已建 | 真实数据未接入 |
| /team/[id] | 球队详情 | ✅ 功能完整 | 待精修布局 |
| /match/[id] | 比赛详情 | ✅ 可用 | 待精修 |

---

## 七、首页（/wc2026）模块说明

首页 `app/(competition)/[comp]/page.jsx` 从上到下依次包含：

1. **TopBar** — DJYY logo（可点击返回首页）+ 搜索按钮
2. **LiveBanner** — 有进行中比赛时显示实时比分横幅
3. **WinProbBar** — 实时胜负概率条（占位数据，待接真实数据）
4. **QuickStats** — 进行中/今日场次/球队数/小组数/距开幕倒计时
5. **今日赛程 / 最近赛程** — 有今日赛程显示今日，否则显示最近3场
6. **夺冠热门 · ELO模型** — Top 6球队，均可点击跳转球队详情页
7. **市场信号 · POLYMARKET** — 显示10队，模型/市场/价值列（真实market数据待接入）

---

## 八、关键数据流

### 实时赛程
```
浏览器 → GET /api/fixtures
  → app/api/fixtures/route.js
  → SportMonks API（SPORTMONKS_API_TOKEN）
  → 返回标准化 fixture 对象数组
  → useFixtures() hook（30秒轮询）
```

### ELO / 预测数据
```
public/data/elo-rankings.json    ← 每周 Python 脚本更新
public/data/wc2026-predictions.json  ← Monte Carlo 模型生成

浏览器 → GET /api/elo → 读取 elo-rankings.json → useElo()
浏览器 → GET /api/predictions → 读取 predictions.json → usePredictions()
```

### 球队详情页的名字匹配逻辑
⚠️ 这是已知的坑，要特别注意：

- ELO数据用英文 `originalName`（如 "Spain"）
- 预测数据用中文 `name`（如 "西班牙"）
- 比赛数据的 fixture.home/away 同时有 `name`（中文）和 `originalName`（英文）

**从夺冠热门跳转球队详情时**，必须用英文 `originalName` 构造 URL（即 `/team/Spain`）。  
首页已有 `getTeamHref(team)` 函数处理这个转换（通过 ELO rankings 交叉查找）。

---

## 九、自动化 Workflows

| Workflow | 触发时间 | 功能 |
|----------|----------|------|
| sync-data.yml | 每周一 02:00 UTC（可手动触发） | 从 SportMonks 同步各队球员大名单到 public/data/squads/ |
| daily-elo-sync.yml | 待确认 | ELO数据每日更新 |

**手动触发方法**：GitHub → Actions → 对应 workflow → "Run workflow"

---

## 十、本地开发步骤

```bash
# 1. 克隆仓库
git clone https://github.com/caerushu1109/djyylive-2026.git
cd djyylive-2026

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 填入真实的 SPORTMONKS_API_TOKEN

# 4. 本地开发
npm run dev          # localhost:3000，使用 Next.js 开发服务器

# 5. 本地模拟 Cloudflare 环境
npm run cf:preview   # 构建 + 本地 Worker 预览

# 6. 部署到生产
# 直接 push 到 main 即可，Cloudflare 自动构建部署
```

---

## 十一、版本记录

| Tag | 时间 | 内容 |
|-----|------|------|
| v0.3-phase1-complete | 2026-03-20 | 首页功能完整：夺冠热门可点击、搜索联通、赛程日期逻辑、市场信号10队 |
| （无tag） | 2026-03-19 | 淘汰赛支架、ELO sparkline、球队详情页完整化 |
| （无tag） | 2026-03-13 | 项目上线，SportMonks 实时数据接通 |

---

## 十二、待完成工作（优先级排序）

### 高优先级（页面精修）
- [ ] 首页各模块视觉细节精修
- [ ] 赛程列表页（/fixtures）精修
- [ ] 比赛详情页（/match/[id]）精修
- [ ] 球队详情页（/team/[id]）精修
- [ ] ELO预测榜（/predict）精修
- [ ] 小组赛页面（/groups）精修

### 中优先级（功能完善）
- [ ] Polymarket 真实数据接入（/markets 页 + 首页市场信号列）
- [ ] WinProbBar 接入真实数据（目前是占位硬编码）
- [ ] 市场信号"价值"列逻辑完善（目前用 offset 模拟）

### 低优先级
- [ ] daily-elo-sync.yml 确认是否正常运行
- [ ] PWA manifest 和 Service Worker 优化

---

## 十三、已知问题 & 注意事项

1. **编码问题**：通过 GitHub API 推送文件时，必须用 `TextEncoder → Uint8Array → btoa` 方式处理 UTF-8，不能直接 `btoa(string)`，否则中文字符会损坏导致 Cloudflare 构建失败（"stream did not contain valid UTF-8"）。

2. **球队名字双轨制**：ELO用英文，预测用中文。所有需要跨数据源匹配球队的地方都要用 `code` 或同时匹配两种名字。

3. **Cloudflare 构建检查**：每次 push 后 GitHub commit 页面会出现 Cloudflare 的构建状态标记（✓/✗），失败时去 Cloudflare Dashboard → Workers → djyylive-2026 → Build Logs 查看具体错误。

4. **No-auth API**：/api/* 路由没有鉴权，全部公开可访问。

---

## 十四、联系 & 授权

- 项目负责人：caerushu1109
- GitHub token 等敏感信息请直接联系负责人获取，不在本文档中保留

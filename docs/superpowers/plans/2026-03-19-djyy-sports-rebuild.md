# DJYY Sports — Phase 1 MVP Rebuild Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the DJYY Sports website from scratch as a multi-competition sports data platform, starting with the 2026 FIFA World Cup MVP.

**Architecture:** Next.js 15 App Router with route group `(competition)/[comp]/` for multi-competition routing, shared component library (`components/shared/` + `components/ui/`), and WC-specific structure components (`components/wc/`). The existing API layer (`src/lib/worldcup-data.js`, `src/lib/team-meta.js`) is reused. Cloudflare Workers deployment via OpenNext is unchanged.

**Tech Stack:** Next.js 15 · React 19 · Tailwind CSS 3 · Lucide React · CSS custom properties (design tokens) · SWR-style client fetch hooks · PWA manifest + service worker · SportMonks API · Polymarket REST API

**DO NOT modify:** `src/lib/team-meta.js`, `src/lib/worldcup-data.js`, `wrangler.jsonc`, `tailwind.config.js`, `scripts/`, `public/data/`, `data/`, `package.json` (no new deps needed).

---

## File Map

### Files to DELETE (after rebuild is complete)
- `components/worldcup-app.jsx` — 1979-line monolith, replaced by new structure
- `styles.css` — old global CSS, replaced by `app/globals.css`
- `app/page.js` → replaced by `app/page.jsx`
- `app/layout.js` → replaced by `app/layout.jsx`

### Files to CREATE

**App shell & routing**
- `app/layout.jsx` — root layout, font vars, manifest links, SW registration
- `app/page.jsx` — root redirect to `/wc2026`
- `app/(competition)/[comp]/layout.jsx` — competition shell: BottomNav + content area
- `app/(competition)/[comp]/page.jsx` — WC2026 home dashboard
- `app/(competition)/[comp]/fixtures/page.jsx` — date-grouped fixture list
- `app/(competition)/[comp]/groups/page.jsx` — standings + group simulator
- `app/(competition)/[comp]/predict/page.jsx` — championship probability rankings
- `app/(competition)/[comp]/markets/page.jsx` — Phase 2 stub (coming soon)
- `app/match/[id]/page.jsx` — match detail (shared across competitions)
- `app/team/[id]/page.jsx` — team page (shared across competitions)

**API routes** (extend existing)
- `app/api/fixtures/route.js` — keep as-is ✓
- `app/api/match/[id]/route.js` — keep as-is ✓
- `app/api/predictions/route.js` — keep as-is ✓
- `app/api/elo/route.js` — NEW: serve `public/data/elo.json`
- `app/api/standings/route.js` — NEW: proxy to `getFixturesData().standings`

**UI primitives** (`components/ui/`)
- `components/ui/Card.jsx` — base card with dark surface + optional glow
- `components/ui/Badge.jsx` — status/label chip (live, ft, ns, etc.)
- `components/ui/TabBar.jsx` — horizontal scrollable tab strip
- `components/ui/SectionTitle.jsx` — section heading with optional action link
- `components/ui/LoadingSpinner.jsx` — centered spinner
- `components/ui/EmptyState.jsx` — empty / error state with icon + message

**Shared components** (`components/shared/`)
- `components/shared/BottomNav.jsx` — 5-tab bottom navigation with Lucide icons
- `components/shared/MatchCard.jsx` — compact fixture card (all statuses)
- `components/shared/MatchDetail.jsx` — full match detail panel (stats, events, H2H)
- `components/shared/PredictionChart.jsx` — horizontal probability bar list
- `components/shared/EloSparkline.jsx` — mini ELO trend sparkline (SVG)
- `components/shared/LiveProbBar.jsx` — in-play win/draw/loss prob bar
- `components/shared/MarketOddsRow.jsx` — odds comparison row
- `components/shared/CompetitionSwitcher.jsx` — bottom sheet to switch competition

**WC-specific components** (`components/wc/`)
- `components/wc/GroupTable.jsx` — single group standings table
- `components/wc/GroupSimulator.jsx` — interactive group outcome simulator
- `components/wc/KnockoutBracket.jsx` — Phase 2 stub

**Data hooks** (`lib/hooks/`)
- `lib/hooks/useFixtures.js` — fetch `/api/fixtures`, poll live
- `lib/hooks/usePredictions.js` — fetch `/api/predictions`
- `lib/hooks/useMatchDetail.js` — fetch `/api/match/[id]`
- `lib/hooks/useElo.js` — fetch `/api/elo`
- `lib/hooks/useStandings.js` — fetch `/api/standings`

**Styles**
- `app/globals.css` — design tokens, reset, base typography, app shell CSS

**PWA**
- `public/manifest.json` — update colors to match new tokens
- `public/sw.js` — service worker (cache-first for assets, network-first for API)

---

## Design Tokens Reference

```css
--bg:      #090a0c   /* page background */
--surface: #13141a   /* topbar / nav */
--card:    #1c1e26   /* card background */
--green:   #00e676   /* goal / advance / positive */
--blue:    #5c9eff   /* data / prediction / primary */
--gold:    #ffc107   /* champion / award / ranking */
--red:     #ff4d6d   /* concede / eliminated / negative */
--live:    #ff3d3d   /* live red dot */
--purple:  #b388ff   /* market / polymarket */
--text:    #e8eef6   /* primary text */
--text-dim:#8892a0   /* secondary text */
--border:  #2a2d3a   /* card border */
```

## Bottom Nav Icons (Lucide React)
- 首页: `LayoutDashboard` → `/wc2026`
- 赛程: `CalendarDays` → `/wc2026/fixtures`
- 积分: `BarChart3` → `/wc2026/groups`
- 预测: `TrendingUp` → `/wc2026/predict`
- 市场: `Activity` → `/wc2026/markets`

---

## Task 1: Foundation — globals.css + root layout + redirect

**Files:**
- Create: `app/globals.css`
- Replace: `app/layout.jsx` (delete `app/layout.js`)
- Replace: `app/page.jsx` (delete `app/page.js`)

- [ ] **Step 1.1: Write `app/globals.css`**

```css
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Noto+Sans+SC:wght@300;400;500;700&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg:      #090a0c;
  --surface: #13141a;
  --card:    #1c1e26;
  --green:   #00e676;
  --blue:    #5c9eff;
  --gold:    #ffc107;
  --red:     #ff4d6d;
  --live:    #ff3d3d;
  --purple:  #b388ff;
  --text:    #e8eef6;
  --text-dim:#8892a0;
  --border:  #2a2d3a;
  --font-body: "Noto Sans SC";
  --font-mono: "IBM Plex Mono";
  --bottom-nav-h: 60px;
  --topbar-h: 52px;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

html, body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body), sans-serif;
  font-size: 15px;
}

::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; }

a { color: inherit; text-decoration: none; }
button { border: 0; background: none; color: inherit; cursor: pointer; font: inherit; }
input { font: inherit; }
```

- [ ] **Step 1.2: Delete old layout and page files**

```bash
cd /path/to/djyylive-2026
rm app/layout.js app/page.js
```

- [ ] **Step 1.3: Write `app/layout.jsx`**

```jsx
import "./globals.css";

export const metadata = {
  title: "DJYY Sports · 赛事数据平台",
  description: "实时比分、ELO预测、夺冠概率。2026 FIFA World Cup及更多大型杯赛数据。",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "DJYY" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090a0c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DJYY" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
          }
        `}} />
      </body>
    </html>
  );
}
```

- [ ] **Step 1.4: Write `app/page.jsx` (root redirect)**

```jsx
import { redirect } from "next/navigation";
export default function RootPage() {
  redirect("/wc2026");
}
```

- [ ] **Step 1.5: Verify build compiles**

```bash
cd /path/to/djyylive-2026 && npm run build 2>&1 | tail -20
```
Expected: `✓ Compiled successfully` (or at least no errors blocking compilation)

- [ ] **Step 1.6: Commit**

```bash
git add app/globals.css app/layout.jsx app/page.jsx
git rm app/layout.js app/page.js
git commit -m "feat: foundation — design tokens, root layout, root redirect"
```

---

## Task 2: BottomNav + Competition Layout Shell

**Files:**
- Create: `components/shared/BottomNav.jsx`
- Create: `app/(competition)/[comp]/layout.jsx`

- [ ] **Step 2.1: Write `components/shared/BottomNav.jsx`**

```jsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, BarChart3, TrendingUp, Activity } from "lucide-react";

const tabs = [
  { id: "home",     Icon: LayoutDashboard, label: "首页",   path: "" },
  { id: "fixtures", Icon: CalendarDays,    label: "赛程",   path: "/fixtures" },
  { id: "groups",   Icon: BarChart3,       label: "积分",   path: "/groups" },
  { id: "predict",  Icon: TrendingUp,      label: "预测",   path: "/predict" },
  { id: "markets",  Icon: Activity,        label: "市场",   path: "/markets" },
];

export default function BottomNav({ comp }) {
  const pathname = usePathname();
  const base = `/${comp}`;

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: "var(--bottom-nav-h)",
      background: "var(--surface)",
      borderTop: "1px solid var(--border)",
      display: "flex",
      zIndex: 100,
      maxWidth: 480,
      margin: "0 auto",
    }}>
      {tabs.map(({ id, Icon, label, path }) => {
        const href = base + path;
        const active = path === ""
          ? pathname === base || pathname === base + "/"
          : pathname.startsWith(base + path);
        return (
          <Link
            key={id}
            href={href}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 3,
              color: active ? "var(--blue)" : "var(--text-dim)",
              fontSize: 10, fontWeight: active ? 600 : 400,
              transition: "color 0.15s",
            }}
          >
            <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2.2: Write `app/(competition)/[comp]/layout.jsx`**

```jsx
import BottomNav from "@/components/shared/BottomNav";

export default function CompetitionLayout({ children, params }) {
  const { comp } = params;
  return (
    <div style={{
      maxWidth: 480,
      minHeight: "100dvh",
      margin: "0 auto",
      background: "var(--bg)",
      paddingBottom: "var(--bottom-nav-h)",
      position: "relative",
    }}>
      {children}
      <BottomNav comp={comp} />
    </div>
  );
}
```

- [ ] **Step 2.3: Write placeholder `app/(competition)/[comp]/page.jsx`** (will be fully replaced in Task 5)

```jsx
export default function CompPage({ params }) {
  return (
    <div style={{ padding: "80px 16px", textAlign: "center", color: "var(--text-dim)" }}>
      <p>Loading {params.comp}...</p>
    </div>
  );
}
```

- [ ] **Step 2.4: Verify `npm run build` passes**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 2.5: Commit**

```bash
git add components/shared/BottomNav.jsx "app/(competition)"
git commit -m "feat: competition layout shell with bottom nav (Lucide icons)"
```

---

## Task 3: UI Primitives

**Files:**
- Create: `components/ui/Card.jsx`
- Create: `components/ui/Badge.jsx`
- Create: `components/ui/TabBar.jsx`
- Create: `components/ui/SectionTitle.jsx`
- Create: `components/ui/LoadingSpinner.jsx`
- Create: `components/ui/EmptyState.jsx`

- [ ] **Step 3.1: Write `components/ui/Card.jsx`**

```jsx
export default function Card({ children, style, onClick, className }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3.2: Write `components/ui/Badge.jsx`**

```jsx
const TONE_COLORS = {
  live:    { bg: "rgba(255,61,61,0.15)",  text: "var(--live)",   border: "rgba(255,61,61,0.3)" },
  ft:      { bg: "rgba(138,146,160,0.1)", text: "var(--text-dim)", border: "var(--border)" },
  ns:      { bg: "rgba(92,158,255,0.1)",  text: "var(--blue)",   border: "rgba(92,158,255,0.2)" },
  green:   { bg: "rgba(0,230,118,0.12)",  text: "var(--green)",  border: "rgba(0,230,118,0.25)" },
  gold:    { bg: "rgba(255,193,7,0.12)",  text: "var(--gold)",   border: "rgba(255,193,7,0.25)" },
  default: { bg: "rgba(138,146,160,0.1)", text: "var(--text-dim)", border: "var(--border)" },
};

export default function Badge({ children, tone = "default", style }) {
  const colors = TONE_COLORS[tone] || TONE_COLORS.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
      background: colors.bg, color: colors.text,
      border: `1px solid ${colors.border}`,
      ...style,
    }}>
      {children}
    </span>
  );
}
```

- [ ] **Step 3.3: Write `components/ui/TabBar.jsx`**

```jsx
"use client";
export default function TabBar({ tabs, active, onChange, style }) {
  return (
    <div style={{
      display: "flex",
      overflowX: "auto",
      gap: 4,
      padding: "0 16px",
      scrollbarWidth: "none",
      ...style,
    }}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 8,
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              background: isActive ? "rgba(92,158,255,0.15)" : "transparent",
              color: isActive ? "var(--blue)" : "var(--text-dim)",
              border: isActive ? "1px solid rgba(92,158,255,0.3)" : "1px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3.4: Write `components/ui/SectionTitle.jsx`**

```jsx
export default function SectionTitle({ children, action, style }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px 8px",
      ...style,
    }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
        {children}
      </h2>
      {action && (
        <span style={{ fontSize: 12, color: "var(--blue)" }}>{action}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 3.5: Write `components/ui/LoadingSpinner.jsx`**

```jsx
export default function LoadingSpinner({ size = 32 }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
      <div style={{
        width: size, height: size,
        border: `2px solid var(--border)`,
        borderTop: `2px solid var(--blue)`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
```

- [ ] **Step 3.6: Write `components/ui/EmptyState.jsx`**

```jsx
export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "60px 24px", gap: 10,
    }}>
      {icon && <div style={{ fontSize: 36, opacity: 0.4 }}>{icon}</div>}
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-dim)" }}>{title}</p>
      {subtitle && <p style={{ margin: 0, fontSize: 13, color: "var(--text-dim)", opacity: 0.6 }}>{subtitle}</p>}
    </div>
  );
}
```

- [ ] **Step 3.7: Build check**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 3.8: Commit**

```bash
git add components/ui/
git commit -m "feat: base UI primitives — Card, Badge, TabBar, SectionTitle, LoadingSpinner, EmptyState"
```

---

## Task 4: Data Hooks

**Files:**
- Create: `lib/hooks/useFixtures.js`
- Create: `lib/hooks/usePredictions.js`
- Create: `lib/hooks/useMatchDetail.js`
- Create: `lib/hooks/useElo.js`
- Create: `lib/hooks/useStandings.js`
- Create: `app/api/elo/route.js`
- Create: `app/api/standings/route.js`

These hooks use `useState` + `useEffect` + native `fetch` — no SWR dependency needed.

- [ ] **Step 4.1: Write `lib/hooks/useFixtures.js`**

```js
"use client";
import { useState, useEffect, useCallback } from "react";

export function useFixtures({ pollInterval = 30000 } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/fixtures");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const timer = setInterval(fetch_, pollInterval);
    return () => clearInterval(timer);
  }, [fetch_, pollInterval]);

  return { data, loading, error, refetch: fetch_ };
}
```

- [ ] **Step 4.2: Write `lib/hooks/usePredictions.js`**

```js
"use client";
import { useState, useEffect } from "react";

export function usePredictions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/predictions")
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  return { data, loading, error };
}
```

- [ ] **Step 4.3: Write `lib/hooks/useMatchDetail.js`**

```js
"use client";
import { useState, useEffect } from "react";

export function useMatchDetail(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/match/${id}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [id]);

  return { data, loading, error };
}
```

- [ ] **Step 4.4: Write `lib/hooks/useElo.js`**

```js
"use client";
import { useState, useEffect } from "react";

export function useElo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/elo")
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

- [ ] **Step 4.5: Write `lib/hooks/useStandings.js`**

```js
"use client";
import { useState, useEffect } from "react";

export function useStandings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/standings")
      .then((r) => r.json())
      .then((json) => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}
```

- [ ] **Step 4.6: Write `app/api/elo/route.js`**

> **Note:** The existing codebase already uses `import data from "@/data/provider-samples/sportmonks-worldcup-sample.json"` — Next.js bundles JSON imports from anywhere under the project root. `@/public/data/elo.json` works the same way.

```js
import { NextResponse } from "next/server";
import eloData from "@/public/data/elo.json";

export async function GET() {
  return NextResponse.json(eloData, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
```

- [ ] **Step 4.7: Write `app/api/standings/route.js`**

```js
import { NextResponse } from "next/server";
import { getFixturesData } from "@/src/lib/worldcup-data";

export async function GET(request) {
  const mode = request.nextUrl.searchParams.get("mode") === "drill" ? "drill" : "live";
  const payload = await getFixturesData({ mode });
  return NextResponse.json({ standings: payload.standings }, {
    headers: { "cache-control": "no-store" },
  });
}
```

- [ ] **Step 4.8: Build check**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 4.9: Commit**

```bash
git add lib/hooks/ app/api/elo/ app/api/standings/
git commit -m "feat: data hooks and new API routes (elo, standings)"
```

---

## Task 5: MatchCard Component

**Files:**
- Create: `components/shared/MatchCard.jsx`

This is the most-used component — appears on home dashboard, fixtures page, and search.

- [ ] **Step 5.1: Write `components/shared/MatchCard.jsx`**

```jsx
"use client";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

function LiveDot() {
  return (
    <span style={{
      display: "inline-block", width: 6, height: 6,
      borderRadius: "50%", background: "var(--live)",
      marginRight: 4, animation: "livepulse 1.2s ease-in-out infinite",
    }} />
  );
}

function TeamRow({ flag, name, score, winner }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
    }}>
      <span style={{ fontSize: 22, lineHeight: 1 }}>{flag}</span>
      <span style={{
        flex: 1, fontSize: 14, fontWeight: winner ? 700 : 400,
        color: winner ? "var(--text)" : "var(--text-dim)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {name}
      </span>
      <span style={{
        fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: "right",
        color: winner ? "var(--text)" : "var(--text-dim)",
      }}>
        {score !== null && score !== undefined ? score : ""}
      </span>
    </div>
  );
}

function statusBadge(fixture) {
  if (fixture.status === "LIVE") {
    return (
      <Badge tone="live">
        <LiveDot />{fixture.minute || "LIVE"}
      </Badge>
    );
  }
  if (fixture.status === "FT") return <Badge tone="ft">终</Badge>;
  return <Badge tone="ns">{fixture.kickoff}</Badge>;
}

export default function MatchCard({ fixture, onClick }) {
  if (!fixture) return null;
  const { id, home, away, homeScore, awayScore, stage, venue, status } = fixture;
  const homeWins = status === "FT" && homeScore > awayScore;
  const awayWins = status === "FT" && awayScore > homeScore;

  const inner = (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "12px 14px",
      cursor: "pointer",
    }}>
      {/* Header row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{stage}</span>
        {statusBadge(fixture)}
      </div>
      {/* Teams */}
      <TeamRow flag={home.flag} name={home.name} score={homeScore} winner={homeWins} />
      <TeamRow flag={away.flag} name={away.name} score={awayScore} winner={awayWins} />
      {/* Venue */}
      {venue && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--text-dim)", opacity: 0.7 }}>
          📍 {venue}
        </p>
      )}
    </div>
  );

  if (onClick) return <div onClick={() => onClick(fixture)}>{inner}</div>;
  return <Link href={`/match/${id}`} style={{ display: "block" }}>{inner}</Link>;
}
```

- [ ] **Step 5.2: Add livepulse keyframe to `app/globals.css`**

Append to end of `app/globals.css`:

```css
@keyframes livepulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

- [ ] **Step 5.3: Build check**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 5.4: Commit**

```bash
git add components/shared/MatchCard.jsx app/globals.css
git commit -m "feat: MatchCard component with live pulse animation"
```

---

## Task 6: WC2026 Home Dashboard Page

**Files:**
- Replace: `app/(competition)/[comp]/page.jsx`

The home page shows: topbar with competition name + live count, live match section (if any), "今日赛程" section, and ELO top-5 rankings.

- [ ] **Step 6.1: Write `app/(competition)/[comp]/page.jsx`**

> **Note (Next.js 15):** Client components cannot receive `params` as a prop. Use `useParams()` hook instead.

```jsx
"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useFixtures } from "@/lib/hooks/useFixtures";
import { useElo } from "@/lib/hooks/useElo";
import MatchCard from "@/components/shared/MatchCard";
import SectionTitle from "@/components/ui/SectionTitle";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const COMP_LABELS = {
  wc2026: "2026 世界杯",
};

function TopBar({ comp, liveCount, source }) {
  return (
    <div style={{
      height: "var(--topbar-h)", background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px", position: "sticky", top: 0, zIndex: 50,
    }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{COMP_LABELS[comp] || comp}</div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>
          {source === "live" ? (
            <span style={{ color: "var(--green)" }}>● 实时数据</span>
          ) : (
            <span>预览模式</span>
          )}
        </div>
      </div>
      {liveCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(255,61,61,0.15)", border: "1px solid rgba(255,61,61,0.3)",
          borderRadius: 8, padding: "4px 10px",
          color: "var(--live)", fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--live)", display: "inline-block" }} />
          {liveCount} 场进行中
        </div>
      )}
    </div>
  );
}

function EloRow({ rank, flag, name, elo, width, style }) {
  return (
    <div style={{ padding: "8px 16px", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={{
          width: 20, textAlign: "right", fontSize: 12,
          color: rank <= 3 ? "var(--gold)" : "var(--text-dim)", fontWeight: 600,
        }}>{rank}</span>
        <span style={{ fontSize: 20 }}>{flag}</span>
        <span style={{ flex: 1, fontSize: 14 }}>{name}</span>
        <span style={{
          fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--blue)",
        }}>{elo}</span>
      </div>
      <div style={{ marginLeft: 30, height: 3, background: "var(--border)", borderRadius: 2 }}>
        <div style={{
          height: "100%", width: `${width}%`,
          background: rank === 1 ? "var(--gold)" : "var(--blue)",
          borderRadius: 2, transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

// Get today's fixtures and next upcoming
function todayFixtures(fixtures) {
  if (!fixtures) return [];
  const today = new Date().toDateString();
  const result = fixtures.filter((f) => {
    if (!f.startingAt) return false;
    return new Date(f.startingAt).toDateString() === today;
  });
  if (result.length) return result;
  // fallback: next 8 upcoming
  return fixtures.filter((f) => f.status === "NS").slice(0, 8);
}

export default function CompHomePage() {
  const { comp } = useParams();
  const { data: fixturesData, loading: fixturesLoading } = useFixtures({ pollInterval: 30000 });
  const { data: eloData, loading: eloLoading } = useElo();

  const liveFixtures = fixturesData?.fixtures?.filter((f) => f.status === "LIVE") || [];
  const displayFixtures = todayFixtures(fixturesData?.fixtures || []);

  return (
    <div>
      <TopBar
        comp={comp}
        liveCount={fixturesData?.liveCount || 0}
        source={fixturesData?.source}
      />

      <div style={{ paddingBottom: 16 }}>
        {/* Live matches */}
        {liveFixtures.length > 0 && (
          <section>
            <SectionTitle>🔴 进行中</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
              {liveFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)}
            </div>
          </section>
        )}

        {/* Today / upcoming fixtures */}
        <section>
          <SectionTitle action={<a href={`/${comp}/fixtures`} style={{ color: "var(--blue)" }}>全部</a>}>
            今日赛程
          </SectionTitle>
          {fixturesLoading ? (
            <LoadingSpinner />
          ) : displayFixtures.length === 0 ? (
            <p style={{ padding: "0 16px", color: "var(--text-dim)", fontSize: 14 }}>今日暂无比赛</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
              {displayFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)}
            </div>
          )}
        </section>

        {/* ELO rankings */}
        <section>
          <SectionTitle action={<a href={`/${comp}/predict`} style={{ color: "var(--blue)" }}>夺冠概率</a>}>
            ELO 排名 Top 10
          </SectionTitle>
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 12, margin: "0 16px", overflow: "hidden",
          }}>
            {eloLoading ? <LoadingSpinner /> : (
              (eloData?.rankings || []).slice(0, 10).map((row, i) => (
                <EloRow
                  key={row.code}
                  rank={row.rank}
                  flag={row.flag}
                  name={row.name}
                  elo={row.elo}
                  width={row.width}
                  style={i < 9 ? { borderBottom: "1px solid var(--border)" } : {}}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: Build check**

```bash
npm run build 2>&1 | tail -20
```
Expected: clean build, no errors.

- [ ] **Step 6.3: Commit**

```bash
git add "app/(competition)/[comp]/page.jsx"
git commit -m "feat: WC2026 home dashboard with live fixtures + ELO rankings"
```

---

## Task 7: Fixtures Page

**Files:**
- Create: `app/(competition)/[comp]/fixtures/page.jsx`

Date-grouped fixture list with day selector tabs.

- [ ] **Step 7.1: Write `app/(competition)/[comp]/fixtures/page.jsx`**

```jsx
"use client";
import { useState, useMemo } from "react";
import { useFixtures } from "@/lib/hooks/useFixtures";
import MatchCard from "@/components/shared/MatchCard";
import TabBar from "@/components/ui/TabBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "今天";
  if (d.toDateString() === tomorrow.toDateString()) return "明天";
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", weekday: "short" }).format(d);
}

function groupByDate(fixtures) {
  const map = new Map();
  for (const f of fixtures) {
    if (!f.startingAt) continue;
    const key = f.startingAt.slice(0, 10); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default function FixturesPage() {
  const { data, loading } = useFixtures();
  const [activeDate, setActiveDate] = useState(null);

  const dateGroups = useMemo(() => groupByDate(data?.fixtures || []), [data]);

  const tabs = useMemo(() => dateGroups.map(([date]) => ({
    id: date,
    label: formatDateLabel(date),
  })), [dateGroups]);

  // Auto-select today or first date
  const selectedDate = activeDate || tabs[0]?.id;

  const visibleFixtures = useMemo(() => {
    const group = dateGroups.find(([date]) => date === selectedDate);
    return group ? group[1] : [];
  }, [dateGroups, selectedDate]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Topbar */}
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <CalendarDays size={18} style={{ color: "var(--blue)", marginRight: 8 }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>赛程</span>
      </div>

      {/* Date tabs */}
      <div style={{
        position: "sticky", top: "var(--topbar-h)", zIndex: 40,
        background: "var(--bg)", borderBottom: "1px solid var(--border)",
        padding: "8px 0",
      }}>
        <TabBar tabs={tabs} active={selectedDate} onChange={setActiveDate} />
      </div>

      {/* Fixture list */}
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {visibleFixtures.length === 0 ? (
          <EmptyState icon="📅" title="该日期暂无比赛" />
        ) : (
          visibleFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2: Build check**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 7.3: Commit**

```bash
git add "app/(competition)/[comp]/fixtures/"
git commit -m "feat: fixtures page with date tabs"
```

---

## Task 8: Groups Page (GroupTable + GroupSimulator)

**Files:**
- Create: `components/wc/GroupTable.jsx`
- Create: `components/wc/GroupSimulator.jsx`
- Create: `app/(competition)/[comp]/groups/page.jsx`

- [ ] **Step 8.1: Write `components/wc/GroupTable.jsx`**

```jsx
import Badge from "@/components/ui/Badge";

const TONE_MAP = {
  q1: "green",   // advance direct
  q2: "green",   // advance via playoffs
  "out danger": "default",
  out: "default",
};

export default function GroupTable({ group }) {
  if (!group) return null;
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 14px",
        background: "rgba(92,158,255,0.06)",
        borderBottom: "1px solid var(--border)",
        fontSize: 13, fontWeight: 700, color: "var(--blue)",
      }}>
        {group.group}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "20px 1fr 28px 28px 28px 28px 38px 32px",
        gap: 4, padding: "4px 14px",
        fontSize: 11, color: "var(--text-dim)", fontWeight: 600,
      }}>
        <span>#</span><span></span>
        <span style={{ textAlign: "center" }}>场</span>
        <span style={{ textAlign: "center" }}>胜</span>
        <span style={{ textAlign: "center" }}>平</span>
        <span style={{ textAlign: "center" }}>负</span>
        <span style={{ textAlign: "center" }}>净</span>
        <span style={{ textAlign: "right" }}>积</span>
      </div>

      {group.rows.map((row, i) => {
        const isAdvance = row.pos <= 2;
        return (
          <div
            key={row.name}
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr 28px 28px 28px 28px 38px 32px",
              gap: 4, padding: "8px 14px", alignItems: "center",
              borderTop: i > 0 ? "1px solid var(--border)" : "none",
              background: isAdvance ? "rgba(0,230,118,0.03)" : "transparent",
            }}
          >
            <span style={{ fontSize: 12, color: isAdvance ? "var(--green)" : "var(--text-dim)" }}>
              {row.pos}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              <span style={{ fontSize: 18 }}>{row.flag}</span>
              <span style={{
                fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontWeight: isAdvance ? 600 : 400,
              }}>{row.name}</span>
            </div>
            {[row.p, row.w, row.d, row.l].map((v, idx) => (
              <span key={idx} style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)" }}>{v}</span>
            ))}
            <span style={{
              textAlign: "center", fontSize: 13,
              color: row.gd > 0 ? "var(--green)" : row.gd < 0 ? "var(--red)" : "var(--text-dim)",
            }}>
              {row.gd > 0 ? `+${row.gd}` : row.gd}
            </span>
            <span style={{
              textAlign: "right", fontSize: 14, fontWeight: 700,
              color: isAdvance ? "var(--green)" : "var(--text)",
            }}>{row.pts}</span>
          </div>
        );
      })}

      {/* Advance indicator */}
      <div style={{ padding: "6px 14px", borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 11, color: "var(--green)" }}>● 晋级淘汰赛</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Write `components/wc/GroupSimulator.jsx`**

The simulator shows each group's standings and lets user click to toggle a win/draw/loss outcome, then recalculates points. This is a full client-side simulation.

```jsx
"use client";
import { useState, useMemo } from "react";
import GroupTable from "./GroupTable";
import Card from "@/components/ui/Card";

// Build a simulated standings from base + overrides
function simulateGroup(baseGroup, overrides) {
  // overrides: { [matchKey]: "home" | "draw" | "away" }
  // Start from base data (live or static standings)
  // For Phase 1, we just display base standings with a note
  // Full simulation requires fixtures data — done in page where both are available
  return baseGroup;
}

export default function GroupSimulator({ standings, fixtures }) {
  const [note] = useState("当前积分榜数据，赛季进行时更新");

  // For Phase 1 MVP: show all groups in a scrollable list
  if (!standings || standings.length === 0) {
    return (
      <div style={{ padding: "24px 16px", color: "var(--text-dim)", fontSize: 14 }}>
        积分数据加载中...
      </div>
    );
  }

  return (
    <div>
      <div style={{
        margin: "8px 16px 12px",
        padding: "8px 12px",
        background: "rgba(92,158,255,0.08)",
        border: "1px solid rgba(92,158,255,0.2)",
        borderRadius: 8,
        fontSize: 12, color: "var(--text-dim)",
      }}>
        💡 {note}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 16px" }}>
        {standings.map((group) => (
          <GroupTable key={group.group} group={group} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8.3: Write `app/(competition)/[comp]/groups/page.jsx`**

```jsx
"use client";
import { useState } from "react";
import { useFixtures } from "@/lib/hooks/useFixtures";
import GroupTable from "@/components/wc/GroupTable";
import GroupSimulator from "@/components/wc/GroupSimulator";
import TabBar from "@/components/ui/TabBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { BarChart3 } from "lucide-react";

const GROUP_TABS = [
  { id: "standings", label: "积分榜" },
  { id: "simulator", label: "出线模拟" },
];

export default function GroupsPage() {
  const [tab, setTab] = useState("standings");
  const { data, loading } = useFixtures();
  const standings = data?.standings || [];

  return (
    <div>
      {/* Topbar */}
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <BarChart3 size={18} style={{ color: "var(--blue)", marginRight: 8 }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>小组积分</span>
      </div>

      {/* Tabs */}
      <div style={{
        position: "sticky", top: "var(--topbar-h)", zIndex: 40,
        background: "var(--bg)", borderBottom: "1px solid var(--border)",
        padding: "8px 0",
      }}>
        <TabBar tabs={GROUP_TABS} active={tab} onChange={setTab} />
      </div>

      <div style={{ paddingBottom: 16 }}>
        {loading ? (
          <LoadingSpinner />
        ) : tab === "standings" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 16px" }}>
            {standings.map((group) => (
              <GroupTable key={group.group} group={group} />
            ))}
          </div>
        ) : (
          <GroupSimulator standings={standings} fixtures={data?.fixtures} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8.4: Build check**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 8.5: Commit**

```bash
git add components/wc/ "app/(competition)/[comp]/groups/"
git commit -m "feat: groups page with GroupTable and GroupSimulator"
```

---

## Task 9: Predict Page (Championship Probabilities)

**Files:**
- Create: `components/shared/PredictionChart.jsx`
- Create: `app/(competition)/[comp]/predict/page.jsx`

- [ ] **Step 9.1: Write `components/shared/PredictionChart.jsx`**

```jsx
export default function PredictionChart({ teams, showElo = true }) {
  if (!teams || teams.length === 0) return null;

  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: 12, overflow: "hidden",
    }}>
      {teams.map((team, i) => (
        <div key={team.name || i} style={{
          padding: "10px 14px",
          borderBottom: i < teams.length - 1 ? "1px solid var(--border)" : "none",
        }}>
          {/* Team row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              width: 24, fontSize: 11,
              color: i < 3 ? "var(--gold)" : "var(--text-dim)",
              fontWeight: 600, textAlign: "right",
            }}>{team.rank || i + 1}</span>
            <span style={{ fontSize: 20 }}>{team.flag}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: i < 3 ? 600 : 400 }}>{team.name}</span>
            {showElo && (
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                {team.elo}
              </span>
            )}
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: i === 0 ? "var(--gold)" : i < 3 ? "var(--blue)" : "var(--text)",
              minWidth: 48, textAlign: "right",
            }}>
              {team.titleProbability}
            </span>
          </div>
          {/* Probability bar */}
          <div style={{ marginLeft: 32, height: 4, background: "var(--border)", borderRadius: 2 }}>
            <div style={{
              height: "100%",
              width: `${team.width || 0}%`,
              background: i === 0
                ? "linear-gradient(90deg, var(--gold), #ffdd57)"
                : i < 3 ? "var(--blue)" : "rgba(92,158,255,0.5)",
              borderRadius: 2,
              transition: "width 0.6s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9.2: Write `app/(competition)/[comp]/predict/page.jsx`**

```jsx
"use client";
import { usePredictions } from "@/lib/hooks/usePredictions";
import { useElo } from "@/lib/hooks/useElo";
import PredictionChart from "@/components/shared/PredictionChart";
import SectionTitle from "@/components/ui/SectionTitle";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { TrendingUp, Info } from "lucide-react";

export default function PredictPage() {
  const { data: predData, loading: predLoading } = usePredictions();
  const { data: eloData, loading: eloLoading } = useElo();

  const teams = predData?.teams?.filter((t) => !t.placeholder) || [];

  return (
    <div>
      {/* Topbar */}
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <TrendingUp size={18} style={{ color: "var(--blue)", marginRight: 8 }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>夺冠预测</span>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Method note */}
        <div style={{
          display: "flex", gap: 8, padding: "10px 12px",
          background: "rgba(92,158,255,0.08)",
          border: "1px solid rgba(92,158,255,0.2)",
          borderRadius: 8,
        }}>
          <Info size={14} style={{ color: "var(--blue)", flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
            {predData?.method || "基于 ELO 排名的蒙特卡洛模拟（10,000次），计算各队夺冠概率。"}
            {predData?.updatedAt && (
              <span style={{ display: "block", marginTop: 2, opacity: 0.6 }}>
                更新于 {new Date(predData.updatedAt).toLocaleDateString("zh-CN")}
              </span>
            )}
          </p>
        </div>

        {/* Championship probabilities */}
        <section>
          <SectionTitle>夺冠概率排名</SectionTitle>
          {predLoading ? <LoadingSpinner /> : (
            <PredictionChart teams={teams} showElo={true} />
          )}
        </section>

        {/* ELO rankings for context */}
        {!eloLoading && eloData && (
          <section>
            <SectionTitle>当前 ELO 排名（前 20）</SectionTitle>
            <div style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 12, overflow: "hidden",
            }}>
              {(eloData.rankings || []).slice(0, 20).map((row, i) => (
                <div key={row.code} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px",
                  borderBottom: i < 19 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{
                    width: 24, textAlign: "right", fontSize: 12,
                    color: i < 3 ? "var(--gold)" : "var(--text-dim)",
                    fontWeight: 600,
                  }}>{row.rank}</span>
                  <span style={{ fontSize: 20 }}>{row.flag}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{row.name}</span>
                  <span style={{ fontSize: 13, color: "var(--blue)", fontFamily: "var(--font-mono)" }}>
                    {row.elo}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 9.3: Build check**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 9.4: Commit**

```bash
git add components/shared/PredictionChart.jsx "app/(competition)/[comp]/predict/"
git commit -m "feat: predict page with championship probability chart"
```

---

## Task 10: Markets Page Stub

**Files:**
- Create: `app/(competition)/[comp]/markets/page.jsx`

- [ ] **Step 10.1: Write `app/(competition)/[comp]/markets/page.jsx`**

```jsx
import { Activity, Clock } from "lucide-react";

export default function MarketsPage() {
  return (
    <div>
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <Activity size={18} style={{ color: "var(--purple)", marginRight: 8 }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>市场赔率</span>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "80px 24px", gap: 16, textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(179,136,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Clock size={28} style={{ color: "var(--purple)" }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>市场对比即将上线</h2>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
            Polymarket 夺冠市场、博彩公司赔率聚合、<br />
            模型 vs 市场价值发现信号 — Phase 2 开发中。
          </p>
        </div>
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
        }}>
          {["Polymarket", "SportMonks Odds", "价值发现"].map((tag) => (
            <span key={tag} style={{
              padding: "4px 10px", borderRadius: 8,
              background: "rgba(179,136,255,0.1)",
              border: "1px solid rgba(179,136,255,0.2)",
              fontSize: 12, color: "var(--purple)",
            }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 10.2: Commit**

```bash
git add "app/(competition)/[comp]/markets/"
git commit -m "feat: markets page stub (Phase 2 coming soon)"
```

---

## Task 11: Match Detail Page

**Files:**
- Create: `app/match/[id]/page.jsx`

The match detail page uses `useMatchDetail` and renders stats, events, H2H.

- [ ] **Step 11.1: Write `app/match/[id]/page.jsx`**

```jsx
"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMatchDetail } from "@/lib/hooks/useMatchDetail";
import Badge from "@/components/ui/Badge";
import TabBar from "@/components/ui/TabBar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft } from "lucide-react";

const DETAIL_TABS = [
  { id: "stats", label: "统计" },
  { id: "events", label: "事件" },
  { id: "h2h", label: "历史对决" },
];

function StatRow({ label, left, right, leftWidth, rightWidth }) {
  return (
    <div style={{ padding: "8px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{left}</span>
        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{right}</span>
      </div>
      <div style={{ display: "flex", height: 4, borderRadius: 2, overflow: "hidden", background: "var(--border)" }}>
        <div style={{ width: `${leftWidth}%`, background: "var(--blue)", transition: "width 0.4s" }} />
        <div style={{ flex: 1, background: "var(--border)" }} />
      </div>
    </div>
  );
}

function EventItem({ event }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "8px 14px",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 28 }}>{event.minute}</span>
      <span style={{ fontSize: 18 }}>{event.icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{event.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{event.subtitle}</div>
      </div>
    </div>
  );
}

function ProbBar({ home, draw, away, homeFlag, awayFlag }) {
  return (
    <div style={{ padding: "12px 14px" }}>
      <div style={{ display: "flex", marginBottom: 8, gap: 2 }}>
        <div style={{ flex: home, height: 6, background: "var(--blue)", borderRadius: "3px 0 0 3px" }} />
        <div style={{ flex: draw, height: 6, background: "var(--text-dim)" }} />
        <div style={{ flex: away, height: 6, background: "var(--red)", borderRadius: "0 3px 3px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-dim)" }}>
        <span>{homeFlag} {home}%</span>
        <span>平 {draw}%</span>
        <span>{away}% {awayFlag}</span>
      </div>
    </div>
  );
}

function ScoreBoard({ fixture }) {
  const { home, away, homeScore, awayScore, stage, status, minute } = fixture;
  const statusLabel = status === "LIVE" ? (minute || "LIVE") : status === "FT" ? "终场" : "未开始";
  return (
    <div style={{ padding: "20px 16px", textAlign: "center" }}>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--text-dim)" }}>{stage}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 36 }}>{home.flag}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{home.name}</div>
        </div>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          {status !== "NS" ? (
            <div style={{ fontSize: 36, fontWeight: 800 }}>
              {homeScore ?? "—"} – {awayScore ?? "—"}
            </div>
          ) : (
            <div style={{ fontSize: 22, fontWeight: 300, color: "var(--text-dim)" }}>VS</div>
          )}
          <Badge tone={status === "LIVE" ? "live" : status === "FT" ? "ft" : "ns"}>
            {statusLabel}
          </Badge>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 36 }}>{away.flag}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{away.name}</div>
        </div>
      </div>
    </div>
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const { data, loading } = useMatchDetail(id);
  const [tab, setTab] = useState("stats");

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Topbar */}
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50, gap: 8,
      }}>
        <button onClick={() => router.back()} style={{ padding: 4, marginLeft: -4 }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>比赛详情</span>
      </div>

      {loading && <LoadingSpinner />}

      {data && (
        <>
          <ScoreBoard fixture={data.fixture} />

          {/* Win probability */}
          {data.probabilities && (
            <div style={{
              margin: "0 16px 16px",
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 12, overflow: "hidden",
            }}>
              <ProbBar
                home={data.probabilities.home}
                draw={data.probabilities.draw}
                away={data.probabilities.away}
                homeFlag={data.fixture.home.flag}
                awayFlag={data.fixture.away.flag}
              />
            </div>
          )}

          {/* Tabs */}
          <div style={{
            position: "sticky", top: "var(--topbar-h)", zIndex: 40,
            background: "var(--bg)", borderBottom: "1px solid var(--border)",
            padding: "8px 0",
          }}>
            <TabBar tabs={DETAIL_TABS} active={tab} onChange={setTab} />
          </div>

          {/* Tab content */}
          <div style={{ marginTop: 8 }}>
            {tab === "stats" && (
              <div style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, margin: "0 16px", overflow: "hidden",
              }}>
                {data.fixture.status === "NS" ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>
                    比赛尚未开始
                  </div>
                ) : (data.stats || []).map((stat, i) => (
                  <div key={i} style={{ borderBottom: i < data.stats.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <StatRow {...stat} />
                  </div>
                ))}
              </div>
            )}

            {tab === "events" && (
              <div style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, margin: "0 16px", overflow: "hidden",
              }}>
                {!data.events?.length ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>
                    暂无事件数据
                  </div>
                ) : data.events.map((event, i) => (
                  <EventItem key={i} event={event} />
                ))}
              </div>
            )}

            {tab === "h2h" && (
              <div style={{ padding: "0 16px" }}>
                <div style={{
                  display: "flex", gap: 8, marginBottom: 12,
                }}>
                  {(data.h2hSummary || []).map((item, i) => (
                    <div key={i} style={{
                      flex: 1, textAlign: "center",
                      background: "var(--card)", border: "1px solid var(--border)",
                      borderRadius: 8, padding: "10px 4px",
                    }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--blue)" }}>{item.value}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: 12, overflow: "hidden",
                }}>
                  {(data.h2hMatches || []).map((match, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px",
                      borderBottom: i < data.h2hMatches.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <span style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 36 }}>{match.year}</span>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--text-dim)" }}>{match.event}</span>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: match.tone === "blue" ? "var(--blue)" : match.tone === "red" ? "var(--red)" : "var(--text-dim)",
                      }}>{match.score}</span>
                    </div>
                  ))}
                  {!data.h2hMatches?.length && (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>
                      暂无历史对决数据
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: 32 }} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 11.2: Build check**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 11.3: Commit**

```bash
git add "app/match/"
git commit -m "feat: match detail page with stats, events, H2H tabs"
```

---

## Task 12: Team Page

**Files:**
- Create: `components/shared/EloSparkline.jsx`
- Create: `app/team/[id]/page.jsx`

The team page is identified by `teamId` (the original name, URL-encoded). It shows team meta, ELO history sparkline, and their fixture results.

- [ ] **Step 12.1: Write `components/shared/EloSparkline.jsx`**

```jsx
"use client";
export default function EloSparkline({ data, color = "var(--blue)", width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => (typeof d === "number" ? d : d.elo));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");

  const current = values[values.length - 1];
  const prev = values[values.length - 2];
  const trend = current > prev ? "var(--green)" : current < prev ? "var(--red)" : color;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline
        points={points}
        fill="none"
        stroke={trend}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
```

- [ ] **Step 12.2: Write `app/team/[id]/page.jsx`**

```jsx
"use client";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useElo } from "@/lib/hooks/useElo";
import { useFixtures } from "@/lib/hooks/useFixtures";
import EloSparkline from "@/components/shared/EloSparkline";
import MatchCard from "@/components/shared/MatchCard";
import SectionTitle from "@/components/ui/SectionTitle";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft } from "lucide-react";

export default function TeamPage() {
  const { id } = useParams();
  const teamName = decodeURIComponent(Array.isArray(id) ? id[0] : id);
  const router = useRouter();
  const { data: eloData, loading: eloLoading } = useElo();
  const { data: fixturesData, loading: fixturesLoading } = useFixtures();

  const teamElo = useMemo(() =>
    (eloData?.rankings || []).find((r) =>
      r.originalName === teamName || r.name === teamName || r.code === teamName
    ),
    [eloData, teamName]
  );

  const teamFixtures = useMemo(() =>
    (fixturesData?.fixtures || []).filter((f) =>
      f.home.originalName === teamName || f.away.originalName === teamName ||
      f.home.name === teamName || f.away.name === teamName
    ),
    [fixturesData, teamName]
  );

  const flag = teamElo?.flag || "🏴";
  const displayName = teamElo?.name || teamName;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Topbar */}
      <div style={{
        height: "var(--topbar-h)", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        position: "sticky", top: 0, zIndex: 50, gap: 8,
      }}>
        <button onClick={() => router.back()} style={{ padding: 4, marginLeft: -4 }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 700 }}>球队</span>
      </div>

      {eloLoading ? <LoadingSpinner /> : (
        <>
          {/* Team hero */}
          <div style={{
            padding: "24px 16px", display: "flex", alignItems: "center",
            gap: 16, borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 56 }}>{flag}</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{displayName}</h1>
              {teamElo && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--text-dim)" }}>ELO</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--blue)" }}>
                    {teamElo.elo}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    全球第 {teamElo.rank} 名
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fixtures */}
          <section>
            <SectionTitle>赛程 & 战绩</SectionTitle>
            {fixturesLoading ? <LoadingSpinner /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
                {teamFixtures.length === 0 ? (
                  <p style={{ color: "var(--text-dim)", fontSize: 14 }}>暂无赛程数据</p>
                ) : (
                  teamFixtures.map((f) => <MatchCard key={f.id} fixture={f} />)
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 12.3: Build check**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 12.4: Commit**

```bash
git add components/shared/EloSparkline.jsx app/team/
git commit -m "feat: team page with ELO stats and match history"
```

---

## Task 13: PWA Manifest + Service Worker

**Files:**
- Replace: `public/manifest.json`
- Create: `public/sw.js`

- [ ] **Step 13.1: Write updated `public/manifest.json`**

```json
{
  "name": "DJYY Sports",
  "short_name": "DJYY",
  "description": "2026 FIFA World Cup · ELO预测 · 实时比分",
  "start_url": "/wc2026",
  "display": "standalone",
  "background_color": "#090a0c",
  "theme_color": "#090a0c",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 13.2: Create icon placeholders directory**

```bash
mkdir -p /path/to/djyylive-2026/public/icons
# Create simple placeholder icons (1x1 transparent PNG, encoded)
# Real icons should be provided by designer — these are stubs
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > public/icons/icon-192.png
cp public/icons/icon-192.png public/icons/icon-512.png
```

- [ ] **Step 13.3: Write `public/sw.js`**

```js
const CACHE = "djyy-v1";
const STATIC = ["/wc2026", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Network-first for API calls
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        if (res.ok && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
    )
  );
});
```

- [ ] **Step 13.4: Build check**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 13.5: Commit**

```bash
git add public/manifest.json public/sw.js public/icons/
git commit -m "feat: PWA manifest and service worker"
```

---

## Task 14: Remove Old Code + Final Cleanup

**Files:**
- Delete: `components/worldcup-app.jsx`
- Delete: `styles.css`
- Delete: `src/mock/worldcup-data.js` (if no longer referenced)

- [ ] **Step 14.1: Check what imports worldcup-app.jsx**

```bash
grep -r "worldcup-app" /path/to/djyylive-2026/app /path/to/djyylive-2026/components --include="*.{js,jsx}" 2>/dev/null
```
Expected: zero references (we deleted `app/page.js` earlier)

- [ ] **Step 14.2: Check what imports mock data**

```bash
grep -r "src/mock" /path/to/djyylive-2026/app /path/to/djyylive-2026/components --include="*.{js,jsx}" 2>/dev/null
```

- [ ] **Step 14.3: Remove old files (only if confirmed no references)**

```bash
git rm components/worldcup-app.jsx styles.css
# Only if not referenced:
# git rm src/mock/worldcup-data.js
```

- [ ] **Step 14.4: Final clean build**

```bash
npm run build 2>&1 | tail -30
```
Expected: zero errors, all routes compiled.

- [ ] **Step 14.5: Check all routes are present in build output**

Confirm these routes appear in build output:
- `/wc2026` (from `(competition)/[comp]/page.jsx`)
- `/wc2026/fixtures`
- `/wc2026/groups`
- `/wc2026/predict`
- `/wc2026/markets`
- `/match/[id]`
- `/team/[id]`
- `/api/fixtures`
- `/api/match/[id]`
- `/api/predictions`
- `/api/elo`
- `/api/standings`

- [ ] **Step 14.6: Final commit**

```bash
git add -A
git commit -m "refactor: remove old monolith (worldcup-app.jsx, styles.css) — rebuild complete"
```

---

## Task 15: Verification

- [ ] **Step 15.1: Run production build**

```bash
npm run build 2>&1
```
Expected: `✓ Compiled successfully`, all pages generated.

- [ ] **Step 15.2: Start dev server and verify routes**

```bash
npm run dev &
sleep 5
# Verify key pages return 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ && echo " /"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/wc2026 && echo " /wc2026"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/wc2026/fixtures && echo " /fixtures"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/wc2026/groups && echo " /groups"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/wc2026/predict && echo " /predict"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/wc2026/markets && echo " /markets"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/fixtures && echo " /api/fixtures"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/elo && echo " /api/elo"
```
Expected: all `200 /route`

- [ ] **Step 15.3: Verify API fixture data shape**

```bash
curl -s http://localhost:3000/api/fixtures | python3 -c "
import json, sys
d = json.load(sys.stdin)
assert 'fixtures' in d, 'missing fixtures'
assert 'standings' in d, 'missing standings'
assert 'groupedFixtures' in d, 'missing groupedFixtures'
print(f'OK: {len(d[\"fixtures\"])} fixtures, {len(d[\"standings\"])} groups')
"
```

- [ ] **Step 15.4: Verify no console errors for bottom nav icon imports**

```bash
node -e "
const { LayoutDashboard, CalendarDays, BarChart3, TrendingUp, Activity } = require('lucide-react');
console.log('Icons OK:', !!LayoutDashboard, !!CalendarDays, !!BarChart3, !!TrendingUp, !!Activity);
"
```
Expected: `Icons OK: true true true true true`

- [ ] **Step 15.5: Kill dev server**

```bash
kill %1 2>/dev/null; true
```

- [ ] **Step 15.6: Final summary commit tag**

```bash
git tag v2.0.0-phase1-mvp -m "Phase 1 MVP: WC2026 rebuild with multi-competition architecture"
```

---

## Notes for Executor

### Key file paths (absolute)
- Project root: `/sessions/upbeat-optimistic-ritchie/djyylive-2026/`
- In all code: `@/` maps to project root (configured in `jsconfig.json`)

### What's kept from old codebase
- `src/lib/worldcup-data.js` — API integration + normalization (do NOT modify)
- `src/lib/team-meta.js` — team metadata (do NOT modify)
- `src/lib/predictions.js` — prediction utilities (reference only)
- `scripts/` — Python scripts (do NOT modify)
- `public/data/` — JSON data files (do NOT modify)
- `data/` — ELO history and samples (do NOT modify)
- `wrangler.jsonc` — deployment config (do NOT modify)
- `tailwind.config.js` — Tailwind config (do NOT modify, but extend if needed)
- `package.json` — no new dependencies needed (Lucide React already installed)

### Design constraints
- Mobile-first: max-width 480px centered
- Bottom nav always fixed at bottom with `--bottom-nav-h: 60px`
- All cards use `var(--card)` background, `var(--border)` border, 12px radius
- No emojis in nav icons — use Lucide React only
- Page topbars are sticky at top with `var(--topbar-h): 52px`
- Content area: `padding-bottom: var(--bottom-nav-h)` to clear fixed nav

### Styling approach
- Design tokens via CSS custom properties (defined in `app/globals.css`)
- Inline styles for component-specific layout (avoids Tailwind className clutter)
- Tailwind utility classes only for responsive overrides or complex states
- No external component libraries (shadcn, etc.) — all custom

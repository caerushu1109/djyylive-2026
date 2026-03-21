# Data Flow Reference

Complete mapping of every data pipeline in djyylive-2026, from source to display.

---

## 1. Data Source -> Hook -> API Route Mapping

### 1.1 useFixtures (lib/hooks/useFixtures.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/fixtures` |
| **API route** | `app/api/fixtures/route.js` -> `getFixturesData()` in `src/lib/worldcup-data.js` |
| **Upstream source** | SportMonks `/fixtures/between/{from}/{to}` (with standings), fallback to `data/provider-samples/sportmonks-worldcup-sample.json` |
| **Polling** | 30s default, exponential backoff on failure, stops after `2026-07-20` |
| **Caching** | Module-level `_cache` with 30s TTL (survives client navigations) |

**Response shape:**
```
{
  source: "sportmonks" | "sample",
  fixtures: [                    // normalizeFixture() output
    {
      id: string,
      stage: string,             // e.g. "A组 第1轮"
      group: string,             // e.g. "A组"
      status: "NS" | "LIVE" | "FT",
      minute: string,            // e.g. "45'" or "20:00"
      kickoff: string,
      home: { flag, name, originalName, elo: null, isTbd },
      away: { flag, name, originalName, elo: null, isTbd },
      homeScore: number | null,
      awayScore: number | null,
      venue: string,
      isLive: boolean,
      startingAt: string (ISO),
      rawState, seasonId,
    }
  ],
  groupedFixtures: [{ label: string, matches: fixture[] }],
  standings: [{ group: string, rows: [{ pos, flag, name, originalName, p, w, d, l, gf, ga, gd, pts, tone }] }],
  liveCount: number,
  updatedAt: string (ISO),
  mode: "live" | "drill" | "sample",
}
```

**Consumed by:** `CompHomePage` (L168), `FixturesClient` (L150), `TeamPage` (L5)

---

### 1.2 useMatchDetail (lib/hooks/useMatchDetail.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/match/{id}` |
| **API route** | `app/api/match/[id]/route.js` -> `getMatchDetail()` in `src/lib/worldcup-data.js` |
| **Upstream source** | SportMonks `/fixtures/{id}` with includes: `participants;scores;state;venue;round;group;events.type;statistics.type;lineups.details.type;formations`, plus separate odds and predictions fetches |
| **Polling** | 30s when match is LIVE, exponential backoff on failure |

**Response shape:**
```
{
  fixture: { ...normalizeFixture() },  // same shape as fixtures[]
  stats: [{ label, left, right, leftWidth, rightWidth }],  // buildAllStats()
  events: [{ minute, minuteLabel, icon, type, title, subtitle, team, teamMeta, assist }],
  lineups: { home: { formation, coach, starting: [{number, name, position}], bench }, away: {...} } | null,
  odds: {
    "1X2": [{ bookmaker, home, draw, away }],  // decimal odds per bookmaker
    asian_handicap_all: [{ bookmaker, line, home, away }],
    over_under_all: [{ bookmaker, line, over, under }],
    asian_handicap: { bookmaker, line, home, away } | null,  // legacy single
    over_under: { bookmaker, line, over, under } | null,      // legacy single
  } | null,
  predictions: {
    home_win: number | null,  // from SportMonks predictions API
    draw: number | null,
    away_win: number | null,
    btts_yes: null,
    over_2_5: null,
    correct_score: null,
  } | null,
  teams: { home: string, away: string },  // originalName strings
}
```

**Consumed by:** Match detail page `app/match/[id]/page.jsx` (L1502)

---

### 1.3 usePredictions (lib/hooks/usePredictions.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/predictions` |
| **API route** | `app/api/predictions/route.js` -> `getPredictionsData()` in `src/lib/predictions.js` |
| **Upstream source** | Static file `public/data/predictions.json` (pre-computed Monte Carlo simulation) |
| **Caching** | `s-maxage=60, stale-while-revalidate=300` |

**Response shape:**
```
{
  updatedAt: string,
  simulationCount: 10000,
  method: string,  // description of simulation methodology
  teams: [
    {
      rank: number,
      flag: string,         // emoji
      name: string,         // Chinese name, e.g. "西班牙"
      code: string,         // ISO 2-letter, e.g. "ES"
      elo: number,          // e.g. 2172
      eloWithBonus: number,
      isHost: boolean,
      titleProbability: string,  // e.g. "22.0%"
      probabilityValue: number,  // e.g. 21.99
      pQualify: number,    // % probability
      pR16: number,
      pQF: number,
      pSF: number,
      pFinal: number,
      pChampion: number,
    }
  ],
}
```

**Consumed by:**
- `CompHomePage` (L170) -- `predData.teams` for top-6 display
- `FixturesClient` (L151) -- `predData.teams` passed as `predictions` to MatchCard
- `MatchCard` (L8, prop `predictions`) -- finds team by `name` or `code` to get ELO
- Match detail page (L1508) -- `predictionsData.teams` for TeamComparisonCard + poissonOdds computation
- Team detail page (L7) -- for ProgressionFunnel + ModelMarketCard

---

### 1.4 useTeamStrengths (lib/hooks/useTeamStrengths.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/team-strengths.json` (static file) |
| **Also available via** | `/api/team-strengths` route (reads same file server-side) |
| **Upstream source** | `public/data/team-strengths.json` (generated by build script from SportMonks season statistics) |
| **Caching** | Module-level `cache` (never re-fetches within session) |

**Response shape:**
```
{
  generatedAt: string,
  method: "Poisson hybrid model",
  parameters: { timeDecay, wcAverageGoals, dixonColesRho },
  tournamentAverages: { avgScored, avgConceded, avgCorners },
  teams: [
    {
      id: number,
      name: string,          // English name, e.g. "Mexico"
      shortCode: string,     // e.g. "MEX"
      attack: number,        // e.g. 0.691
      defense: number,       // e.g. 1.136
      cornerRate: number,
      avgScored: number,
      avgConceded: number,
      totalMatches: number,
      totalSeasons: number,
      fallback: boolean,
    }
  ],
}
```

**Consumed by:**
- `MatchCard` (L10) -- calls `findTeamStrength()` to look up attack/defense
- Match detail page (L1510) -- for poissonOdds computation

**Helper:** `findTeamStrength(strengths, teamName)` (L34-64) tries: direct match on `name`/`shortCode`, then converts Chinese to English via `toEnglishName()`, then fuzzy substring match.

---

### 1.5 useElo (lib/hooks/useElo.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/elo` |
| **API route** | `app/api/elo/route.js` -- imports `public/data/elo.json` directly |
| **Upstream source** | `public/data/elo.json` (scraped from eloratings.net World.tsv, filtered to WC 48 teams) |
| **Caching** | `max-age=3600` |

**Response shape:**
```
{
  updatedAt: string,
  source: "eloratings.net",
  rankings: [
    {
      rank: number,
      code: string,          // ISO 2-letter
      flag: string,
      name: string,          // Chinese name
      originalName: string,  // English name
      elo: number,
      placeholder: boolean,
      width: number,         // for bar chart rendering (0-100)
    }
  ],
}
```

**Consumed by:** `CompHomePage` (L169) -- for team href resolution (finding `originalName` from team code)

---

### 1.6 useEloTrends (lib/hooks/useEloTrends.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/elo-trends.json` (static file) |
| **Returns** | `json.teams` array |

**Response shape:** `data` = array of `{ code, name, points: [{ label, elo }] }`

**Consumed by:** Team detail page -- `GroupEloChart` component (L309)

**Helper:** `getTeamTrend(data, code)` finds team by ISO code.

---

### 1.7 useH2H (lib/hooks/useH2H.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/h2h/{key}.json` where key = `h2hKey(iso1, iso2)` (alphabetically sorted pair) |
| **Upstream source** | Pre-built static JSON files in `public/data/h2h/` |

**Response shape:**
```
{
  summary: { [isoCode]: winCount, draws: number },
  matches: [{ tournament, stage, home, away, homeScore, awayScore, homePen, awayPen, winner }],
}
```

**Consumed by:** Match detail page (L1509) -- `H2HSummaryCard` in TabOverview

---

### 1.8 useSquad (lib/hooks/useSquad.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/squads/{iso}.json` |
| **Upstream source** | Pre-built static JSON files in `public/data/squads/` |

**Consumed by:** Team detail page -- roster display

---

### 1.9 useTeamDetail (lib/hooks/useTeamDetail.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/team-detail/{iso}.json` |
| **Upstream source** | Pre-built static JSON files in `public/data/team-detail/` |

**Response shape:**
```
{
  confederation: string,
  totalStats: { ... },
  topPlayers: [...],
  tournaments: [{ year, stage, manager, cards, group, matches, squad }],
}
```

**Consumed by:** Team detail page -- TournamentAccordion, team stats

---

### 1.10 useTeamHistory (lib/hooks/useTeamHistory.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/wc-team-history.json` (single file, filters by ISO code) |

**Consumed by:** Team detail page -- historical World Cup appearances

---

### 1.11 usePolymarket (lib/hooks/usePolymarket.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/polymarket` (primary), direct Gamma API (fallback) |
| **API route** | `app/api/polymarket/route.js` -> fetches Gamma API with CORS proxy fallback |
| **Upstream source** | `gamma-api.polymarket.com/events?slug=2026-fifa-world-cup-winner-595` |

**Response shape:**
```
{
  teams: [{ name: string, probability: number }],  // from parseEvents()
  fetchedAt: string,
  source: "polymarket",
  method: "direct" | "proxy0" | "proxy1",
}
```

**Consumed by:** `CompHomePage` (L171) -- `OddsTicker` component; Team detail page -- `ModelMarketCard`

---

### 1.12 usePolymarketGroups (lib/hooks/usePolymarketGroups.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/polymarket-groups` |
| **API route** | Fetches 12 group winner markets from Gamma API in parallel |

**Response shape:** `{ groups: { [letter]: { [teamName]: probability } }, fetchedAt, count }`

**Consumed by:** Groups page (for group winner market odds)

---

### 1.13 useTopScorers (lib/hooks/useTopScorers.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/topscorers` |
| **API route** | `app/api/topscorers/route.js` -> `getTopScorers()` in worldcup-data.js |
| **Upstream source** | SportMonks `/topscorers/seasons/{id}`, fallback to sample data |

**Response shape:** `{ source, scorers: [{ player, playerId, playerNameEn, team, flag, teamMeta, goals, assists, matches, minutes }] }`

**Consumed by:** `CompHomePage` -> `TopScorersCard` (L96), Scorers page

---

### 1.14 useTopAssists (lib/hooks/useTopAssists.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/topassists` |
| **API route** | `app/api/topassists/route.js` -> `getTopAssists()` |

**Response shape:** Same as topscorers but with `assists` array instead of `scorers`

---

### 1.15 useHistoryData (lib/hooks/useHistoryData.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/history/{file}.json` (parameterized by `file` argument) |
| **Caching** | Module-level `cache` object keyed by filename |

**Consumed by:** History page components

---

### 1.16 usePlayerDetail (lib/hooks/usePlayerDetail.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/players/{id}.json` (historical) AND `/api/player/{id}` (live) in parallel |
| **API route** | `app/api/player/[id]/route.js` -> SportMonks `/players/{id}` |
| **Caching** | In-memory Map with 5-minute TTL |
| **Returns** | `{ historical, live, loading, error }` (two separate data objects) |

**Live response shape:**
```
{
  id: string,
  photo: string | null,
  height: string | null,
  weight: string | null,
  nationality: string | null,
  club: string | null,
  currentStats: { goals, assists, appearances, minutes, yellowCards, redCards },
}
```

---

### 1.17 usePlayerIndex (lib/hooks/usePlayerIndex.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/data/players/index.json` |
| **Caching** | Module-level singleton |
| **Returns** | `{ lookup(name) -> playerId, loading }` |

---

### 1.18 useStandings (lib/hooks/useStandings.js)

| Property | Value |
|----------|-------|
| **Fetches** | `/api/standings` |
| **API route** | `app/api/standings/route.js` -> `getFixturesData()` -> returns `{ standings }` subset |

---

### 1.19 Elo History (no hook -- inline fetch in component)

Used directly in `EloHistoryChart` component in team detail page (L222-232):
```js
fetch(`/api/elo-history?name=${encodeURIComponent(originalName)}&code=${encodeURIComponent(code)}`)
```

| Property | Value |
|----------|-------|
| **API route** | `app/api/elo-history/route.js` |
| **Upstream source** | `eloratings.net/{slug}.tsv` (fetched at request time) |
| **Response** | `{ team, slug, points: [{ year, elo }] }` (2006-2026 time series) |

---

### 1.20 Team Group (no hook -- inline fetch in component)

Used in `useTeamGroup()` (team detail page L52-72):
```js
fetch("/data/wc2026-groups.json")
```

---

## 2. Prediction Model Data Flow

### 2.1 Complete Pipeline: Source -> Lambda -> Odds -> Display

```
                    ┌──────────────────────┐
                    │   DATA SOURCES        │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
  predictions.json      team-strengths.json     fixture.venue
  (ELO ratings)        (attack/defense)        (host advantage)
          │                    │                     │
          ▼                    ▼                     ▼
  usePredictions()      useTeamStrengths()    getHostAdvantage()
  predData.teams[]      strengthsData          homeBoost, awayBoost
          │                    │                     │
          │    ┌───────────────┼─────────────────────┘
          │    │               │
          ▼    ▼               ▼
      ┌────────────────────────────────┐
      │   LAMBDA COMPUTATION           │
      │   (3-tier fallback)            │
      │                                │
      │  Tier 1: hybridLambda()        │  strength + ELO (both available)
      │  Tier 2: computeLambda()       │  strength only (no ELO)
      │  Tier 3: eloToLambda()         │  ELO only (no strength)
      └──────────────┬─────────────────┘
                     │
                     ▼  { home: number, away: number }
      ┌──────────────────────────────────┐
      │   computeMatchOdds(λH, λA)       │
      │   (lib/poisson.js)               │
      │                                  │
      │   buildScoreMatrix() + DC ρ      │
      │   ──────────────────────         │
      │   derive1X2()                    │
      │   findBestAsianHandicap()        │
      │   findBestOverUnder()            │
      │   deriveBTTS()                   │
      │   deriveCorrectScore()           │
      │   deriveCorners()                │
      └──────────────┬───────────────────┘
                     │
                     ▼  poissonOdds object
      ┌──────────────────────────────────┐
      │   DISPLAY COMPONENTS             │
      │                                  │
      │   MatchCard       -> result      │
      │   CompactModelSummary -> result  │
      │   TabAnalysis     -> all fields  │
      │   WinProbBar      -> predictions │
      └──────────────────────────────────┘
```

### 2.2 Lambda Computation Detail

#### Tier 1: hybridLambda() (lib/poisson.js L533)

Blends strength-based and ELO-based lambdas at 35/65 weight:

```
Inputs:
  homeStr.attack, homeStr.defense     (from team-strengths.json)
  awayStr.attack, awayStr.defense
  homePred.elo, awayPred.elo          (from predictions.json)
  homeBoost, awayBoost                (from getHostAdvantage())

Parameters:
  STRENGTH_WEIGHT = 0.35
  ELO divisor = 300, goalShareFactor = 0.8  (backtested aggressive params)
  avgGoals = 3.0

Output:
  { home: clamped(0.2, 4.0), away: clamped(0.2, 4.0) }
```

#### Tier 2: computeLambda() (lib/poisson.js L480)

Pure strength model:
```
λ_home = home_attack * away_defense * (avgGoals/2) * homeBoost
λ_away = away_attack * home_defense * (avgGoals/2) * awayBoost
```

#### Tier 3: eloToLambda() (lib/poisson.js L501)

ELO-only fallback with conservative defaults:
```
Parameters (standalone): divisor=400, goalShareFactor=0.6, avgGoals=2.6
homeExp = 1 / (1 + 10^(-diff/divisor))
homeGoalShare = 0.5 + (homeExp - 0.5) * goalShareFactor
λ_home = avgGoals * homeGoalShare
```

### 2.3 Host Advantage (lib/poisson.js L396-475)

```
getHostAdvantage(homeTeamName, awayTeamName, venue)
  -> looks up venue city in VENUE_COUNTRY map -> country code
  -> checks if either team is host via HOST_TEAMS map
  -> Returns: { homeBoost: 1.24, awayBoost: 0.92 } if host playing at home venue
              { homeBoost: 1.0,  awayBoost: 1.0 }  otherwise (neutral)
```

### 2.4 computeMatchOdds() Output Shape (lib/poisson.js L301)

This is the `poissonOdds` object used throughout:
```
{
  lambdaHome: number,       // rounded to 2 decimals
  lambdaAway: number,
  result: {
    homeWin: number,        // percentage, 1 decimal (e.g. 45.2)
    draw: number,
    awayWin: number,
  },
  overUnder: {
    line: number,           // auto-picked closest to 50-50
    over: number,           // percentage
    under: number,
  },
  asianHandicap: {
    line: number,           // auto-picked closest to 50-50
    home: number,           // percentage
    away: number,
  },
  btts: {
    yes: number,            // percentage
    no: number,
  },
  correctScore: [
    { score: "1-0", prob: 18.2 },  // top 6 most likely scores
    ...
  ],
  corners: {
    homeExpected: number,
    awayExpected: number,
    totalExpected: number,
    overUnder: [{ line, over, under }],  // at lines 8.5, 9.5, 10.5, 11.5
  },
  odds: {
    home: number,           // decimal odds with 5% margin
    draw: number,
    away: number,
  },
}
```

### 2.5 Where poissonOdds is Computed

**Match detail page** (app/match/[id]/page.jsx L1513-1563):
```jsx
const poissonOdds = useMemo(() => {
  // Only for pre-match (status === "NS")
  const homeStr = findTeamStrength(strengthsData, fixture.home.originalName);
  const awayStr = findTeamStrength(strengthsData, fixture.away.originalName);
  const homePred = predictionsData?.teams?.find(t => t.name === fixture.home.name || t.code === homeIso?.toUpperCase());
  const awayPred = predictionsData?.teams?.find(t => t.name === fixture.away.name || t.code === awayIso?.toUpperCase());
  const { homeBoost, awayBoost } = getHostAdvantage(fixture.home.originalName, fixture.away.originalName, fixture.venue);
  // 3-tier fallback: hybrid -> strength -> elo
}, [fixture, strengthsData, predictionsData, homeIso, awayIso]);
```

**MatchCard** (components/shared/MatchCard.jsx L29-72):
Same 3-tier computation but uses `predictions` prop (which is `predData.teams`) to find ELO.

**Key difference:** MatchCard receives `predictions` as a prop (the full `teams[]` array), while match detail page fetches `usePredictions()` directly.

---

## 3. Component Prop Reference

### 3.1 MatchCard (components/shared/MatchCard.jsx)

```jsx
<MatchCard
  fixture={fixture}          // REQUIRED: normalizeFixture() output
  onClick={fn}               // optional: override Link with custom handler
  predictions={predData.teams}  // optional: teams[] array from predictions.json
  showVenue={false}          // optional: show venue line
/>
```

**fixture** shape: see useFixtures response above. Key fields used:
- `fixture.id` -- for Link href
- `fixture.home.name` / `fixture.home.originalName` -- display + strength lookup
- `fixture.away.name` / `fixture.away.originalName`
- `fixture.home.flag` / `fixture.away.flag`
- `fixture.homeScore` / `fixture.awayScore`
- `fixture.status` -- "NS" | "LIVE" | "FT"
- `fixture.minute` / `fixture.kickoff`
- `fixture.group` / `fixture.venue`

**predictions** shape: Array of team objects. MatchCard finds teams by matching:
```js
predictions?.find(t => t.name === home.name || t.code === home.code)
```
It reads `.elo` from the matched team to feed into lambda computation.

### 3.2 WinProbBar (app/match/[id]/page.jsx L232)

```jsx
<WinProbBar
  predictions={predictions}   // from data.predictions (SportMonks match-level)
  fixture={fixture}
/>
```

**predictions** shape (NOT the same as predData.teams!):
```
{
  home_win: number | null,    // integer percentage, e.g. 55
  draw: number | null,
  away_win: number | null,
  btts_yes: number | null,    // integer percentage
  over_2_5: number | null,
  correct_score: string | null,  // e.g. "2-1"
}
```

This is `data.predictions` from the match detail API response -- per-match SportMonks predictions, NOT the tournament-level predictions.json.

### 3.3 TabAnalysis (app/match/[id]/page.jsx L736)

```jsx
<TabAnalysis
  data={data}                // full match detail API response
  poissonOdds={poissonOdds}  // computeMatchOdds() result or null
  fixture={fixture}          // data.fixture
/>
```

Destructures from `poissonOdds`:
- `poissonOdds.result` -> 1X2 comparison (homeWin, draw, awayWin)
- `poissonOdds.asianHandicap` -> AH comparison
- `poissonOdds.overUnder` -> O/U comparison
- `poissonOdds.btts` -> BTTS display
- `poissonOdds.corners` -> corner predictions
- `poissonOdds.correctScore` -> most likely scores
- `poissonOdds.lambdaHome`, `poissonOdds.lambdaAway` -> for line recalculation

Destructures from `data`:
- `data.odds["1X2"]` -> bookmaker odds for comparison
- `data.odds.asian_handicap_all` -> all AH lines from bookmakers
- `data.odds.over_under_all` -> all O/U lines from bookmakers

**Smart line matching:** When bookmaker offers a different line than the model, recalculates model probability at the bookmaker's line using `computeAHAtLine()` / `computeOUAtLine()`.

### 3.4 CompactModelSummary (app/match/[id]/page.jsx L521)

```jsx
<CompactModelSummary
  poissonOdds={poissonOdds}  // computeMatchOdds() result
  fixture={fixture}
  onSwitchTab={setTab}       // switches to "analysis" tab on click
/>
```

Uses only `poissonOdds.result` -> `{ homeWin, draw, awayWin }` for the probability bar.

### 3.5 TabOverview (app/match/[id]/page.jsx L551)

```jsx
<TabOverview
  data={data}                          // full match detail response
  onPlayerClick={handleEventPlayerClick}
  predictionsTeams={predictionsData?.teams}  // from usePredictions() - tournament level
  h2hData={h2hData}                    // from useH2H()
  homeIso={homeIso}
  awayIso={awayIso}
  poissonOdds={poissonOdds}            // computeMatchOdds() result
  onSwitchTab={setTab}
/>
```

When status === "NS": shows CompactModelSummary, TeamComparisonCard, MatchInfoCard, H2HSummaryCard.
When status !== "NS": shows WinProbBar (from `data.predictions`), key stats, recent events.

### 3.6 TeamComparisonCard (app/match/[id]/page.jsx L330)

```jsx
<TeamComparisonCard
  homePred={homePred}   // single team from predictionsData.teams
  awayPred={awayPred}
  fixture={fixture}
/>
```

Reads from pred object: `.elo`, `.rank`, `.titleProbability`, `.pQualify`

### 3.7 TabFixtures -- Team Page (app/team/[id]/page.jsx L811)

```jsx
<TabFixtures
  teamFixtures={teamFixtures}  // filtered fixtures for this team
  fixturesLoading={boolean}
  predictions={predictions}     // from usePredictions() -> data.teams
/>
```

Passes `predictions` through to `<MatchCard predictions={predictions} />`.

### 3.8 ProgressionFunnel -- Team Page (app/team/[id]/page.jsx L134)

```jsx
<ProgressionFunnel teamPred={teamPred} />
```

`teamPred` is a single team from `predData.teams`. Uses: `.rank`, `.probabilityValue`, `.pQualify`, `.pR16`, `.pQF`, `.pSF`, `.pFinal`, `.pChampion`.

### 3.9 ModelMarketCard -- Team Page (app/team/[id]/page.jsx L186)

```jsx
<ModelMarketCard modelPct={modelPct} marketPct={marketPct} />
```

- `modelPct`: from `predData.teams[].probabilityValue`
- `marketPct`: from Polymarket data, matched by team name via `EN_TO_ZH` mapping

---

## 4. Common Pitfalls

### 4.1 predData.teams vs data.predictions

**This is the #1 source of confusion.**

| | `predData.teams` | `data.predictions` |
|---|---|---|
| **Source** | `usePredictions()` -> `/api/predictions` -> `predictions.json` | `useMatchDetail()` -> `/api/match/{id}` -> SportMonks predictions API |
| **Scope** | Tournament-level (all 48 teams) | Per-match (single fixture) |
| **Contains** | ELO, rank, championship probability, stage probabilities | Win/draw/loss percentages for specific match |
| **Shape** | `{ teams: [{ name, code, elo, pChampion, ... }] }` | `{ home_win, draw, away_win, btts_yes, over_2_5 }` |
| **Used for** | Lambda computation (ELO input), team comparison cards | WinProbBar display (SportMonks AI prediction) |

**Bug pattern:** Passing `predData` to a component expecting `data.predictions` format, or vice versa.

### 4.2 Team Name Matching Across Sources

Three naming conventions exist:

| Source | Name format | Example |
|--------|------------|---------|
| `predictions.json` / `elo.json` | Chinese | "西班牙" |
| `team-strengths.json` | English | "Spain" |
| SportMonks fixture | Localized Chinese | "西班牙" (via locale=zh) |
| Polymarket | English | "Spain" |
| fixture.home.name | Chinese (via getTeamMeta) | "西班牙" |
| fixture.home.originalName | English (from SportMonks) | "Spain" |

**Matching strategies used:**
- `MatchCard` matches predictions by `t.name === home.name` (Chinese) OR `t.code === home.code` (ISO)
- `findTeamStrength()` matches by `name` (English), then tries `toEnglishName()` conversion, then fuzzy substring
- Match detail page (L1521-1526): matches by Chinese name OR ISO code
- Polymarket team names are mapped via `EN_TO_ZH` in `lib/polymarket-names.js`

**Bug pattern:** When SportMonks returns a team name that doesn't match predictions.json (e.g. "Korea Republic" vs "South Korea" vs "韩国"), ELO lookup fails silently and the model falls to a lower tier.

### 4.3 SportMonks Odds: Per-Outcome vs Per-Market

SportMonks returns odds as **individual outcome entries**, not grouped by market:

```json
// SportMonks returns 3 SEPARATE entries for 1X2:
{ "market_id": 1, "label": "Home", "value": "2.10", "bookmaker": { "name": "bet365" } }
{ "market_id": 1, "label": "Draw", "value": "3.30", "bookmaker": { "name": "bet365" } }
{ "market_id": 1, "label": "Away", "value": "3.60", "bookmaker": { "name": "bet365" } }
```

The grouping happens in `getMatchDetail()` (worldcup-data.js L583-635):
- 1X2 (market_id=1): grouped by bookmaker name
- Asian Handicap (market_id=28): grouped by `${bookmaker}|${line}`
- Over/Under (market_id=18): grouped by `${bookmaker}|${line}`

**Bug pattern:** Treating a single odds entry as a complete market (e.g. assuming `o.home` and `o.away` exist on the same object when they're actually separate entries).

### 4.4 Fixture Status Values

SportMonks state normalization (worldcup-data.js L16-30):
- `"live"`, `"inplay"`, `"ht"` -> `"LIVE"`
- `"ft"`, `"finished"`, `"after_penalties"` -> `"FT"`
- Everything else -> `"NS"` (not started)

**Bug pattern:** Checking for raw SportMonks values (e.g. `"finished"`) instead of normalized values (`"FT"`).

### 4.5 Prediction Model Tier Fallback

The 3-tier fallback in both MatchCard and match detail page means a match can silently use a less accurate model:

| Tier | Condition | Accuracy |
|------|-----------|----------|
| 1: Hybrid | Both strength AND ELO data available | Best (Brier 0.472) |
| 2: Strength-only | Strength available but no ELO match | Medium |
| 3: ELO-only | No strength data (uses conservative params) | Worst |

**Bug pattern:** Adding a new team to predictions.json but not to team-strengths.json (or vice versa) causes silent fallback to a worse model tier. No warning is logged.

### 4.6 Dixon-Coles rho Mismatch

Two different rho values are used in different contexts:
- `team-strengths.json` generation: `rho = -0.04` (parameters.dixonColesRho)
- `computeMatchOdds()`: `rho = -0.15` (backtested on 964 WC matches)

This is intentional but could cause confusion if someone tries to reproduce numbers.

### 4.7 ELO Divisor Inconsistency

There are TWO ELO-based probability systems:

1. **Poisson model** (via `eloToLambda` / `hybridLambda`): Uses ELO to compute goal lambdas, then Poisson for probabilities. Divisor=300 inside hybrid, divisor=400 for standalone.

2. **Legacy direct ELO** (match detail page L302-315): `computeEloProbabilities()` uses `ELO_DIVISOR=300`, `HOST_BONUS=110`, `DRAW_BASE=0.34` to compute probabilities directly (not via Poisson). This is used only in the legacy TeamComparisonCard context and is separate from the Poisson model.

### 4.8 Host Advantage: Two Different Systems

1. **Poisson model** (`getHostAdvantage()` in poisson.js): Applies lambda multipliers: `HOST_ADVANTAGE=1.24` for host, `HOST_OPPONENT_PENALTY=0.92` for opponent. Requires venue city match.

2. **Legacy ELO** (`computeEloProbabilities()` in match page): Adds `HOST_BONUS=110` ELO points to any host team (US/CA/MX), regardless of venue. Always applies when team code is in `HOST_CODES`.

### 4.9 In-Play Odds

`computeInPlayOdds()` (poisson.js L332) exists but is not currently wired to any component. It supports:
- Time-based lambda decay
- Red card adjustment (-18% per red card)
- Remaining-time score matrix

This is available for future integration with live match data.

### 4.10 Static Files vs API Routes

Some data is served both ways, which can cause staleness:

| Data | Static path | API route | Used by hooks |
|------|------------|-----------|---------------|
| team-strengths | `/data/team-strengths.json` | `/api/team-strengths` | Hook uses static path |
| elo.json | `/data/elo.json` (not direct) | `/api/elo` | Hook uses API |
| predictions | - | `/api/predictions` | Hook uses API |
| fixtures | - | `/api/fixtures` | Hook uses API |

The static-served files (`/data/...`) are under `public/data/` and update only on deploy. The API routes may have different caching behavior.

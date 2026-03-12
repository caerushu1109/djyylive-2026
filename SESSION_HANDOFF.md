# World Cup Project Handoff

## Current Direction

This project is no longer a generic football demo. It is being shaped into a World Cup portal with:

- tournament-first homepage during the competition period
- deep history content as the long-tail differentiator
- team archive pages
- Elo-based prediction tools
- event pages reserved for live/API integration
- future bilingual structure in Chinese and English

## Product Decisions Already Made

### Homepage priority

The homepage should prioritize match consumption during the 2026 World Cup:

1. featured fixtures / today's key matches
2. group standings / group overview
3. Live entry
4. deeper content such as history, teams, prediction

History remains important, but it is not the first thing most users should see during the tournament.

### Navigation

Main nav is now intended to stay consistent across the site:

`首页 -> 赛程 -> 历史 -> 预测 -> 球队`

`赛程` is immediately after `首页`.
`Live` is no longer a top-level nav item. It now sits under the event flow:

- `schedule.html`
- `live.html`
- `match.html`

### History module

The original single long history page was split into:

- `history.html`
- `history-upsets.html`
- `history-archive.html`
- `history-players.html`
- `history-matches.html`

Localized history pages already created:

- `zh/history.html`
- `en/history.html`
- `zh/history-upsets.html`
- `en/history-upsets.html`
- `zh/history-archive.html`
- `en/history-archive.html`
- `zh/history-players.html`
- `en/history-players.html`
- `zh/history-matches.html`
- `en/history-matches.html`

Reason:

- the old history page was too long
- the new structure is easier to read
- each subpage can later become a stronger SEO / editorial destination

### Team module

The team area was refactored into:

- `teams.html` as team hub
- `team-history.html` as single-team deep page

### Event module

Event pages already exist as product shells:

- `schedule.html`
- `live.html`
- `match.html`

They are intended to be upgraded later with real live API data.

### Prediction

`prediction.html` is based on Elo logic and should remain as an explainable tool page, not a black-box odds page.

## Data Sources In Use

### 1. Elo historical source

User-provided Excel:

- `1930-2022世界杯elo.xlsx`

Use cases:

- upsets
- Elo shocks
- champion strength
- strongest teams without a title
- collapse rankings
- Elo-based prediction logic

### 2. World Cup historical structured data

GitHub source:

- `https://github.com/jfjelstul/worldcup`

This is already integrated into the project through generated data:

- `scripts/build_worldcup_archive.py`
- `src/worldcup-archive.js`

Use cases:

- tournaments
- matches
- players
- awards
- referees
- managers
- venues
- hosts
- groups
- event-level history

### 3. 2026 tournament data

Current 2026 data file:

- `src/wc2026-data.js`

This file now contains:

- 2026 group structure
- 2026 schedule framework
- placeholders for still-unconfirmed playoff slots
- homepage poll defaults
- countdown target

Important:

- this is based on official 2026 schedule/group structure
- some teams are still placeholders because final playoff outcomes are not yet fully settled

## Key Files

### Core rendering

- `src/app.js`
- `styles.css`

### Homepage

- `index.html`

### History

- `history.html`
- `history-upsets.html`
- `history-archive.html`
- `history-players.html`
- `history-matches.html`

### Teams

- `teams.html`
- `team-history.html`

### Event pages

- `schedule.html`
- `live.html`
- `match.html`

### Prediction / article / trends

- `prediction.html`
- `article.html`

## UI / UX Decisions Already Applied

- long history page split into subpages
- navigation unified across pages
- `赛程` and `Live` promoted in nav
- homepage hero upgraded
- homepage four entry cards upgraded into more editorial portal-style cards
- copy rewritten to sound less like a demo/prototype
- hover states and current-page hierarchy improved

## Important Current State

The old hardcoded demo match data has been replaced by 2026-oriented schedule/group data:

- `src/app.js` now imports data from `src/wc2026-data.js`

Homepage fixtures and group tables now use that new source.

Live and schedule pages now support pre-tournament empty-state logic so they do not look broken before kickoff.

There is now also a real adapter architecture in place:

- `src/matchday-normalizers.js`
- `src/provider-mappers.js`
- `src/matchday-adapter.js`
- `src/api-adapter-example.js`

The site is now phase-aware:

- `pre_match`
- `in_match`
- `post_match`

This means the next major step is provider hookup, not page redesign.

There is now also a runtime source switch:

- default local seed mode
- provider-sample mode via `?source=provider-sample`
- SportMonks real-shape sample mode via `?source=sportmonks-live-sample`
- SportMonks live-request mode via `?source=sportmonks-live`

Files involved:

- `src/matchday-source.js`
- `src/provider-sample-payload.js`
- `src/provider-sample-state.js`
- `src/sportmonks-live-sample-payload.js`
- `PROVIDER_ONBOARDING.md`
- `PROVIDER_SWAP_GUIDE.md`
- `API_BUY_DECISION.md`
- `PROVIDER_SELECTION_TEMPLATE.md`
- `MAIN_DOMAIN_CUTOVER.md`

The user has now verified real SportMonks responses for:

- fixture detail with `participants;scores;state;venue;events.type;lineups.details.type;statistics.type`
- standings with `participant;rule;details`

The next practical step is no longer provider research. It is:

1. map real SportMonks payloads into the current adapter layer
2. use the runtime sample switch to validate schedule/live/match rendering
3. then move from sample payload files to a real fetch-backed source

There is now a local live-config pattern:

- template: `data/provider-live-config.example.json`
- local ignored file: `data/provider-live-config.json`
- runtime loader: `src/provider-live-runtime.js`

There is also now a local captured-payload path:

- local ignored folder: `data/provider-live/`
- expected files:
  - `sportmonks-fixture.json`
  - `sportmonks-standings.json`
- runtime source:
  - `?source=sportmonks-captured`

Once the user regenerates their SportMonks token and saves the ignored config file, these routes can attempt real provider fetches:

- `/schedule.html?source=sportmonks-live`
- `/live.html?source=sportmonks-live`
- `/match.html?id=18528480&source=sportmonks-live`

If browser-to-provider fetch is inconvenient or blocked by CORS, the preferred local validation route is now:

- save real Postman-exported JSON into `data/provider-live/`
- run the local site
- open:
  - `/schedule.html?source=sportmonks-captured`
  - `/live.html?source=sportmonks-captured`
  - `/match.html?id=18528480&source=sportmonks-captured`

## Next Recommended Task

Next task should be provider selection and payload hookup:

1. choose the football data provider
2. collect one real sample payload
3. test it against `src/provider-mappers.js`
4. fill missing field mappings
5. run the validator
6. then buy the API plan

## Future Architecture Decision

The site should be prepared for bilingual support:

- `/zh/...`
- `/en/...`

Recommended implementation model:

- shared data layer
- shared templates
- separate translation dictionary / copy layer

Do not duplicate raw match/group/history data for each language.

## How To Resume Next Time

When continuing this project in a future session, start with:

1. read `SESSION_HANDOFF.md`
2. read `API_BUY_DECISION.md`
3. read `PROVIDER_ONBOARDING.md`
4. read `src/matchday-source.js`
5. then continue provider hookup first

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

`首页 -> 赛程 -> Live -> 历史 -> 预测 -> 球队档案 ...`

`赛程` is immediately after `首页`.
`Live` is always visible in the main nav and should not be hidden behind schedule-only pages.

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

## Next Recommended Task

Next task should be:

### Refine the homepage page-by-page

Specifically:

- polish tournament-first homepage hierarchy
- make featured fixtures and standings even more prominent
- make homepage feel more premium and editorial
- then continue page-by-page refinement after homepage

Recommended order after that:

1. homepage
2. history hub
3. upsets / Elo page
4. archive page
5. team hub
6. team deep page
7. schedule / live / match

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
2. read `src/wc2026-data.js`
3. read `src/app.js`
4. then continue the homepage refinement first

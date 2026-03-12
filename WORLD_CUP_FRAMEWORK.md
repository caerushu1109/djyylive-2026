# World Cup Site Framework

## Positioning

This project is a World Cup special site focused on three pillars:

- History
- Data analysis
- Prediction

The current prototype is intentionally split from any existing production site so the information architecture can be stabilized first.

## Phase 1 Core Pages

- `/world-cup`
  - homepage and traffic router
- `/world-cup/history`
  - flagship history page
- `/world-cup/prediction`
  - Elo-driven prediction and matchup model
- `/world-cup/schedule`
  - schedule shell, later backed by a live data API
- `/world-cup/live`
  - matchday live shell
- `/world-cup/match/[id]`
  - match detail template
- `/world-cup/team-history`
  - full World Cup archive for a single team
- `/world-cup/trends`
  - SVG-based chart and trend page

## Reserved Phase 2 Pages

- `/world-cup/standings`
- `/world-cup/bracket`
- `/world-cup/teams/[team]`
- `/world-cup/players/[player]`
- `/world-cup/features/[slug]`

## Page Roles

### Homepage

Primary job:

- route users into schedule, history, prediction, and team archives

Required modules:

- hero
- key entry cards
- featured rankings
- selected teams
- selected stories
- latest schedule highlights

### History

Primary job:

- become the most differentiated and most shareable page on the site

Required modules:

- overview stats
- upset rankings
- Elo shockwave rankings
- tournament chaos index
- champion strength rankings
- strongest never-champions
- single-tournament collapse rankings
- team vault
- match explorer
- timeline

### Prediction

Primary job:

- convert Elo data into reusable user-facing tools

Required modules:

- assumptions
- matchup calculator
- simplified title odds
- future simulation hooks

### Schedule

Primary job:

- high-frequency page during the 2026 tournament

Required modules:

- stage filter
- date filter
- team filter
- match cards
- match detail entry

### Live

Primary job:

- high-frequency matchday entry point during the tournament

Required modules:

- live now
- upcoming matches
- watchlist
- jump to match detail

### Match Detail

Primary job:

- become the atomic page for live data, events, and stats

Required modules:

- match hero
- event timeline
- technical stats
- related entry points

### Team History

Primary job:

- long-tail SEO landing page and deep retention page

Required modules:

- record summary
- goals for/against
- upset record
- full World Cup match archive
- team Elo curve

Required modules:

- champion distribution
- goals trend
- chaos trend
- strongest never-champions chart

## Data Source Split

### Elo spreadsheet

Use for:

- upset rankings
- Elo swing rankings
- prediction model
- champion strength
- strongest never-champions
- collapse rankings
- team strength curves

### worldcup GitHub dataset

Use for:

- tournament metadata
- rounds and stages
- venues and host countries
- players and squads
- event-level match facts
- standings and bracket structures

### Live API in 2026

Use for:

- live scores
- match status
- standings refresh
- knockout bracket refresh
- event timeline

## Development Order

1. Stabilize page structure and reusable modules
2. Expand history page until it becomes the strongest page on the site
3. Improve team archive and trends pages
4. Add schedule and match-detail templates
5. Attach worldcup dataset
6. Attach live API closer to the 2026 tournament
7. Decide whether to merge into an existing site or deploy independently

## Current Repo Mapping

- `index.html`
- `history.html`
- `prediction.html`
- `schedule.html`
- `live.html`
- `schedule.html` detail state
- `team-history.html`
- `src/history-data.js`
- `src/history-generated.js`
- `src/prediction-data.js`
- `src/app.js`

## Notes

- Do not bind live frontend behavior directly to third-party HTML pages.
- Keep Elo as an analysis layer, not the primary fact source.
- Prefer scheduled ingest jobs over client-side scraping.

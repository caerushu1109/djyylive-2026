# WorldCup Pulse

A static World Cup special-site prototype focused on history, data analysis, and Elo-based prediction.

## Current Pages

- `index.html`
- `history.html`
- `prediction.html`
- `schedule.html`
- `live.html`
- `match.html`
- `team-history.html`
- `teams.html`
- `article.html`

## Run

Serve the repo root as static files:

```bash
cd /Users/caerushu/Documents/New\ project
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080/index.html`
- `http://localhost:8080/history.html`
- `http://localhost:8080/prediction.html`
- `http://localhost:8080/schedule.html`
- `http://localhost:8080/live.html`
- `http://localhost:8080/match.html?id=wc26-eng-cro`
- `http://localhost:8080/team-history.html`

## Data Layers

- `src/history-data.js`
  - curated rankings and editorial history data
- `src/history-generated.js`
  - generated full-match archive and curve data from the historical Elo spreadsheet
- `src/prediction-data.js`
  - prediction model inputs

## Planning Docs

- `WORLD_CUP_FRAMEWORK.md`
  - site structure, routing, page roles, and source split
- `SESSION_HANDOFF.md`
  - continue-from-here handoff for future sessions
- `I18N_ROADMAP.md`
  - bilingual rollout notes for `/zh` and `/en`
- `API_REQUIREMENTS.md`
  - required data contract before buying a football API
- `API_BUY_DECISION.md`
  - practical checklist for deciding when to buy the football API
- `LAUNCH_CHECKLIST.md`
  - minimum launch gate before binding a real domain
- `DEPLOYMENT.md`
  - deployment and domain-binding steps

## Launch Foundation

This repo now includes basic launch/deploy assets:

- `404.html`
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`
- `vercel.json`

## Elo Update Workflow

The site should not fetch third-party Elo pages directly from the browser.

Use:

```bash
python3 scripts/update_elo_snapshot.py saved-eloratings-page.html
```

This converts a saved `eloratings.net` snapshot into normalized JSON under `data/elo/latest.json`.

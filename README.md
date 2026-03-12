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
- `PROVIDER_ONBOARDING.md`
  - first-day sequence for wiring a real football data provider
- `PROVIDER_SELECTION_TEMPLATE.md`
  - comparison template for choosing the football data provider
- `PROVIDER_SWAP_GUIDE.md`
  - exact file-level switch points when moving from seed data to a real provider
- `MAIN_DOMAIN_CUTOVER.md`
  - final domain cutover checklist for moving from preview to `djyylive.com`
- `LAUNCH_CHECKLIST.md`
  - minimum launch gate before binding a real domain
- `DEPLOYMENT.md`
  - deployment and domain-binding steps
- `data/provider-samples/sportmonks-worldcup-sample.json`
  - sample provider payload for adapter tests

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

## Provider Payload Check

Before buying a football API, validate one real sample payload:

```bash
python3 scripts/validate_matchday_provider.py data/provider-samples/sportmonks-worldcup-sample.json
```

## Provider-Sample Preview

The site can already preview a provider-backed runtime state without changing page templates:

- `/schedule.html?source=provider-sample`
- `/live.html?source=provider-sample`
- `/match.html?id=2026002&source=provider-sample`

There is now also a real-shape SportMonks runtime sample wired into the same source layer:

- `/schedule.html?source=sportmonks-live-sample`
- `/live.html?source=sportmonks-live-sample`
- `/match.html?id=19609127&source=sportmonks-live-sample`

## Live Provider Config

To test a real provider request locally without committing secrets:

1. copy `data/provider-live-config.example.json`
2. save it as `data/provider-live-config.json`
3. replace the placeholder token with a regenerated SportMonks token

That live config file is git-ignored.

Once it exists, these routes will try the real provider first and fall back safely if the request fails:

- `/schedule.html?source=sportmonks-live`
- `/live.html?source=sportmonks-live`
- `/match.html?id=19609127&source=sportmonks-live`

## Cloudflare SportMonks Proxy

For deployed preview and production, the site now prefers a same-origin proxy at:

- `/api/sportmonks/runtime`

This keeps the SportMonks token out of the browser. To enable it on Cloudflare Pages:

1. open the `djyylive-worldcup` Pages project
2. go to `Settings -> Environment variables`
3. add:
   - `SPORTMONKS_API_TOKEN`
4. optionally add:
   - `SPORTMONKS_BASE_URL`

Once that secret exists, these deployed routes can use real SportMonks data safely:

- `/schedule.html?source=sportmonks-live`
- `/live.html?source=sportmonks-live`
- `/match.html?id=19609127&source=sportmonks-live`

## Captured Provider Preview

For a more stable local test flow, save exported SportMonks JSON under:

- `data/provider-live/sportmonks-fixture.json`
- `data/provider-live/sportmonks-fixtures.json`
- `data/provider-live/sportmonks-standings.json`

Use the singular file for one detailed match and the plural file for extra match rows, so `schedule` and `live` can preview multiple fixtures at once.

Then open locally:

- `/schedule.html?source=sportmonks-captured`
- `/live.html?source=sportmonks-captured`
- `/match.html?id=19609127&source=sportmonks-captured`

This avoids browser CORS issues because the site only reads local JSON files served from the same static server.

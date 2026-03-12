# Project Handoff

Last updated: 2026-03-13

## Current status

- Project is live on [2026.djyylive.com](https://2026.djyylive.com)
- Deployment target is Cloudflare Workers
- GitHub repo in use is `caerushu1109/djyylive-2026`
- Main product flow is working with real SportMonks data
- A separate drill mode now exists for rehearsal and does not replace the live data path

## Confirmed working

- `https://2026.djyylive.com/api/fixtures` now returns `source: "sportmonks"` in live mode
- Cloudflare custom domain binding for `2026.djyylive.com` is active
- Cloudflare runtime secrets were corrected so the Worker can read `SPORTMONKS_API_TOKEN`
- Frontend no longer flashes the original mock fixture list before real data arrives
- Fixture, standings, and match detail loading states were added
- Drill mode toggle was added in the top bar

## Current modes

- `正式`
  Uses real SportMonks fixture and match detail data
- `演练中`
  Uses the built-in rehearsal fixture flow for:
  - home page live banner
  - fixtures page
  - standings page
  - match detail page

The selected mode is stored in browser local storage.

## Important files

- App shell and page logic:
  [components/worldcup-app.jsx](/Users/caerushu/Documents/New%20project/components/worldcup-app.jsx)
- Global styles:
  [app/globals.css](/Users/caerushu/Documents/New%20project/app/globals.css)
- Live fixtures API:
  [app/api/fixtures/route.js](/Users/caerushu/Documents/New%20project/app/api/fixtures/route.js)
- Match detail API:
  [app/api/match/[id]/route.js](/Users/caerushu/Documents/New%20project/app/api/match/%5Bid%5D/route.js)
- SportMonks normalization and fallback logic:
  [src/lib/worldcup-data.js](/Users/caerushu/Documents/New%20project/src/lib/worldcup-data.js)
- Predictions snapshot loader:
  [src/lib/predictions.js](/Users/caerushu/Documents/New%20project/src/lib/predictions.js)
- Cloudflare/OpenNext config:
  [wrangler.jsonc](/Users/caerushu/Documents/New%20project/wrangler.jsonc)
  [open-next.config.ts](/Users/caerushu/Documents/New%20project/open-next.config.ts)

## Recent deployment-related fixes

- `f936d5f` Remove fs dependency from worker routes
- `744b854` Remove fs dependency from predictions route
- `166189e` Use explicit OpenNext Cloudflare config
- `bea5565` Remove R2 cache requirement from Cloudflare deploy
- `24ae5a0` Polish production loading state
- `6b99660` Add fixture loading and empty states
- `c297aec` Add drill mode for match rehearsal

## Notes about deployment

- Cloudflare project name: `djyylive-2026`
- Domain in use: `2026.djyylive.com`
- Old domains/projects were intentionally not reused
- Current deployment flow relies on:
  - GitHub push
  - Cloudflare auto build
- Key runtime config:
  - `SPORTMONKS_API_TOKEN` must exist as a secret
  - `SPORTMONKS_BASE_URL` must exist as a variable

## Known product state

- Core stages from the brief are implemented:
  - stage 1 static frame
  - stage 2 real data access
  - stage 3 live refresh behavior
  - stage 4 enhancement features
- Additional post-launch hardening has started
- Some page content, copy, and layout still need manual product refinement from the user

## Recommended next steps

1. Push commit `c297aec` and confirm drill mode appears online
2. Run a full rehearsal in `演练中` mode:
   - home page live banner
   - fixtures page
   - standings page
   - match detail page
3. Collect user-requested content and layout changes page by page
4. Continue online polish only after rehearsal flow feels stable
5. Later, wire daily Elo updates into production automation

## Important caution

- Do not remove the live SportMonks path while refining rehearsal mode
- Do not reuse old Cloudflare projects or old broken subdomains
- If runtime data falls back again, first check:
  - Cloudflare secret presence
  - deployed version
  - `/api/fixtures` response source and diagnostics

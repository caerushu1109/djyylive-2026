# Cloudflare Deployment

## Recommended Path

This project is a Next.js 14 app with App Router and API routes, so it should be deployed as a Cloudflare full-stack app on Workers, not as a static Pages export.

Recommended setup:

1. GitHub as the source of truth
2. Cloudflare Workers deployment for this repository
3. `main` branch as production
4. Custom domain: `2026.djyylive.com`
5. GitHub Actions updates Elo JSON once per day
6. Cloudflare rebuilds and redeploys after each push

## Before Deploying

Make sure these are ready:

1. A clean production branch
2. One Cloudflare project for this version only
3. One active domain target only
4. SportMonks token available

Because you mentioned there are old failed versions, do not reuse those old project names blindly. First confirm which Cloudflare Worker / build target and which domain binding should remain active.

## Required Environment Variables

Set these in Cloudflare build variables / secrets:

1. `SPORTMONKS_API_TOKEN`
2. `SPORTMONKS_BASE_URL`

Suggested value for `SPORTMONKS_BASE_URL`:

```text
https://api.sportmonks.com/v3/football
```

## Local Verification

Run these before the first real deploy:

```bash
npm run build
npm run update:elo
```

## GitHub Automation

This repo includes:

`/.github/workflows/daily-elo-sync.yml`

What it does:

1. Runs once per day
2. Pulls the latest Elo data
3. Regenerates:
   - `public/data/elo.json`
   - `public/data/predictions.json`
   - `public/data/elo-trends.json`
   - `public/data/worldcup-teams.json`
4. Commits changes back to the repo

Required GitHub secret:

1. `SPORTMONKS_API_TOKEN`

## Cloudflare Checklist

When you start the actual Cloudflare setup, confirm:

1. Correct GitHub repo connected
2. Correct production branch selected
3. Correct custom domain attached: `2026.djyylive.com`
4. Old `wc.djyylive.com` bindings are not reused
5. Old failed project bindings are disabled or left untouched until cutover is verified
6. New deployment points to this Next.js app only

## Old Version Cleanup

Because you have old residual versions, check these before cutover:

1. Old Cloudflare Worker / Pages project names
2. Old custom domain bindings
3. Old preview aliases
4. Old GitHub webhook/build connections

Do not delete anything yet until the new deployment is verified.

## Official Direction

Cloudflare's current official guidance for existing full-stack Next.js apps is to deploy them on Workers using Wrangler auto-configuration (`wrangler deploy --x-autoconfig`) rather than using static Pages export for SSR/API applications.

# DJYY 2026 World Cup

Mobile-first 2026 World Cup data site built with Next.js 14.

## Stack

- Next.js 14 App Router
- Tailwind CSS
- SportMonks proxy routes
- Local static JSON for Elo, history, and predictions

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

## Data Commands

```bash
npm run update:elo
npm run archive:elo-history
npm run generate:elo-trends
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `SPORTMONKS_API_TOKEN`
- `SPORTMONKS_BASE_URL`

## Deployment

Deployment preparation is documented in:

- `DEPLOYMENT.md`
- `.github/workflows/daily-elo-sync.yml`

Cloudflare deploy helper:

- `npm run cf:deploy`

Target domain for this version:

- `2026.djyylive.com`

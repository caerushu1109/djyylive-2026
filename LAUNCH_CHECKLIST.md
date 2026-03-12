# Launch Checklist

This is the minimum launch checklist for the World Cup site before binding a real domain.

## Product

- Homepage is stable as a tournament-first portal
- Schedule page is stable as the main fixture discovery page
- Live page is stable as the matchday quick-entry page
- Match page is stable as the single-match template
- History pages are stable enough for public traffic
- Team hub and single-team page are stable enough for public traffic

## Bilingual

- `/zh/index.html` works
- `/en/index.html` works
- `/zh/history.html` works
- `/en/history.html` works
- `/zh/history-upsets.html` works
- `/en/history-upsets.html` works
- `/zh/history-archive.html` works
- `/en/history-archive.html` works
- `/zh/history-players.html` works
- `/en/history-players.html` works
- `/zh/history-matches.html` works
- `/en/history-matches.html` works
- `/zh/schedule.html` works
- `/en/schedule.html` works
- `/zh/live.html` works
- `/en/live.html` works
- `/zh/match.html` works
- `/en/match.html` works
- `/zh/prediction.html` works
- `/en/prediction.html` works
- `/zh/teams.html` works
- `/en/teams.html` works
- `/zh/team-history.html` works
- `/en/team-history.html` works
- Language switchers point to the matching localized route

## Deployment

- `404.html` exists
- `robots.txt` exists
- `sitemap.xml` exists
- `site.webmanifest` exists
- `vercel.json` exists
- `/` redirects to `/zh/index.html`
- `/zh` redirects to `/zh/index.html`
- `/en` redirects to `/en/index.html`

## SEO

- Homepage has canonical and hreflang tags
- Schedule pages have canonical and hreflang tags
- Live pages have canonical and hreflang tags
- Match pages have canonical and hreflang tags
- Prediction pages have canonical and hreflang tags

## Data

- Historical data is embedded and renders correctly
- 2026 fixture and group structure renders correctly
- Matchday pages use a stable internal match object
- Matchday adapter layer is in place for fixtures, standings, timeline events, and stats
- API requirements are documented in `API_REQUIREMENTS.md`

## Buy Timing

Buy the domain when:

- the homepage visual direction is settled
- the bilingual route structure is settled
- the deployment target is decided

Buy the football API when:

- schedule, live, and match templates are settled
- the field mapping in `API_REQUIREMENTS.md` is confirmed
- you know the provider covers World Cup fixtures and live events

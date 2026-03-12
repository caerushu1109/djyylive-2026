# Local Provider Payload Drop Zone

Save real provider responses here for local preview without committing secrets.

Recommended files:

- `sportmonks-fixture.json`
- `sportmonks-standings.json`

Then open locally:

- `/schedule.html?source=sportmonks-captured`
- `/live.html?source=sportmonks-captured`
- `/match.html?id=18528480&source=sportmonks-captured`

This mode avoids browser-to-provider CORS issues because the site only reads local JSON files served by the same local static server.

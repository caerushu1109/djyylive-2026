# Provider Onboarding

This is the practical sequence for the first day of connecting a real football data provider.

## Goal

Replace local placeholder matchday data without changing page structure.

## Recommended Order

1. pick the provider
2. fetch one real sample payload for:
   - fixtures
   - standings
   - events
   - stats
3. save the payload under `data/provider-samples/`
4. run the validator
5. update `src/provider-mappers.js`
6. update `src/api-adapter-example.js`
7. swap the local seed state for the provider-backed state
8. verify the site using the runtime source switch

## First Payload Checklist

The first payload should include at least:

- one scheduled match
- one live match
- one finished match
- one standings group
- one event list for a live or finished match
- one stats object for a live or finished match

That is why `data/provider-samples/sportmonks-worldcup-sample.json` includes all three phases.

## Local Test Flow

1. Save the provider response:

```bash
python3 scripts/validate_matchday_provider.py data/provider-samples/sportmonks-worldcup-sample.json
```

2. Compare the response structure with:

- `src/provider-mappers.js`
- `src/api-adapter-example.js`
- `src/matchday-adapter.js`

3. Confirm that the mapped result can provide:

- `schedule.html`
- `live.html`
- `schedule.html` detail state

without changing HTML structure.

4. Test the sample-backed runtime directly:

```text
/schedule.html?source=provider-sample
/live.html?source=provider-sample
/schedule.html?id=2026002&source=provider-sample#schedule-match-detail
```

## When The First Real Payload Arrives

The next code step should be:

- add a new real provider sample JSON
- update the mapper only where the sample disagrees
- point `src/matchday-source.js` at the real provider-backed state
- do not redesign the pages

## What Not To Do

- do not wire raw provider fields directly into `src/app.js`
- do not duplicate page logic for each provider
- do not let provider naming leak into the templates

The internal adapter should remain the only shape the UI consumes.

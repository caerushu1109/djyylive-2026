# Provider Swap Guide

This file answers one practical question:

When real API data arrives, which files should change?

## Main Switch Points

### 1. Provider sample or real payload

Start here:

- `data/provider-samples/`

If the provider is real, save one sample response first.

### 2. Provider mapping

Map raw provider fields here:

- `src/provider-mappers.js`

This file should stay provider-specific.

### 3. Provider state builder

Build site-facing state here:

- `src/api-adapter-example.js`

This file should convert mapped provider data into:

- matches
- groups
- detailsByMatch

### 4. Runtime data source entry point

This is the file that should switch the whole site from local seed data to provider-backed state:

- `src/matchday-source.js`

Right now it points to the local seed state.
It can also point to the provider sample state by using:

- `?source=provider-sample`

Later it should point to the real provider-backed state.

### 5. UI rendering

The UI should continue to consume only:

- `src/app.js`

But `src/app.js` should only read from `src/matchday-source.js`, not from raw provider files.

## Intended Swap Sequence

1. keep pages unchanged
2. keep `src/app.js` unchanged
3. update `src/provider-mappers.js`
4. update `src/api-adapter-example.js`
5. switch `src/matchday-source.js`

If this sequence is followed, the site moves to real data without page redesign.

## Files That Should Not Be Touched During Provider Swap

- `index.html`
- `schedule.html`
- `live.html`
- `schedule.html` detail state
- `styles.css`

These should already be stable enough.

## Success Condition

Provider hookup is successful when:

- `schedule.html` shows real fixtures
- `live.html` shows real live/next/recent matches
- `schedule.html#schedule-match-detail` shows real event timeline and stats
- no template rewrite was needed

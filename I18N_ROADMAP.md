# I18N Roadmap

## Goal

Prepare the site for a bilingual launch without duplicating raw tournament/history data.

## Recommended Structure

- `/zh/index.html`
- `/zh/history.html`
- `/zh/schedule.html`
- `/en/index.html`
- `/en/history.html`
- `/en/schedule.html`

## Data Principle

- keep `src/wc2026-data.js` shared
- keep history and archive data shared
- move labels, headings, CTA copy, and UI strings into locale dictionaries

## Recommended Next Step

1. extract homepage labels and nav copy into shared locale config
2. duplicate only templates, not data
3. add language switch in the masthead

## Launch Advice

Chinese-only launch is acceptable if needed.

Do not block deployment on full bilingual completion. Build the locale layer first, then translate page-by-page.

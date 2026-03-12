# API Buy Decision

This file is the practical checkpoint for deciding when to buy a football data API.

## Current State

The project now has:

- stable tournament-first pages for `schedule`, `live`, and `match`
- a provider mapping layer in `src/provider-mappers.js`
- a normalization layer in `src/matchday-normalizers.js`
- a site-facing adapter in `src/matchday-adapter.js`
- a provider integration example in `src/api-adapter-example.js`
- phase-aware page rendering for:
  - `pre_match`
  - `in_match`
  - `post_match`

This means the site is no longer blocked on page structure. It is now mostly blocked on real provider data.

## Buy API When All Boxes Below Are True

### Product

- `schedule.html` feels stable as the fixture discovery page
- `live.html` feels stable as the matchday quick-entry page
- `match.html` feels stable as the single-match page

### Data

- internal match object shape is stable
- internal standings shape is stable
- internal event shape is stable
- internal stats shape is stable

### Integration

- provider mapping file exists
- provider-specific match mapper exists
- provider-specific standings mapper exists
- provider-specific event mapper exists
- provider-specific stats mapper exists

### Deployment

- preview site is already running on `wc.djyylive.com`
- GitHub to Cloudflare Pages deployment is stable

## Current Recommendation

At the current stage:

- the site is close enough to start evaluating providers seriously
- buying an API is justified after one more pass on real provider field coverage

In practice, the next step should be:

1. choose the provider
2. collect one real provider sample payload
3. test the payload against `src/provider-mappers.js`
4. confirm missing fields
5. then buy the API plan

## Minimum Provider Questions Before Paying

- Does it cover World Cup fixtures and all knockout rounds?
- Does it provide stable match IDs?
- Does it provide lineups?
- Does it provide timeline events?
- Does it provide standings during the tournament?
- Does it provide venue and city data?
- Are rate limits acceptable during peak traffic?
- Does it provide a webhook or only polling?

## What Is No Longer Blocking

These items should not delay the API purchase anymore:

- minor homepage copy polish
- extra visual refinement on history pages
- non-critical long-tail editorial pages
- further UI experiments on static sections

## What Still Blocks Main-Domain Launch

- final provider selection
- real provider payload test
- replacing placeholder local match detail content with real mapped data
- final launch pass on `djyylive.com`

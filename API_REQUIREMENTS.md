# World Cup Matchday API Requirements

This document defines the minimum data contract for the site before buying a football data API.

## Internal Adapter Layer

The site now has a stable internal adapter in:

- `src/matchday-adapter.js`

Any provider should be mapped into this internal shape first, instead of feeding raw provider fields directly into page rendering.

## Priority Pages

1. `schedule.html`
2. `live.html`
3. `match.html`

These three pages are the first surfaces that need real data during the tournament.

## Minimum Match Object

```json
{
  "id": "string",
  "status": "scheduled | live | finished",
  "kickoff": "ISO datetime",
  "stage": "Group A | Round of 32 | Quarter-final | Semi-final | Final",
  "group": "A",
  "home": "Argentina",
  "away": "France",
  "home_score": 0,
  "away_score": 0,
  "score": "0-0",
  "minute": "72'",
  "venue": "New York New Jersey",
  "city": "New York",
  "country": "United States"
}
```

## Live Timeline Events

Needed for `match.html`.

```json
{
  "event_id": "string",
  "match_id": "string",
  "minute": 72,
  "stoppage_minute": 1,
  "type": "goal | own_goal | yellow_card | red_card | substitution | penalty_missed | var",
  "team": "Argentina",
  "player": "Lionel Messi",
  "assist_player": "string | null",
  "detail": "Open play finish from inside the box"
}
```

## Match Stats

Needed for `match.html`.

```json
{
  "possession_home": 54,
  "possession_away": 46,
  "shots_home": 13,
  "shots_away": 10,
  "shots_on_target_home": 6,
  "shots_on_target_away": 4,
  "xg_home": 1.4,
  "xg_away": 1.1
}
```

## Standings

Needed for the homepage and later standings pages.

```json
{
  "group": "A",
  "team": "Mexico",
  "played": 2,
  "wins": 1,
  "draws": 1,
  "losses": 0,
  "goals_for": 3,
  "goals_against": 1,
  "goal_difference": 2,
  "points": 4
}
```

## Lineups

Needed for a serious match page.

```json
{
  "match_id": "string",
  "team": "Argentina",
  "formation": "4-3-3",
  "starting_xi": ["player ids..."],
  "bench": ["player ids..."]
}
```

## Provider Checklist

Before paying for an API, confirm it can provide:

- World Cup fixture coverage
- Match status updates in near real time
- Timeline events
- Team lineups
- Standings
- Venue and city data
- Stable match IDs
- Reasonable rate limits during peak traffic

## Buy Timing

Buy the API only after:

1. the schedule page structure is fixed
2. the live page structure is fixed
3. the match page structure is fixed
4. the field mapping above is confirmed against the provider

At the current project stage, the site is close, but one more round on matchday pages is still justified before paying.

The remaining work is now mostly provider mapping and real-time polling, not page structure redesign.

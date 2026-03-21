# SportMonks Football API v3 - Response Structure Reference

> Generated from real API calls on 2026-03-21.
> Base URL: `https://api.sportmonks.com/v3/football`
> Auth: `?api_token=<TOKEN>` query parameter on every request.
> Default locale used: `locale=zh` (Chinese names for teams/venues).

---

## Table of Contents

1. [Envelope & Pagination](#1-envelope--pagination)
2. [fixtures/between/{from}/{to}](#2-fixturesbetweenfromto)
3. [fixtures/{id} (detail with includes)](#3-fixturesid-detail)
4. [odds/pre-match/fixtures/{id}](#4-oddspre-matchfixturesid)
5. [predictions/probabilities/fixtures/{id}](#5-predictionsprobabilitiesfixturesid)
6. [standings/seasons/{seasonId}](#6-standingsseassonsseasonid)
7. [teams/{id}](#7-teamsid)
8. [squads/seasons/{seasonId}/teams/{teamId}](#8-squadsseasonsseasonidteamsteamid)
9. [Reference Tables](#9-reference-tables)

---

## 1. Envelope & Pagination

Every response wraps data in this envelope:

```jsonc
{
  "data": { ... } | [ ... ],        // single object or array
  "subscription": [ ... ],           // plan info (ignore)
  "rate_limit": {
    "resets_in_seconds": 3073,
    "remaining": 4347,
    "requested_entity": "Fixture"
  },
  "timezone": "UTC",
  "pagination": {                    // only on list endpoints
    "count": 25,
    "per_page": 25,
    "current_page": 1,
    "next_page": "https://...",
    "has_more": true
  }
}
```

**Gotcha:** `pagination` is absent (not `null`) when there is only one page. Check `pagination?.has_more` safely.

---

## 2. fixtures/between/{from}/{to}

**URL pattern:**
```
fixtures/between/2026-06-11/2026-07-19?include=participants;scores;state;venue;round;group&per_page=100&page=1
```

**WC2026 identifiers (real):**
- `league_id`: **732** (FIFA World Cup)
- `season_id`: **26618** (2026 edition)
- First fixture ID: **19609127** (Mexico vs South Africa)

### Fixture object (in `data[]`):

```jsonc
{
  "id": 19609127,                    // integer — fixture ID
  "sport_id": 1,
  "league_id": 732,
  "season_id": 26618,               // use this to fetch standings
  "stage_id": 77478590,
  "group_id": 253019,               // null for knockout stage
  "aggregate_id": null,
  "round_id": 395361,
  "state_id": 1,                    // maps to state object
  "venue_id": 8347,
  "name": "Mexico vs South Africa", // "Home vs Away" format
  "starting_at": "2026-06-11 19:00:00",  // UTC, NO "T", NO "Z"
  "result_info": null,              // e.g. "Mexico won after penalties"
  "leg": "1/1",
  "details": "Match 1",            // "Match N" label
  "length": 90,
  "placeholder": false,            // true for TBD playoff teams
  "has_odds": false,               // boolean
  "has_premium_odds": false,
  "starting_at_timestamp": 1781204400,  // unix timestamp

  // === INCLUDED relations ===

  "participants": [                 // array of 2 team objects
    {
      "id": 18576,                  // team ID
      "sport_id": 1,
      "country_id": 458,
      "venue_id": 14659,
      "gender": "male",
      "name": "Mexico",             // full team name
      "short_code": "MEX",          // 3-letter code
      "image_path": "https://cdn.sportmonks.com/images/soccer/teams/16/18576.png",
      "founded": 1927,
      "type": "national",           // "national" or "domestic"
      "placeholder": false,         // true for TBD qualifier teams
      "last_played_at": "2026-02-26 02:00:00",
      "meta": {
        "location": "home",         // "home" or "away" — KEY FIELD
        "winner": null,             // true/false after match
        "position": null
      }
    },
    { /* away participant — same structure */ }
  ],

  "scores": [                       // empty array [] before match starts
    {
      "id": 123456,
      "fixture_id": 19609127,
      "type_id": 1,
      "description": "CURRENT",     // "CURRENT" | "1ST_HALF" | "2ND_HALF" | "ET" | "PENALTIES"
      "score": {
        "participant": "home",       // "home" or "away"
        "goals": 1                   // integer
      }
    },
    {
      "description": "CURRENT",
      "score": { "participant": "away", "goals": 0 }
    }
  ],

  "state": {                        // included via state_id
    "id": 1,
    "state": "NS",                  // raw state code
    "name": "Not Started",
    "short_name": "NS",
    "developer_name": "NS"          // use this for logic
  },

  "venue": {
    "id": 8347,
    "country_id": 458,
    "city_id": 21420,
    "name": "Estadio Banorte",
    "address": "Boulevard Enrique Cabrera 952",
    "zipcode": null,
    "latitude": "24.7978965",
    "longitude": "-107.393395",
    "capacity": 20395,
    "image_path": "https://cdn.sportmonks.com/images/soccer/venues/27/8347.png",
    "city_name": "Culiacan",        // used for venue display
    "surface": "grass",
    "national_team": false
  },

  "round": {
    "id": 395361,
    "sport_id": 1,
    "league_id": 732,
    "season_id": 26618,
    "stage_id": 77478590,
    "name": "1",                    // round number as string, or "Round of 32" etc.
    "finished": false,
    "is_current": false,
    "starting_at": "2026-06-11",
    "ending_at": "2026-06-18",
    "games_in_current_week": false
  },

  "group": {                        // null for knockout fixtures
    "id": 253019,
    "sport_id": 1,
    "league_id": 732,
    "season_id": 26618,
    "stage_id": 77478590,
    "name": "Group A",              // "Group A" through "Group L"
    "starting_at": "2026-06-11",
    "ending_at": "2026-06-25",
    "games_in_current_week": false,
    "is_current": false,
    "finished": false,
    "pending": false
  }
}
```

### Gotchas (fixtures):
- `starting_at` uses space separator, NOT ISO "T" — our code does `.replace(" ", "T") + "Z"`
- `placeholder: true` means TBD qualifier teams (e.g. "Den/Mkd/Cze/Irl")
- `scores` is `[]` (empty array) before match starts, not `null`
- `participants[].meta.location` is the authoritative home/away indicator
- `state` can be an object (when included) OR just `state_id` integer
- WC2026 has 104 fixtures. Default per_page is 25. Must paginate with `per_page=100`.
- `group.name` returns "Group A" format (English), not "A组"

---

## 3. fixtures/{id} (detail)

**URL pattern:**
```
fixtures/19609127?include=participants;scores;state;venue;round;group;events.type;statistics.type;lineups.details.type;formations
```

Returns a single fixture object in `data` (not array). Same base fields as above, plus the included relations.

### events[] (when match has been played):

```jsonc
// data.events — array, empty [] before match
{
  "id": 12345,
  "fixture_id": 19609127,
  "participant_id": 18576,         // which team
  "type_id": 14,                   // event type ID
  "section": "event",
  "player_id": 12345,
  "player_name": "Player Name",    // localized
  "related_player_id": null,       // assist player
  "related_player_name": null,
  "result": "1-0",                 // score after event
  "info": null,
  "addition": null,
  "minute": 23,                    // integer
  "extra_minute": null,            // stoppage time addition
  "injured": null,
  "on_bench": false,
  "coach_id": null,
  "sub_type_id": null,

  // included via events.type
  "type": {
    "id": 14,
    "name": "Goal",
    "code": "goal",
    "developer_name": "GOAL",      // use for icon mapping
    "model_type": "event",
    "stat_group": null
  },

  // participant info also included
  "participant": {
    "id": 18576,
    "name": "Mexico"
    // ... full team object
  }
}
```

### statistics[] (when match has been played):

**CRITICAL: Each stat is a SEPARATE entry per team, not grouped.**

```jsonc
// data.statistics — flat array, one entry per stat per team
{
  "id": 99999,
  "fixture_id": 19609127,
  "type_id": 45,
  "participant_id": 18576,         // team ID — determines home/away
  "data": {
    "value": 58                    // the stat value
  },
  // included via statistics.type
  "type": {
    "id": 45,
    "name": "Ball Possession",
    "code": "ball-possession",
    "developer_name": "BALL_POSSESSION",  // key for mapping
    "model_type": "statistic",
    "stat_group": null
  }
}
```

**Our code groups stats by team:**
```js
// Compare participant_id to homeId to determine side
const side = item.participant_id === homeId ? "home" : "away";
const key = item.type.developer_name;  // e.g. "BALL_POSSESSION"
```

### Statistic developer_name keys used in our code:

| developer_name | Our mapping key | Display label |
|---|---|---|
| BALL_POSSESSION | possession | 控球率 |
| SHOTS_TOTAL | shots | 射门 |
| SHOTS_ON_TARGET | shots_on_target | 射正 |
| SHOTS_OFF_TARGET | shots_off_target | 射偏 |
| BLOCKED_SHOTS | blocked_shots | 被封堵 |
| CORNER_KICKS | corner_kicks | 角球 |
| FOULS | fouls | 犯规 |
| OFFSIDES | offsides | 越位 |
| YELLOWCARDS | yellow_cards | 黄牌 |
| REDCARDS | red_cards | 红牌 |
| SAVES | saves | 扑救 |
| PASSES | passes | 传球 |
| PASSES_PERCENTAGE | pass_accuracy | 传球准确率 |
| TACKLES | tackles | 铲球 |
| INTERCEPTIONS | interceptions | 拦截 |
| EXPECTED_GOALS | xg | xG |

### lineups[] (when match has been played):

```jsonc
// data.lineups — flat array, one entry per player
{
  "id": 88888,
  "fixture_id": 19609127,
  "player_id": 12345,
  "team_id": 18576,              // use to determine home/away
  "type": "lineup",              // "lineup" = starting XI, "bench" = substitute
  "formation_field": "1",        // position in formation string
  "formation_position": 1,
  "player_name": "Edson Alvarez",
  "jersey_number": 4,
  "position": {                  // or just position_id
    "id": 26,
    "developer_name": "MIDFIELDER",
    "name": "Midfielder"
  },
  // details included via lineups.details.type
  "details": [
    {
      "id": 777,
      "type_id": 56,
      "value": { ... },
      "type": {
        "developer_name": "RATING",
        "name": "Rating"
      }
    }
  ]
}
```

### formations[] (when match has been played):

```jsonc
// data.formations — array with one entry per team
{
  "id": 55555,
  "fixture_id": 19609127,
  "participant_id": 18576,       // team ID
  "formation": "4-3-3",          // formation string
  "location": "home"
}
```

---

## 4. odds/pre-match/fixtures/{id}

**URL pattern:**
```
odds/pre-match/fixtures/19609127?include=bookmaker
```

> **NOTE:** WC2026 odds not yet available (tournament hasn't started).
> Structure documented from SportMonks API docs + codebase logic.

### CRITICAL GOTCHA: Odds are PER-OUTCOME, not per-market

Each entry in `data[]` is a **single outcome** (e.g. "Home wins"), NOT a complete market.
You must **group by bookmaker + market** to reconstruct full odds.

```jsonc
{
  "data": [
    // Each entry = ONE outcome for ONE bookmaker
    {
      "id": 999001,
      "fixture_id": 19609127,
      "market_id": 1,              // 1 = Fulltime Result (1X2)
      "bookmaker_id": 2,
      "label": "Home",             // "Home" | "Draw" | "Away" for 1X2
      "value": "2.10",             // decimal odds as STRING
      "name": "Fulltime Result",
      "market_description": "...",
      "probability": "47.62",      // implied probability as string
      "dp3": "2.100",
      "fractional": "11/10",
      "american": "+110",
      "winning": null,             // true/false after settlement
      "stopped": false,
      "total": null,               // used for Over/Under line
      "handicap": null,            // used for Asian Handicap line
      "participants": null,
      "latest_bookmaker_update": "2026-03-15 10:30:00",

      // included via bookmaker
      "bookmaker": {
        "id": 2,
        "legacy_id": 2,
        "name": "bet365"
      }
    },
    {
      "market_id": 1,
      "bookmaker_id": 2,
      "label": "Draw",             // same bookmaker, same market, different outcome
      "value": "3.30",
      "bookmaker": { "id": 2, "name": "bet365" }
    },
    {
      "market_id": 1,
      "bookmaker_id": 2,
      "label": "Away",
      "value": "3.60",
      "bookmaker": { "id": 2, "name": "bet365" }
    },

    // Asian Handicap entries
    {
      "market_id": 28,
      "label": "Home",             // or "1"
      "value": "1.90",
      "handicap": "-0.5",          // handicap line as STRING
      "bookmaker": { "name": "Pinnacle" }
    },
    {
      "market_id": 28,
      "label": "Away",             // or "2"
      "value": "2.00",
      "handicap": "-0.5",
      "bookmaker": { "name": "Pinnacle" }
    },

    // Over/Under entries
    {
      "market_id": 18,
      "label": "Over",
      "value": "1.95",
      "total": "2.5",              // the line (total goals)
      "handicap": "2.5",           // ALSO in handicap field sometimes
      "bookmaker": { "name": "Pinnacle" }
    },
    {
      "market_id": 18,
      "label": "Under",
      "value": "1.90",
      "total": "2.5",
      "handicap": "2.5",
      "bookmaker": { "name": "Pinnacle" }
    }
  ]
}
```

### Key market_id values:

| market_id | Market Name | label values | Line field |
|---|---|---|---|
| 1 | Fulltime Result (1X2) | "Home" / "Draw" / "Away" (or "1"/"X"/"2") | none |
| 18 | Over/Under | "Over" / "Under" | `total` or `handicap` |
| 28 | Asian Handicap | "Home" / "Away" (or "1"/"2") | `handicap` |

### How our code reconstructs odds:

```js
// 1X2: group by bookmaker name
const ftEntries = oddsData.filter(o => o.market_id === 1);
// Group: { bookmaker, home, draw, away }

// Asian Handicap: group by bookmaker + line
const ahEntries = oddsData.filter(o => o.market_id === 28);
const line = Number(o.handicap ?? 0);
// Group key: `${bookmaker}|${line}`
// Result: { bookmaker, line, home, away }

// Over/Under: group by bookmaker + line
const ouEntries = oddsData.filter(o => o.market_id === 18);
const line = Number(o.total ?? o.handicap ?? 2.5);
// Group key: `${bookmaker}|${line}`
// Result: { bookmaker, line, over, under }
```

### Label value gotchas:
- Labels can be "Home"/"Draw"/"Away" OR "1"/"X"/"2" depending on bookmaker
- Our code checks both: `label.includes("home") || label === "1"`
- `value` is a STRING, must `Number()` convert
- `handicap` and `total` are also STRINGS
- Over/Under line may be in `total` OR `handicap` field (check both)
- Multiple bookmakers x multiple lines = many entries. Filter carefully.

---

## 5. predictions/probabilities/fixtures/{id}

**URL pattern:**
```
predictions/probabilities/fixtures/19609127
```

> **NOTE:** WC2026 predictions not yet available.
> Structure documented from SportMonks API docs.

```jsonc
{
  "data": [
    {
      "id": 3317639,
      "fixture_id": 19609127,
      "type_id": 1,                // prediction type — see table below
      "predictions": {
        "home": "42.5",            // percentage as string
        "draw": "28.0",
        "away": "29.5"
      }
    },
    {
      "id": 3317640,
      "fixture_id": 19609127,
      "type_id": 240,             // correct score probabilities
      "predictions": {
        "scores": {
          "0-0": 2.84,
          "0-1": 4.97,
          "1-0": 8.12,
          "1-1": 12.5,
          "2-0": 6.3,
          "2-1": 9.8,
          // ... more scores
          "Other_1": 9.33,        // other home wins
          "Other_2": 11.81,       // other away wins
          "Other_X": 0.59         // other draws
        }
      }
    }
  ]
}
```

### Known type_id values:

| type_id | Description | predictions shape |
|---|---|---|
| 1 | Fulltime Result | `{ home, draw, away }` |
| 240 | Correct Score | `{ scores: { "0-0": %, "1-0": %, ... } }` |

**Our code usage:**
```js
const find = (type) => predData.find(p => p.type_id === type)?.predictions;
const ftProb = find(1);  // fulltime result
predictions = {
  home_win: ftProb?.home ?? null,
  draw: ftProb?.draw ?? null,
  away_win: ftProb?.away ?? null,
};
```

---

## 6. standings/seasons/{seasonId}

**URL pattern:**
```
standings/seasons/26618?include=participant;details.type;group
```

Returns `data[]` with one entry per team per group (48 teams for WC2026 group stage).

```jsonc
{
  "data": [
    {
      "id": 278170,
      "participant_id": 18576,
      "sport_id": 1,
      "league_id": 732,
      "season_id": 26618,
      "stage_id": 77478590,
      "group_id": 253019,
      "round_id": 395361,
      "standing_rule_id": 134588,
      "position": 1,              // position within group
      "result": null,             // "qualified" etc. after group stage
      "points": 0,                // total points (shortcut)

      // included
      "participant": {
        "id": 18576,
        "name": "Mexico",
        "short_code": "MEX",
        "image_path": "https://cdn.sportmonks.com/images/soccer/teams/16/18576.png",
        "type": "national",
        "placeholder": false
        // ... other team fields
      },

      "group": {
        "id": 253019,
        "name": "Group A",        // "Group A" through "Group L"
        // ... other group fields
      },

      "details": [
        // Each detail = one stat, identified by type.developer_name
        {
          "id": 11851490431,
          "standing_type": "standing",
          "standing_id": 278170,
          "type_id": 187,
          "value": 0,              // integer
          "type": {
            "id": 187,
            "name": "Overall Points",
            "code": "overall-points",
            "developer_name": "TOTAL_POINTS",
            "model_type": "standings",
            "stat_group": "overall"
          }
        }
        // ... 21 more detail entries per team
      ]
    }
  ]
}
```

### All standing detail developer_names (22 total):

**Overall (used by our code):**

| type_id | developer_name | Name | Our mapping |
|---|---|---|---|
| 187 | TOTAL_POINTS | Overall Points | pts |
| 129 | OVERALL_MATCHES | Overall Matches Played | p |
| 130 | OVERALL_WINS | Overall Won | w |
| 131 | OVERALL_DRAWS | Overall Draw | d |
| 132 | OVERALL_LOST | Overall Lost | l |
| 133 | OVERALL_SCORED | Overal Goals Scored | gf |
| 134 | OVERALL_CONCEDED | Overall Goals Conceded | ga |
| 179 | OVERALL_GOAL_DIFFERENCE | Goal Difference | gd |

**Home (available but not used):**

| type_id | developer_name |
|---|---|
| 135 | HOME_MATCHES |
| 136 | HOME_WINS |
| 137 | HOME_DRAWS |
| 138 | HOME_LOST |
| 139 | HOME_SCORED |
| 140 | HOME_CONCEDED |
| 185 | HOME_POINTS |

**Away (available but not used):**

| type_id | developer_name |
|---|---|
| 141 | AWAY_MATCHES |
| 142 | AWAY_WINS |
| 143 | AWAY_DRAWS |
| 144 | AWAY_LOST |
| 145 | AWAY_SCORED |
| 146 | AWAY_CONCEDED |
| 186 | AWAY_POINTS |

### How our code extracts standings:
```js
const details = Object.fromEntries(
  row.details.map(d => [d.type.developer_name || d.type_id, d.value])
);
// Then: details.OVERALL_WINS, details.TOTAL_POINTS, etc.
```

---

## 7. teams/{id}

**URL pattern:**
```
teams/18576
```

```jsonc
{
  "data": {
    "id": 18576,
    "sport_id": 1,
    "country_id": 458,
    "venue_id": 14659,
    "gender": "male",
    "name": "Mexico",
    "short_code": "MEX",
    "image_path": "https://cdn.sportmonks.com/images/soccer/teams/16/18576.png",
    "founded": 1927,
    "type": "national",        // "national" for NT, "domestic" for clubs
    "placeholder": false,
    "last_played_at": "2026-02-26 02:00:00"
  }
}
```

**Gotcha:** This is a minimal object. For coach, players, etc., use includes or the squads endpoint.

---

## 8. squads/seasons/{seasonId}/teams/{teamId}

**URL pattern:**
```
squads/seasons/26618/teams/18576?include=player
```

Returns `data[]` with one entry per squad member.

```jsonc
{
  "data": [
    {
      "id": 1862369566,
      "player_id": 3169754,
      "team_id": 18576,
      "season_id": 26618,
      "has_values": false,         // true if player stats exist
      "position_id": 25,           // see position table below
      "jersey_number": null,       // integer or null

      // included via player
      "player": {
        "id": 3169754,
        "sport_id": 1,
        "country_id": 458,
        "nationality_id": 458,
        "city_id": null,
        "position_id": 25,
        "detailed_position_id": 148,  // more specific position
        "type_id": 25,
        "common_name": "J. Angulo Uriarte",
        "firstname": "Jesus Alberto",
        "lastname": "Angulo Uriarte",
        "name": "Jesus Alberto Angulo Uriarte",  // full name
        "display_name": "Jesus Angulo",           // preferred display
        "image_path": "https://cdn.sportmonks.com/images/soccer/players/26/3169754.png",
        "height": 178,             // cm, integer
        "weight": 73,              // kg, integer
        "date_of_birth": "1998-01-30",
        "gender": "male"
      }
    }
  ]
}
```

**Gotcha:** `jersey_number` is often `null` before tournament squads are finalized.
WC2026 Mexico squad returned 46 players (preliminary list — will be trimmed to 26).

---

## 9. Reference Tables

### Match States (state_id)

| id | state | developer_name | Description | Our mapping |
|---|---|---|---|---|
| 1 | NS | NS | Not Started | "NS" |
| 2 | INPLAY_1ST_HALF | INPLAY_1ST_HALF | 1st Half | "LIVE" |
| 3 | HT | HT | Half Time | "LIVE" |
| 4 | BREAK | BREAK | Break | "LIVE" |
| 5 | FT | FT | Full Time | "FT" |
| 6 | INPLAY_ET | INPLAY_ET | Extra Time | "LIVE" |
| 7 | AET | AET | After Extra Time | "FT" |
| 8 | FT_PEN | FT_PEN | After Penalties | "FT" |
| 9 | INPLAY_PENALTIES | INPLAY_PENALTIES | Penalties | "LIVE" |
| 10 | POSTPONED | POSTPONED | Postponed | "NS" |
| 11 | SUSPENDED | SUSPENDED | Suspended | "NS" |
| 12 | CANCELLED | CANCELLED | Cancelled | "NS" |
| 13 | TBA | TBA | To Be Announced | "NS" |
| 14 | WO | WO | Walk Over | "NS" |
| 15 | ABANDONED | ABANDONED | Abandoned | "NS" |
| 16 | DELAYED | DELAYED | Delayed | "NS" |
| 17 | AWARDED | AWARDED | Awarded | "NS" |
| 18 | INTERRUPTED | INTERRUPTED | Interrupted | "NS" |
| 19 | AWAITING_UPDATES | AWAITING_UPDATES | Awaiting Updates | "NS" |
| 20 | DELETED | DELETED | Deleted | "NS" |
| 21 | EXTRA_TIME_BREAK | EXTRA_TIME_BREAK | ET Break | "LIVE" |
| 22 | INPLAY_2ND_HALF | INPLAY_2ND_HALF | 2nd Half | "LIVE" |
| 23 | INPLAY_ET_2ND_HALF | INPLAY_ET_SECOND_HALF | ET 2nd Half | "LIVE" |
| 25 | PEN_BREAK | PEN_BREAK | Penalties Break | "LIVE" |
| 26 | PENDING | PENDING | Pending | "NS" |

**Our normalizeState() maps:** `["live", "inplay", "ht"]` -> "LIVE", `["ft", "finished", "after_penalties"]` -> "FT", everything else -> "NS"

### Position IDs

| position_id | developer_name | Name |
|---|---|---|
| 24 | GOALKEEPER | Goalkeeper |
| 25 | DEFENDER | Defender |
| 26 | MIDFIELDER | Midfielder |
| 27 | ATTACKER | Attacker |

Detailed positions (detailed_position_id) include 148+, but these are not widely used in our code.

### Event Type developer_names (used for icons):

| Pattern | Icon | Examples |
|---|---|---|
| contains "goal" | soccer ball | GOAL, OWN_GOAL, PENALTY_GOAL |
| contains "yellow" | yellow card | YELLOWCARD, YELLOWRED |
| contains "red" | red card | REDCARD |
| contains "sub" | substitution | SUBSTITUTION |
| other | bullet | VAR, PENALTY_MISSED, etc. |

### Score description values:

| description | Meaning |
|---|---|
| "CURRENT" | Current/final score |
| "1ST_HALF" | Score at half time |
| "2ND_HALF" | Goals scored in 2nd half only |
| "ET" | Extra time goals |
| "PENALTIES" | Penalty shootout score |

---

## Common Patterns & Gotchas Summary

1. **Dates are NOT ISO 8601** — `"2026-06-11 19:00:00"` has a space, not "T", and no "Z". Always in UTC.

2. **Includes use semicolons** — `include=participants;scores;state` (not commas)

3. **Nested includes use dots** — `include=events.type;statistics.type;lineups.details.type`

4. **Odds are per-outcome** — You get 3 entries for a 1X2 market (Home, Draw, Away). Must group by `bookmaker_id` + `market_id`.

5. **Odds values are strings** — `"2.10"` not `2.10`. Always `Number()` convert.

6. **Over/Under line location** — Check `total` first, fall back to `handicap`. Both are strings.

7. **Placeholder teams** — `placeholder: true` teams have names like "Den/Mkd/Cze/Irl" (playoff TBD).

8. **Statistics are flat** — One entry per stat per team. Group by `participant_id` and `type.developer_name`.

9. **Empty arrays, not null** — `scores: []`, `events: []`, `lineups: []` when no data yet.

10. **Pagination** — Default is 25 per page. WC has 104 fixtures. Always set `per_page=100` and check `pagination?.has_more`.

11. **Group names** — API returns "Group A" (English). Our code normalizes to "A组" via `normalizeGroupName()`.

12. **Locale** — We send `locale=zh` for Chinese team names. API falls back to English if Chinese not available.

13. **Rate limits** — Response includes `rate_limit.remaining`. WC2026 trial has 2000 calls with hourly reset windows.

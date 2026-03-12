# SportMonks 2026 World Cup Data Plan

This file captures what the current SportMonks World Cup plan is already returning, what the site still needs, and how each high-frequency page should use the data.

## What We Have Already Confirmed

From the real World Cup 2026 runtime responses, the current plan is already providing:

- fixture id
- season id
- league id
- stage id
- group id
- round id
- venue id
- fixture name
- kickoff time
- match metadata such as `details` and `leg`
- participants
- participant short codes
- participant crest image URLs
- fixture state
- venue name
- venue city
- standings rows
- standings participant objects
- standings detail arrays

This is enough to power:

- schedule discovery
- live landing pages for pre-match states
- match detail shells for scheduled matches
- homepage fixture previews
- group standings

## What Is Expected To Be Empty Before Kickoff

For a match that has not started yet, these fields can legitimately be empty:

- scores
- events
- lineups
- statistics

That is not a data failure. It just means the fixture is still in the pre-match phase.

## What We Still Need To Confirm During Matchday

Once the tournament actually starts, we should verify real responses for:

- live scores
- event timeline population
- lineups filling in
- statistics filling in
- minute / clock behavior

The current adapter layer is already prepared for those fields. We mainly need to validate the real matchday payloads once they exist.

## Important Provider Reality

The World Cup 2026 plan can return placeholder teams for playoff slots. Examples already seen:

- `Den/Mkd/Cze/Irl`
- `Ita/Nir/Wal/BiH`
- `Bol/Sur/Irq`

These should be treated as real provider placeholders, not demo content.

## Page Mapping

### Homepage

Should show:

- the next 4 to 6 most relevant fixtures
- one standings snapshot
- one featured match entry

Should not try to show:

- deep event detail
- lineups
- dense match stats

### Schedule

Should show:

- chronological fixture list
- team filter
- status filter
- fixture venue
- kickoff time
- stage

Priority rule:

- sort by kickoff time first
- use phase only as a secondary tie-breaker

### Live

Should show:

- in-match fixtures first
- then next upcoming fixtures
- then featured follow-up entries

If there are no live matches yet, it should still work as a “next fixtures” page instead of feeling empty.

### Match Detail

Pre-match:

- teams
- kickoff
- venue
- state
- prediction link

In-match:

- score
- event timeline
- minute
- stats

Post-match:

- final score
- event timeline
- stats

## Recommended Display Strategy Right Now

Because the tournament has not started yet, the site should currently prioritize:

1. chronological fixture order
2. clear stage labels
3. standings visibility
4. direct links into prediction and team pages

It should not over-optimize for:

- event richness
- lineups
- stats density

Those matter more after kickoff.

## Current Gaps To Fix In The Site

1. Ensure all schedule-facing lists are truly chronological.
2. Ensure homepage featured fixtures are drawn from the same real runtime source.
3. Ensure match entry links always point to the currently featured real fixture, not stale demo ids.
4. Keep cache-busting versions aligned whenever runtime logic changes.

## Next Integration Work

1. Finish eliminating stale demo ordering in homepage and schedule.
2. Keep the real SportMonks runtime as the default preview path on `wc.djyylive.com`.
3. After kickoff, validate live events / stats / lineups against real matchday payloads.

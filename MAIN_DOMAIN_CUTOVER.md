# Main Domain Cutover

This file is the final cutover checklist for moving from:

- `wc.djyylive.com`

to:

- `djyylive.com`
- `www.djyylive.com`

## Pre-Cutover Conditions

- preview site is stable on `wc.djyylive.com`
- `schedule.html` is the single event page and is stable
- provider selection is finished
- at least one real provider payload has been validated
- bilingual routes are working

## Cloudflare Pages Target

The target Pages project should be:

- `djyylive-worldcup`

## Cutover Steps

1. open Cloudflare Pages
2. open `djyylive-worldcup`
3. open `Custom domains`
4. add:
   - `djyylive.com`
   - `www.djyylive.com`
5. verify both show:
   - `Active`
   - `SSL enabled`
6. remove those domains from the old Pages project if still attached there

## Post-Cutover Checks

- `djyylive.com` loads the new site
- `www.djyylive.com` loads the new site
- `/zh/index.html` works
- `/en/index.html` works
- `schedule.html` works
- `live.html` works
- schedule detail state works
- language switchers still point to matching localized routes

## Old Project Cleanup

Only after cutover is confirmed:

- remove unused old Pages projects for `djyylive`
- remove old custom-domain bindings

## Rollback

If the new site has a critical issue:

1. reattach `djyylive.com`
2. reattach `www.djyylive.com`
3. point them back to the old Pages project

Do this only if the issue blocks:

- homepage access
- schedule access
- live access
- match access

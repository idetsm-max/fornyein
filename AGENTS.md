# AGENTS.md — repository memory

## What this is
Browser-only Myanmar poem video editor (CapCut-like), no build step. Vanilla ES
modules under `public/v2/`. Authoritative plan: `Plan.md` (Burmese). Verification
counts: `docs/VERIFY.md`.

## Rules that bite
- All UI text/labels must be Burmese. New English labels go in `public/v2/ui/labels-my.js`.
- Keep `docs/VERIFY.md` totals in sync with real test counts, and refresh the
  matching `Plan.md` rows (status marker + evidence) in the same commit.
- `scripts/lint-lines.mjs` is a ratchet: files in `scripts/lint-baseline.json`
  may only shrink. If a change must add lines to a grandfathered file, move code
  into a new module instead (that is how `engine/grading.js`,
  `engine/effects.js`, `engine/timeline-drop.js`, `ui/panels-adjust.js` and
  `ui/panels-effects.js` were born). `node scripts/lint-lines.mjs --update`
  only when a split was intentional.

## Test gate (must pass before committing)
```sh
cd public && python3 -m http.server 8765 &   # e2e needs a static server
cd .. && ./scripts/test-all.sh               # lint -> unit -> known-bugs -> e2e
```

## Pushing
The git credential helper token can read but not push (`403`). Push with the PAT:
```sh
git -c credential.helper= push "https://x-access-token:${GH_PAT}@github.com/idetsm-max/fornyein.git" main
```
Without `-c credential.helper=` git replays the helper's token and the push fails.

## Clip rendering pipeline
`engine/draw-visual.js` is the single preview/export path: grading
(`clip.adjust` + `filterIntensity`) and effect stack (`clip.fx`) are merged into
one filter string, then vignette and effect overlays paint in clip-local
coordinates (origin = clip centre). Any new pixel effect must go through this
function so preview and export stay identical.

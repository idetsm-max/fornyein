# fornyein

For Nyein — Burmese poem video maker. Browser-only render (WebCodecs), Cloudflare Pages + Worker + private R2.

## Layout
- `public/` — app (Cloudflare Pages). `public/spike.html` = Stage S capability check. `public/fonts/` + `fonts.json` = fonts.
- `worker/` — Cloudflare Worker (R2 binding): `/api/library/:type`, `/api/asset/:type/:name`, `/api/presets`.

## Notes
- R2 bucket stays private; Worker is the only way in. Protect with Cloudflare Access.
- Never commit tokens, keys or `.env`.

## Tests
- `./scripts/test-all.sh` — line budget, unit tests, known-bug checks and all e2e suites (needs `chromium`; override with `CHROME=/path/to/chrome`).
- A CI workflow (`.github/workflows/test.yml`) runs the same unit/lint gate plus an e2e job; the file is kept local-only because the automation token lacks `workflow` scope.

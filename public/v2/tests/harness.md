# Test harness

## Unit + regression (no dependencies)

```sh
for f in public/v2/tests/unit/*.mjs; do node "$f"; done
node public/v2/tests/verify/known-bugs.mjs
node scripts/lint-lines.mjs
```

## E2E (headless Chromium)

```sh
python3 -m http.server 8765 --directory public &
npm install --no-save puppeteer-core@23
BASE=http://localhost:8765 PUPPETEER=puppeteer-core CHROME=/usr/bin/chromium \
  node public/v2/tests/e2e/phase1.js
BASE=http://localhost:8765 PUPPETEER=puppeteer-core CHROME=/usr/bin/chromium \
  node public/v2/tests/e2e/ux.js
BASE=http://localhost:8765 PUPPETEER=puppeteer-core CHROME=/usr/bin/chromium \
  node public/v2/tests/e2e/audio.js
BASE=http://localhost:8765 PUPPETEER=puppeteer-core CHROME=/usr/bin/chromium \
  node public/v2/tests/e2e/layout.js
```

`phase1.js` covers text/timeline/autosave/projects/theme. `ux.js` covers the
inspector registry (U1), context menu + clipboard (U2) and drag & drop (U3).
`audio.js` covers the AudioContext clock (S4) and the shared preview/export
graph (S6), including a deterministic two-render comparison. `layout.js` covers
panel splitters/collapse, track mute/solo/rename/height, razor split and undo
labels (T1/U4–U6).

## Export check (needs ffprobe)

```sh
node scripts/validate-export.mjs <file.mp4> --duration 6 --tolerance 0.1
```

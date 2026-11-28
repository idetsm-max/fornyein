#!/usr/bin/env bash
# Local gate: line budget, unit tests, known-bug checks and every e2e suite.
# CHROME defaults to /usr/bin/chromium; override with CHROME=/path/to/chrome.
set -u
cd "$(dirname "$0")/.." || exit 1
PORT="${PORT:-8765}"
node scripts/lint-lines.mjs || exit 1
for f in public/v2/tests/unit/*.mjs; do echo "== $f"; node "$f" || exit 1; done
node public/v2/tests/verify/known-bugs.mjs || exit 1
( cd public && python3 -m http.server "$PORT" >/tmp/fornyein-http.log 2>&1 & echo $! >/tmp/fornyein-http.pid )
trap 'kill "$(cat /tmp/fornyein-http.pid 2>/dev/null)" 2>/dev/null' EXIT
sleep 1
for t in phase1 ux audio layout groups onboarding tools session mixer templates mixdown filters; do
  echo "== e2e $t"
  BASE="http://localhost:$PORT" PUPPETEER="${PUPPETEER:-puppeteer-core}" CHROME="${CHROME:-/usr/bin/chromium}" node "public/v2/tests/e2e/$t.js" || exit 1
done
echo "all suites passed"

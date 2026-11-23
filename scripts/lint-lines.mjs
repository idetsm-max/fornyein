#!/usr/bin/env node
// Line budget ratchet: every file <= 300 lines and every line <= 160 characters.
// Files recorded in scripts/lint-baseline.json are grandfathered at their current
// size; they may only get smaller or cleaner. New files must pass outright.
// Refresh the baseline after an intentional split/rewrite: node scripts/lint-lines.mjs --update
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_FILE = path.join(ROOT, 'scripts', 'lint-baseline.json');
const MAX_LINES = 300, MAX_LINE = 160;
const ROOTS = ['public/v2', 'scripts', 'worker/src'];
const EXT = new Set(['.js', '.mjs', '.css', '.html']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(full, out); }
    else if (EXT.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function measure(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/\n$/, '').split('\n');
  return { lines: lines.length, long: lines.filter((line) => line.length > MAX_LINE).length };
}

const measured = Object.fromEntries(
  ROOTS.flatMap((root) => walk(path.join(ROOT, root)))
    .map((file) => [path.relative(ROOT, file), measure(file)])
    .sort(([a], [b]) => a.localeCompare(b)),
);

if (process.argv.includes('--update')) {
  // Only files that still exceed a budget are grandfathered; clean files are
  // dropped so the ratchet tightens instead of leaking.
  const next = Object.fromEntries(Object.entries(measured)
    .filter(([, m]) => m.lines > MAX_LINES || m.long > 0));
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(next, null, 2) + '\n');
  console.log(`lint baseline written for ${Object.keys(next).length} oversized files`);
  process.exit(0);
}

const baseline = fs.existsSync(BASELINE_FILE) ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) : {};
const problems = [];
for (const [file, m] of Object.entries(measured)) {
  const base = baseline[file];
  if (!base) {
    if (m.lines > MAX_LINES) problems.push(`${file}: ${m.lines} lines (max ${MAX_LINES})`);
    if (m.long) problems.push(`${file}: ${m.long} line(s) over ${MAX_LINE} chars`);
    continue;
  }
  if (m.lines > base.lines) problems.push(`${file}: grew from ${base.lines} to ${m.lines} lines — split the file`);
  if (m.long > base.long) problems.push(`${file}: ${m.long} long line(s), baseline was ${base.long}`);
}
if (problems.length) {
  console.error(`lint-lines: ${problems.length} problem(s)\n` + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log(`lint-lines: ${Object.keys(measured).length} files within budget`);

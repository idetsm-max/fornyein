import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

const REQUIRED = ['--success', '--warn', '--danger', '--info', '--selection-outline', '--snap-guide', '--accent-soft', '--field2'];

test('both themes define the UX Part 0 colour roles', () => {
  const dark = css.slice(css.indexOf(':root'), css.indexOf('[data-theme="light"]'));
  const light = css.slice(css.indexOf('[data-theme="light"]'), css.indexOf('}', css.indexOf('[data-theme="light"]') + 20));
  for (const token of REQUIRED) {
    assert.ok(dark.includes(token), `dark theme misses ${token}`);
    assert.ok(light.includes(token), `light theme misses ${token}`);
  }
});

test('focus, disabled, motion and Burmese typography rules exist', () => {
  assert.match(css, /:focus-visible\{outline:2px solid var\(--accent\);outline-offset:2px\}/);
  assert.match(css, /button:disabled[^{]*\{cursor:not-allowed\}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /html\[lang="my"\] body\{line-height:1\.6\}/);
});

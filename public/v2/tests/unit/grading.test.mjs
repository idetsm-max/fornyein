import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADJUST_LABELS, ADJUST_RANGE, DEFAULT_ADJUST, filterString, normalizeAdjust, paintVignette,
} from '../../engine/grading.js';
import { FILTER_PRESETS } from '../../ui/tool-presets.js';

test('every default key has a slider and a range', () => {
  const keys = ADJUST_LABELS.map(([key]) => key).sort();
  assert.deepEqual(keys, Object.keys(DEFAULT_ADJUST).sort());
  for (const [key] of ADJUST_LABELS) assert.equal(ADJUST_RANGE[key].length, 2);
});

test('normalizeAdjust fills defaults and clamps out-of-range values', () => {
  const a = normalizeAdjust({ brightness: 500, temp: -900, vignette: 40, bogus: 5 });
  assert.equal(a.brightness, 100);
  assert.equal(a.temp, -100);
  assert.equal(a.vignette, 40);
  assert.equal(a.blur, 0);
  assert.ok(!('bogus' in a));
});

test('normalizeAdjust ignores non-numeric junk', () => {
  const a = normalizeAdjust({ contrast: 'abc', saturation: null, blur: undefined });
  assert.equal(a.contrast, 0);
  assert.equal(a.saturation, 0);
  assert.equal(a.blur, 0);
});

test('an empty grade renders no filter', () => {
  assert.equal(filterString({}), 'none');
  assert.equal(filterString(), 'none');
});

test('brightness, contrast and saturation map to CSS percentages', () => {
  const s = filterString({ brightness: 20, contrast: -30, saturation: 50 });
  assert.match(s, /brightness\(120%\)/);
  assert.match(s, /contrast\(70%\)/);
  assert.match(s, /saturate\(150%\)/);
});

test('temperature warms with sepia and never goes negative', () => {
  const warm = filterString({ temp: 50 }), cool = filterString({ temp: -50 });
  assert.match(warm, /sepia\(30%\)/);
  assert.ok(!/sepia\(-/.test(cool));
  assert.match(cool, /hue-rotate\(-6deg\)/);
});

test('fade washes the image out instead of just darkening it', () => {
  assert.match(filterString({ fade: 40 }), /contrast\(80%\)/);
});

test('vignette stays out of the filter string', () => {
  assert.equal(filterString({ vignette: 80 }), 'none');
});

test('paintVignette does nothing when the grade is neutral', () => {
  const calls = [];
  const ctx = {
    createRadialGradient: () => calls.push('gradient'),
    fillRect: () => calls.push('fill'),
    save: () => {}, restore: () => {},
  };
  paintVignette(ctx, 100, 50, 0);
  assert.deepEqual(calls, []);
});

test('paintVignette covers the clip box with a radial gradient', () => {
  const calls = [];
  const ctx = {
    createRadialGradient: (x0, y0, r0, x1, y1, r1) => { calls.push(['grad', x0, y0, r0, x1, y1, r1]); return { addColorStop: () => {} }; },
    fillRect: (x, y, w, h) => calls.push(['fill', x, y, w, h]),
    save: () => {}, restore: () => {},
  };
  paintVignette(ctx, 200, 100, 100);
  assert.equal(calls[0][0], 'grad');
  assert.deepEqual(calls[1], ['fill', -100, -50, 200, 100]);
});

test('filter presets only use known adjust keys and reach the CSS filter', () => {
  for (const preset of FILTER_PRESETS) {
    for (const key of Object.keys(preset.adjust)) assert.ok(key in DEFAULT_ADJUST, key);
    const s = filterString(preset.adjust);
    if (preset.id === 'none') assert.equal(s, 'none');
    else assert.notEqual(s, 'none', preset.id);
  }
});

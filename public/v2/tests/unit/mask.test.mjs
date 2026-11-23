import test from 'node:test';
import assert from 'node:assert/strict';
import { maskBox, maskActive, maskPath, applyMask, MASK_SHAPES } from '../../engine/mask.js';

test('mask shapes list and activity check', () => {
  assert.deepEqual(MASK_SHAPES, ['none', 'rect', 'ellipse']);
  assert.equal(maskActive({ shape: 'none' }), false);
  assert.equal(maskActive({ shape: 'bogus' }), false);
  assert.equal(maskActive({ shape: 'rect' }), true);
  assert.equal(maskActive(undefined), false);
});

test('maskBox maps percentages to pixels and clamps', () => {
  assert.deepEqual(maskBox({ w: 50, h: 50, x: 50, y: 50 }, 1000, 500), { cx: 500, cy: 250, w: 500, h: 250, x: 250, y: 125 });
  const big = maskBox({ w: 500, h: 0, x: 50, y: 50 }, 1000, 500);
  assert.equal(big.w, 1000);
  assert.equal(big.h, 5);
  const far = maskBox({ x: -100, y: 300 }, 1000, 500);
  assert.equal(far.cx, -500);
  assert.equal(far.cy, 750);
});

test('maskPath builds a rect or an ellipse and applyMask clips', () => {
  const calls = [];
  const ctx = { beginPath() {}, rect: (...a) => calls.push(['rect', ...a]), ellipse: (...a) => calls.push(['ellipse', ...a]), clip: (rule) => calls.push(['clip', rule]) };
  maskPath(ctx, { shape: 'rect', w: 50, h: 50, x: 50, y: 50 }, 1000, 500);
  assert.deepEqual(calls[0], ['rect', 250, 125, 500, 250]);
  calls.length = 0;
  maskPath(ctx, { shape: 'ellipse', w: 50, h: 50, x: 50, y: 50, invert: true }, 1000, 500);
  assert.deepEqual(calls[0], ['rect', 0, 0, 1000, 500]);
  assert.equal(calls[1][0], 'ellipse');
  calls.length = 0;
  assert.equal(applyMask(ctx, { shape: 'ellipse', invert: true }), true);
  assert.deepEqual(calls.at(-1), ['clip', 'evenodd']);
  assert.equal(applyMask(ctx, { shape: 'none' }), false);
});

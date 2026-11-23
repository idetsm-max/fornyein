import test from 'node:test';
import assert from 'node:assert/strict';
import { rangeOn, wrapRange } from '../../engine/range.js';

const r = { in: 2, out: 6, loop: true };

test('range is only active when loop + both points are valid', () => {
  assert.equal(rangeOn(r), true);
  assert.equal(rangeOn({ ...r, loop: false }), false);
  assert.equal(rangeOn({ ...r, out: 2 }), false);
  assert.equal(rangeOn({ ...r, in: null }), false);
});

test('time inside the range is untouched', () => {
  assert.equal(wrapRange(4, r), 4);
});

test('time past out wraps back into the range', () => {
  assert.equal(wrapRange(6.5, r), 2.5);
  assert.equal(wrapRange(10, r), 2);
});

test('time before in wraps forward into the range', () => {
  assert.equal(wrapRange(0, r), 4);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionFx, TRANSITION_TYPES, TRANSITION_NAMES } from '../../engine/transitions.js';

test('there are eight real transitions plus none', () => {
  assert.equal(TRANSITION_TYPES.length, 9);
  assert.equal(TRANSITION_TYPES[0], 'none');
  for (const id of TRANSITION_TYPES) assert.ok(TRANSITION_NAMES[id], id);
});

test('fade multiplies alpha on both ends', () => {
  assert.equal(transitionFx({ inType: 'fade', inProgress: 0.5 }).alpha, 0.5);
  assert.equal(transitionFx({ outType: 'fade', outProgress: 0.25 }).alpha, 0.25);
  assert.equal(transitionFx({ inType: 'fade', outType: 'fade', inProgress: 0.5, outProgress: 0.5 }).alpha, 0.25);
});

test('slide pushes in from the right and out to the left', () => {
  assert.equal(transitionFx({ inType: 'slide', inProgress: 0.5 }, 1000, 500).dx, 500);
  assert.equal(transitionFx({ outType: 'slide', outProgress: 0.5 }, 1000, 500).dx, -500);
});

test('zoom, rise, spin, blur and wipe map progress to their channels', () => {
  assert.equal(transitionFx({ inType: 'zoom', inProgress: 1 }).scale, 1);
  assert.ok(transitionFx({ inType: 'zoom', inProgress: 0 }).scale < 1);
  assert.equal(transitionFx({ inType: 'rise', inProgress: 0 }, 100, 400).dy, 100);
  assert.equal(transitionFx({ inType: 'spin', inProgress: 0 }).rot, 6);
  assert.equal(transitionFx({ inType: 'blur', inProgress: 0 }).blur, 12);
  assert.equal(transitionFx({ inType: 'wipe', inProgress: 0.3 }).wipe, 0.3);
});

test('progress is clamped and none is a no-op', () => {
  assert.equal(transitionFx({ inType: 'fade', inProgress: 5 }).alpha, 1);
  assert.equal(transitionFx({ inType: 'fade', inProgress: -2 }).alpha, 0);
  assert.deepEqual(transitionFx({ inType: 'none', outType: 'none' }), { alpha: 1, dx: 0, dy: 0, scale: 1, blur: 0, wipe: 1, rot: 0 });
});

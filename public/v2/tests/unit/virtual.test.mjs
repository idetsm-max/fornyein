import test from 'node:test';
import assert from 'node:assert/strict';
import { clipVisible, visibleClips } from '../../engine/virtual.js';

const view = { left: 1200, width: 1000 };
const clips = [
  { id: 'a', start: 0, dur: 2 },
  { id: 'b', start: 10, dur: 2 },
  { id: 'c', start: 40, dur: 2 },
];

test('clips inside the window plus margin are visible', () => {
  assert.equal(clipVisible(clips[1], 100, view.left, view.width), true);
});

test('clips far before the window are hidden', () => {
  assert.equal(clipVisible(clips[0], 100, view.left, view.width), false);
});

test('visibleClips keeps only the near ones', () => {
  assert.deepEqual(visibleClips(clips, 100, view).map((c) => c.id), ['b']);
});

test('margin widens the window on both sides', () => {
  assert.equal(clipVisible(clips[0], 100, view.left, view.width, 2000), true);
});

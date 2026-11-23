import test from 'node:test';
import assert from 'node:assert/strict';
import { addKeyframe, removeKeyframeAt, sampleKeyframes, resolvedTransform, keyframeTimes, clearKeyframes } from '../../engine/keyframes.js';

const clip = () => ({ start: 0, dur: 4, pos: { x: 50, y: 50, scale: 1, rot: 0 }, opacity: 100 });

test('addKeyframe snapshots the transform and sorts', () => {
  const c = clip();
  addKeyframe(c, 2, { x: 80, y: 20, scale: 2, opacity: 50 });
  addKeyframe(c, 0);
  assert.deepEqual(keyframeTimes(c), [0, 2]);
  assert.equal(c.keys[1].scale, 2);
});

test('duplicate times replace the existing keyframe', () => {
  const c = clip();
  addKeyframe(c, 1, { x: 10, y: 10, scale: 1, opacity: 100 });
  addKeyframe(c, 1, { x: 90, y: 90, scale: 1, opacity: 100 });
  assert.equal(c.keys.length, 1);
  assert.equal(c.keys[0].x, 90);
});

test('sampleKeyframes interpolates and clamps', () => {
  const keys = [{ t: 1, x: 0, y: 0, scale: 1, opacity: 100 }, { t: 3, x: 100, y: 50, scale: 3, opacity: 0 }];
  assert.equal(sampleKeyframes(keys, 0).x, 0);
  assert.equal(sampleKeyframes(keys, 2).x, 50);
  assert.equal(sampleKeyframes(keys, 2).scale, 2);
  assert.equal(sampleKeyframes(keys, 9).opacity, 0);
});

test('resolvedTransform falls back to the clip position', () => {
  const c = clip();
  assert.deepEqual(resolvedTransform(c, 1), { x: 50, y: 50, scale: 1, opacity: 100 });
  addKeyframe(c, 0, { x: 0, y: 0, scale: 1, opacity: 100 });
  addKeyframe(c, 2, { x: 100, y: 100, scale: 2, opacity: 40 });
  assert.equal(resolvedTransform(c, 1).x, 50);
  assert.equal(resolvedTransform(c, 1).opacity, 70);
});

test('removeKeyframeAt and clearKeyframes', () => {
  const c = clip();
  addKeyframe(c, 0); addKeyframe(c, 1);
  removeKeyframeAt(c, 1);
  assert.deepEqual(keyframeTimes(c), [0]);
  removeKeyframeAt(c, 0);
  assert.equal(c.keys, undefined);
  addKeyframe(c, 0); clearKeyframes(c);
  assert.equal(c.keys, undefined);
});

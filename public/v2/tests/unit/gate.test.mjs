import test from 'node:test';
import assert from 'node:assert/strict';
import { gateEnvelope } from '../../engine/audio-graph.js';

const peaks = [0.2, 0.2, 0.001, 0.001, 0.3, 0.3];

test('gateEnvelope opens on loud buckets and closes on quiet ones', () => {
  const env = gateEnvelope({ peaks, dur: 6, mediaDur: 6, threshold: 0.05 });
  assert.equal(env.length, 6);
  assert.deepEqual(env.map((p) => p.value), [1, 1, 0, 0, 1, 1]);
  assert.equal(env[0].ramp, false);
  assert.ok(env.slice(1).every((p) => p.ramp));
  assert.deepEqual(env.map((p) => p.time), [0, 1, 2, 3, 4, 5]);
});

test('gateEnvelope honours the source offset and the start time', () => {
  const env = gateEnvelope({ peaks, dur: 3, mediaDur: 6, offset: 2, threshold: 0.05, when: 10 });
  assert.deepEqual(env.map((p) => p.value), [0, 0, 1]);
  assert.equal(env[0].time, 10);
});

test('gateEnvelope is empty without peaks or a duration', () => {
  assert.deepEqual(gateEnvelope({ peaks: [], dur: 4, mediaDur: 4 }), []);
  assert.deepEqual(gateEnvelope({ peaks, dur: 0, mediaDur: 6 }), []);
  assert.deepEqual(gateEnvelope({ peaks, dur: 4, mediaDur: 0 }), []);
});

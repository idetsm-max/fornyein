import test from 'node:test';
import assert from 'node:assert/strict';
import { readMeters, setMeterSource, meterSource } from '../../engine/meters.js';

const analyser = (samples) => ({ fftSize: samples.length, getFloatTimeDomainData: (buf) => buf.set(samples) });

test('no mixer means no levels', () => {
  setMeterSource(null);
  assert.deepEqual(readMeters(), {});
  assert.equal(meterSource(), null);
});

test('silence reads zero', () => {
  setMeterSource({ buses: new Map([['trk-audio', { analyser: analyser([0, 0, 0, 0]) }]]) });
  assert.equal(readMeters()['trk-audio'], 0);
});

test('full-scale tone clamps to one', () => {
  setMeterSource({ buses: new Map([['trk-audio', { analyser: analyser([1, -1, 1, -1]) }]]) });
  assert.equal(readMeters()['trk-audio'], 1);
});

test('rms scales with amplitude', () => {
  setMeterSource({ buses: new Map([['trk-audio', { analyser: analyser([0.1, 0.1, 0.1, 0.1]) }]]) });
  const level = readMeters()['trk-audio'];
  assert.ok(Math.abs(level - 0.3) < 1e-6, String(level));
});

test('buses without an analyser are skipped', () => {
  setMeterSource({ buses: new Map([['trk-audio', {}], ['trk-music', { analyser: analyser([0, 0, 0, 0]) }]]) });
  assert.deepEqual(Object.keys(readMeters()), ['trk-music']);
});

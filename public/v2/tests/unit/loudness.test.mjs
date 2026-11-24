import test from 'node:test';
import assert from 'node:assert/strict';
import { peaksRms, rmsToDb, loudnessGain, loudnessReport, LUFS_TARGET, GAIN_MIN, GAIN_MAX } from '../../engine/loudness.js';

test('peaksRms averages squares and ignores silence', () => {
  assert.equal(peaksRms([]), 0);
  assert.equal(peaksRms([0, 0]), 0);
  assert.ok(Math.abs(peaksRms([0.5, 0.5]) - 0.5) < 1e-9);
  assert.ok(Math.abs(peaksRms([0.3, 0.4]) - Math.sqrt(0.125)) < 1e-9);
});

test('rmsToDb reports dBFS and floors silence', () => {
  assert.ok(Math.abs(rmsToDb(1) - 0) < 1e-9);
  assert.ok(Math.abs(rmsToDb(0.5) + 6.0206) < 1e-3);
  assert.equal(rmsToDb(0), -96);
});

test('loudnessGain lifts quiet audio and clamps extremes', () => {
  const quiet = loudnessGain([0.05]);
  assert.ok(quiet > 1 && quiet <= GAIN_MAX, String(quiet));
  const loud = loudnessGain([1]);
  assert.equal(loud, GAIN_MIN);
  assert.equal(loudnessGain([]), 1);
  const target = loudnessGain([0.05], -20);
  assert.ok(target < quiet);
});

test('loudnessReport flags silent clips', () => {
  const silent = loudnessReport([]);
  assert.equal(silent.silent, true);
  const report = loudnessReport([0.02]);
  assert.equal(report.target, LUFS_TARGET);
  assert.ok(report.db < 0 && report.gain > 1);
});

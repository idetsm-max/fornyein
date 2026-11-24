import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, sanitize, loadSettings, saveSettings, snapSeconds, qualityCap, KEY } from '../../engine/settings.js';

const fakeStorage = (seed) => { const m = new Map(seed ? [[KEY, JSON.stringify(seed)]] : []); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test('defaults are returned for an empty store', () => {
  assert.deepEqual(loadSettings(fakeStorage()), DEFAULTS);
});

test('unknown keys and bad values fall back to defaults', () => {
  const s = sanitize({ theme: 'neon', snapPx: 'wide', textDur: 99, perfHud: 'yes', nope: 1 });
  assert.equal(s.theme, DEFAULTS.theme);
  assert.equal(s.snapPx, DEFAULTS.snapPx);
  assert.equal(s.textDur, 20);
  assert.equal(s.perfHud, true);
  assert.equal('nope' in s, false);
});

test('numeric settings are clamped to their limits', () => {
  assert.equal(sanitize({ snapPx: 99 }).snapPx, 12);
  assert.equal(sanitize({ snapPx: 1 }).snapPx, 4);
  assert.equal(sanitize({ autosaveMs: 10 }).autosaveMs, 700);
  assert.equal(sanitize({ autosaveMs: 99999 }).autosaveMs, 5000);
});

test('choice settings only accept known values', () => {
  assert.equal(sanitize({ timecode: 'sec' }).timecode, 'sec');
  assert.equal(sanitize({ timecode: 'frames' }).timecode, 'tc');
  assert.equal(sanitize({ previewQuality: 0.5 }).previewQuality, '0.5');
});

test('saveSettings writes the sanitised object', () => {
  const storage = fakeStorage();
  saveSettings({ ...DEFAULTS, snapPx: 100 }, storage);
  assert.equal(JSON.parse(storage.getItem(KEY)).snapPx, 12);
});

test('snapSeconds converts pixels through the timeline scale', () => {
  assert.equal(snapSeconds({ snapPx: 8 }, 40), 0.2);
  assert.equal(snapSeconds({ snapPx: 4 }, 80), 0.05);
  assert.ok(snapSeconds({ snapPx: 8 }, 0) > 0);
});

test('qualityCap maps the preview quality setting', () => {
  assert.equal(qualityCap({ previewQuality: 'auto' }), 1);
  assert.equal(qualityCap({ previewQuality: '0.5' }), 0.5);
  assert.equal(qualityCap({ previewQuality: '0.25' }), 0.25);
});

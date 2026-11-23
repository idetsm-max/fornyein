import test from 'node:test';
import assert from 'node:assert/strict';
import { FILTER_PRESETS, TRANSITION_PRESETS, STICKERS, toggleEffect, findPreset, isAdjustKey } from '../../ui/tool-presets.js';

test('preset ids are unique', () => {
  for (const list of [FILTER_PRESETS, TRANSITION_PRESETS]) {
    const ids = list.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('filter presets only use known adjust keys', () => {
  for (const preset of FILTER_PRESETS) {
    for (const key of Object.keys(preset.adjust)) assert.ok(isAdjustKey(key), key);
  }
});

test('toggleEffect adds then removes a key', () => {
  assert.deepEqual(toggleEffect([], 'glow'), ['glow']);
  assert.deepEqual(toggleEffect(['glow', 'blur'], 'glow'), ['blur']);
});

test('findPreset and stickers', () => {
  assert.equal(findPreset(FILTER_PRESETS, 'mono').adjust.saturation, -100);
  assert.equal(findPreset(FILTER_PRESETS, 'nope'), null);
  assert.ok(STICKERS.length >= 8);
});

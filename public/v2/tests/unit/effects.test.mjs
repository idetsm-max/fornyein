import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIP_EFFECTS, EFFECT_BY_ID, effectStack, hasEffects, sumAdjust } from '../../engine/effects.js';
import { DEFAULT_ADJUST } from '../../engine/grading.js';

test('the library ships at least fifteen effects with unique ids', () => {
  assert.ok(CLIP_EFFECTS.length >= 15, String(CLIP_EFFECTS.length));
  assert.equal(EFFECT_BY_ID.size, CLIP_EFFECTS.length);
  for (const ef of CLIP_EFFECTS) assert.ok(ef.name && ef.id);
});

test('an empty stack changes nothing', () => {
  const stack = effectStack([]);
  assert.deepEqual(stack.adjust, DEFAULT_ADJUST);
  assert.deepEqual(stack.css, []);
  assert.deepEqual(stack.overlays, []);
  assert.equal(hasEffects([]), false);
});

test('unknown effect ids and zero amounts are ignored', () => {
  const stack = effectStack([{ id: 'nope' }, { id: 'mono', amount: 0 }, null]);
  assert.deepEqual(stack.adjust, DEFAULT_ADJUST);
  assert.equal(hasEffects([{ id: 'nope' }]), false);
});

test('a half-strength mono effect halves the desaturation', () => {
  const stack = effectStack([{ id: 'mono', amount: 50 }]);
  assert.equal(stack.adjust.saturation, -50);
  assert.equal(hasEffects([{ id: 'mono', amount: 50 }]), true);
});

test('stacked effects sum and clamp to the slider range', () => {
  const stack = effectStack([{ id: 'mono' }, { id: 'noir' }]);
  assert.equal(stack.adjust.saturation, -100);
  assert.equal(stack.adjust.contrast, 25);
  assert.equal(stack.adjust.vignette, 40);
});

test('invert rides on CSS with the amount as a percentage', () => {
  assert.deepEqual(effectStack([{ id: 'invert' }]).css, ['invert(100%)']);
  assert.deepEqual(effectStack([{ id: 'invert', amount: 40 }]).css, ['invert(40%)']);
});

test('overlays are collected in stack order with their intensity', () => {
  const stack = effectStack([{ id: 'oldfilm' }, { id: 'glow', amount: 50 }]);
  assert.deepEqual(stack.overlays, [['grain', 1], ['scanlines', 1], ['glow', 0.5]]);
});

test('sumAdjust adds two slidergroups and clamps', () => {
  const merged = sumAdjust({ brightness: 40, saturation: -80 }, { brightness: 30, saturation: -80 });
  assert.equal(merged.brightness, 70);
  assert.equal(merged.saturation, -100);
  assert.equal(merged.blur, 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { SHORTCUT_GROUPS, implementedShortcuts } from '../../ui/keymap.js';

const all = SHORTCUT_GROUPS.flatMap((g) => g.items);

test('every shortcut has keys and a label', () => {
  assert.ok(SHORTCUT_GROUPS.length >= 4);
  for (const item of all) {
    assert.ok(item.keys.trim().length > 0);
    assert.ok(item.en.trim().length > 0);
    assert.equal(typeof item.done, 'boolean');
  }
});

test('key combos are unique', () => {
  const keys = all.map((i) => i.keys.toLowerCase());
  assert.equal(new Set(keys).size, keys.length);
});

test('core bindings are registered as implemented', () => {
  const done = implementedShortcuts().flatMap((g) => g.items.map((i) => i.keys));
  for (const key of ['Space', 'Ctrl/Cmd + S', 'Ctrl/Cmd + E', '?', 'Ctrl/Cmd + Z', 'M', 'I / O']) {
    assert.ok(done.includes(key), key);
  }
});

test('the implemented list only exposes done bindings', () => {
  const shown = implementedShortcuts().flatMap((g) => g.items);
  assert.ok(!shown.some((i) => i.done === false));
  assert.ok(shown.some((i) => i.keys.startsWith('F')), 'fullscreen key is listed');
});

test('every listed shortcut is implemented', () => {
  assert.equal(all.filter((i) => !i.done).length, 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocale, setLocale, toggleLocale, LOCALE_KEY } from '../../ui/locale-core.js';

test('defaults to en outside a browser', () => {
  assert.equal(getLocale(), 'en');
  assert.equal(LOCALE_KEY, 'fornyein.locale');
});

test('setLocale accepts only en or my', () => {
  setLocale('my');
  assert.equal(getLocale(), 'my');
  setLocale('fr');
  assert.equal(getLocale(), 'en');
});

test('toggleLocale flips the current locale', () => {
  setLocale('en');
  assert.equal(toggleLocale(), 'my');
  assert.equal(getLocale(), 'my');
  assert.equal(toggleLocale(), 'en');
});

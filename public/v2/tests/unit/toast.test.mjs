import test from 'node:test';
import assert from 'node:assert/strict';
import { createToastQueue } from '../../ui/toast-queue.js';

test('push adds items and notifies subscribers', () => {
  const queue = createToastQueue();
  let seen = null;
  queue.subscribe((items) => { seen = items; });
  queue.push('hello', 'ok');
  assert.equal(seen.length, 1);
  assert.equal(seen[0].message, 'hello');
  assert.equal(seen[0].tone, 'ok');
});

test('identical messages are not duplicated', () => {
  const queue = createToastQueue();
  queue.push('saved');
  assert.equal(queue.push('saved'), null);
  assert.equal(queue.get().length, 1);
});

test('empty messages are ignored and the list is capped', () => {
  const queue = createToastQueue();
  assert.equal(queue.push('  '), null);
  for (let i = 0; i < 8; i++) queue.push('m' + i);
  assert.equal(queue.get().length, 4);
  assert.equal(queue.get().at(-1).message, 'm7');
});

test('dismiss and clear update the list', () => {
  const queue = createToastQueue();
  const id = queue.push('one');
  queue.dismiss(id);
  assert.equal(queue.get().length, 0);
  queue.push('two');
  queue.clear();
  assert.equal(queue.get().length, 0);
});

test('toast lifetime follows the tone (UX Part 0)', () => {
  const queue = createToastQueue();
  queue.push('info one');
  queue.push('bad thing', 'error');
  queue.push('careful', 'warn');
  const [info, error, warn] = queue.get();
  assert.equal(info.ms, 3000);
  assert.equal(error.ms, 6000);
  assert.equal(warn.ms, 4500);
});

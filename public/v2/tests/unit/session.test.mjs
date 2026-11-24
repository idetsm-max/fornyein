import test from 'node:test';
import assert from 'node:assert/strict';
import { markRecovery, clearRecovery, hasRecovery, recoveryAge, olderWins, createTabLock, RECOVERY_KEY } from '../../engine/session.js';

const fakeStorage = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), _m: m }; };

test('the recovery flag round-trips', () => {
  const s = fakeStorage();
  assert.equal(hasRecovery(s), false);
  markRecovery(s);
  assert.equal(hasRecovery(s), true);
  assert.ok(recoveryAge(s) > 0);
  clearRecovery(s);
  assert.equal(hasRecovery(s), false);
  assert.equal(s.getItem(RECOVERY_KEY), null);
});

test('a broken storage never throws', () => {
  const bad = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(hasRecovery(bad), false);
  assert.doesNotThrow(() => markRecovery(bad));
  assert.doesNotThrow(() => clearRecovery(bad));
});

test('the older tab keeps the lock', () => {
  assert.equal(olderWins(200, 100), true);
  assert.equal(olderWins(100, 200), false);
  assert.equal(olderWins(100, 100), false);
});

const fakeChannel = () => {
  const sent = [];
  return { sent, postMessage: (m) => sent.push(m), close: () => sent.push({ type: 'closed' }), onmessage: null, reply(m) { this.onmessage?.({ data: m }); } };
};

test('a hello from an older tab makes this tab read-only', () => {
  const ch = fakeChannel(); const peers = [];
  createTabLock({ channel: ch, at: 200, onPeer: (v) => peers.push(v) });
  assert.deepEqual(ch.sent[0], { type: 'hello', at: 200 });
  ch.reply({ type: 'hello', at: 100 });
  assert.deepEqual(peers, [true]);
  assert.ok(ch.sent.some((m) => m.type === 'here'));
});

test('a hello from a newer tab leaves this tab writable', () => {
  const ch = fakeChannel(); const peers = [];
  createTabLock({ channel: ch, at: 100, onPeer: (v) => peers.push(v) });
  ch.reply({ type: 'hello', at: 200 });
  assert.deepEqual(peers, []);
});

test('takeover clears the lock and tells the other tab', () => {
  const ch = fakeChannel(); const peers = [];
  const lock = createTabLock({ channel: ch, at: 200, onPeer: (v) => peers.push(v) });
  ch.reply({ type: 'here', at: 100 });
  lock.takeOver();
  assert.deepEqual(peers, [true, false]);
  assert.ok(ch.sent.some((m) => m.type === 'takeover'));
  ch.reply({ type: 'takeover', at: 100 });
  assert.deepEqual(peers, [true, false, true]);
});

test('closing posts bye and closes the channel', () => {
  const ch = fakeChannel();
  const lock = createTabLock({ channel: ch, at: 1, onPeer: () => {} });
  lock.close();
  assert.ok(ch.sent.some((m) => m.type === 'bye'));
  assert.ok(ch.sent.some((m) => m.type === 'closed'));
});

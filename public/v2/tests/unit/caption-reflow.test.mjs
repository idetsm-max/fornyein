import test from 'node:test';
import assert from 'node:assert/strict';
import { reflowCues, CAPTION_MAX_CHARS } from '../../engine/captions.js';

const long = 'မြန်မာကဗျာတစ်ပုဒ်ကိုရေးပါမည်'; // 24 chars, no spaces

test('reflowCues splits a long Burmese line on the character budget', () => {
  const rows = reflowCues([{ text: long.repeat(2), start: 0, end: 6 }], { maxChars: 24 });
  assert.ok(rows.length >= 2);
  assert.ok(rows.every((r) => r.text.length <= 24));
  assert.equal(rows.map((r) => r.text).join(''), long.repeat(2));
  assert.equal(rows[0].start, 0);
  assert.equal(rows.at(-1).end, 6);
  assert.ok(rows[0].end <= rows[1].start);
});

test('reflowCues splits Latin text on word boundaries', () => {
  const rows = reflowCues([{ text: 'the quick brown fox jumps over the lazy dog', start: 0, end: 4 }], { maxChars: 20 });
  assert.ok(rows.length > 1);
  assert.ok(rows.every((r) => r.text.length <= 20 && !r.text.startsWith(' ') && !r.text.endsWith(' ')));
  assert.equal(rows.map((r) => r.text).join(' '), 'the quick brown fox jumps over the lazy dog');
});

test('reflowCues shares the time by text length', () => {
  const rows = reflowCues([{ text: 'aaaaaaaaaaaaaaaabbbb', start: 0, end: 10 }], { maxChars: 8, maxDur: 10 });
  assert.equal(rows.length, 3);
  assert.ok(Math.abs(rows[0].end - 3.5) < 0.01, JSON.stringify(rows));
  assert.ok(Math.abs(rows[1].end - 7) < 0.01, JSON.stringify(rows));
});

test('reflowCues caps long segments and keeps every cue readable', () => {
  const rows = reflowCues([{ text: 'short line here', start: 0, end: 40 }], { maxDur: 6, minDur: 0.7 });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].end, 6);
});

test('reflowCues never overlaps cues from different rows', () => {
  const rows = reflowCues([
    { text: 'first cue text', start: 0, end: 3 },
    { text: 'second cue text', start: 1, end: 4 },
  ]);
  assert.equal(rows.length, 2);
  assert.ok(rows[1].start >= rows[0].start);
  assert.equal(rows[0].end, Math.max(rows[0].end, rows[1].start));
});

test('reflowCues drops empty and invalid rows', () => {
  assert.deepEqual(reflowCues([{ text: '   ', start: 0, end: 2 }, { text: 'x', start: 3, end: 3 }, { text: 'y', start: 'a', end: 2 }]), []);
  assert.equal(reflowCues([]).length, 0);
  assert.equal(CAPTION_MAX_CHARS, 28);
});

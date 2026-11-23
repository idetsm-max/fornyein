import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSrt, srtSeconds, captionClip } from '../../engine/captions.js';

const sample = '\uFEFF1\r\n00:00:00,500 --> 00:00:02,250\r\nပထမ ကြောင်း\r\n\r\n2\r\n00:00:03,000 --> 00:00:05,000\r\nဒုတိယ\r\nအပိုလိုင်း\r\n';

test('srtSeconds parses comma and dot stamps', () => {
  assert.equal(srtSeconds('00:01:02,500'), 62.5);
  assert.equal(srtSeconds('01:00:00.25'), 3600.25);
  assert.ok(Number.isNaN(srtSeconds('nope')));
});

test('parseSrt reads cues with BOM and CRLF', () => {
  const cues = parseSrt(sample);
  assert.equal(cues.length, 2);
  assert.deepEqual(cues[0], { start: 0.5, dur: 1.75, text: 'ပထမ ကြောင်း' });
  assert.equal(cues[1].text, 'ဒုတိယ\nအပိုလိုင်း');
});

test('parseSrt skips malformed and empty blocks', () => {
  const cues = parseSrt('1\n00:00:05,000 --> 00:00:01,000\nbackwards\n\n2\nnot a stamp\n\n3\n00:00:01,000 --> 00:00:02,000\n\n');
  assert.equal(cues.length, 0);
});

test('captionClip marks the clip and sets caption styling', () => {
  const clip = captionClip({ start: 1, dur: 2, text: 'hi' });
  assert.equal(clip.caption, true);
  assert.equal(clip.review, 'imported');
  assert.equal(clip.style.size, 44);
  assert.equal(clip.pos.y, 88);
});

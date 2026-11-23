import test from 'node:test';
import assert from 'node:assert/strict';
import { trimProject, stripCaptions } from '../../engine/export-range.js';

const project = {
  name: 'p', tracks: [
    { id: 'text', kind: 'text', clips: [
      { id: 'a', kind: 'text', start: 1, dur: 2, text: 'a' },
      { id: 'b', kind: 'text', start: 8, dur: 2, text: 'b', caption: true },
    ] },
    { id: 'audio', kind: 'audio', clips: [
      { id: 'c', kind: 'audio', start: 0, dur: 10, speed: 2, src: { mediaId: 'm', in: 0, out: 20 } },
    ] },
  ],
};

test('trimProject cuts clips to the range and shifts starts', () => {
  const out = trimProject(project, 2, 6);
  const text = out.tracks[0].clips;
  assert.deepEqual(text.map((c) => [c.id, c.start, c.dur]), [['a', 0, 1]]);
});

test('trimProject advances the source offset for trimmed clips', () => {
  const out = trimProject(project, 2, 6);
  const audio = out.tracks[1].clips[0];
  assert.equal(audio.start, 0);
  assert.equal(audio.dur, 4);
  assert.equal(audio.src.in, 4);
});

test('trimProject keeps a minimum duration and clamps negatives', () => {
  const out = trimProject(project, -5, 0.05);
  assert.equal(out.tracks[1].clips.length, 1);
  assert.equal(out.tracks[1].clips[0].dur, 0.1);
});

test('stripCaptions removes only caption clips', () => {
  const out = stripCaptions(project);
  assert.deepEqual(out.tracks[0].clips.map((c) => c.id), ['a']);
  assert.equal(out.tracks[1].clips.length, 1);
});

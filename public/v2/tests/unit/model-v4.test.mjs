// Schema v4 (src{mediaId,in,out}) + lane rules. Run: node public/v2/tests/unit/model-v4.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, newAudioClip, newTextClip, textTrack, findClip, clipEnd } from '../../engine/model.js';
import { createStore } from '../../engine/store.js';
import { addMedia, splitClip, trimClip, slipClip, moveClip } from '../../engine/actions.js';
import { srcTime, sourceRange, clipRangeValid, setClipSpeed, SPEED_MIN, SPEED_MAX } from '../../engine/clip.js';
import { migrate, validate } from '../../engine/migrate.js';
import { nearestFreeStart, laneFor, placeClip, trackHasRoom } from '../../engine/lanes.js';
import { quantize } from '../../engine/time.js';

const tr = { t: 0, seek(v) { this.t = v; } };
const audioClips = (p) => p.tracks.filter((t) => t.kind === 'audio').flatMap((t) => t.clips);

test('new media clips carry src{in,out} and default speed', () => {
  const c = newAudioClip(0, 'm1', 4);
  assert.deepEqual(c.src, { mediaId: 'm1', in: 0, out: 4 });
  assert.equal(c.speed, 1);
  assert.equal(c.reverse, false);
});

test('split keeps the source range contiguous', () => {
  const s = createStore(newProject());
  addMedia(s, tr, { id: 'm1', kind: 'audio', dur: 8 });
  const id = s.get().selection, rightId = splitClip(s, id, 3, { snap: false });
  const left = findClip(s.get().project, id).clip, right = findClip(s.get().project, rightId).clip;
  assert.deepEqual(sourceRange(left), { in: 0, out: 3 });
  assert.deepEqual(sourceRange(right), { in: 3, out: 8 });
  assert.equal(right.start, 3);
  assert.equal(left.dur + right.dur, 8);
});

test('trim left moves src.in, trim right moves src.out', () => {
  const s = createStore(newProject());
  addMedia(s, tr, { id: 'm1', kind: 'audio', dur: 8 });
  const id = s.get().selection;
  trimClip(s, id, 'left', 2, { snap: false });
  let c = findClip(s.get().project, id).clip;
  assert.deepEqual(sourceRange(c), { in: 2, out: 8 });
  assert.equal(c.start, 2); assert.equal(c.dur, 6);
  trimClip(s, id, 'right', 5, { snap: false });
  c = findClip(s.get().project, id).clip;
  assert.deepEqual(sourceRange(c), { in: 2, out: 5 });
  assert.equal(c.dur, 3);
});

test('slip moves the source window without moving the clip', () => {
  const s = createStore(newProject());
  addMedia(s, tr, { id: 'm1', kind: 'audio', dur: 8 });
  const id = s.get().selection;
  trimClip(s, id, 'right', 4, { snap: false });
  slipClip(s, id, 2);
  const c = findClip(s.get().project, id).clip;
  assert.deepEqual(sourceRange(c), { in: 2, out: 6 });
  assert.equal(c.start, 0); assert.equal(c.dur, 4);
});

test('srcTime maps timeline time to source time (speed + reverse)', () => {
  const c = { start: 10, dur: 4, src: { mediaId: 'm', in: 2, out: 6 }, speed: 1 };
  assert.equal(srcTime(c, 10), 2);
  assert.equal(srcTime(c, 12), 4);
  assert.equal(srcTime({ ...c, speed: 2 }, 11), 4);
  assert.equal(srcTime({ ...c, reverse: true }, 10), 6);
  assert.equal(srcTime({ ...c, reverse: true }, 14), 2);
});

test('migrate upgrades a v3 project and is idempotent', () => {
  const v3 = {
    version: 3, id: 'p', name: 'Old', size: '16:9', fps: 30,
    media: { m1: { id: 'm1', dur: 12, kind: 'audio' } },
    tracks: [{ id: 'trk-audio', kind: 'audio', name: 'Audio', clips: [{ id: 'c1', kind: 'audio', start: 1, dur: 5, mediaId: 'm1', name: 'v.wav' }] }],
  };
  const once = migrate(v3), twice = migrate(once);
  assert.equal(once.version, 4);
  assert.deepEqual(once.tracks[0].clips[0].src, { mediaId: 'm1', in: 0, out: 5 });
  assert.equal(once.tracks[0].clips[0].mediaId, undefined);
  assert.deepEqual(twice, once);
  assert.deepEqual(validate(once), []);
});

test('migrate clamps the source range to the media duration', () => {
  const input = { version: 3, media: { m: { id: 'm', dur: 4 } } };
  input.tracks = [{ kind: 'video', clips: [{ id: 'c', kind: 'video', start: 0, dur: 10, mediaId: 'm' }] }];
  const p = migrate(input);
  const c = p.tracks[0].clips[0];
  assert.equal(c.src.out, 4);
  assert.equal(c.dur, 4);
  assert.ok(clipRangeValid(c, 4));
});

test('quantize snaps to the project frame grid', () => {
  assert.equal(quantize(0.51, 30), 0.5);
  assert.equal(quantize(1.01, 30), 1);
  assert.equal(quantize(-3, 30), 0);
});

test('lanes never overlap and add a lane when the first is full', () => {
  const p = newProject();
  textTrack(p).clips.push(newTextClip(0, 'a', 3));
  const lane = laneFor(p, 'text', 0, 3);
  assert.equal(lane.track.id, textTrack(p).id);
  assert.equal(lane.start, 3);
  const placed = placeClip(p, 'sticker', 0, 2);
  assert.equal(placed.track.kind, 'sticker');
  assert.equal(nearestFreeStart(textTrack(p), 1, 1), 3);
  assert.ok(trackHasRoom(textTrack(p), 3, 1));
  assert.ok(!trackHasRoom(textTrack(p), 0.5, 1));
});

test('random moves never leave two clips overlapping on one track', () => {
  const s = createStore(newProject());
  for (let i = 0; i < 12; i++) { tr.t = i * 0.4; addMedia(s, tr, { id: 'm' + i, kind: 'audio', dur: 2 }); }
  const ids = audioClips(s.get().project).map((c) => c.id);
  for (let i = 0; i < 300; i++) {
    const id = ids[i % ids.length];
    moveClip(s, id, (i * 0.37) % 14, { snap: i % 2 === 0 });
    for (const track of s.get().project.tracks) {
      const sorted = [...track.clips].sort((a, b) => a.start - b.start);
      for (let j = 1; j < sorted.length; j++) assert.ok(sorted[j].start >= clipEnd(sorted[j - 1]) - 1e-6);
    }
  }
});

test('addMedia at the same playhead stacks instead of overlapping', () => {
  const s = createStore(newProject());
  addMedia(s, tr, { id: 'm1', kind: 'audio', dur: 3 });
  addMedia(s, tr, { id: 'm2', kind: 'audio', dur: 3 });
  const clips = audioClips(s.get().project).sort((a, b) => a.start - b.start);
  assert.equal(clips.length, 2);
  assert.ok(clips[1].start >= clipEnd(clips[0]) - 1e-6);
});

test('setClipSpeed keeps the source slice and rescales duration', () => {
  const c = { start: 0, dur: 4, src: { mediaId: 'm', in: 2, out: 6 }, speed: 1 };
  setClipSpeed(c, 2);
  assert.equal(c.speed, 2);
  assert.equal(c.dur, 2);
  assert.deepEqual(sourceRange(c), { in: 2, out: 6 });
  setClipSpeed(c, 0.5);
  assert.equal(c.dur, 8);
  setClipSpeed(c, 99);
  assert.equal(c.speed, SPEED_MAX);
  setClipSpeed(c, 0.01);
  assert.equal(c.speed, SPEED_MIN);
});

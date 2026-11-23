import test from 'node:test';
import assert from 'node:assert/strict';
import { findClip, newProject, newTextClip, newVisualClip, textTrack, visualTrack } from '../../engine/model.js';
import { createStore } from '../../engine/store.js';
import {
  moveClips, trimClip, splitClips, slideClip, lift, extract, insertAt, overwriteAt, setClipProp,
} from '../../engine/timeline.js';

function setup(clips = [newTextClip(0, 'a', 2), newTextClip(4, 'b', 2)]) {
  const p = newProject();
  textTrack(p).clips.push(...clips);
  return { p, store: createStore(p) };
}
const starts = (store) => textTrack(store.get().project).clips.slice().sort((a, b) => a.start - b.start).map((c) => +c.start.toFixed(3));

test('moveClips moves a group and keeps lanes safe', () => {
  const { store } = setup();
  const ids = textTrack(store.get().project).clips.map((c) => c.id);
  moveClips(store, ids, 2);
  assert.deepEqual(starts(store), [2, 6]);
  assert.equal(store.get().undoLabel, 'Move 2 clips');
});

test('moveClips copy leaves the originals in place', () => {
  const { store } = setup();
  const ids = textTrack(store.get().project).clips.map((c) => c.id);
  const made = moveClips(store, ids, 1, { copy: true });
  assert.equal(made.length, 2);
  assert.equal(textTrack(store.get().project).clips.length, 4);
  assert.deepEqual(ids.map((id) => findClip(store.get().project, id).clip.start), [0, 4]);
});

test('ripple trim closes the gap after the clip', () => {
  const { store } = setup([newTextClip(0, 'a', 2), newTextClip(3, 'b', 2)]);
  const a = textTrack(store.get().project).clips[0];
  trimClip(store, a.id, 'right', 1, { mode: 'ripple' });
  assert.equal(textTrack(store.get().project).clips.find((c) => c.id === a.id).dur, 1);
  assert.deepEqual(starts(store), [0, 2]);
});

test('roll trim moves the shared edit point', () => {
  const { store } = setup([newTextClip(0, 'a', 2), newTextClip(2, 'b', 2)]);
  const b = textTrack(store.get().project).clips[1];
  trimClip(store, b.id, 'left', 2.5, { mode: 'roll' });
  const [a2, b2] = textTrack(store.get().project).clips;
  assert.equal(a2.dur, 2.5);
  assert.equal(b2.start, 2.5);
  assert.equal(b2.dur, 1.5);
});

test('splitClips splits every track at the playhead', () => {
  const p = newProject();
  textTrack(p).clips.push(newTextClip(0, 'a', 4));
  visualTrack(p).clips.push(newVisualClip(1, 'm', 2));
  const store = createStore(p);
  const made = splitClips(store, null, 2, { allTracks: true });
  assert.equal(made.length, 2);
  assert.equal(textTrack(store.get().project).clips.length, 2);
  assert.equal(visualTrack(store.get().project).clips.length, 2);
});

test('slide trims the neighbour instead of overlapping it', () => {
  const { store } = setup([newTextClip(0, 'a', 2), newTextClip(2, 'b', 2)]);
  const b = textTrack(store.get().project).clips[1];
  slideClip(store, b.id, 0.5);
  const [a2, b2] = textTrack(store.get().project).clips;
  assert.equal(a2.dur, 2.5);
  assert.equal(b2.start, 2.5);
});

test('lift removes the middle of a clip and keeps both ends', () => {
  const { store } = setup([newTextClip(0, 'a', 4)]);
  lift(store, 1, 2);
  const clips = textTrack(store.get().project).clips.slice().sort((a, b) => a.start - b.start);
  assert.deepEqual(clips.map((c) => [+c.start.toFixed(3), +c.dur.toFixed(3)]), [[0, 1], [2, 2]]);
});

test('extract removes a range and closes it on every track', () => {
  const { store } = setup([newTextClip(0, 'a', 4), newTextClip(6, 'b', 2)]);
  extract(store, 1, 2);
  assert.deepEqual(starts(store), [0, 1, 5]);
});

test('insert shifts later content and splits the clip under the point', () => {
  const { store } = setup([newTextClip(0, 'a', 2)]);
  const added = newTextClip(0, 'new', 1);
  insertAt(store, added, 1);
  const clips = textTrack(store.get().project).clips.slice().sort((a, b) => a.start - b.start);
  assert.deepEqual(clips.map((c) => +c.start.toFixed(3)), [0, 1, 2]);
  assert.equal(clips[1].id, added.id);
});

test('overwrite replaces the range it covers', () => {
  const { store } = setup([newTextClip(0, 'a', 4)]);
  const added = newTextClip(0, 'new', 1);
  overwriteAt(store, added, 1);
  const clips = textTrack(store.get().project).clips.slice().sort((a, b) => a.start - b.start);
  assert.deepEqual(clips.map((c) => [+c.start.toFixed(3), +c.dur.toFixed(3)]), [[0, 1], [1, 1], [2, 2]]);
});

test('setClipProp writes a nested value with a label and skips no-ops', () => {
  const { store } = setup([newTextClip(0, 'a', 2)]);
  const id = textTrack(store.get().project).clips[0].id;
  assert.equal(setClipProp(store, id, ['style', 'size'], 90, { label: 'Change size' }), true);
  assert.equal(textTrack(store.get().project).clips[0].style.size, 90);
  assert.equal(store.get().undoLabel, 'Change size');
  assert.equal(setClipProp(store, id, ['style', 'size'], 90), false);
});

test('undo and redo restore the labelled command', () => {
  const { store } = setup([newTextClip(0, 'a', 2)]);
  const id = textTrack(store.get().project).clips[0].id;
  moveClips(store, [id], 2);
  store.undo();
  assert.equal(textTrack(store.get().project).clips[0].start, 0);
  assert.equal(store.get().redoLabel, 'Move 1 clip');
  store.redo();
  assert.equal(textTrack(store.get().project).clips[0].start, 2);
});

test('locked clips are ignored by commands', () => {
  const p = newProject();
  const clip = newTextClip(0, 'a', 2);
  clip.locked = true;
  textTrack(p).clips.push(clip);
  const store = createStore(p);
  moveClips(store, [clip.id], 2);
  assert.equal(textTrack(store.get().project).clips[0].start, 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { findClip, newProject, newTextClip, textTrack } from '../../engine/model.js';
import { createStore } from '../../engine/store.js';
import { linkClips, unlinkClips, linkedIds } from '../../engine/groups.js';
import { addMarker, markers, nextMarker, prevMarker, removeMarkerAt } from '../../engine/markers.js';
import { moveClips, deleteClips } from '../../engine/timeline.js';

function setup() {
  const p = newProject();
  const a = newTextClip(0, 'a', 2), b = newTextClip(4, 'b', 2);
  textTrack(p).clips.push(a, b);
  return { a, b, store: createStore(p) };
}
const startOf = (store, id) => findClip(store.get().project, id).clip.start;

test('link groups move together', () => {
  const { a, b, store } = setup();
  linkClips(store, [a.id, b.id]);
  assert.equal(store.get().undoLabel, 'Link 2 clips');
  moveClips(store, [a.id], 2);
  assert.equal(startOf(store, a.id), 2);
  assert.equal(startOf(store, b.id), 6);
});

test('linked ids expand from any member', () => {
  const { a, b, store } = setup();
  linkClips(store, [a.id, b.id]);
  assert.deepEqual(new Set(linkedIds(store.get().project, [b.id])), new Set([a.id, b.id]));
});

test('unlink stops the group behaviour', () => {
  const { a, b, store } = setup();
  linkClips(store, [a.id, b.id]);
  unlinkClips(store, [a.id]);
  moveClips(store, [a.id], 2);
  assert.equal(startOf(store, b.id), 4);
});

test('deleting one linked clip deletes the group', () => {
  const { a, b, store } = setup();
  linkClips(store, [a.id, b.id]);
  deleteClips(store, [a.id]);
  assert.equal(textTrack(store.get().project).clips.length, 0);
});

test('markers sort, navigate and delete', () => {
  const { store } = setup();
  addMarker(store, 5, 'end');
  addMarker(store, 2, 'start');
  const list = markers(store.get().project);
  assert.deepEqual(list.map((m) => m.t), [2, 5]);
  assert.equal(nextMarker(store.get().project, 0).t, 2);
  assert.equal(prevMarker(store.get().project, 9).t, 5);
  assert.equal(nextMarker(store.get().project, 5), null);
  const hit = removeMarkerAt(store, 2);
  assert.ok(hit);
  assert.deepEqual(markers(store.get().project).map((m) => m.t), [5]);
});

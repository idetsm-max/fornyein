// Run:  node public/v2/tests/unit/engine.test.mjs      (no dependencies)
import assert from 'node:assert/strict';
import { newProject, newTextClip, textTrack, freeSlot, findClip, projectDuration, isEmpty, fmtClock } from '../../engine/model.js';
import { createStore } from '../../engine/store.js';
import { createTransport } from '../../engine/transport.js';

let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok  ' + name); };

t('new project is empty with 4 tracks', () => { const p = newProject(); assert.equal(p.tracks.length, 4); assert.ok(isEmpty(p)); assert.equal(projectDuration(p), 0); });
t('freeSlot skips over clips', () => {
  const p = newProject(); textTrack(p).clips.push(newTextClip(0, 'a', 3), newTextClip(3, 'b', 3));
  assert.equal(freeSlot(textTrack(p), 0, 3), 6); assert.equal(freeSlot(textTrack(p), 7, 3), 7); assert.equal(freeSlot(textTrack(p), 2, 1), 6);
});
t('store edit does not mutate the old project', () => {
  const s = createStore(newProject()), before = s.get().project;
  s.edit((d) => { textTrack(d).clips.push(newTextClip(0, 'x')); });
  assert.notEqual(s.get().project, before); assert.ok(isEmpty(before)); assert.equal(textTrack(s.get().project).clips.length, 1);
});
t('undo / redo', () => {
  const s = createStore(newProject()); s.edit((d) => { textTrack(d).clips.push(newTextClip(0, 'x')); });
  assert.ok(s.get().canUndo); s.undo(); assert.ok(isEmpty(s.get().project)); assert.ok(s.get().canRedo); s.redo(); assert.equal(textTrack(s.get().project).clips.length, 1);
});
t('same key edits merge into one undo step', () => {
  const s = createStore(newProject()); s.edit((d) => { textTrack(d).clips.push(newTextClip(0, 'x')); }); const id = textTrack(s.get().project).clips[0].id;
  for (let i = 1; i <= 5; i++) s.edit((d) => { findClip(d, id).clip.style.size = 70 + i; }, { key: 'size' });
  assert.equal(findClip(s.get().project, id).clip.style.size, 75); s.undo(); assert.equal(findClip(s.get().project, id).clip.style.size, 72);
});
t('selection is cleared when its clip disappears', () => {
  const s = createStore(newProject()); const c = newTextClip(0, 'x'); s.edit((d) => { textTrack(d).clips.push(c); }); s.select(c.id); assert.equal(s.get().selection, c.id); s.undo(); assert.equal(s.get().selection, null);
});
t('transport seeks inside limits and stops at the end', () => {
  const tr = createTransport(() => 5, () => 30); tr.seek(100); assert.equal(tr.t, 30); tr.seek(-3); assert.equal(tr.t, 0);
});
t('timecode', () => { assert.equal(fmtClock(61.5), '00:01:01:15'); });
console.log(`\n${n} tests passed`);

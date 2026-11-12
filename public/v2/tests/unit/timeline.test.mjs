import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, newTextClip, projectDuration, textTrack } from '../../engine/model.js';
import { createStore } from '../../engine/store.js';
import { addLines, addTimedLines, addAsrLines, moveClip, trimClip, splitClip, deleteClips, textToSrt, splitTextClip, mergeTextClips } from '../../engine/actions.js';
import { normalizeMyanmar, revealText, PRESETS, isLikelyZawgyi, convertMyanmarToUnicode } from '../../engine/text.js';

function setup() { const p = newProject(); const c = newTextClip(2, 'တစ်', 4); p.tracks[0].clips.push(c); const store = createStore(p); store.select(c.id); return { p, c, store }; }
test('move clip snaps to nearby clip boundary', () => { const { p, c, store } = setup(); p.tracks[0].clips.push(newTextClip(10, 'နှစ်', 2)); moveClip(store, c.id, 9.92); assert.equal(store.get().project.tracks[0].clips[0].start, 10); });
test('trim clip keeps minimum duration', () => { const { c, store } = setup(); trimClip(store, c.id, 'right', 2.01, { snap: false }); assert.equal(store.get().project.tracks[0].clips[0].dur, 0.1); });
test('split clip creates two clips at playhead', () => { const { c, store } = setup(); const right = splitClip(store, c.id, 4, { snap: false }); assert.ok(right); const clips = store.get().project.tracks[0].clips; assert.equal(clips.length, 2); assert.equal(clips[0].dur, 2); assert.equal(clips[1].start, 4); });
test('ripple delete closes the gap', () => { const { p, c, store } = setup(); const second = newTextClip(8, 'နှစ်', 2); p.tracks[0].clips.push(second); deleteClips(store, [c.id], { ripple: true }); assert.equal(store.get().project.tracks[0].clips[0].start, 4); assert.equal(projectDuration(store.get().project), 6); });
test('text clips export as valid SRT timing', () => { const { p } = setup(); const srt = textToSrt(p); assert.match(srt, /1\n00:00:02,000 --> 00:00:06,000\nတစ်/); });
test('split and merge caption clips preserve timing', () => { const { c, store } = setup(); c.text = 'တစ်\nနှစ်'; const ids = splitTextClip(store, c.id); assert.equal(ids.length, 2); assert.equal(store.get().project.tracks[0].clips.length, 2); mergeTextClips(store, ids); assert.equal(store.get().project.tracks[0].clips.length, 1); assert.match(store.get().project.tracks[0].clips[0].text, /တစ်\nနှစ်/); });
test('Myanmar text helpers and caption creation preserve Unicode', () => {
  const source = 'တွေကို ရေကို ဗုဒ္ဓ မန္တလေး';
  assert.equal(normalizeMyanmar(source), source);
  assert.equal(normalizeMyanmar('ေက'), 'ေက');
  assert.equal(isLikelyZawgyi('\u1031က'), true);
  const store = createStore(newProject()), tr = { t: 0, seek(value) { this.t = value; } };
  addLines(store, tr, [source]);
  addTimedLines(store, tr, [source], [{ start: 5, end: 7 }]);
  addAsrLines(store, tr, [{ text: source, start: 8, end: 10 }]);
  assert.deepEqual(textTrack(store.get().project).clips.map((clip) => clip.text), [source, source, source]);
  assert.equal(revealText('တစ် နှစ်', .5, 'word'), 'တစ် ');
  assert.equal(PRESETS.title.name, 'Title card');
});
test('Zawgyi conversion runs only through the explicit converter helper', async () => {
  const previous = globalThis.Rabbit;
  globalThis.Rabbit = { zg2uni: (text) => text.replace('legacy', 'unicode') };
  try { assert.equal(await convertMyanmarToUnicode('legacy'), 'unicode'); }
  finally { if (previous === undefined) delete globalThis.Rabbit; else globalThis.Rabbit = previous; }
});
test('locked captions cannot be moved or deleted', () => { const { c, store } = setup(); c.locked = true; moveClip(store, c.id, 20); deleteClips(store, [c.id]); assert.equal(store.get().project.tracks[0].clips.length, 1); });

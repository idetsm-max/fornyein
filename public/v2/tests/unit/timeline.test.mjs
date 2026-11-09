import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, newTextClip, projectDuration } from '../../engine/model.js';
import { createStore } from '../../engine/store.js';
import { moveClip, trimClip, splitClip, deleteClips, textToSrt, splitTextClip, mergeTextClips, normalizeTextClip } from '../../engine/actions.js';
import { normalizeMyanmar, revealText, PRESETS } from '../../engine/text.js';

function setup() { const p = newProject(); const c = newTextClip(2, 'တစ်', 4); p.tracks[0].clips.push(c); const store = createStore(p); store.select(c.id); return { p, c, store }; }
test('move clip snaps to nearby clip boundary', () => { const { p, c, store } = setup(); p.tracks[0].clips.push(newTextClip(10, 'နှစ်', 2)); moveClip(store, c.id, 9.92); assert.equal(store.get().project.tracks[0].clips[0].start, 10); });
test('trim clip keeps minimum duration', () => { const { c, store } = setup(); trimClip(store, c.id, 'right', 2.01, { snap: false }); assert.equal(store.get().project.tracks[0].clips[0].dur, 0.1); });
test('split clip creates two clips at playhead', () => { const { c, store } = setup(); const right = splitClip(store, c.id, 4, { snap: false }); assert.ok(right); const clips = store.get().project.tracks[0].clips; assert.equal(clips.length, 2); assert.equal(clips[0].dur, 2); assert.equal(clips[1].start, 4); });
test('ripple delete closes the gap', () => { const { p, c, store } = setup(); const second = newTextClip(8, 'နှစ်', 2); p.tracks[0].clips.push(second); deleteClips(store, [c.id], { ripple: true }); assert.equal(store.get().project.tracks[0].clips[0].start, 4); assert.equal(projectDuration(store.get().project), 6); });
test('text clips export as valid SRT timing', () => { const { p } = setup(); const srt = textToSrt(p); assert.match(srt, /1\n00:00:02,000 --> 00:00:06,000\nတစ်/); });
test('split and merge caption clips preserve timing', () => { const { c, store } = setup(); c.text = 'တစ်\nနှစ်'; const ids = splitTextClip(store, c.id); assert.equal(ids.length, 2); assert.equal(store.get().project.tracks[0].clips.length, 2); mergeTextClips(store, ids); assert.equal(store.get().project.tracks[0].clips.length, 1); assert.match(store.get().project.tracks[0].clips[0].text, /တစ်\nနှစ်/); });
test('Myanmar normalization and reveal utilities work', () => { assert.equal(normalizeMyanmar('ေက'), 'ကေ'); assert.equal(revealText('တစ် နှစ်', .5, 'word'), 'တစ် '); assert.equal(PRESETS.title.name, 'Title card'); });
test('locked captions cannot be edited or deleted', () => { const { c, store } = setup(); c.locked = true; moveClip(store, c.id, 20); deleteClips(store, [c.id]); assert.equal(store.get().project.tracks[0].clips.length, 1); normalizeTextClip(store, c.id); });

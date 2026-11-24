import test from 'node:test';
import assert from 'node:assert/strict';
import { missingMediaIds, relinkMedia, relinkLabel } from '../../engine/media-status.js';
import { newProject, newVisualClip } from '../../engine/model.js';

test('missingMediaIds compares project media with stored keys', () => {
  const project = { media: { a: {}, b: {}, c: {} } };
  assert.deepEqual(missingMediaIds(project, ['a', 'c']), ['b']);
  assert.deepEqual(missingMediaIds(project, new Set(['a', 'b', 'c'])), []);
  assert.deepEqual(missingMediaIds({}, ['x']), []);
});

test('relinkMedia merges metadata and keeps clip references', () => {
  const project = newProject();
  project.media.old = { id: 'old', name: 'voice.m4a', kind: 'audio', dur: 4 };
  const clip = newVisualClip(0, 'old', 4, 'video');
  project.tracks.find((t) => t.kind === 'video').clips.push(clip);
  const entry = relinkMedia(project, 'old', { dur: 9, size: 1234 });
  assert.equal(entry.name, 'voice.m4a');
  assert.equal(entry.dur, 9);
  assert.equal(project.media.old.size, 1234);
  assert.equal(project.tracks.find((t) => t.kind === 'video').clips[0].src.mediaId, 'old');
});

test('relinkLabel pluralises in both languages', () => {
  const T = (en, my) => en;
  assert.match(relinkLabel(1, T), /^1 file is missing/);
  assert.match(relinkLabel(3, T), /^3 files are missing/);
  const MY = (en, my) => my;
  assert.match(relinkLabel(3, MY), /ဖိုင် ၃ ခု/);
});

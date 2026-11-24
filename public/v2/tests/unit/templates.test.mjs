import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECT_TEMPLATES, buildTemplate, templateById } from '../../engine/templates.js';

test('ships at least five project templates', () => {
  assert.ok(PROJECT_TEMPLATES.length >= 5, String(PROJECT_TEMPLATES.length));
  assert.equal(new Set(PROJECT_TEMPLATES.map((t) => t.id)).size, PROJECT_TEMPLATES.length);
});

test('every template builds a schema v4 project with text clips', () => {
  for (const t of PROJECT_TEMPLATES) {
    const p = buildTemplate(t.id);
    assert.equal(p.version, 4, t.id);
    assert.equal(p.size, t.size, t.id);
    const clips = p.tracks.flatMap((tr) => tr.clips);
    assert.ok(clips.length >= 2, t.id);
    for (const c of clips) {
      assert.equal(c.kind, 'text', t.id);
      assert.ok(c.dur > 0 && c.start >= 0, t.id);
      assert.ok(c.text.length > 0, t.id);
    }
  }
});

test('clips never overlap on the text track', () => {
  for (const t of PROJECT_TEMPLATES) {
    const clips = buildTemplate(t.id).tracks.find((tr) => tr.kind === 'text').clips;
    const sorted = clips.slice().sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i].start >= sorted[i - 1].start + sorted[i - 1].dur, `${t.id} #${i}`);
    }
  }
});

test('unknown ids build nothing', () => {
  assert.equal(templateById('nope'), null);
  assert.equal(buildTemplate('nope'), null);
});

test('each build is independent (no shared clip ids)', () => {
  const a = buildTemplate('credits'), b = buildTemplate('credits');
  const ids = new Set([...a.tracks.flatMap((t) => t.clips), ...b.tracks.flatMap((t) => t.clips)].map((c) => c.id));
  assert.equal(ids.size, a.tracks.flatMap((t) => t.clips).length + b.tracks.flatMap((t) => t.clips).length);
});

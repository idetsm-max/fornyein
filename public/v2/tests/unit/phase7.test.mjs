import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, newTextClip } from '../../engine/model.js';
import { projectComplexity, createRenderStats, frameBudget } from '../../engine/perf.js';

test('project complexity counts clips by visual/text class', () => { const p = newProject(); p.tracks[0].clips.push(newTextClip(0, 'က', 1)); const c = projectComplexity(p); assert.equal(c.tracks, 4); assert.equal(c.clips, 1); assert.equal(c.text, 1); });
test('render stats reports frame budget', () => { const stats = createRenderStats({ targetFps: 30 }); stats.frame(0); stats.frame(33.3); const s = stats.snapshot(); assert.equal(s.frames, 2); assert.ok(s.averageMs > 0); assert.equal(typeof s.withinBudget, 'boolean'); });
test('frame budget never returns a negative wait', () => { assert.equal(frameBudget({ lastFrameAt: 0, now: 1000, fps: 30 }), 0); assert.ok(frameBudget({ lastFrameAt: 1000, now: 1001, fps: 30 }) > 0); });
test('long timeline complexity remains bounded and countable', () => { const p = newProject(); for (let i = 0; i < 10000; i++) p.tracks[0].clips.push(newTextClip(i * .1, 'က', .1)); const t0 = Date.now(), c = projectComplexity(p), elapsed = Date.now() - t0; assert.equal(c.clips, 10000); assert.equal(c.text, 10000); assert.ok(elapsed < 250, `complexity scan took ${elapsed}ms`); });

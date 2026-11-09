import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, newAudioClip } from '../../engine/model.js';
import { filterString, normalizeAdjust } from '../../engine/visual.js';

test('audio mixer model contains DSP controls', () => { const c = newAudioClip(0, 'm1', 4); assert.equal(c.volume, 1); assert.equal(c.pan, 0); assert.deepEqual(c.eq, { low: 0, mid: 0, high: 0 }); assert.equal(c.compressor.enabled, false); });
test('tracks expose mixer defaults and ducking', () => { const p = newProject(); const a = p.tracks.find((t) => t.kind === 'audio'); assert.equal(a.mixer.volume, 1); assert.equal(a.mixer.ducking, false); });
test('visual adjustments compile to CSS filter', () => { assert.match(filterString({ brightness: 12, contrast: -10, saturation: 20, blur: 3 }), /brightness\(112%\).*contrast\(90%\).*saturate\(120%\).*blur\(3px\)/); assert.equal(normalizeAdjust({}).blur, 0); });

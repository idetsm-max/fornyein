import test from 'node:test';
import assert from 'node:assert/strict';
import { newProject, newTextClip } from '../../engine/model.js';
import { exportConfig, normalizeImportedProject, createExportJob, exportCapabilities, createCanvasFrameRenderer, createMediabunnyJob, selectAudioCodec, validateExportConfig, saveExportResult } from '../../engine/export.js';

test('export presets calculate duration and resolution', () => { const p = newProject(); p.tracks[0].clips.push(newTextClip(2, 'က', 3)); const c = exportConfig(p, '9:16'); assert.equal(c.width, 1080); assert.equal(c.height, 1920); assert.equal(c.duration, 5); });
test('v1-like JSON normalizes into version 3 project', () => { const p = normalizeImportedProject({ name: 'Old', tracks: [{ kind: 'text', clips: [{ start: -2, dur: 0 }] }] }); assert.equal(p.version, 3); assert.equal(p.tracks[0].clips[0].start, 0); assert.equal(p.tracks[0].clips[0].dur, .1); });
test('export job reports progress and supports completion', async () => { const p = newProject(); p.tracks[0].clips.push(newTextClip(0, 'က', .1)); const values = []; const job = createExportJob(p, '720p', { onProgress: (v) => values.push(v) }); const out = await job.run(async () => {}); assert.equal(out.frames, 3); assert.equal(values.at(-1), 1); });
test('export capabilities expose WebCodecs and worker detection', () => { const c = exportCapabilities(); assert.equal(typeof c.webCodecs, 'boolean'); assert.equal(typeof c.offscreenCanvas, 'boolean'); assert.equal(typeof c.worker, 'boolean'); });
test('canvas renderer and Mediabunny API are exposed', () => { assert.equal(typeof createCanvasFrameRenderer, 'function'); assert.equal(typeof createMediabunnyJob, 'function'); });
test('MP4 falls back to Opus when AAC cannot be encoded', async () => {
  const mb = {
    Quality: class Quality { constructor(options) { this.options = options; } },
    async getFirstEncodableAudioCodec(codecs) {
      assert.deepEqual(codecs, ['aac', 'opus']);
      return 'opus';
    },
  };
  const format = { getSupportedAudioCodecs: () => ['aac', 'opus'] };
  assert.equal(await selectAudioCodec(mb, format, { format: 'mp4' }), 'opus');
});
test('WebM selects only a codec supported by its container', async () => {
  const mb = { async getFirstEncodableAudioCodec(codecs) { return codecs[0] || null; } };
  const format = { getSupportedAudioCodecs: () => ['opus', 'vorbis'] };
  assert.equal(await selectAudioCodec(mb, format, { format: 'webm' }), 'opus');
});
test('long export validation calculates one and five minute frame counts', () => { const p = newProject(); p.tracks[0].clips.push(newTextClip(0, 'က', 300)); assert.equal(validateExportConfig(p, '720p').frames, 9000); assert.equal(validateExportConfig(p, '720p').minutes, 5); });
test('streaming and download save APIs are exposed', () => { assert.equal(typeof saveExportResult, 'function'); assert.equal(typeof exportCapabilities().fileSystemAccess, 'boolean'); });

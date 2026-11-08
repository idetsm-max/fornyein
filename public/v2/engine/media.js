import { uid } from './model.js';
import { saveMedia } from './storage.js';
export const audioTypes = /^(audio\/|video\/)/;
export async function inspectFile(file) {
  let duration = 0;
  if (audioTypes.test(file.type)) { const url = URL.createObjectURL(file); try { const el = document.createElement('audio'); el.preload = 'metadata'; duration = await new Promise((resolve) => { el.onloadedmetadata = () => resolve(Number.isFinite(el.duration) ? el.duration : 0); el.onerror = () => resolve(0); el.src = url; }); } finally { URL.revokeObjectURL(url); } }
  return { id: 'med-' + uid(), name: file.name, kind: file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'image', type: file.type, size: file.size, dur: duration };
}
export async function importFile(file) { const meta = await inspectFile(file); if (meta.kind === 'audio') { try { const wave = await peaksFromBlob(file); meta.dur = wave.dur; meta.peaks = wave.peaks; } catch { /* duration metadata is still useful if decoding is unavailable */ } } await saveMedia(meta.id, file); return meta; }
export async function peaksFromBlob(blob, count = 160) {
  const ctx = new AudioContext(); try { const buffer = await ctx.decodeAudioData(await blob.arrayBuffer()); const data = buffer.getChannelData(0), step = Math.max(1, Math.floor(data.length / count)), out = []; for (let i = 0; i < count; i++) { let peak = 0; for (let j = i * step; j < Math.min(data.length, (i + 1) * step); j++) peak = Math.max(peak, Math.abs(data[j])); out.push(+peak.toFixed(3)); } return { peaks: out, dur: buffer.duration, sampleRate: buffer.sampleRate }; } finally { await ctx.close(); } }
export function blobUrl(blob) { return blob ? URL.createObjectURL(blob) : ''; }

// User actions shared by buttons, keyboard, canvas and Timeline.
import { newTextClip, newAudioClip, newVisualClip, textTrack, audioTrack, visualTrack, findClip, uid, freeSlot, clipEnd } from './model.js';
import { PRESETS, normalizeMyanmar } from './text.js';
const MIN_DUR = 0.1;
const snapTime = (value, project, ignoreId, enabled = true) => {
  if (!enabled) return Math.max(0, value);
  const points = [0];
  for (const t of project.tracks) for (const c of t.clips) if (c.id !== ignoreId) points.push(c.start, clipEnd(c));
  let best = value, dist = 0.12;
  for (const p of points) if (Math.abs(p - value) < dist) { best = p; dist = Math.abs(p - value); }
  return Math.max(0, +best.toFixed(3));
};
export function addText(store, transport, text = 'စာသား ရိုက်ပါ') {
  const c = newTextClip(freeSlot(textTrack(store.get().project), transport.t, 3), text);
  store.edit((d) => { textTrack(d).clips.push(c); }); store.select(c.id); transport.seek(c.start); return c;
}
export function addLines(store, transport, lines, dur = 3) {
  const list = lines.map((l) => normalizeMyanmar(l).trim()).filter(Boolean); if (!list.length) return;
  let at = freeSlot(textTrack(store.get().project), transport.t, dur * list.length);
  const clips = list.map((text) => { const c = newTextClip(at, text, dur); at += dur; return c; });
  store.edit((d) => { textTrack(d).clips.push(...clips); }); store.select(clips[0].id); transport.seek(clips[0].start);
}
export function splitTextClip(store, id, separator = '\n') {
  let ids = [];
  store.edit((d) => { const f = findClip(d, id); if (!f || f.clip.kind !== 'text' || f.clip.locked) return; const parts = f.clip.text.split(separator).map((x) => x.trim()).filter(Boolean); if (parts.length < 2) return; const each = f.clip.dur / parts.length; const base = f.clip; const made = parts.map((text, i) => ({ ...JSON.parse(JSON.stringify(base)), id: uid(), text, start: +(base.start + i * each).toFixed(3), dur: +each.toFixed(3) })); f.track.clips.splice(f.ci, 1, ...made); ids = made.map((x) => x.id); }); if (ids[0]) store.select(ids[0]); return ids;
}
export function mergeTextClips(store, ids) {
  const chosen = new Set(ids || []); let merged = null;
  store.edit((d) => { const f = d.tracks.find((t) => t.kind === 'text'); if (!f) return; const picked = f.clips.filter((c) => chosen.has(c.id) && c.kind === 'text' && !c.locked).sort((a, b) => a.start - b.start); if (picked.length < 2) return; const first = picked[0]; merged = { ...first, text: picked.map((c) => c.text).join('\n'), dur: clipEnd(picked.at(-1)) - first.start }; f.clips = f.clips.filter((c) => !chosen.has(c.id)); f.clips.push(merged); }); if (merged) store.select(merged.id); return merged;
}
export function insertPreset(store, transport, key) { const preset = PRESETS[key]; if (!preset) return; const c = newTextClip(freeSlot(textTrack(store.get().project), transport.t, 3), preset.text); Object.assign(c.style, preset.style); c.preset = key; store.edit((d) => { textTrack(d).clips.push(c); }); store.select(c.id); transport.seek(c.start); return c; }
export function normalizeTextClip(store, id) { store.edit((d) => { const f = findClip(d, id); if (f?.clip.kind === 'text') f.clip.text = normalizeMyanmar(f.clip.text); }); }
const srtTime = (s) => { const ms = Math.max(0, Math.round(s * 1000)); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60, milli = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(milli).padStart(3, '0')}`; };
export function textToSrt(project) { return textTrack(project).clips.slice().sort((a, b) => a.start - b.start).map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(clipEnd(c))}\n${c.text || ''}\n`).join('\n'); }
export function addTimedLines(store, transport, lines, segments) {
  const list = lines.map((x) => x.trim()).filter(Boolean); if (!list.length || !segments?.length) return;
  const clips = list.map((text, i) => { const seg = segments[Math.min(i, segments.length - 1)]; const c = newTextClip(seg.start, normalizeMyanmar(text), Math.max(.1, seg.end - seg.start)); c.confidence = seg.confidence ?? .5; c.review = c.confidence < .55 ? 'review' : 'draft'; return c; });
  store.edit((d) => { textTrack(d).clips.push(...clips); }); store.select(clips[0].id); transport.seek(clips[0].start); return clips;
}
export function syncTextClip(store, id, start, nextStart = null) {
  store.edit((d) => { const f = findClip(d, id); if (!f) return; f.clip.start = Math.max(0, +start.toFixed(3)); if (nextStart != null) f.clip.dur = Math.max(.1, +(nextStart - f.clip.start).toFixed(3)); }, { key: 'tap-sync:' + id });
}
export function addMedia(store, transport, meta) {
  const isAudio = meta.kind === 'audio', track = isAudio ? audioTrack(store.get().project) : visualTrack(store.get().project), start = freeSlot(track, transport.t, meta.dur || 3);
  store.edit((d) => { d.media ||= {}; d.media[meta.id] = meta; const tr = isAudio ? audioTrack(d) : visualTrack(d); tr.clips.push(isAudio ? newAudioClip(start, meta.id, meta.dur || 1, meta.name) : newVisualClip(start, meta.id, meta.dur || 3, meta.kind, meta.name)); });
  const clip = (isAudio ? audioTrack(store.get().project) : visualTrack(store.get().project)).clips.at(-1); if (clip) { store.select(clip.id); transport.seek(start); }
  return meta;
}
export function moveClip(store, id, start, { snap = true, key = 'move' } = {}) {
  store.edit((d) => { const f = findClip(d, id); if (!f || f.track.locked || f.clip.locked) return; f.clip.start = snapTime(start, d, id, snap); }, { key: `${key}:${id}` });
}
export function trimClip(store, id, edge, value, { snap = true } = {}) {
  store.edit((d) => { const f = findClip(d, id); if (!f || f.track.locked || f.clip.locked) return; const c = f.clip;
    if (edge === 'left') { const end = clipEnd(c); const start = Math.min(end - MIN_DUR, snapTime(value, d, id, snap)); c.start = Math.max(0, start); c.dur = Math.max(MIN_DUR, end - c.start); }
    else { const end = Math.max(c.start + MIN_DUR, snapTime(value, d, id, snap)); c.dur = +Math.max(MIN_DUR, end - c.start).toFixed(3); }
  }, { key: `trim:${id}:${edge}` });
}
export function splitClip(store, id, at, { snap = true } = {}) {
  let rightId = null;
  store.edit((d) => { const f = findClip(d, id); if (!f || f.track.locked || f.clip.locked) return; const c = f.clip; const cut = snapTime(at, d, id, snap); if (cut <= c.start + MIN_DUR || cut >= clipEnd(c) - MIN_DUR) return;
    const right = JSON.parse(JSON.stringify(c)); right.id = uid(); right.start = cut; right.dur = clipEnd(c) - cut; c.dur = cut - c.start; f.track.clips.splice(f.ci + 1, 0, right); rightId = right.id;
  });
  if (rightId) store.select(rightId); return rightId;
}
export function deleteClips(store, ids, { ripple = false } = {}) {
  const set = new Set(ids.filter(Boolean)); if (!set.size) return;
  store.edit((d) => { for (const t of d.tracks) { const removed = t.clips.filter((c) => set.has(c.id) && !c.locked); if (!removed.length || t.locked) continue; const shift = ripple ? removed.reduce((n, c) => n + c.dur, 0) : 0; const first = Math.min(...removed.map((c) => c.start)); t.clips = t.clips.filter((c) => !set.has(c.id)); if (ripple) for (const c of t.clips) if (c.start >= first) c.start = Math.max(0, c.start - shift); } });
}
export function deleteSelected(store, { ripple = false } = {}) { const id = store.get().selection; if (id) deleteClips(store, [id], { ripple }); }
export function duplicateSelected(store) {
  const id = store.get().selection; if (!id) return; let nid = null;
  store.edit((d) => { const f = findClip(d, id); if (!f) return; const c = JSON.parse(JSON.stringify(f.clip)); c.id = uid(); c.start = f.clip.start + f.clip.dur; nid = c.id; f.track.clips.push(c); }); if (nid) store.select(nid);
}
export function toggleTrack(store, trackId, key) { store.edit((d) => { const t = d.tracks.find((x) => x.id === trackId); if (t) t[key] = !t[key]; }); }

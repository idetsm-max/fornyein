// User actions shared by buttons, keyboard, canvas and Timeline.
import {
  newTextClip, newAudioClip, newVisualClip, newOverlayClip,
  textTrack, findClip, uid, freeSlot, clipEnd, projectDuration,
} from './model.js';
import { PRESETS } from './text.js';
import { reflowCues } from './captions.js';
import { clipMediaId, clipSpeed, sourceRange, trimSourceLeft, trimSourceRight, slipSource } from './clip.js';
import { laneFor, nearestFreeStart } from './lanes.js';
import { quantize } from './time.js';

const MIN_DUR = 0.1;
export const snapTime = (value, project, ignoreId, enabled = true) => {
  if (!enabled) return Math.max(0, value);
  const points = [0, ...(project.markers || []).map((m) => m.t)];
  for (const t of project.tracks) for (const c of t.clips) if (c.id !== ignoreId) points.push(c.start, clipEnd(c));
  let best = value, dist = 0.12;
  for (const p of points) if (Math.abs(p - value) < dist) { best = p; dist = Math.abs(p - value); }
  return Math.max(0, +best.toFixed(3));
};
const placeText = (project, start, dur) => {
  const lane = laneFor(project, 'text', start, dur);
  return lane ? lane.start : start;
};

export function addText(store, transport, text = 'စာသား ရိုက်ပါ') {
  const project = store.get().project;
  const start = placeText(project, transport.t, 3);
  const c = newTextClip(start, text);
  store.edit((d) => { const lane = laneFor(d, 'text', start, 3) || { track: textTrack(d) }; lane.track.clips.push(c); });
  store.select(c.id); transport.seek(c.start); return c;
}
export function addLines(store, transport, lines, dur = 3) {
  const list = lines.map((line) => String(line ?? '').trim()).filter(Boolean); if (!list.length) return;
  const at = freeSlot(textTrack(store.get().project), transport.t, dur * list.length);
  const clips = list.map((text, i) => newTextClip(quantize(at + i * dur), text, dur));
  store.edit((d) => { textTrack(d).clips.push(...clips); }); store.select(clips[0].id); transport.seek(clips[0].start);
}
export function splitTextClip(store, id, separator = '\n') {
  let ids = [];
  store.edit((d) => {
    const f = findClip(d, id);
    if (!f || f.clip.kind !== 'text' || f.clip.locked) return;
    const parts = f.clip.text.split(separator).map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) return;
    const each = f.clip.dur / parts.length, base = f.clip;
    const made = parts.map((text, i) => ({ ...JSON.parse(JSON.stringify(base)), id: uid(), text, start: +(base.start + i * each).toFixed(3), dur: +each.toFixed(3) }));
    f.track.clips.splice(f.ci, 1, ...made); ids = made.map((x) => x.id);
  });
  if (ids[0]) store.select(ids[0]); return ids;
}
export function mergeTextClips(store, ids) {
  const chosen = new Set(ids || []); let merged = null;
  store.edit((d) => {
    const f = d.tracks.find((t) => t.kind === 'text'); if (!f) return;
    const picked = f.clips.filter((c) => chosen.has(c.id) && c.kind === 'text' && !c.locked).sort((a, b) => a.start - b.start);
    if (picked.length < 2) return;
    const first = picked[0];
    merged = { ...first, text: picked.map((c) => c.text).join('\n'), dur: clipEnd(picked.at(-1)) - first.start };
    f.clips = f.clips.filter((c) => !chosen.has(c.id)); f.clips.push(merged);
  });
  if (merged) store.select(merged.id); return merged;
}
export function insertPreset(store, transport, key) {
  const preset = PRESETS[key]; if (!preset) return;
  const start = placeText(store.get().project, transport.t, 3);
  const c = newTextClip(start, preset.text); Object.assign(c.style, preset.style); c.preset = key;
  store.edit((d) => { const lane = laneFor(d, 'text', start, 3) || { track: textTrack(d) }; lane.track.clips.push(c); });
  store.select(c.id); transport.seek(c.start); return c;
}
const srtTime = (s) => { const ms = Math.max(0, Math.round(s * 1000)); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60, milli = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(milli).padStart(3, '0')}`; };
export function textToSrt(project) { return textTrack(project).clips.slice().sort((a, b) => a.start - b.start).map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(clipEnd(c))}\n${c.text || ''}\n`).join('\n'); }
export function addTimedLines(store, transport, lines, segments) {
  const list = lines.map((x) => x.trim()).filter(Boolean); if (!list.length || !segments?.length) return;
  const clips = list.map((text, i) => {
    const seg = segments[Math.min(i, segments.length - 1)];
    const c = newTextClip(quantize(seg.start), text, Math.max(MIN_DUR, quantize(seg.end) - quantize(seg.start)));
    c.confidence = seg.confidence ?? .5; c.review = c.confidence < .55 ? 'review' : 'draft'; return c;
  });
  store.edit((d) => { textTrack(d).clips.push(...clips); }); store.select(clips[0].id); transport.seek(clips[0].start); return clips;
}
export function addAsrLines(store, transport, rows, opts) {
  const list = reflowCues(rows, opts);
  if (!list.length) return [];
  const clips = list.map((r) => {
    const c = newTextClip(quantize(Math.max(0, r.start)), r.text, Math.max(MIN_DUR, quantize(r.end) - quantize(r.start)));
    c.confidence = r.confidence ?? .5; c.review = c.confidence < .65 ? 'review' : 'draft';
    c.asr = { engine: 'cloudflare-workers-ai-whisper', language: r.language || 'my' }; return c;
  });
  store.edit((d) => { textTrack(d).clips.push(...clips); }); store.select(clips[0].id); transport.seek(clips[0].start); return clips;
}
export function syncTextClip(store, id, start, nextStart = null) {
  store.edit((d) => {
    const f = findClip(d, id); if (!f) return;
    f.clip.start = Math.max(0, +start.toFixed(3));
    if (nextStart != null) f.clip.dur = Math.max(MIN_DUR, +(nextStart - f.clip.start).toFixed(3));
  }, { key: 'tap-sync:' + id });
}

export function addMediaAt(store, transport, meta, time, { trackId = null } = {}) {
  const kind = meta.kind === 'audio' ? 'audio' : 'video';
  const dur = Math.max(MIN_DUR, meta.dur || 3);
  const start = quantize(Math.max(0, time));
  let clipId = null;
  store.edit((d) => {
    d.media ||= {}; d.media[meta.id] = meta;
    const lane = laneFor(d, kind, start, dur, { prefer: trackId });
    const track = lane?.track || d.tracks.find((t) => t.kind === kind);
    const at = lane ? lane.start : start;
    const clip = kind === 'audio'
      ? newAudioClip(at, meta.id, dur, meta.name)
      : newVisualClip(at, meta.id, dur, meta.kind, meta.name);
    track.clips.push(clip); clipId = clip.id;
  });
  if (clipId) { store.select(clipId); transport.seek(start); }
  return clipId;
}
export function addMedia(store, transport, meta) { return addMediaAt(store, transport, meta, transport.t); }
export function addOverlayLogo(store, transport, meta) {
  if (!meta || meta.kind !== 'image') return;
  const start = quantize(transport.t);
  const dur = Math.max(30, projectDuration(store.get().project) - start || 30);
  const c = newOverlayClip(start, meta.id, dur, meta.name);
  store.edit((d) => {
    d.media ||= {}; d.media[meta.id] = meta;
    const lane = laneFor(d, 'overlay', start, dur) || { track: d.tracks.find((t) => t.kind === 'overlay') };
    lane.track.clips.push(c);
  });
  store.select(c.id); transport.seek(start); return c;
}
export function moveClip(store, id, start, { snap = true, key = 'move', toTrack = null } = {}) {
  store.edit((d) => {
    const f = findClip(d, id); if (!f || f.track.locked || f.clip.locked) return;
    let track = f.track;
    if (toTrack && toTrack !== track.id) {
      const target = d.tracks.find((t) => t.id === toTrack);
      if (target && !target.locked && target.kind === track.kind) { track.clips.splice(f.ci, 1); track = target; }
    }
    const wanted = snapTime(start, d, id, snap);
    f.clip.start = nearestFreeStart(track, wanted, f.clip.dur, id);
    if (!track.clips.includes(f.clip)) track.clips.push(f.clip);
  }, { key: `${key}:${id}`, label: 'Move clip' });
}
export function trimClip(store, id, edge, value, { snap = true } = {}) {
  store.edit((d) => {
    const f = findClip(d, id); if (!f || f.track.locked || f.clip.locked) return;
    const c = f.clip, end = clipEnd(c);
    if (edge === 'left') {
      const start = Math.max(0, Math.min(end - MIN_DUR, snapTime(value, d, id, snap)));
      if (c.kind === 'text') { c.start = start; c.dur = +Math.max(MIN_DUR, end - start).toFixed(6); }
      else trimSourceLeft(c, start);
    } else {
      const nextEnd = Math.max(c.start + MIN_DUR, snapTime(value, d, id, snap));
      if (c.kind === 'text') c.dur = +Math.max(MIN_DUR, nextEnd - c.start).toFixed(6);
      else trimSourceRight(c, nextEnd);
    }
  }, { key: `trim:${id}:${edge}`, label: 'Trim clip' });
}
export function splitClip(store, id, at, { snap = true } = {}) {
  let rightId = null;
  store.edit((d) => {
    const f = findClip(d, id); if (!f || f.track.locked || f.clip.locked) return;
    const c = f.clip, cut = snapTime(at, d, id, snap);
    if (cut <= c.start + MIN_DUR || cut >= clipEnd(c) - MIN_DUR) return;
    const right = JSON.parse(JSON.stringify(c));
    right.id = uid(); right.start = cut; right.dur = clipEnd(c) - cut;
    if (c.kind !== 'text' && c.src) {
      const inRight = +(sourceRange(c).in + (cut - c.start) * clipSpeed(c)).toFixed(6);
      right.src = { ...c.src, in: inRight, out: sourceRange(c).out };
      c.src = { ...c.src, out: inRight };
    }
    c.dur = cut - c.start;
    f.track.clips.splice(f.ci + 1, 0, right); rightId = right.id;
  }, { key: `split:${id}`, label: 'Split clip' });
  if (rightId) store.select(rightId); return rightId;
}
export function slipClip(store, id, deltaSrc) {
  store.edit((d) => { const f = findClip(d, id); if (!f || f.track.locked || f.clip.locked || f.clip.kind === 'text') return; slipSource(f.clip, deltaSrc); }, { key: `slip:${id}`, label: 'Slip clip' });
}
export function deleteClips(store, ids, { ripple = false } = {}) {
  const set = new Set(ids.filter(Boolean)); if (!set.size) return;
  store.edit((d) => {
    for (const t of d.tracks) {
      const removed = t.clips.filter((c) => set.has(c.id) && !c.locked);
      if (!removed.length || t.locked) continue;
      const shift = ripple ? removed.reduce((n, c) => n + c.dur, 0) : 0;
      const first = Math.min(...removed.map((c) => c.start));
      t.clips = t.clips.filter((c) => !set.has(c.id));
      if (ripple) for (const c of t.clips) if (c.start >= first) c.start = Math.max(0, c.start - shift);
    }
  }, { key: 'delete', label: `Delete ${set.size} clip${set.size === 1 ? '' : 's'}` });
}
export function deleteSelected(store, { ripple = false } = {}) { const id = store.get().selection; if (id) deleteClips(store, [id], { ripple }); }
export function duplicateSelected(store) {
  const id = store.get().selection; if (!id) return null;
  let nid = null;
  store.edit((d) => {
    const f = findClip(d, id); if (!f) return;
    const c = JSON.parse(JSON.stringify(f.clip));
    c.id = uid(); c.start = nearestFreeStart(f.track, clipEnd(f.clip), c.dur, id);
    f.track.clips.push(c); nid = c.id;
  }, { key: `duplicate:${id}`, label: 'Duplicate clip' });
  if (nid) store.select(nid); return nid;
}
export function toggleTrack(store, trackId, key) {
  store.edit((d) => { const t = d.tracks.find((x) => x.id === trackId); if (t) t[key] = !t[key]; }, { key: 'track:' + key, label: 'Toggle ' + key });
}
export { clipMediaId };

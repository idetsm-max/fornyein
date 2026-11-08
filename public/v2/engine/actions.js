// User actions shared by buttons, keyboard, canvas and Timeline.
import { newTextClip, textTrack, findClip, uid, freeSlot, clipEnd } from './model.js';
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
  const list = lines.map((l) => l.trim()).filter(Boolean); if (!list.length) return;
  let at = freeSlot(textTrack(store.get().project), transport.t, dur * list.length);
  const clips = list.map((text) => { const c = newTextClip(at, text, dur); at += dur; return c; });
  store.edit((d) => { textTrack(d).clips.push(...clips); }); store.select(clips[0].id); transport.seek(clips[0].start);
}
export function moveClip(store, id, start, { snap = true, key = 'move' } = {}) {
  store.edit((d) => { const f = findClip(d, id); if (!f || f.track.locked) return; f.clip.start = snapTime(start, d, id, snap); }, { key: `${key}:${id}` });
}
export function trimClip(store, id, edge, value, { snap = true } = {}) {
  store.edit((d) => { const f = findClip(d, id); if (!f || f.track.locked) return; const c = f.clip;
    if (edge === 'left') { const end = clipEnd(c); const start = Math.min(end - MIN_DUR, snapTime(value, d, id, snap)); c.start = Math.max(0, start); c.dur = Math.max(MIN_DUR, end - c.start); }
    else { const end = Math.max(c.start + MIN_DUR, snapTime(value, d, id, snap)); c.dur = +Math.max(MIN_DUR, end - c.start).toFixed(3); }
  }, { key: `trim:${id}:${edge}` });
}
export function splitClip(store, id, at, { snap = true } = {}) {
  let rightId = null;
  store.edit((d) => { const f = findClip(d, id); if (!f || f.track.locked) return; const c = f.clip; const cut = snapTime(at, d, id, snap); if (cut <= c.start + MIN_DUR || cut >= clipEnd(c) - MIN_DUR) return;
    const right = JSON.parse(JSON.stringify(c)); right.id = uid(); right.start = cut; right.dur = clipEnd(c) - cut; c.dur = cut - c.start; f.track.clips.splice(f.ci + 1, 0, right); rightId = right.id;
  });
  if (rightId) store.select(rightId); return rightId;
}
export function deleteClips(store, ids, { ripple = false } = {}) {
  const set = new Set(ids.filter(Boolean)); if (!set.size) return;
  store.edit((d) => { for (const t of d.tracks) { const removed = t.clips.filter((c) => set.has(c.id)); if (!removed.length || t.locked) continue; const shift = ripple ? removed.reduce((n, c) => n + c.dur, 0) : 0; const first = Math.min(...removed.map((c) => c.start)); t.clips = t.clips.filter((c) => !set.has(c.id)); if (ripple) for (const c of t.clips) if (c.start >= first) c.start = Math.max(0, c.start - shift); } });
}
export function deleteSelected(store, { ripple = false } = {}) { const id = store.get().selection; if (id) deleteClips(store, [id], { ripple }); }
export function duplicateSelected(store) {
  const id = store.get().selection; if (!id) return; let nid = null;
  store.edit((d) => { const f = findClip(d, id); if (!f) return; const c = JSON.parse(JSON.stringify(f.clip)); c.id = uid(); c.start = f.clip.start + f.clip.dur; nid = c.id; f.track.clips.push(c); }); if (nid) store.select(nid);
}
export function toggleTrack(store, trackId, key) { store.edit((d) => { const t = d.tracks.find((x) => x.id === trackId); if (t) t[key] = !t[key]; }); }

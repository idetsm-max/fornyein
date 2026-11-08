// User actions shared by the buttons, the keyboard and the canvas. They only talk to the store / transport.
import { newTextClip, textTrack, findClip, uid, freeSlot } from './model.js';

export function addText(store, transport, text = 'စာသား ရိုက်ပါ') {
  const c = newTextClip(freeSlot(textTrack(store.get().project), transport.t, 3), text);     // never on top of another clip
  store.edit((d) => { textTrack(d).clips.push(c); }); store.select(c.id); transport.seek(c.start); return c;
}
// one clip per non-empty line, one after the other from the playhead
export function addLines(store, transport, lines, dur = 3) {
  const list = lines.map((l) => l.trim()).filter(Boolean); if (!list.length) return;
  let at = freeSlot(textTrack(store.get().project), transport.t, dur * list.length);              // the whole block fits after any clip it would touch
  const clips = list.map((text) => { const c = newTextClip(at, text, dur); at += dur; return c; });
  store.edit((d) => { textTrack(d).clips.push(...clips); }); store.select(clips[0].id); transport.seek(clips[0].start);
}
export function deleteSelected(store) {
  const id = store.get().selection; if (!id) return;
  store.edit((d) => { const f = findClip(d, id); if (f && !f.track.locked) f.track.clips.splice(f.ci, 1); });
}
export function duplicateSelected(store) {
  const id = store.get().selection; if (!id) return; let nid = null;
  store.edit((d) => { const f = findClip(d, id); if (!f) return; const c = JSON.parse(JSON.stringify(f.clip)); c.id = uid(); c.start = f.clip.start + f.clip.dur; nid = c.id; f.track.clips.push(c); });
  if (nid) store.select(nid);
}
export function toggleTrack(store, trackId, key) { store.edit((d) => { const t = d.tracks.find((x) => x.id === trackId); if (t) t[key] = !t[key]; }); }

// Project model (JSON, version 3): project -> tracks -> clips. Everything on the timeline is a clip.
export const RATIOS = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] };
export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const track = (kind, name) => ({ id: 'trk-' + kind, kind, name, hidden: false, locked: false, clips: [] });

export const newProject = () => ({
  version: 3, id: uid(), name: 'Untitled Project', size: '16:9', fps: 30, created: Date.now(),
  tracks: [track('text', 'Text'), track('video', 'Video'), track('overlay', 'Overlay'), track('audio', 'Audio')],
});
export const textStyle = () => ({ font: 'Noto Sans Myanmar', size: 72, fill: '#ffffff', strokeOn: true, stroke: '#000000', opacity: 100, bold: false, italic: false, underline: false, align: 'center' });
// size = pixels at 1080 px frame height; pos = percent of the frame (so a change of aspect ratio keeps the layout); rot = degrees
export const newTextClip = (start, text = 'စာသား', dur = 3) => ({ id: uid(), kind: 'text', start, dur, text, style: textStyle(), pos: { x: 50, y: 80, rot: 0 } });

export const clipEnd = (c) => c.start + c.dur;
export function findClip(p, id) {
  for (let ti = 0; ti < p.tracks.length; ti++) { const t = p.tracks[ti], ci = t.clips.findIndex((c) => c.id === id); if (ci >= 0) return { track: t, clip: t.clips[ci], ti, ci }; }
  return null;
}
export const textTrack = (p) => p.tracks.find((t) => t.kind === 'text');
// first start time >= `start` where [start, start+dur) does not overlap any clip of the track
export function freeSlot(track, start, dur) {
  let s = Math.max(0, start), moved = true;
  while (moved) { moved = false; for (const c of track.clips) if (c.start < s + dur - 1e-6 && clipEnd(c) > s + 1e-6) { s = clipEnd(c); moved = true; } }
  return s;
}
export function projectDuration(p) { let d = 0; for (const t of p.tracks) for (const c of t.clips) d = Math.max(d, clipEnd(c)); return d; }
export const isEmpty = (p) => p.tracks.every((t) => !t.clips.length);
export const fmtClock = (s) => { const f = Math.floor((s % 1) * 30), t = Math.floor(s); return [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60, f].map((n) => String(n).padStart(2, '0')).join(':'); };

// Project model (JSON, version 3): project -> tracks -> clips. Everything on the timeline is a clip.
export const RATIOS = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] };
export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const track = (kind, name) => ({ id: 'trk-' + kind, kind, name, hidden: false, locked: false, muted: false, clips: [] });
export const newProject = () => ({ version: 3, id: uid(), name: 'Untitled Project', size: '16:9', fps: 30, created: Date.now(), media: {}, tracks: [track('text', 'Text'), track('video', 'Video'), track('overlay', 'Overlay'), track('audio', 'Audio')] });
export const textStyle = () => ({ font: 'Noto Sans Myanmar', size: 72, fill: '#ffffff', fill2: '#79c7ff', gradient: false, gradientAngle: 90, strokeOn: true, stroke: '#000000', opacity: 100, bold: false, italic: false, underline: false, align: 'center', shadow: { on: false, color: '#000000', blur: 12, x: 0, y: 4, opacity: 55 }, glow: { on: false, color: '#79c7ff', blur: 18, opacity: 65 }, effects: [] });
export const newTextClip = (start, text = 'စာသား', dur = 3) => ({ id: uid(), kind: 'text', start, dur, text, review: 'draft', confidence: 1, locked: false, reveal: { mode: 'none', speed: 1 }, style: textStyle(), anim: { in: 'fade', out: 'fade', loop: 'none', inDur: .35, outDur: .35 }, pos: { x: 50, y: 80, rot: 0, scale: 1 } });
export const newAudioClip = (start, mediaId, dur, name = '') => ({ id: uid(), kind: 'audio', start, dur: Math.max(.1, dur || .1), mediaId, name, gain: 1, fade: { in: 0, out: 0 }, loop: false });
export const clipEnd = (c) => c.start + c.dur;
export function findClip(p, id) { for (let ti = 0; ti < p.tracks.length; ti++) { const t = p.tracks[ti], ci = t.clips.findIndex((c) => c.id === id); if (ci >= 0) return { track: t, clip: t.clips[ci], ti, ci }; } return null; }
export const textTrack = (p) => p.tracks.find((t) => t.kind === 'text');
export const audioTrack = (p) => p.tracks.find((t) => t.kind === 'audio');
export function freeSlot(track, start, dur) { let s = Math.max(0, start), moved = true; while (moved) { moved = false; for (const c of track.clips) if (c.start < s + dur - 1e-6 && clipEnd(c) > s + 1e-6) { s = clipEnd(c); moved = true; } } return s; }
export const projectDuration = (p) => Object.values(p.tracks).reduce((d, t) => Math.max(d, ...t.clips.map(clipEnd), 0), 0);
export const isEmpty = (p) => p.tracks.every((t) => !t.clips.length);
export const fmtClock = (s) => { const f = Math.floor((s % 1) * 30), t = Math.floor(s); return [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60, f].map((n) => String(n).padStart(2, '0')).join(':'); };

// Lane rules: a track never holds two clips on the same time range. When a lane
// is full we push the clip to the next free spot, and add a lane when none exists.
import { clipEnd } from './model.js';

export const TRACK_KINDS = ['text', 'video', 'overlay', 'audio'];
const TRACK_NAMES = { text: 'Text', video: 'Video', overlay: 'Overlay', audio: 'Audio' };

export const overlaps = (start, dur, clip) => start < clipEnd(clip) - 1e-6 && start + dur > clip.start + 1e-6;

export function trackHasRoom(track, start, dur, ignoreId = null) {
  return !track.clips.some((c) => c.id !== ignoreId && overlaps(start, dur, c));
}

export function nearestFreeStart(track, start, dur, ignoreId = null) {
  let s = Math.max(0, start);
  for (let guard = 0; guard < 500; guard++) {
    const hit = track.clips
      .filter((c) => c.id !== ignoreId && overlaps(s, dur, c))
      .sort((a, b) => a.start - b.start)[0];
    if (!hit) return +s.toFixed(3);
    s = clipEnd(hit);
  }
  return +s.toFixed(3);
}

export const tracksOfKind = (project, kind) => project.tracks.filter((t) => t.kind === kind);

export function laneFor(project, kind, start, dur, { ignoreId = null, prefer = null } = {}) {
  const preferred = prefer ? project.tracks.find((t) => t.id === prefer && t.kind === kind) : null;
  if (preferred && trackHasRoom(preferred, start, dur, ignoreId)) return { track: preferred, start };
  for (const track of tracksOfKind(project, kind)) {
    if (trackHasRoom(track, start, dur, ignoreId)) return { track, start };
  }
  const first = tracksOfKind(project, kind)[0];
  return first ? { track: first, start: nearestFreeStart(first, start, dur, ignoreId) } : null;
}

export function addLane(project, kind) {
  const lanes = tracksOfKind(project, kind);
  const index = project.tracks.findIndex((t) => t.kind === kind);
  const track = {
    id: `trk-${kind}-${lanes.length + 1}`,
    kind,
    name: `${TRACK_NAMES[kind] || kind} ${lanes.length + 1}`,
    hidden: false,
    locked: false,
    muted: false,
    mixer: { volume: 1, pan: 0, bypass: false, ducking: false },
    clips: [],
  };
  project.tracks.splice(index < 0 ? project.tracks.length : index + 1, 0, track);
  return track;
}

export function placeClip(project, kind, start, dur, options = {}) {
  const lane = laneFor(project, kind, start, dur, options);
  if (lane) return lane;
  return { track: addLane(project, kind), start };
}

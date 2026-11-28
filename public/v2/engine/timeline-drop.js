// HTML5 drag & drop payloads that land on a timeline row. Kept out of
// actions.js so that file stays within its line budget.
import { TRANSITION_TYPES } from './transitions.js';
import { findClip } from './model.js';
import { addMediaAt } from './actions.js';

// Dropping a transition tile near a clip edge binds only that side, which is
// what CapCut users expect when they drop on the left or right handle.
export function applyTransitionDrop(store, trackId, time, id) {
  if (!TRANSITION_TYPES.includes(id)) return null;
  const track = store.get().project.tracks.find((t) => t.id === trackId);
  const clip = (track?.clips || []).find((c) => time >= c.start - .5 && time <= c.start + c.dur + .5);
  if (!clip) return null;
  const side = Math.abs(time - clip.start) <= Math.abs(time - (clip.start + clip.dur)) ? 'in' : 'out';
  store.edit((d) => {
    const found = findClip(d, clip.id);
    if (!found) return;
    found.clip.transition = id === 'none' ? null
      : { ...(found.clip.transition || {}), [side]: id, dur: found.clip.transition?.dur ?? .35 };
  }, { key: 'trdrop-' + clip.id });
  return { clipId: clip.id, side };
}

export function dropOnTimeline(store, transport, project, trackId, time, dataTransfer) {
  const transition = dataTransfer.getData('text/x-fornyein-transition');
  if (transition) return applyTransitionDrop(store, trackId, time, transition);
  const meta = project.media?.[dataTransfer.getData('text/x-fornyein-media')];
  if (meta) addMediaAt(store, transport, meta, time, { trackId });
  return null;
}

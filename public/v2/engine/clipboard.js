// Clipboard for timeline clips. Copies carry their lane kind and relative offset,
// so pasting a group keeps its internal spacing.
import { findClip, uid } from './model.js';
import { placeClip } from './lanes.js';
import { quantize } from './time.js';
import { deleteClips } from './actions.js';

let board = null;

export const hasClipboard = () => !!board?.length;

export function copyClips(store, ids = [store.get().selection]) {
  const project = store.get().project;
  const picked = (ids || []).filter(Boolean).map((id) => findClip(project, id)).filter((f) => f && !f.clip.locked);
  if (!picked.length) return 0;
  const base = Math.min(...picked.map((f) => f.clip.start));
  board = picked.map((f) => ({
    kind: f.track.kind,
    offset: +(f.clip.start - base).toFixed(6),
    clip: JSON.parse(JSON.stringify(f.clip)),
  }));
  return board.length;
}

export function cutClips(store, ids = [store.get().selection]) {
  const n = copyClips(store, ids);
  if (n) deleteClips(store, ids);
  return n;
}

export function pasteClips(store, transport, at = transport.t) {
  if (!board?.length) return [];
  const ids = [];
  store.edit((d) => {
    for (const item of board) {
      const clip = JSON.parse(JSON.stringify(item.clip));
      clip.id = uid();
      const lane = placeClip(d, item.kind, quantize(at + item.offset), clip.dur);
      clip.start = lane.start;
      lane.track.clips.push(clip);
      ids.push(clip.id);
    }
  });
  if (ids.length) store.select(ids[ids.length - 1]);
  return ids;
}

export function clearClipboard() { board = null; }

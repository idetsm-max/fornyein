// Pointer-drag semantics for one clip: move a link group, slip (Alt), slide
// (Ctrl), or trim with ripple (Shift) / roll (Alt) at the edges.
import { moveGroup, slideClip, slipClip, trimClip } from '../engine/timeline.js';

export function applyClipDrag(store, g, clientX, snap) {
  const delta = (clientX - g.x) / g.pps;
  if (g.edge === 'move') {
    if (g.alt) { slipClip(store, g.id, delta - g.applied); g.applied = delta; return; }
    if (g.ctrl) { slideClip(store, g.id, delta - g.applied); g.applied = delta; return; }
    moveGroup(store, g.id, g.start + delta, { snap });
    return;
  }
  const mode = g.alt ? 'roll' : g.shift ? 'ripple' : 'normal';
  trimClip(store, g.id, g.edge, g.edge === 'left' ? g.start + delta : g.end + delta, { snap, mode });
}

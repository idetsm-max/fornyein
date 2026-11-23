// Ruler scrub: snap the playhead to clip edges/markers and play a short audio burst.
import { snapTime } from '../engine/actions.js';

export function scrubSeek({ transport, project, pps, snap, scrollEl, clientX, audio, last }) {
  const r = scrollEl.getBoundingClientRect();
  const raw = Math.max(0, (clientX - r.left + scrollEl.scrollLeft) / pps);
  const t = snapTime(raw, project, null, snap);
  transport.seek(t);
  if (performance.now() - last.current > 80) { last.current = performance.now(); audio?.current?.scrub?.(t); }
}

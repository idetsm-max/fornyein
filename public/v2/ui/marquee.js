// Rubber-band selection over timeline clips (client coordinates, no scroll math).
import { useRef, useState } from './deps.js';

export const marqueeStyle = (b) => ({
  left: (Math.min(b.x0, b.x1) - b.left) + 'px',
  top: (Math.min(b.y0, b.y1) - b.top) + 'px',
  width: Math.abs(b.x1 - b.x0) + 'px',
  height: Math.abs(b.y1 - b.y0) + 'px',
});

export function useMarquee({ containerRef, onSelect }) {
  const ref = useRef(null);
  const [box, setBox] = useState(null);
  const start = (e) => {
    if (e.button !== 0 || e.target.closest('.clip,.ruler,.marker,.playhead')) return;
    const r = e.currentTarget.getBoundingClientRect();
    ref.current = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY, left: r.left, top: r.top };
    setBox({ ...ref.current });
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
  };
  const move = (e) => { const m = ref.current; if (!m) return; m.x1 = e.clientX; m.y1 = e.clientY; setBox({ ...m }); };
  const end = () => {
    const m = ref.current; ref.current = null; setBox(null);
    if (!m) return;
    const x0 = Math.min(m.x0, m.x1), x1 = Math.max(m.x0, m.x1), y0 = Math.min(m.y0, m.y1), y1 = Math.max(m.y0, m.y1);
    if (x1 - x0 < 4 && y1 - y0 < 4) return;
    const ids = [...(containerRef.current?.querySelectorAll('.clip') || [])].filter((c) => {
      const r = c.getBoundingClientRect();
      return r.left < x1 && r.right > x0 && r.top < y1 && r.bottom > y0;
    }).map((c) => c.dataset.id);
    if (ids.length) onSelect(ids);
  };
  return { box, start, move, end };
}

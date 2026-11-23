// Timeline-local shortcuts: razor (B/V), delete left/right (Q/W), fit (Shift+Z).
import { useEffect, useRef } from './deps.js';
import { deleteLeft, deleteRight } from '../engine/timeline.js';

export function useTimelineKeys({ store, transport, setRazor, onFit }) {
  const fitRef = useRef(onFit);
  fitRef.current = onFit;
  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(e.target.tagName);
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'b') setRazor(true);
      else if (key === 'v') setRazor(false);
      else if (key === 'q') { e.preventDefault(); deleteLeft(store, transport.t); }
      else if (key === 'w') { e.preventDefault(); deleteRight(store, transport.t); }
      else if (e.shiftKey && key === 'z') { e.preventDefault(); fitRef.current?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store, transport, setRazor]);
}

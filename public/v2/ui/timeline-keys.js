// Timeline-local shortcuts: razor (B/V), delete left/right (Q/W), fit (Shift+Z).
import { useEffect, useRef } from './deps.js';
import { deleteLeft, deleteRight } from '../engine/timeline.js';
import { addMarker, nextMarker, prevMarker } from '../engine/markers.js';
import { projectDuration } from '../engine/model.js';
import { frameStep } from '../engine/time.js';

export function useTimelineKeys({ store, transport, setRazor, setSnap, onFit }) {
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
      else if (key === 'm') { e.preventDefault(); addMarker(store, transport.t); }
      else if (key === 'n') { e.preventDefault(); setSnap?.((v) => !v); }
      else if (key === 'i' && e.shiftKey) { e.preventDefault(); transport.setRange({ in: null }); }
      else if (key === 'o' && e.shiftKey) { e.preventDefault(); transport.setRange({ out: null }); }
      else if (key === 'i') { e.preventDefault(); transport.setRange({ in: transport.t }); }
      else if (key === 'o') { e.preventDefault(); transport.setRange({ out: transport.t }); }
      else if (key === 'arrowleft') { e.preventDefault(); transport.seek(transport.t - (e.shiftKey ? 1 : frameStep())); }
      else if (key === 'arrowright') { e.preventDefault(); transport.seek(transport.t + (e.shiftKey ? 1 : frameStep())); }
      else if (key === 'arrowup') { const m = prevMarker(store.get().project, transport.t); if (m) transport.seek(m.t); }
      else if (key === 'arrowdown') { const m = nextMarker(store.get().project, transport.t); if (m) transport.seek(m.t); }
      else if (key === 'home') { e.preventDefault(); transport.seek(0); }
      else if (key === 'end') { e.preventDefault(); transport.seek(projectDuration(store.get().project)); }
      else if (key === 'k') { e.preventDefault(); transport.pause(); }
      else if (key === 'l') { e.preventDefault(); transport.play(); }
      else if (key === 'j') { e.preventDefault(); transport.pause(); transport.seek(transport.t - 1); }
      else if (e.shiftKey && key === 'z') { e.preventDefault(); fitRef.current?.(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store, transport, setRazor, setSnap]);
}

// Horizontal timeline viewport: tracks scrollLeft for virtualization and adds
// shift-wheel / trackpad horizontal scrolling.
import { useEffect, useState } from './deps.js';

export function useTimelineScroll(scrollRef, pps) {
  const [view, setView] = useState({ left: 0, width: 1200 });
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const sync = () => setView({ left: el.scrollLeft, width: el.clientWidth || 1200 });
    sync(); el.addEventListener('scroll', sync); window.addEventListener('resize', sync);
    return () => { el.removeEventListener('scroll', sync); window.removeEventListener('resize', sync); };
  }, [scrollRef, pps]);
  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    const onWheel = (e) => {
      if (!(e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY))) return;
      el.scrollLeft += e.deltaX || e.deltaY;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scrollRef]);
  return view;
}

// Playhead clock; the audio clock is the master when playing (S4).
import { rangeOn, wrapRange } from './range.js';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export function createTransport(getDuration, getSeekMax) {
  let t = 0, playing = false, last = 0, raf = 0, range = { in: null, out: null, loop: false };
  const subs = new Set(); const emit = () => subs.forEach((f) => f());
  function tick(now) {
    if (!playing) return;
    t = wrapRange(t + (now - last) / 1000, range); last = now;
    const d = getDuration(); if (t >= d) { t = d; playing = false; }
    emit(); if (playing) raf = requestAnimationFrame(tick);
  }
  const api = {
    get t() { return t; }, get playing() { return playing; }, get range() { return range; },
    play() { const d = getDuration(); if (playing || d <= 0) return; if (rangeOn(range) && (t < range.in || t >= range.out)) t = range.in; if (t >= d - 0.01) t = rangeOn(range) ? range.in : 0; playing = true; last = performance.now(); raf = requestAnimationFrame(tick); emit(); },
    pause() { if (!playing) return; playing = false; cancelAnimationFrame(raf); emit(); },
    toggle() { playing ? api.pause() : api.play(); },
    seek(x) { t = clamp(x, 0, Math.max(getSeekMax(), 0)); emit(); },
    setRange(next) { range = { ...range, ...next }; if (rangeOn(range) && t < range.in) t = range.in; emit(); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
  };
  return api;
}

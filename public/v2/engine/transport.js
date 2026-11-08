// Playhead clock. (Phase 3 will make the audio clock the master; for now a frame timer drives time.)
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export function createTransport(getDuration, getSeekMax) {
  let t = 0, playing = false, last = 0, raf = 0; const subs = new Set(); const emit = () => subs.forEach((f) => f());
  function tick(now) {
    if (!playing) return;
    t += (now - last) / 1000; last = now;
    const d = getDuration(); if (t >= d) { t = d; playing = false; }
    emit(); if (playing) raf = requestAnimationFrame(tick);
  }
  const api = {
    get t() { return t; }, get playing() { return playing; },
    play() { const d = getDuration(); if (playing || d <= 0) return; if (t >= d - 0.01) t = 0; playing = true; last = performance.now(); raf = requestAnimationFrame(tick); emit(); },
    pause() { if (!playing) return; playing = false; cancelAnimationFrame(raf); emit(); },
    toggle() { playing ? api.pause() : api.play(); },
    seek(x) { t = clamp(x, 0, Math.max(getSeekMax(), 0)); emit(); },
    subscribe(f) { subs.add(f); return () => subs.delete(f); },
  };
  return api;
}

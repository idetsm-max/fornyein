export function projectComplexity(project) { const tracks = project?.tracks || [], clips = tracks.reduce((n, t) => n + (t.clips?.length || 0), 0), visual = tracks.filter((t) => t.kind === 'video' || t.kind === 'overlay').reduce((n, t) => n + (t.clips?.length || 0), 0), text = tracks.filter((t) => t.kind === 'text').reduce((n, t) => n + (t.clips?.length || 0), 0); return { tracks: tracks.length, clips, visual, text }; }
export function createRenderStats({ targetFps = 30 } = {}) { let frames = 0, total = 0, last = null, started = null; return { targetFps, frame(ms) { if (started === null) started = ms; if (last !== null) total += ms - last; last = ms; frames++; }, snapshot() { const elapsed = started === null ? 0 : Math.max(0, (last ?? performance.now()) - started); return { frames, elapsed, fps: elapsed ? frames * 1000 / elapsed : 0, averageMs: frames > 1 ? total / (frames - 1) : 0, withinBudget: frames < 2 || total / (frames - 1) <= 1000 / targetFps }; }, reset() { frames = 0; total = 0; last = null; started = null; } }; }
export function frameBudget({ lastFrameAt = 0, now = performance.now(), fps = 30 } = {}) { const interval = 1000 / fps; return Math.max(0, interval - Math.max(0, now - lastFrameAt)); }

// Adaptive preview quality: drop the backing-store scale when frames keep
// missing the budget, climb back once they are comfortably inside it. Export
// never uses this, so output stays full resolution.
export function createQualityGovernor({ levels = [1, 0.75, 0.5], budgetMs = 33, downAfter = 10, upAfter = 90 } = {}) {
  let idx = 0, slow = 0, fast = 0;
  return {
    get level() { return levels[idx]; },
    sample({ ms }) {
      if (!(ms >= 0)) return levels[idx];
      if (ms > budgetMs) { slow += 1; fast = 0; if (slow >= downAfter && idx < levels.length - 1) { idx += 1; slow = 0; } }
      else { fast += 1; slow = 0; if (fast >= upAfter && idx > 0) { idx -= 1; fast = 0; } }
      return levels[idx];
    },
  };
}


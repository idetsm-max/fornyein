// Visibility test for timeline virtualization: clips far outside the viewport
// are skipped so the DOM stays small on long timelines.
export const clipVisible = (clip, pps, left, width, margin = 600) =>
  clip.start * pps <= left + width + margin && (clip.start + clip.dur) * pps >= left - margin;

export const visibleClips = (clips, pps, view, margin = 600) =>
  clips.filter((c) => clipVisible(c, pps, view.left, view.width, margin));

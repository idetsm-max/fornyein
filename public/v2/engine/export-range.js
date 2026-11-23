// Export-range helpers: cut the project to the in/out range and drop captions
// when they are delivered as an SRT sidecar instead of burned in.
import { projectDuration } from './model.js';

const shiftSource = (clip, shift) => {
  if (!clip.src || shift <= 0) return clip;
  const speed = clip.speed || 1;
  return { ...clip, src: { ...clip.src, in: +(clip.src.in + shift * speed).toFixed(3) } };
};

export function trimProject(project, from = 0, to = projectDuration(project)) {
  const start = Math.max(0, from), end = Math.max(start + 0.1, to);
  const tracks = project.tracks.map((track) => ({
    ...track,
    clips: track.clips
      .filter((clip) => clip.start < end && clip.start + clip.dur > start)
      .map((clip) => {
        const from0 = Math.max(clip.start, start), to0 = Math.min(clip.start + clip.dur, end);
        const trimmed = { ...clip, start: +(from0 - start).toFixed(3), dur: +(to0 - from0).toFixed(3) };
        return shiftSource(trimmed, from0 - clip.start);
      }),
  }));
  return { ...project, tracks };
}

export function stripCaptions(project) {
  return { ...project, tracks: project.tracks.map((track) => ({ ...track, clips: track.clips.filter((clip) => !clip.caption) })) };
}

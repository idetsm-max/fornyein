// Project migration + validation. Runs on every open/import; must be idempotent
// and must never delete a clip just because a field is missing.
import { newProject } from './model.js';
import { clipMediaId, clipSpeed, sourceRange } from './clip.js';
import { frameStep } from './time.js';

export const SCHEMA_VERSION = 4;

export function migrate(input) {
  if (!input || typeof input !== 'object') return newProject();
  const p = JSON.parse(JSON.stringify(input));
  if (!Array.isArray(p.tracks)) p.tracks = [];
  if (!p.media || typeof p.media !== 'object') p.media = {};
  const fps = Number.isFinite(p.fps) && p.fps > 0 ? p.fps : 30;
  p.tracks = p.tracks.filter((t) => t && typeof t === 'object');
  for (const track of p.tracks) {
    if (!Array.isArray(track.clips)) track.clips = [];
    track.clips = track.clips.filter((c) => c && typeof c === 'object');
    for (const clip of track.clips) migrateClip(clip, p, fps);
  }
  p.fps = fps;
  if (!p.background) p.background = '#0b0e14';
  p.version = SCHEMA_VERSION;
  return p;
}

function migrateClip(clip, project, fps) {
  const step = frameStep(fps);
  clip.start = Math.max(0, Number(clip.start) || 0);
  clip.dur = Math.max(step, Number(clip.dur) || step);
  clip.speed = clipSpeed(clip);
  clip.reverse = !!clip.reverse;
  if (clip.kind === 'text') return;
  const mediaId = clipMediaId(clip);
  const { in: tin, out: tout } = sourceRange(clip);
  const mediaDur = Number(project.media?.[mediaId]?.dur);
  const out = Number.isFinite(mediaDur) && mediaDur > 0
    ? Math.min(mediaDur, Math.max(tin + step, tout))
    : Math.max(tin + step, tout);
  clip.src = { mediaId, in: tin, out };
  clip.dur = Math.max(step, (out - tin) / clip.speed);
  delete clip.mediaId;
  delete clip.in;
  delete clip.offset;
  delete clip.srcStart;
  if (!clip.transform || typeof clip.transform !== 'object') clip.transform = {};
  if (!Array.isArray(clip.fx)) clip.fx = [];
  if (clip.mask === undefined) clip.mask = null;
  if (clip.trIn === undefined) clip.trIn = null;
  if (clip.trOut === undefined) clip.trOut = null;
}

export function validate(project) {
  const warnings = [];
  for (const track of project?.tracks || []) {
    for (const clip of track.clips || []) {
      const mediaDur = Number(project.media?.[clipMediaId(clip)]?.dur);
      const { in: tin, out: tout } = sourceRange(clip);
      if (!(tout > tin)) warnings.push(`${clip.id}: empty source range`);
      if (Number.isFinite(mediaDur) && tout > mediaDur + 1e-6) warnings.push(`${clip.id}: source out ${tout} > media ${mediaDur}`);
    }
  }
  return warnings;
}

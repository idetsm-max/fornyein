// Loudness helpers (M5a): peak arrays are absolute amplitudes in 0..1, so their
// RMS maps to dBFS closely enough for a one-click normalise.
export const LUFS_TARGET = -14;
export const GAIN_MIN = 0.25;
export const GAIN_MAX = 4;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function peaksRms(peaks = []) {
  const values = peaks.filter((v) => Number.isFinite(v) && v > 0);
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v * v, 0);
  return Math.sqrt(sum / values.length);
}

export const rmsToDb = (rms) => (rms > 0 ? 20 * Math.log10(rms) : -96);

export function loudnessGain(peaks, target = LUFS_TARGET) {
  const rms = peaksRms(peaks);
  if (!rms) return 1;
  return clamp(Math.pow(10, (target - rmsToDb(rms)) / 20), GAIN_MIN, GAIN_MAX);
}

export function loudnessReport(peaks, target = LUFS_TARGET) {
  const rms = peaksRms(peaks);
  const db = rmsToDb(rms);
  return { db, target, gain: loudnessGain(peaks, target), silent: !rms };
}

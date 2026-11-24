// Editor preferences, persisted in localStorage. Pure helpers stay testable.
export const KEY = 'fn.settings.v1';

export const DEFAULTS = {
  theme: 'dark', timecode: 'tc',
  snap: true, snapPx: 8, magnet: true, follow: 'auto',
  textDur: 3, imageDur: 5,
  previewQuality: 'auto', autosaveMs: 700, persist: true, perfHud: false,
};

export const LIMITS = { snapPx: [4, 12], autosaveMs: [700, 5000], textDur: [1, 20], imageDur: [1, 60] };
const CHOICES = {
  theme: ['dark', 'light'], timecode: ['tc', 'sec'], follow: ['auto', 'smooth', 'off'],
  previewQuality: ['auto', '1', '0.5', '0.25'],
};

const clamp = (x, [a, b]) => Math.min(b, Math.max(a, x));

export function sanitize(raw = {}) {
  const out = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    if (!(key in raw)) continue;
    const value = raw[key];
    if (CHOICES[key]) { if (CHOICES[key].includes(String(value))) out[key] = String(value); continue; }
    if (LIMITS[key]) { const n = Number(value); if (Number.isFinite(n)) out[key] = clamp(n, LIMITS[key]); continue; }
    if (typeof DEFAULTS[key] === 'boolean') out[key] = !!value;
  }
  return out;
}

export function loadSettings(storage = globalThis.localStorage) {
  try { return sanitize(JSON.parse(storage?.getItem(KEY) || '{}')); } catch { return { ...DEFAULTS }; }
}

export function saveSettings(settings, storage = globalThis.localStorage) {
  const clean = sanitize(settings);
  try { storage?.setItem(KEY, JSON.stringify(clean)); } catch { /* private mode */ }
  return clean;
}

export const snapSeconds = (settings, pps) => Math.max(0.001, (settings?.snapPx ?? DEFAULTS.snapPx) / Math.max(1, pps || 1));

export const qualityCap = (settings) => (settings?.previewQuality === 'auto' ? 1 : Number(settings?.previewQuality) || 1);

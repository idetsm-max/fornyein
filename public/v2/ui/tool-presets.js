// Data for the tool panels; pure so it can be unit tested without a DOM.
import { DEFAULT_ADJUST } from '../engine/visual.js';

export const STICKERS = ['✨', '💖', '🌸', '🌙', '⭐', '🎵', '🕊️', '🍃', '☀️', '🌊', '🎀', '💫'];

export const FILTER_PRESETS = [
  { id: 'none', name: 'မူလ', adjust: {} },
  { id: 'warm', name: 'Warm', adjust: { brightness: 6, contrast: 6, saturation: 14 } },
  { id: 'cool', name: 'Cool', adjust: { brightness: 2, contrast: 4, saturation: -8 } },
  { id: 'vivid', name: 'Vivid', adjust: { contrast: 12, saturation: 32 } },
  { id: 'mono', name: 'Mono', adjust: { contrast: 8, saturation: -100 } },
  { id: 'dream', name: 'Dream', adjust: { brightness: 8, blur: 1, saturation: 10 } },
  { id: 'noir', name: 'Noir', adjust: { brightness: -6, contrast: 22, saturation: -100 } },
];

export const TRANSITION_PRESETS = [
  { id: 'none', name: 'မရှိ', transition: null },
  { id: 'fade', name: 'Fade', transition: { in: 'fade', out: 'fade', dur: 0.4 } },
  { id: 'slide', name: 'Slide', transition: { in: 'slide', out: 'slide', dur: 0.35 } },
];

export const STICKER_STYLE = { size: 180, fill: '#ffffff', align: 'center' };

export const toggleEffect = (list = [], key) => (list.includes(key) ? list.filter((item) => item !== key) : [...list, key]);
export const findPreset = (list, id) => list.find((preset) => preset.id === id) || null;
export const isAdjustKey = (key) => Object.hasOwn(DEFAULT_ADJUST, key);

// Myanmar text utilities and caption presets used by the editor.
export const PRESETS = {
  title: {
    name: 'Title card', text: 'ခေါင်းစဉ်',
    style: { size: 112, fill: '#ffffff', fill2: '#79c7ff', gradient: true, bold: true, align: 'center' },
  },
  credits: {
    name: 'Credits', text: 'တင်ဆက်သူ\nကျေးဇူးတင်ပါသည်',
    style: { size: 58, fill: '#ffffff', strokeOn: false, align: 'center' },
  },
  quote: {
    name: 'Quote', text: 'စကားလက်ဆောင်',
    style: { size: 72, fill: '#ffe08a', fill2: '#ff8ab3', gradient: true, italic: true, align: 'center' },
  },
  lowerThird: {
    name: 'Lower third', text: 'အမည် — အခန်းကဏ္ဍ',
    style: { size: 54, fill: '#ffffff', fill2: '#ffffff', gradient: false, align: 'left' },
  },
  karaoke: {
    name: 'Karaoke', text: 'သီချင်းစာသား',
    style: { size: 78, fill: '#fff27a', fill2: '#ff8a3d', gradient: true, strokeOn: true, align: 'center' },
  },
};

export const EFFECTS = [
  ['shadow', 'Shadow'], ['glow', 'Glow'], ['blur', 'Blur'], ['grayscale', 'Mono'],
  ['sepia', 'Sepia'], ['invert', 'Invert'], ['contrast', 'Contrast'],
  ['bright', 'Bright'], ['saturate', 'Vivid'], ['hue', 'Hue'], ['soft', 'Soft'],
  ['outline', 'Outline'], ['neon', 'Neon'], ['warm', 'Warm'], ['cool', 'Cool'],
];

// Kept as a compatibility helper: valid Unicode text must never be rewritten.
export function normalizeMyanmar(text) {
  return String(text ?? '');
}

export function isLikelyZawgyi(text) {
  const value = String(text ?? '');
  return /[\u1060-\u1097]/.test(value) ||
    /(^|[^\u1000-\u1021\u103b-\u103e\u102c-\u1032\u1036\u1037])\u1031[\u1000-\u1021]/.test(value);
}

let rabbitPromise;
const RABBIT_URL = 'https://cdn.jsdelivr.net/npm/rabbit-node@1.0.3/dist/rabbit.min.js';

function loadRabbit() {
  if (globalThis.Rabbit?.zg2uni) return Promise.resolve(globalThis.Rabbit);
  if (rabbitPromise) return rabbitPromise;
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Zawgyi conversion requires a browser'));
  }
  rabbitPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RABBIT_URL;
    script.async = true;
    script.onload = () => {
      if (globalThis.Rabbit?.zg2uni) resolve(globalThis.Rabbit);
      else reject(new Error('Rabbit converter was not available'));
    };
    script.onerror = () => reject(new Error('Could not load the Rabbit converter'));
    document.head.append(script);
  }).catch((error) => {
    rabbitPromise = null;
    throw error;
  });
  return rabbitPromise;
}

export async function convertMyanmarToUnicode(text) {
  const source = String(text ?? '');
  const rabbit = await loadRabbit();
  return rabbit.zg2uni(source);
}

export function revealText(text, progress, mode = 'none') {
  if (mode === 'none') return text;
  const chars = [...String(text || '')];
  if (mode === 'word') {
    const words = String(text || '').split(/(\s+)/);
    const n = Math.ceil(words.length * Math.max(0, Math.min(1, progress)));
    return words.slice(0, n).join('');
  }
  return chars.slice(0, Math.ceil(chars.length * Math.max(0, Math.min(1, progress)))).join('');
}

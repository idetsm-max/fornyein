// Myanmar text utilities and caption presets used by the editor.
export const PRESETS = {
  title: { name: 'Title card', text: 'ခေါင်းစဉ်', style: { size: 112, fill: '#ffffff', fill2: '#79c7ff', gradient: true, bold: true, align: 'center' } },
  credits: { name: 'Credits', text: 'တင်ဆက်သူ\nကျေးဇူးတင်ပါသည်', style: { size: 58, fill: '#ffffff', strokeOn: false, align: 'center' } },
  quote: { name: 'Quote', text: 'စကားလက်ဆောင်', style: { size: 72, fill: '#ffe08a', fill2: '#ff8ab3', gradient: true, italic: true, align: 'center' } },
  lowerThird: { name: 'Lower third', text: 'အမည် — အခန်းကဏ္ဍ', style: { size: 54, fill: '#ffffff', fill2: '#ffffff', gradient: false, align: 'left' } },
  karaoke: { name: 'Karaoke', text: 'သီချင်းစာသား', style: { size: 78, fill: '#fff27a', fill2: '#ff8a3d', gradient: true, strokeOn: true, align: 'center' } },
};
export const EFFECTS = [['shadow', 'Shadow'], ['glow', 'Glow'], ['blur', 'Blur'], ['grayscale', 'Mono'], ['sepia', 'Sepia'], ['invert', 'Invert'], ['contrast', 'Contrast'], ['bright', 'Bright'], ['saturate', 'Vivid'], ['hue', 'Hue'], ['soft', 'Soft'], ['outline', 'Outline'], ['neon', 'Neon'], ['warm', 'Warm'], ['cool', 'Cool']];
export function normalizeMyanmar(text) {
  return String(text || '').replace(/ေ([က-အ])/g, '$1ေ').replace(/([က-အ])့/g, '$1့').replace(/([က-အ])္([က-အ])/g, '$1်$2').replace(/ဦ/g, 'ဦ').replace(/ဦး/g, 'ဦး');
}
export function revealText(text, progress, mode = 'none') {
  if (mode === 'none') return text;
  const chars = [...String(text || '')];
  if (mode === 'word') { const words = String(text || '').split(/(\s+)/); const n = Math.ceil(words.length * Math.max(0, Math.min(1, progress))); return words.slice(0, n).join(''); }
  return chars.slice(0, Math.ceil(chars.length * Math.max(0, Math.min(1, progress)))).join('');
}

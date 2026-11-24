// Caption lane: parse SRT cues into text clips marked as captions.
import { newTextClip, textTrack } from './model.js';

const STAMP = /^(\d+):(\d{2}):(\d{2})[,.](\d{1,3})$/;

export const srtSeconds = (value) => {
  const m = STAMP.exec(String(value).trim());
  if (!m) return NaN;
  return +m[1] * 3600 + +m[2] * 60 + +m[3] + Number(m[4].padEnd(3, '0')) / 1000;
};

export function parseSrt(src) {
  const blocks = String(src || '').replace(/^\uFEFF/, '').replace(/\r/g, '').split(/\n{2,}/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split('\n').filter((line) => line.trim() !== '');
    const at = lines.findIndex((line) => line.includes('-->'));
    if (at < 0) continue;
    const [from, to] = lines[at].split('-->').map(srtSeconds);
    const text = lines.slice(at + 1).join('\n').trim();
    if (!text || !(to > from)) continue;
    cues.push({ start: from, dur: +(to - from).toFixed(3), text });
  }
  return cues.sort((a, b) => a.start - b.start);
}

export function captionClip({ start, dur, text }) {
  const clip = newTextClip(start, text, dur);
  clip.caption = true;
  clip.review = 'imported';
  clip.style = { ...clip.style, size: 44 };
  clip.pos = { ...clip.pos, y: 88 };
  return clip;
}

export function importSrt(store, transport, src) {
  const cues = parseSrt(src);
  if (!cues.length) return [];
  const ids = [];
  store.edit((d) => {
    const track = textTrack(d);
    for (const cue of cues) { const clip = captionClip(cue); track.clips.push(clip); ids.push(clip.id); }
    track.clips.sort((a, b) => a.start - b.start);
  });
  store.select(ids[0]);
  transport.seek(cues[0].start);
  return ids;
}

export const CAPTION_MAX_CHARS = 28;

function splitText(text, maxChars) {
  if (text.length <= maxChars) return [text];
  if (text.includes(' ')) {
    const words = text.split(/\s+/).filter(Boolean), out = [];
    let line = '';
    for (const word of words) {
      if (line && line.length + 1 + word.length > maxChars) { out.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) out.push(line);
    return out;
  }
  const parts = Math.ceil(text.length / maxChars), size = Math.ceil(text.length / parts), out = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

// Turn ASR/VAD rows into readable caption cues: split long lines on the
// character budget, share the segment time by text length, drop fragments
// too short to read and never let two cues overlap.
export function reflowCues(rows, { maxChars = CAPTION_MAX_CHARS, maxDur = 6, minDur = 0.7 } = {}) {
  const out = [];
  for (const row of rows || []) {
    const text = String(row.text ?? '').trim();
    const start = Number(row.start), end = Number(row.end);
    if (!text || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    const parts = splitText(text, maxChars);
    const total = parts.reduce((n, p) => n + p.length, 0);
    let at = Math.max(0, start), from = Math.max(0, start), to = Math.max(0, end);
    if (to - from > maxDur) to = from + maxDur;
    parts.forEach((part, i) => {
      const share = (to - from) * (part.length / total);
      const cueStart = at;
      let cueEnd = i === parts.length - 1 ? to : at + share;
      if (cueEnd - cueStart < minDur) cueEnd = cueStart + minDur;
      if (cueEnd > to) cueEnd = to;
      const prev = out.at(-1);
      if (prev && cueStart < prev.end) { prev.end = Math.max(prev.end, cueStart); prev.dur = +(prev.end - prev.start).toFixed(3); }
      if (cueEnd > cueStart) out.push({ ...row, text: part, start: +cueStart.toFixed(3), end: +cueEnd.toFixed(3) });
      at = cueEnd;
    });
  }
  return out;
}

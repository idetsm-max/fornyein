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

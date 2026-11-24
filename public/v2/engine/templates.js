// Project templates (M6): a fresh project with the text clips already laid out.
import { newProject, newTextClip } from './model.js';

const textTrack = (p) => p.tracks.find((t) => t.kind === 'text');
const text = (p, start, dur, str, style = {}) => {
  const clip = newTextClip(start, str, dur);
  Object.assign(clip.style, style);
  textTrack(p).clips.push(clip);
  return clip;
};

export const PROJECT_TEMPLATES = [
  {
    id: 'poem-card', name: 'ကဗျာ ကတ်ပြား', hint: '၄:၅ · ခေါင်းစဉ် + ကဗျာ', size: '4:5',
    build: () => {
      const p = newProject(); p.size = '4:5'; p.name = 'ကဗျာ ကတ်ပြား';
      text(p, 0, 2.5, 'ခေါင်းစဉ်', { size: 96, bold: true, gradient: true });
      text(p, 2.5, 8, 'ကဗျာ စာသား\nဒီနေရာမှာ ရေးပါ', { size: 64 });
      return p;
    },
  },
  {
    id: 'lyric-video', name: 'သီချင်း စာတန်း', hint: '၁၆:၉ · စာတန်း ၃ ကြောင်း', size: '16:9',
    build: () => {
      const p = newProject(); p.name = 'သီချင်း စာတန်း';
      text(p, 0, 2, 'သီချင်း ခေါင်းစဉ်', { size: 112, bold: true, gradient: true });
      ['ပထမ စာကြောင်း', 'ဒုတိယ စာကြောင်း', 'တတိယ စာကြောင်း'].forEach((line, i) => text(p, 2 + i * 4, 4, line, { size: 76 }));
      return p;
    },
  },
  {
    id: 'short-9x16', name: 'Short ၉:၁၆', hint: 'ဖုန်း မျက်နှာပြင် · hook + ၂ ကြောင်း', size: '9:16',
    build: () => {
      const p = newProject(); p.size = '9:16'; p.name = 'Short ၉:၁၆';
      text(p, 0, 3, 'ဒီမှာ စပါ', { size: 88, bold: true, gradient: true });
      text(p, 3, 4, 'အချက် ၁', { size: 72 });
      text(p, 7, 4, 'အချက် ၂', { size: 72 });
      return p;
    },
  },
  {
    id: 'title-intro', name: 'ခေါင်းစဉ် နိဒါန်း', hint: '၁၆:၉ · ခေါင်းစဉ် + စာတန်း', size: '16:9',
    build: () => {
      const p = newProject(); p.name = 'ခေါင်းစဉ် နိဒါန်း';
      text(p, 0, 3, 'ခေါင်းစဉ်', { size: 120, bold: true, gradient: true });
      text(p, 3, 2, 'စာတန်း', { size: 56, strokeOn: false });
      return p;
    },
  },
  {
    id: 'credits', name: 'နိဂုံး စာတန်း', hint: '၁၆:၉ · ကျေးဇူးတင်စကား + credits', size: '16:9',
    build: () => {
      const p = newProject(); p.name = 'နိဂုံး စာတန်း';
      text(p, 0, 4, 'ကျေးဇူးတင်ပါသည်', { size: 96, bold: true, gradient: true });
      text(p, 4, 4, 'တင်ဆက်သူ\nကဗျာ — အမည်\nအသံ — အမည်', { size: 58, strokeOn: false });
      return p;
    },
  },
];

export const templateById = (id) => PROJECT_TEMPLATES.find((t) => t.id === id) || null;
export const buildTemplate = (id) => templateById(id)?.build() || null;

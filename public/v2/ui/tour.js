// Five-step coach tour shown once per browser; dismisses on any outside click.
import { html, useState, useEffect } from './deps.js';
import { cx } from './widgets.js';

export const TOUR_KEY = 'fornyein.tour.v1';

export const TOUR_STEPS = [
  { title: 'မီဒီယာ ထည့်ပါ', text: 'ဘယ်ဘက် Media panel မှ ဖတ်သံ သို့မဟုတ် ပုံကို timeline ပေါ် ဆွဲထည့်ပါ။' },
  { title: 'ကဗျာ စာတန်း', text: 'Text panel မှ ကဗျာကို ရိုက် သို့မဟုတ် paste လုပ်ပါ။ Add lines ဖြင့် တစ်ကြောင်းချင်း ခွဲနိုင်သည်။' },
  { title: 'တည်းဖြတ်', text: 'Timeline တွင် clip ကို ဆွဲရွှေ့၊ အနားမှ ဆွဲပြီး ဖြတ်နိုင်သည်။ Ctrl/Cmd+B က playhead တွင် ဖြတ်သည်။' },
  { title: 'အလှဆင်', text: 'Effects၊ Filters၊ Stickers၊ Transitions တို့ဖြင့် ဗီဒီယိုကို လှပအောင် ပြင်ပါ။' },
  { title: 'ထုတ်ယူ', text: 'Ctrl/Cmd+E ဖြင့် Export dialog ဖွင့်ပြီး 720p/1080p ရွေးကာ သိမ်းပါ။' },
];

export function CoachTour({ onClose }) {
  const [step, setStep] = useState(0);
  const last = step === TOUR_STEPS.length - 1;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setStep((i) => Math.min(TOUR_STEPS.length - 1, i + 1));
      else if (e.key === 'ArrowLeft') setStep((i) => Math.max(0, i - 1));
    };
    const onDown = (e) => { if (!e.target.closest?.('.tourcard')) onClose(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', onDown, true); };
  }, [onClose]);
  const current = TOUR_STEPS[step];
  return html`<aside class="tourcard" role="dialog" aria-label="Coach tour">
    <div class="tourhead"><b>စတင်အသုံးပြုနည်း</b><span class="tourcount">${step + 1} / ${TOUR_STEPS.length}</span><button type="button" class="x" aria-label="Close tour" onClick=${onClose}>×</button></div>
    <h3>${current.title}</h3><p>${current.text}</p>
    <div class="tourdots">${TOUR_STEPS.map((_, i) => html`<i class=${cx('tdot', i === step && 'on')}></i>`)}</div>
    <div class="tourfoot"><button type="button" class="btn" onClick=${onClose}>ကျော်ရန်</button><span class="grow"></span>
      <button type="button" class="btn" disabled=${step === 0} onClick=${() => setStep(step - 1)}>နောက်သို့</button>
      <button type="button" class="btn primary" onClick=${() => (last ? onClose() : setStep(step + 1))}>${last ? 'ပြီးပါပြီ' : 'ရှေ့သို့'}</button></div>
  </aside>`;
}

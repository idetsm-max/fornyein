import { html } from './deps.js';
import { useStore } from './hooks.js';
import { Slider, cx } from './widgets.js';
import { findClip } from '../engine/model.js';
import { ADJUST_LABELS, ADJUST_RANGE, DEFAULT_ADJUST, normalizeAdjust } from '../engine/grading.js';
import { FILTER_PRESETS } from './tool-presets.js';
import { toast } from './toast.js';
import { L, H } from './strings.js';
import { myLabel } from './labels-my.js';

const panel = (title, tip, body) => html`<section class="panel tools">
  <div class="phead"><b>${title}</b><small class="panelhint inline">${tip}</small></div>
  <div class="pbody scroll">${body}</div></section>`;
const hint = (text) => html`<p class="panelhint">${text}</p>`;
const patch = (store, id, fn, key) => store.edit((d) => { const found = findClip(d, id); if (found) fn(found.clip, d); }, { key });
export const isVisual = (clip) => !!clip && (clip.kind === 'video' || clip.kind === 'image');

function useVisual(store) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const found = sel ? findClip(project, sel) : null, clip = found ? found.clip : null;
  return { clip, visual: isVisual(clip) };
}

// Shared by the Adjust tool panel and the Inspector's Adjust tab. adjust lives
// on the clip so two clips of one file can carry different looks.
export function AdjustPanel({ store, clip }) {
  const a = normalizeAdjust(clip.adjust);
  const set = (key, value) => patch(store, clip.id, (c) => {
    c.adjust = { ...normalizeAdjust(c.adjust), [key]: value };
  }, 'adjust-' + key + clip.id);
  const reset = () => patch(store, clip.id, (c) => { c.adjust = { ...DEFAULT_ADJUST }; }, 'adjustreset-' + clip.id);
  return html`${ADJUST_LABELS.map(([key, label]) => {
    const [min, max] = ADJUST_RANGE[key];
    return html`<${Slider} key=${key} label=${myLabel(label)} value=${a[key]} min=${min} max=${max}
      onChange=${(v) => set(key, v)} />`;
  })}
  <div class="frow"><span class="flabel"></span><div class="fctl">
    <button type="button" class="chip" data-adjust-reset onClick=${reset}>${myLabel('Reset')}</button>
  </div></div>`;
}

export function FiltersTool({ store }) {
  const { clip, visual } = useVisual(store);
  const current = visual ? normalizeAdjust(clip.adjust) : null;
  const apply = (preset) => {
    if (!visual) return toast('Filter အတွက် ဗီဒီယို/ပုံ clip ရွေးပါ', 'error');
    patch(store, clip.id, (c) => { c.adjust = { ...DEFAULT_ADJUST, ...preset.adjust }; c.filterIntensity = 100; }, 'filter-' + clip.id);
    toast(myLabel(preset.name) + ' filter သုံးပြီး', 'ok');
  };
  const intensity = clip?.filterIntensity ?? 100;
  const hasLook = visual && Object.keys(DEFAULT_ADJUST).some((k) => current?.[k]);
  const setIntensity = (v) => patch(store, clip.id, (c) => { c.filterIntensity = v; }, 'fint-' + clip.id);
  return panel(L('filters'), H('filters'), html`${!visual && hint('Filter အတွက် ဗီဒီယို သို့မဟုတ် ပုံ clip ရွေးပါ။')}
    <div class="fxgrid">${FILTER_PRESETS.map((preset, i) => {
      const target = { ...DEFAULT_ADJUST, ...preset.adjust };
      const on = visual && JSON.stringify(target) === JSON.stringify(current);
      return html`<button type="button" data-filter=${preset.id} class=${cx('fxtile', on && 'on')}
        onClick=${() => apply(preset)}><span class=${'fxthumb g' + (i % 8 + 1)}></span><em>${myLabel(preset.name)}</em></button>`;
    })}</div>
    ${hasLook && html`<${Slider} label=${myLabel('Intensity')} value=${intensity} min=${0} max=${100}
      onChange=${setIntensity} />`}`);
}

export function AdjustTool({ store }) {
  const { clip, visual } = useVisual(store);
  return panel(L('adjust'), H('adjust'), html`${!visual
    ? hint('Adjust အတွက် ဗီဒီယို သို့မဟုတ် ပုံ clip ရွေးပါ။')
    : html`<${AdjustPanel} store=${store} clip=${clip} />`}`);
}

import { html } from './deps.js';
import { useStore } from './hooks.js';
import { Slider, cx } from './widgets.js';
import { findClip } from '../engine/model.js';
import { EFFECTS } from '../engine/text.js';
import { CLIP_EFFECTS, EFFECT_BY_ID } from '../engine/effects.js';
import { toggleEffect } from './tool-presets.js';
import { toast } from './toast.js';
import { L, H } from './strings.js';
import { myLabel } from './labels-my.js';

const panel = (title, tip, body) => html`<section class="panel tools">
  <div class="phead"><b>${title}</b><small class="panelhint inline">${tip}</small></div>
  <div class="pbody scroll">${body}</div></section>`;
const hint = (text) => html`<p class="panelhint">${text}</p>`;
const patch = (store, id, fn, key) => store.edit((d) => { const found = findClip(d, id); if (found) fn(found.clip, d); }, { key });

function TextEffects({ store, clip }) {
  const active = clip.style?.effects || [];
  const apply = (key) => patch(store, clip.id, (c) => {
    c.style = { ...c.style, effects: toggleEffect(c.style.effects || [], key) };
  }, 'fx-' + clip.id);
  return html`<div class="fxgrid">${EFFECTS.map(([key, name], i) => html`<button type="button" key=${key}
    class=${cx('fxtile', active.includes(key) && 'on')} onClick=${() => apply(key)}
    ><span class=${'fxthumb g' + (i % 8 + 1)}></span><em>${myLabel(name)}</em></button>`)}</div>`;
}

function ClipEffects({ store, clip }) {
  const list = Array.isArray(clip?.fx) ? clip.fx : [];
  const amountOf = (id) => list.find((e) => e.id === id)?.amount ?? 100;
  const toggle = (id) => {
    if (!clip) return toast('Effect အတွက် clip တစ်ခု ရွေးပါ', 'error');
    const on = list.some((e) => e.id === id);
    patch(store, clip.id, (c) => {
      c.fx = on ? (c.fx || []).filter((e) => e.id !== id) : [...(c.fx || []), { id, amount: 100 }];
    }, 'fx-' + clip.id + id);
    toast(myLabel(EFFECT_BY_ID.get(id)?.name || id) + (on ? ' ဖျက်ပြီး' : ' ထည့်ပြီး'), 'ok');
  };
  const setAmount = (id, v) => clip && patch(store, clip.id, (c) => {
    c.fx = (c.fx || []).map((e) => (e.id === id ? { ...e, amount: v } : e));
  }, 'fxamt-' + clip.id + id);
  return html`<div class="fxgrid">${CLIP_EFFECTS.map((ef, i) => html`<button type="button" data-effect=${ef.id}
    class=${cx('fxtile', list.some((e) => e.id === ef.id) && 'on')} onClick=${() => toggle(ef.id)}
    ><span class=${'fxthumb g' + (i % 8 + 1)}></span><em>${myLabel(ef.name)}</em></button>`)}</div>
    ${list.length > 0 && html`<div class="fxstack">${list.map((e) => html`<${Slider} key=${e.id}
      label=${myLabel(EFFECT_BY_ID.get(e.id)?.name || e.id)} value=${amountOf(e.id)} min=${0} max=${100}
      onChange=${(v) => setAmount(e.id, v)} />`)}</div>
    <div class="frow"><span class="flabel"></span><div class="fctl">
      <button type="button" class="chip" data-effects-clear
        onClick=${() => patch(store, clip.id, (c) => { c.fx = []; }, 'fxclear-' + clip.id)}>${myLabel('Clear')}</button>
    </div></div>`}`;
}

export function EffectsTool({ store }) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const found = sel ? findClip(project, sel) : null, clip = found ? found.clip : null;
  const isText = clip?.kind === 'text', isVisual = !!clip && (clip.kind === 'video' || clip.kind === 'image');
  const tip = isText ? 'စာတန်း ပုံစံအကျိုးသက်ရောက်မှု' : 'Clip ပေါ် ထပ်ဆင့် effect များ';
  return panel(L('effects'), H('effects'), html`${!clip && hint('Effect ထည့်လိုသော clip ကို အရင်ရွေးပါ — အောက်က tile များက ရွေးပြီး သုံးရန်။')}
    ${clip && !isText && !isVisual && hint('Effect ကို ဗီဒီယို/ပုံ သို့မဟုတ် စာတန်း clip ပေါ်တွင် သုံးနိုင်သည်။')}
    ${isText ? html`<${TextEffects} store=${store} clip=${clip} />` : html`<${ClipEffects} store=${store} clip=${clip} />`}`);
}

import { html } from './deps.js';
import { useStore } from './hooks.js';
import { Slider, cx } from './widgets.js';
import { findClip } from '../engine/model.js';
import { addText, insertPreset } from '../engine/actions.js';
import { EFFECTS, PRESETS } from '../engine/text.js';
import { clipMediaId } from '../engine/clip.js';
import { FILTER_PRESETS, STICKERS, STICKER_STYLE, TRANSITION_PRESETS, toggleEffect } from './tool-presets.js';
import { toast } from './toast.js';
import { L, H } from './strings.js';
import { myLabel } from './labels-my.js';
import { TemplatesTool } from './panels-templates.js';
import { AdjustTool, FiltersTool } from './panels-adjust.js';

const panel = (title, tip, body) => html`<section class="panel tools"><div class="phead"><b>${title}</b><small class="panelhint inline">${tip}</small></div><div class="pbody scroll">${body}</div></section>`;
const hint = (text) => html`<p class="panelhint">${text}</p>`;
const patch = (store, id, fn, key) => store.edit((d) => { const found = findClip(d, id); if (found) fn(found.clip, d); }, { key });

function useSelected(store) {
  const project = useStore(store, (s) => s.project), sel = useStore(store, (s) => s.selection);
  const found = sel ? findClip(project, sel) : null;
  return { project, clip: found ? found.clip : null };
}

function EffectsTool({ store }) {
  const { clip } = useSelected(store), isText = clip?.kind === 'text', active = isText ? clip.style?.effects || [] : [];
  const apply = (key) => {
    if (!isText) return toast('Effects အတွက် စာတန်း clip ရွေးပါ', 'error');
    patch(store, clip.id, (c) => { c.style = { ...c.style, effects: toggleEffect(c.style.effects || [], key) }; }, 'fx-' + clip.id);
  };
  return panel(L('effects'), H('effects'), html`${!isText && hint('Effects ကို စာတန်း clip ပေါ်တွင် သုံးနိုင်သည် — စာတန်း clip တစ်ခု ရွေးပါ။')}
    <div class="fxgrid">${EFFECTS.map(([key, name], i) => html`<button type="button" class=${cx('fxtile', active.includes(key) && 'on')} onClick=${() => apply(key)}><span class=${'fxthumb g' + (i % 8 + 1)}></span><em>${myLabel(name)}</em></button>`)}</div>`);
}

function TransitionsTool({ store }) {
  const { clip } = useSelected(store);
  const apply = (preset) => {
    if (!clip) return toast('Clip တစ်ခု ရွေးပါ', 'error');
    patch(store, clip.id, (c) => { if (preset.transition) c.transition = { ...preset.transition }; else delete c.transition; }, 'tr-' + clip.id);
    toast(preset.name + ' transition သတ်မှတ်ပြီး', 'ok');
  };
  const current = clip?.transition?.in || 'none';
  return panel(L('transitions'), H('transitions'), html`${!clip && hint('Transition ထည့်လိုသော clip ကို အရင်ရွေးပါ။')}
    <div class="fxgrid">${TRANSITION_PRESETS.map((preset) => html`<button type="button" class=${cx('fxtile', current === preset.id && 'on')} onClick=${() => apply(preset)}><span class="fxthumb g2"></span><em>${myLabel(preset.name)}</em></button>`)}</div>`);
}

function AudioTool({ store, transport }) {
  const project = useStore(store, (s) => s.project), selection = useStore(store, (s) => s.selection);
  const clips = (project.tracks || []).filter((t) => t.kind === 'audio').flatMap((t) => t.clips.map((c) => ({ ...c, trackId: t.id })));
  const set = (id, key, value) => patch(store, id, (c) => { c[key] = value; }, 'audio-' + id);
  return panel(L('audio'), H('audio'), html`${!clips.length && hint('ဖတ်သံ သို့မဟုတ် ဂီတ ထည့်ရန် Media မှ ဖိုင်ရွေးပါ။')}
    <div class="audiolist">${clips.map((c) => html`<div class="audiorow"><button type="button" class=${cx('audioname', selection === c.id && 'on')} onClick=${() => { store.select(c.id); transport.seek(c.start); }}>${c.text || c.name || 'Audio'}</button>
      <${Slider} label="Volume" value=${Math.round((c.volume ?? 1) * 100)} min=${0} max=${150} onChange=${(v) => set(c.id, 'volume', v / 100)} /></div>`)}</div>`);
}

function StickersTool({ store, transport }) {
  const add = (emoji) => { const clip = addText(store, transport, emoji); patch(store, clip.id, (c) => { c.style = { ...c.style, ...STICKER_STYLE }; c.sticker = true; }, 'sticker-' + clip.id); toast('Sticker ထည့်ပြီး', 'ok'); };
  return panel(L('stickers'), H('stickers'), html`<div class="stickergrid">${STICKERS.map((emoji) => html`<button type="button" class="stickerbtn" onClick=${() => add(emoji)}>${emoji}</button>`)}</div>`);
}

function MoreTool({ store, transport }) {
  const project = useStore(store, (s) => s.project);
  const clips = project.tracks.reduce((n, t) => n + t.clips.length, 0);
  return panel(L('more'), H('more'), html`<div class="morelist">
    <p class="panelhint">ပရောဂျက်: ${project.name} · clip ${clips} ခု · ${project.size}</p>
    <button type="button" class="btn" onClick=${() => window.dispatchEvent(new Event('fornyein:shortcuts'))}>Keyboard shortcuts (?)</button>
    <button type="button" class="btn" onClick=${() => window.dispatchEvent(new Event('fornyein:tour'))}>Coach tour ပြန်ကြည့်</button>
    <button type="button" class="btn" onClick=${() => { transport.seek(0); transport.play(); }}>အစကနေ ဖွင့်ကြည့်</button>
    <p class="panelhint">မြန်မာစာ စာလုံးပေါင်း၊ Zawgyi/Unicode ပြဿနာများအတွက် Text panel မှ ပြောင်းနိုင်ပါသည်။</p>
  </div>`);
}

const TOOL_PANELS = { audio: AudioTool, stickers: StickersTool, effects: EffectsTool, transitions: TransitionsTool, filters: FiltersTool, adjust: AdjustTool, templates: TemplatesTool, more: MoreTool };

export function ToolsPanel({ tool, store, transport }) {
  const Tool = TOOL_PANELS[tool];
  return Tool ? html`<${Tool} store=${store} transport=${transport} />` : null;
}

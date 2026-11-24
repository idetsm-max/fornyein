import { html } from './deps.js';
import { insertPreset } from '../engine/actions.js';
import { PRESETS } from '../engine/text.js';
import { PROJECT_TEMPLATES, buildTemplate } from '../engine/templates.js';
import { toast } from './toast.js';
import { L, H } from './strings.js';

const panel = (title, tip, body) => html`<section class="panel tools">
  <div class="phead"><b>${title}</b><small class="panelhint inline">${tip}</small></div>
  <div class="pbody scroll">${body}</div></section>`;

export function TemplatesTool({ store, transport }) {
  const add = (key) => { insertPreset(store, transport, key); toast(PRESETS[key].name + ' ထည့်ပြီး', 'ok'); };
  const use = (tpl) => {
    const used = store.get().project.tracks.reduce((n, t) => n + t.clips.length, 0);
    if (used && !window.confirm('လက်ရှိ clip ' + used + ' ခု ဖျက်ပြီး template အသစ် ဖွင့်မလား?')) return;
    transport.pause(); store.load(buildTemplate(tpl.id)); transport.seek(0);
    toast(tpl.name + ' ဖွင့်ပြီး', 'ok');
  };
  return panel(L('templates'), H('templates'), html`
    <p class="panelhint">Project template — စာသား အစီအစဉ် အဆင်သင့်</p>
    <div class="tpllist">${PROJECT_TEMPLATES.map((tpl) => html`<button type="button" class="tplrow" data-tpl=${tpl.id}
      onClick=${() => use(tpl)}><span class="tplthumb"></span>
      <span class="tplmeta"><b>${tpl.name}</b><small>${tpl.hint}</small></span></button>`)}</div>
    <p class="panelhint">စာ preset</p>
    <div class="fxgrid">${Object.entries(PRESETS).map(([key, preset]) => html`<button type="button" class="fxtile"
      onClick=${() => add(key)}><span class="fxthumb g3"></span><em>${preset.name}</em></button>`)}</div>`);
}

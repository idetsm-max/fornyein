import { html } from './deps.js';
import { Select, cx } from './widgets.js';
import { diagnostics } from './capability.js';
import { LIMITS } from '../engine/settings.js';
import { toast } from './toast.js';

const Row = ({ label, hint, children }) => html`<label class="setrow"><span class="setlabel"><b>${label}</b>${hint && html`<em>${hint}</em>`}</span>${children}</label>`;
const Check = ({ on, onChange }) => html`<input type="checkbox" class="setcheck" checked=${on} onChange=${(e) => onChange(e.target.checked)} />`;

export function SettingsDialog({ settings, onChange, onClose, onResetLayout, onClearCaches, onReset }) {
  const set = (key, value) => onChange({ ...settings, [key]: value });
  const copy = async () => { try { await navigator.clipboard.writeText(diagnostics()); toast('Diagnostics ကူးပြီးပါပြီ', 'ok'); } catch { toast('ကူးလို့ မရပါ', 'error'); } };
  return html`<div class="exportshade" onClick=${(e) => e.target === e.currentTarget && onClose()}>
    <div class="exportbox settingsbox" role="dialog" aria-modal="true" aria-label="Settings">
      <div class="exporthead"><b>Settings</b><button type="button" class="x" title="ပိတ် · Esc" onClick=${onClose}>✕</button></div>
      <div class="setbody">
        <section class="setgroup"><h3>General</h3>
          <${Row} label="Theme"><${Select} value=${settings.theme} onChange=${(v) => set('theme', v)} options=${['dark', 'light']} cls="compact" /></${Row}>
          <${Row} label="Timecode" hint="Status bar and preview clock"><${Select} value=${settings.timecode} onChange=${(v) => set('timecode', v)} options=${['tc', 'sec']} cls="compact" /></${Row}>
        </section>
        <section class="setgroup"><h3>Editing</h3>
          <${Row} label="Snap to edges" hint="Alt ဖိနေရင် ခဏပိတ်"><${Check} on=${settings.snap} onChange=${(v) => set('snap', v)} /></${Row}>
          <${Row} label="Snap distance" hint=${settings.snapPx + ' px'}><input type="range" min=${LIMITS.snapPx[0]} max=${LIMITS.snapPx[1]} step="1" value=${settings.snapPx} onInput=${(e) => set('snapPx', +e.target.value)} /></${Row}>
          <${Row} label="Main-track magnet" hint="ကပ်ရိုက်တဲ့အခါ ကွက်လပ်မကျန်စေ"><${Check} on=${settings.magnet} onChange=${(v) => set('magnet', v)} /></${Row}>
          <${Row} label="Playhead follow" hint="Scroll ကို playhead လိုက်စေ"><${Select} value=${settings.follow} onChange=${(v) => set('follow', v)} options=${['auto', 'smooth', 'off']} cls="compact" /></${Row}>
          <${Row} label="Text clip duration" hint=${settings.textDur + ' s'}><input type="range" min=${LIMITS.textDur[0]} max=${LIMITS.textDur[1]} step="0.5" value=${settings.textDur} onInput=${(e) => set('textDur', +e.target.value)} /></${Row}>
          <${Row} label="Image clip duration" hint=${settings.imageDur + ' s'}><input type="range" min=${LIMITS.imageDur[0]} max=${LIMITS.imageDur[1]} step="1" value=${settings.imageDur} onInput=${(e) => set('imageDur', +e.target.value)} /></${Row}>
        </section>
        <section class="setgroup"><h3>Playback</h3>
          <${Row} label="Preview quality" hint="Export က အမြဲ full quality"><${Select} value=${settings.previewQuality} onChange=${(v) => set('previewQuality', v)} options=${['auto', '1', '0.5', '0.25']} cls="compact" /></${Row}>
          <${Row} label="Performance HUD" hint="Status bar မှာ fps ပြ"><${Check} on=${settings.perfHud} onChange=${(v) => set('perfHud', v)} /></${Row}>
        </section>
        <section class="setgroup"><h3>Autosave</h3>
          <${Row} label="Save after idle" hint=${(settings.autosaveMs / 1000).toFixed(1) + ' s'}><input type="range" min=${LIMITS.autosaveMs[0]} max=${LIMITS.autosaveMs[1]} step="100" value=${settings.autosaveMs} onInput=${(e) => set('autosaveMs', +e.target.value)} /></${Row}>
          <${Row} label="Keep projects in this browser" hint="Off ဆိုရင် reload ရင် ပျောက်နိုင်"><${Check} on=${settings.persist} onChange=${(v) => set('persist', v)} /></${Row}>
        </section>
        <section class="setgroup"><h3>Advanced</h3>
          <div class="setactions">
            <button type="button" class="btn ghost" onClick=${onReset}>Reset to defaults</button>
            <button type="button" class="btn ghost" onClick=${onResetLayout}>Reset layout</button>
            <button type="button" class="btn ghost" onClick=${onClearCaches}>Clear caches</button>
            <button type="button" class="btn ghost" onClick=${copy}>Copy diagnostics</button>
          </div>
        </section>
      </div>
    </div>
  </div>`;
}

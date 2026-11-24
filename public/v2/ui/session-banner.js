import { html } from './deps.js';
import { Icon } from './icons.js';
import { T } from './locale-core.js';

const ago = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? T('just now', 'ယခုလေးတင်') : m < 60 ? `${m} ${T('min ago', 'မိနစ်က')}` : `${Math.round(m / 60)} ${T('h ago', 'နာရီက')}`; };

export function RecoveryDialog({ at, onRestore, onDiscard }) {
  return html`<div class="exportshade">
    <div class="exportbox recoverybox" role="alertdialog" aria-modal="true" aria-label="Recovery">
      <div class="exporthead"><b>${T('Unfinished session found', 'မပြီးခဲ့တဲ့ session ရှိတယ်')}</b></div>
      <div class="recoverybody">
        <p>${T('The editor closed before the last save finished.', 'နောက်ဆုံးသိမ်းတာ မပြီးခင် editor ပိတ်သွားတယ်။')}
          ${at ? html`<em>${ago(at)}</em>` : ''}</p>
        <div class="setactions">
          <button type="button" class="btn primary" onClick=${onRestore}><${Icon} name="undo" size=${15} /><span>${T('Reopen', 'ပြန်ဖွင့်')}</span></button>
          <button type="button" class="btn ghost" onClick=${onDiscard}><${Icon} name="trash" size=${15} /><span>${T('Discard', 'ပယ်')}</span></button>
        </div>
      </div>
    </div>
  </div>`;
}

export function ReadOnlyBar({ onTakeOver }) {
  return html`<div class="readonlybar" role="status">
    <${Icon} name="lock" size=${15} />
    <span>${T('This project is open in another tab — this tab is read-only.', 'ဒီ project ကို တခြား tab မှာ ဖွင့်ထားတယ် — ဒီ tab က ဖတ်ရုံပါ')}</span>
    <button type="button" class="btn ghost small" onClick=${onTakeOver}>${T('Edit here', 'ဒီ tab မှာ ဆက်လုပ်')}</button>
  </div>`;
}

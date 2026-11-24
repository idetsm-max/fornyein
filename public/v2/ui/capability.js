// Browser capability gate: the editor needs these APIs before it can start.
import { html } from './deps.js';
import { Icon } from './icons.js';

export const REQUIRED = [
  ['WebCodecs (VideoEncoder/Decoder)', (w) => !!w.VideoEncoder && !!w.VideoDecoder],
  ['WebCodecs (AudioEncoder)', (w) => !!w.AudioEncoder],
  ['AudioContext', (w) => !!(w.AudioContext || w.webkitAudioContext)],
  ['IndexedDB', (w) => !!w.indexedDB],
  ['OffscreenCanvas', (w) => !!w.OffscreenCanvas],
];

export function detectCapabilities(win = globalThis) {
  const missing = REQUIRED.filter(([, has]) => !has(win)).map(([name]) => name);
  return { ok: missing.length === 0, missing };
}

export function diagnostics(win = globalThis) {
  return [
    `For Nyein · ${new Date().toISOString()}`,
    `user agent: ${win.navigator?.userAgent || 'n/a'}`,
    ...REQUIRED.map(([name, has]) => `${name}: ${has(win) ? 'yes' : 'MISSING'}`),
  ].join('\n');
}

export function CapabilityGate({ caps }) {
  const copy = async () => {
    try { await navigator.clipboard.writeText(diagnostics()); } catch { /* clipboard blocked */ }
  };
  return html`<div class="gate" role="alert">
    <div class="gatecard">
      <span class="gatelogo"><${Icon} name="play" size=${18} /></span>
      <h1>ဒီ browser မှာ မရနိုင်သေးပါ</h1>
      <p>For Nyein ကို <b>Chrome သို့မဟုတ် Edge (နောက်ဆုံး version ၂ ခု)</b> နဲ့ ဖွင့်ပါ။ လိုအပ်နေတာ —</p>
      <ul class="gatemiss">${caps.missing.map((m) => html`<li>${m}</li>`)}</ul>
      <button type="button" class="btn ghost" onClick=${copy}><${Icon} name="copy" size=${15} /><span>Diagnostics ကူးယူ</span></button>
    </div>
  </div>`;
}

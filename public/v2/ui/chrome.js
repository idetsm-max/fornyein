import { html } from './deps.js';
import { Icon } from './icons.js';
import { IconBtn, Select, cx } from './widgets.js';
import { L, H } from './strings.js';

export function TopBar({ theme, setTheme, zoom, setZoom }) {
  return html`<header class="topbar">
    <div class="brand" title="For Nyein"><span class="logo"><${Icon} name="play" size=${15} /></span><span class="brandname">For Nyein</span></div>
    <button type="button" class="navbtn" title=${H('home')}><${Icon} name="home" size=${17} /><span>${L('home')}</span></button>
    <button type="button" class="navbtn" title=${H('projects')}><span>${L('projects')}</span><${Icon} name="chevron" size=${14} /></button>
    <div class="savedpill" title=${H('saved')}><${Icon} name="cloud" size=${18} /><span><b>${L('saved')}</b> <em>just now</em></span></div>
    <div class="spacer"></div>
    <div class="topctl">
      <${IconBtn} name="undo" title=${L('undo') + ' · ' + H('undo')} />
      <${IconBtn} name="redo" title=${L('redo') + ' · ' + H('redo')} />
      <span class="vsep"></span>
      <${Select} value=${zoom} onChange=${setZoom} options=${['50%', '75%', '100%', '150%', '200%']} title="Zoom" cls="compact" />
      <${IconBtn} name="maximize" title=${L('fullscreen') + ' · ' + H('fullscreen')} />
    </div>
    <button type="button" class="btn ghost" title=${H('preview')}><${Icon} name="play" size=${15} /><span>${L('preview')}</span></button>
    <button type="button" class="btn primary" title=${H('export')}><${Icon} name="export" size=${16} /><span>${L('export')}</span></button>
    <div class="themeswitch" role="group" aria-label="Theme">
      <button type="button" class=${cx(theme === 'light' && 'on')} title="Light" onClick=${() => setTheme('light')}><${Icon} name="sun" size=${16} /></button>
      <button type="button" class=${cx(theme === 'dark' && 'on')} title="Dark" onClick=${() => setTheme('dark')}><${Icon} name="moon" size=${16} /></button>
    </div>
    <div class="avatar" title="Account">N</div>
  </header>`;
}

const TOOLS = ['media', 'audio', 'text', 'stickers', 'effects', 'transitions', 'filters', 'adjust', 'templates', 'more'];
export function Rail({ tool, setTool }) {
  return html`<nav class="rail" aria-label="Tools">${TOOLS.map((id) =>
    html`<button type="button" class=${cx('railbtn', tool === id && 'on')} title=${H(id)} onClick=${() => setTool(id)}><${Icon} name=${id} size=${22} /><span>${L(id)}</span></button>`)}</nav>`;
}

export function StatusBar({ ratio, res }) {
  return html`<footer class="statusbar">
    <span class="sitem">${L('project')}: <b>Untitled Project</b></span><span class="vsep"></span>
    <span class="sitem">${L('resolution')}: <b>${res[0]} × ${res[1]}</b> (${ratio})</span>
    <div class="spacer"></div>
    <button type="button" class="btn ghost" title=${H('save')}><${Icon} name="save" size=${16} /><span>${L('save')}</span></button>
    <button type="button" class="btn primary" title=${H('exportVideo')}><${Icon} name="export" size=${16} /><span>${L('exportVideo')}</span></button>
  </footer>`;
}

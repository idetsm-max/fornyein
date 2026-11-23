import { html } from './deps.js';
import { implementedShortcuts } from './keymap.js';

export function ShortcutsDialog({ onClose }) {
  const groups = implementedShortcuts();
  return html`<div class="exportshade" onClick=${(e) => e.target === e.currentTarget && onClose()}><div class="exportbox shortcutbox"><div class="exporthead"><b>Keyboard shortcuts</b><button type="button" class="x" onClick=${onClose}>×</button></div><div class="shortcutlist">
    ${groups.map((group) => html`<b class="scgroup">${group.en}</b>${group.items.map((item) => html`<span><kbd>${item.keys}</kbd> ${item.en}</span>`)}`)}
  </div></div></div>`;
}

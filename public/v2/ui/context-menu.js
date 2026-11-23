import { html } from './deps.js';

export function ContextMenu({ menu, onClose }) {
  if (!menu) return null;
  const width = 232, height = 44 + menu.items.length * 34;
  const x = Math.max(8, Math.min(menu.x, (window.innerWidth || 1280) - width - 8));
  const y = Math.max(8, Math.min(menu.y, (window.innerHeight || 800) - height));
  return html`<div class="ctxbackdrop" onPointerDown=${onClose} onContextMenu=${(e) => { e.preventDefault(); onClose(); }}>
    <div class="ctxmenu" role="menu" style=${{ left: x + 'px', top: y + 'px' }}
      onPointerDown=${(e) => e.stopPropagation()} onContextMenu=${(e) => e.preventDefault()}>
      ${menu.title && html`<div class="ctxhead">${menu.title}</div>`}
      ${menu.items.map((item) => item.sep
        ? html`<div class="ctxsep"></div>`
        : html`<button type="button" role="menuitem" class="ctxitem" disabled=${!!item.disabled}
            onClick=${() => { onClose(); item.run?.(); }}>
            <span>${item.label}</span>${item.shortcut && html`<kbd>${item.shortcut}</kbd>`}
          </button>`)}
    </div>
  </div>`;
}

// Toast rendering bound to the shared queue.
import { html, useState, useEffect, useRef } from './deps.js';
import { createToastQueue } from './toast-queue.js';

export const toasts = createToastQueue();
export const toast = (message, tone, ms) => toasts.push(message, tone, ms);

export function Toaster() {
  const [items, setItems] = useState(toasts.get());
  const timers = useRef(new Map());
  useEffect(() => toasts.subscribe(setItems), []);
  useEffect(() => {
    for (const item of items) {
      if (timers.current.has(item.id)) continue;
      timers.current.set(item.id, setTimeout(() => { toasts.dismiss(item.id); timers.current.delete(item.id); }, item.ms));
    }
    for (const [id, timer] of timers.current) {
      if (!items.some((item) => item.id === id)) { clearTimeout(timer); timers.current.delete(id); }
    }
  }, [items]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []);
  return html`<div class="toasts" role="status" aria-live="polite">${items.map((item) => html`<div key=${item.id} class=${'toast ' + item.tone}>${item.message}</div>`)}</div>`;
}

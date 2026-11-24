// Toast rendering bound to the shared queue.
import { html, useState, useEffect, useRef } from './deps.js';
import { createToastQueue } from './toast-queue.js';

export const toasts = createToastQueue();
export const toast = (message, tone, ms) => toasts.push(message, tone, ms);

export function Toaster() {
  const [items, setItems] = useState(toasts.get());
  const timers = useRef(new Map());
  const left = useRef(new Map());
  useEffect(() => toasts.subscribe(setItems), []);
  const arm = (item, ms) => timers.current.set(item.id, setTimeout(() => { toasts.dismiss(item.id); timers.current.delete(item.id); left.current.delete(item.id); }, ms));
  const pause = (item) => {
    const timer = timers.current.get(item.id);
    if (!timer) return;
    clearTimeout(timer); timers.current.delete(item.id);
    left.current.set(item.id, Math.max(400, (left.current.get(item.id) ?? item.ms)));
  };
  const resume = (item) => {
    if (!left.current.has(item.id)) return;
    arm(item, left.current.get(item.id));
  };
  useEffect(() => {
    for (const item of items) {
      if (timers.current.has(item.id) || left.current.has(item.id)) continue;
      left.current.set(item.id, item.ms);
      arm(item, item.ms);
    }
    for (const [id, timer] of timers.current) {
      if (!items.some((item) => item.id === id)) { clearTimeout(timer); timers.current.delete(id); left.current.delete(id); }
    }
  }, [items]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []);
  return html`<div class="toasts" role="status" aria-live="polite">${items.map((item) => html`<div key=${item.id} class=${'toast ' + item.tone} onMouseEnter=${() => pause(item)} onMouseLeave=${() => resume(item)}>${item.message}</div>`)}</div>`;
}

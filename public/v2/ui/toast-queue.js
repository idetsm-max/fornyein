// Pure toast queue (no DOM) so it can be unit tested under node.
const MAX_VISIBLE = 4;
const TONE_MS = { error: 6000, warn: 4500, info: 3000, success: 3000 };

export function createToastQueue() {
  let items = [], seq = 0;
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(items));
  return {
    push(message, tone = 'info', ms = TONE_MS[tone] || 3000) {
      const text = String(message || '').trim();
      if (!text || items.some((item) => item.message === text)) return null;
      const item = { id: ++seq, message: text, tone, ms };
      items = [...items, item].slice(-MAX_VISIBLE);
      emit();
      return item.id;
    },
    dismiss(id) { items = items.filter((item) => item.id !== id); emit(); },
    clear() { items = []; emit(); },
    get() { return items; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

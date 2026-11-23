// Language state without DOM/Preact so unit tests can import it under node.
export const LOCALE_KEY = 'fornyein.locale';
const subs = new Set();
const read = () => { try { return localStorage.getItem(LOCALE_KEY) === 'my' ? 'my' : 'en'; } catch { return 'en'; } };
let current = read();

export const getLocale = () => current;

export function setLocale(next) {
  current = next === 'my' ? 'my' : 'en';
  try { localStorage.setItem(LOCALE_KEY, current); } catch { /* private mode */ }
  if (typeof document !== 'undefined') document.documentElement.lang = current === 'my' ? 'my' : 'en';
  subs.forEach((fn) => fn());
}

export function toggleLocale() { setLocale(current === 'my' ? 'en' : 'my'); return current; }

export function subscribeLocale(fn) { subs.add(fn); return () => subs.delete(fn); }

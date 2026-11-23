import { useEffect, useState } from './deps.js';
import { getLocale, subscribeLocale } from './locale-core.js';

export * from './locale-core.js';

export function useLocale() {
  const [, force] = useState(0);
  useEffect(() => subscribeLocale(() => force((n) => n + 1)), []);
  return getLocale();
}

// Session safety: crash-recovery flag and the cross-tab project lock.
export const RECOVERY_KEY = 'fn.recovery.v1';
export const CHANNEL = 'fn-session';

const safe = (fn) => { try { return fn(); } catch { return null; } };

export const markRecovery = (storage = globalThis.localStorage) => safe(() => storage.setItem(RECOVERY_KEY, String(Date.now())));
export const clearRecovery = (storage = globalThis.localStorage) => safe(() => storage.removeItem(RECOVERY_KEY));
export const hasRecovery = (storage = globalThis.localStorage) => !!safe(() => storage.getItem(RECOVERY_KEY));
export const recoveryAge = (storage = globalThis.localStorage) => Number(safe(() => storage.getItem(RECOVERY_KEY))) || 0;

// The tab that started later yields; an explicit takeover flips the roles.
export const olderWins = (mine, theirs) => theirs < mine;

export function createTabLock({ channel, at, onPeer }) {
  if (!channel) return { close() {}, takeOver() {} };
  const post = (type) => safe(() => channel.postMessage({ type, at }));
  channel.onmessage = (e) => {
    const msg = e?.data;
    if (!msg || typeof msg.at !== 'number') return;
    if (msg.type === 'hello') { post('here'); if (olderWins(at, msg.at)) onPeer(true); }
    else if (msg.type === 'here') { if (olderWins(at, msg.at)) onPeer(true); }
    else if (msg.type === 'takeover') onPeer(true);
    else if (msg.type === 'bye') onPeer(false);
  };
  post('hello');
  return {
    takeOver() { onPeer(false); post('takeover'); },
    close() { post('bye'); safe(() => channel.close()); },
  };
}

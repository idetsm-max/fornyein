import { loadMedia } from './storage.js';
export function createAudioController(transport, getProject) {
  const players = new Map(); let lastT = 0, active = false, token = 0;
  async function sync(force = false) {
    const p = getProject(), clips = p.tracks.find((t) => t.kind === 'audio')?.clips || [], now = transport.t;
    if (!force && Math.abs(now - lastT) < .25 && active === transport.playing) return; lastT = now; active = transport.playing; const current = new Set(clips.map((c) => c.id));
    for (const [id, item] of players) if (!current.has(id)) { item.el.pause(); URL.revokeObjectURL(item.url); players.delete(id); }
    if (!active) { for (const { el } of players.values()) el.pause(); return; }
    await Promise.all(clips.map(async (c) => { let item = players.get(c.id); if (!item) { const blob = await loadMedia(p.media?.[c.mediaId]?.id || c.mediaId); if (!blob) return; item = { url: URL.createObjectURL(blob), el: new Audio() }; item.el.src = item.url; players.set(c.id, item); } item.el.loop = !!c.loop; const offset = now - c.start; if (offset >= 0 && offset < c.dur) { item.el.currentTime = Math.max(0, offset); const fadeIn = c.fade?.in || 0, fadeOut = c.fade?.out || 0; const inGain = fadeIn ? Math.min(1, offset / fadeIn) : 1; const outGain = fadeOut ? Math.min(1, Math.max(0, (c.dur - offset) / fadeOut)) : 1; item.el.volume = Math.max(0, Math.min(1, (c.gain ?? 1) * inGain * outGain)); item.el.play().catch(() => {}); } else item.el.pause(); }));
  }
  const unsub = transport.subscribe(() => sync());
  return { sync, dispose() { unsub(); for (const { el, url } of players.values()) { el.pause(); URL.revokeObjectURL(url); } players.clear(); } };
}

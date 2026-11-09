import { loadMedia } from './storage.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
function setupGraph(ctx, el, output) {
  const source = ctx.createMediaElementSource(el), eq = ['low', 'mid', 'high'].map((type) => { const n = ctx.createBiquadFilter(); n.type = type === 'mid' ? 'peaking' : `${type}pass`; if (type === 'low') n.type = 'lowshelf'; if (type === 'high') n.type = 'highshelf'; n.frequency.value = type === 'low' ? 180 : type === 'mid' ? 1200 : 5000; return n; }), comp = ctx.createDynamicsCompressor(), delay = ctx.createDelay(2), echoGain = ctx.createGain(), gain = ctx.createGain(), pan = ctx.createStereoPanner(), analyser = ctx.createAnalyser();
  delay.delayTime.value = .18; echoGain.gain.value = 0; comp.connect(delay); delay.connect(echoGain); echoGain.connect(gain); eq[2].connect(comp); source.connect(eq[0]); eq[0].connect(eq[1]); eq[1].connect(eq[2]); comp.connect(gain); gain.connect(pan); pan.connect(analyser); analyser.connect(output || ctx.destination);
  return { source, eq, comp, delay, echoGain, gain, pan, analyser };
}
function applyGraph(item, clip, track, duck = 1) {
  const m = item.graph, mix = track?.mixer || {}, bypass = clip.bypass || mix.bypass;
  if (!m) return;
  const now = item.ctx.currentTime, q = clip.eq || {};
  m.eq[0].gain.setTargetAtTime(bypass ? 0 : (q.low || 0), now, .02); m.eq[1].gain.setTargetAtTime(bypass ? 0 : (q.mid || 0), now, .02); m.eq[2].gain.setTargetAtTime(bypass ? 0 : (q.high || 0), now, .02);
  m.comp.threshold.setTargetAtTime(clip.compressor?.enabled ? clip.compressor.threshold : 0, now, .02); m.comp.ratio.setTargetAtTime(clip.compressor?.enabled ? clip.compressor.ratio : 1, now, .02);
  m.delay.delayTime.setTargetAtTime(.12 + (clip.echo || 0) * .35, now, .02); m.echoGain.gain.setTargetAtTime((clip.echo || 0) * .35, now, .02); m.gain.gain.setTargetAtTime(clamp((clip.gain ?? 1) * (clip.volume ?? 1) * (mix.volume ?? 1) * duck, 0, 2), now, .02); m.pan.pan.setTargetAtTime(clamp((clip.pan ?? 0) + (mix.pan ?? 0), -1, 1), now, .02);
}
export function createAudioController(transport, getProject) {
  const players = new Map(); let lastT = 0, active = false, token = 0, ctx = null, master = null;
  const ensure = () => { if (!ctx) { ctx = new AudioContext(); master = ctx.createDynamicsCompressor(); master.threshold.value = -1; master.ratio.value = 12; master.connect(ctx.destination); } if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  async function sync(force = false) {
    const p = getProject(), tracks = p.tracks || [], audioTrack = tracks.find((t) => t.kind === 'audio'), clips = audioTrack?.clips || [], now = transport.t;
    if (!force && Math.abs(now - lastT) < .12 && active === transport.playing) return; lastT = now; active = transport.playing;
    const current = new Set(clips.map((c) => c.id)); for (const [id, item] of players) if (!current.has(id)) { item.el.pause(); URL.revokeObjectURL(item.url); players.delete(id); }
    if (!active) { for (const { el } of players.values()) el.pause(); return; }
    const ac = ensure(); const voiceActive = clips.some((c) => c.role === 'voice' && now >= c.start && now < c.start + c.dur);
    await Promise.all(clips.map(async (c) => { let item = players.get(c.id); if (!item) { const blob = await loadMedia(p.media?.[c.mediaId]?.id || c.mediaId); if (!blob) return; item = { url: URL.createObjectURL(blob), el: new Audio(), ctx: ac }; item.el.src = item.url; item.el.crossOrigin = 'anonymous'; item.graph = setupGraph(ac, item.el, master); players.set(c.id, item); } item.el.loop = !!c.loop; const offset = now - c.start; if (offset >= 0 && offset < c.dur) { item.el.currentTime = Math.max(0, offset); const fi = c.fade?.in || 0, fo = c.fade?.out || 0, fade = (fi ? Math.min(1, offset / fi) : 1) * (fo ? Math.min(1, Math.max(0, (c.dur - offset) / fo)) : 1); applyGraph(item, c, audioTrack, audioTrack.mixer?.ducking && c.role === 'music' && voiceActive ? .35 : 1); item.graph.gain.gain.value *= fade; item.el.play().catch(() => {}); } else item.el.pause(); }));
  }
  const unsub = transport.subscribe(() => sync());
  return { sync, getMeters() { const out = {}; for (const [id, item] of players) { const data = new Uint8Array(item.graph.analyser.frequencyBinCount); item.graph.analyser.getByteTimeDomainData(data); out[id] = Math.sqrt(data.reduce((n, x) => n + ((x - 128) / 128) ** 2, 0) / data.length); } return out; }, dispose() { unsub(); for (const { el, url } of players.values()) { el.pause(); URL.revokeObjectURL(url); } players.clear(); if (ctx) ctx.close(); } };
}

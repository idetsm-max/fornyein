// One audio graph for preview and export. The only difference between the two is
// how sources are started (live clock vs offline clock), so both hear the same
// EQ / compressor / echo / reverb / gain / pan chain.
import { clipSpeed } from './clip.js';

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// Deterministic PRNG so a reverb impulse is identical on every render.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildImpulse(ctx, seconds = 1.8, decay = 2.4, seed = 0x5eed) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  const rand = mulberry32(seed);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (rand() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}

// Per-clip chain: EQ -> compressor -> [dry + echo + reverb] -> gain -> pan.
export function createClipChain(ctx, { reverbSeed = 0x5eed } = {}) {
  const input = ctx.createGain();
  const eq = [180, 1200, 5000].map((freq, i) => {
    const node = ctx.createBiquadFilter();
    node.type = i === 0 ? 'lowshelf' : i === 2 ? 'highshelf' : 'peaking';
    node.frequency.value = freq;
    node.gain.value = 0;
    return node;
  });
  const comp = ctx.createDynamicsCompressor();
  const delay = ctx.createDelay(2), echo = ctx.createGain();
  const convolver = ctx.createConvolver(), reverb = ctx.createGain();
  const gain = ctx.createGain(), pan = ctx.createStereoPanner();
  convolver.buffer = buildImpulse(ctx, 1.8, 2.4, reverbSeed);
  delay.delayTime.value = .18;
  echo.gain.value = 0;
  reverb.gain.value = 0;
  comp.threshold.value = 0;
  comp.ratio.value = 1;
  input.connect(eq[0]);
  eq[0].connect(eq[1]).connect(eq[2]).connect(comp);
  comp.connect(gain);
  comp.connect(delay); delay.connect(echo).connect(gain);
  comp.connect(convolver); convolver.connect(reverb).connect(gain);
  gain.connect(pan);
  return { input, output: pan, eq, comp, delay, echo, convolver, reverb, gain, pan };
}

const setParam = (param, value, now, smooth) => {
  if (param.setTargetAtTime) param.setTargetAtTime(value, now, smooth);
  else param.value = value;
};

export function applyClipFx(chain, clip, { now = 0, smooth = .02 } = {}) {
  const bypass = !!clip.bypass, eq = clip.eq || {}, comp = clip.compressor || {};
  setParam(chain.eq[0].gain, bypass ? 0 : (eq.low || 0), now, smooth);
  setParam(chain.eq[1].gain, bypass ? 0 : (eq.mid || 0), now, smooth);
  setParam(chain.eq[2].gain, bypass ? 0 : (eq.high || 0), now, smooth);
  setParam(chain.comp.threshold, comp.enabled ? comp.threshold : 0, now, smooth);
  setParam(chain.comp.ratio, comp.enabled ? comp.ratio : 1, now, smooth);
  setParam(chain.delay.delayTime, .12 + (clip.echo || 0) * .35, now, smooth);
  setParam(chain.echo.gain, bypass ? 0 : (clip.echo || 0) * .35, now, smooth);
  setParam(chain.reverb.gain, bypass ? 0 : (clip.reverb || 0) * .45, now, smooth);
}

// Envelope points in plain data so the maths can be unit-tested without Web Audio.
export function gainEnvelope({ when = 0, dur, gain, fadeIn = 0, fadeOut = 0, local = 0 }) {
  const start = Math.max(0, when), end = Math.max(start, start + Math.max(0, dur)), points = [];
  const initial = fadeIn > local ? gain * Math.max(0, local / fadeIn) : gain;
  points.push({ time: start, value: initial, ramp: false });
  if (fadeIn > local) points.push({ time: Math.min(end, start + (fadeIn - local)), value: gain, ramp: true });
  if (fadeOut > 0 && dur > 0) {
    const outStart = Math.max(start, end - fadeOut);
    if (outStart > start) points.push({ time: outStart, value: gain, ramp: false });
    points.push({ time: end, value: 0, ramp: true });
  } else points.push({ time: end, value: gain, ramp: false });
  return points;
}

export function applyEnvelope(param, env) {
  for (const point of env) {
    if (point.ramp && param.linearRampToValueAtTime) param.linearRampToValueAtTime(point.value, point.time);
    else if (param.setValueAtTime) param.setValueAtTime(point.value, point.time);
    else param.value = point.value;
  }
}

export function createTrackBus(ctx, track) {
  const input = ctx.createGain(), pan = ctx.createStereoPanner(), analyser = ctx.createAnalyser();
  input.connect(pan).connect(analyser);
  const apply = (mixer = {}) => {
    input.gain.value = clamp(mixer.volume ?? 1, 0, 2);
    pan.pan.value = clamp(mixer.pan || 0, -1, 1);
  };
  apply(track.mixer);
  return { input, output: analyser, analyser, apply };
}

export function createMixer(ctx, project, { reverbSeed = 0x5eed } = {}) {
  const master = ctx.createGain(), limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = .003;
  limiter.release.value = .1;
  master.connect(limiter).connect(ctx.destination);
  const buses = new Map();
  for (const track of (project.tracks || []).filter((t) => t.kind === 'audio')) {
    const bus = createTrackBus(ctx, track);
    bus.output.connect(master);
    buses.set(track.id, bus);
  }
  return { master, limiter, buses, reverbSeed };
}

export function clipGain(clip, track, duck = 1) {
  return clamp((clip.gain ?? 1) * (clip.volume ?? 1) * (track?.mixer?.volume ?? 1) * duck, 0, 2);
}

export function clipPan(clip, track) {
  return clamp((clip.pan || 0) + (track?.mixer?.pan || 0), -1, 1);
}

// Build and start one clip. Returns a handle with stop(); `when` is context time.
export function startBufferClip(ctx, mixer, clip, event, buffer, when) {
  const bus = mixer.buses.get(event.trackId);
  if (!bus) return null;
  const chain = createClipChain(ctx, { reverbSeed: mixer.reverbSeed });
  applyClipFx(chain, clip, { now: ctx.currentTime });
  chain.input.connect(bus.input);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = clipSpeed(clip);
  source.loop = !!event.loop;
  if (source.loop) {
    source.loopStart = event.loopStart ?? event.offset;
    source.loopEnd = Math.max(source.loopStart + .01, event.loopEnd ?? event.offset + event.srcDur);
  }
  source.connect(chain.input);
  applyEnvelope(chain.gain.gain, gainEnvelope({
    when, dur: event.dur, gain: event.gain, fadeIn: event.fadeIn, fadeOut: event.fadeOut, local: event.localOffset,
  }));
  chain.pan.pan.value = event.pan;
  source.start(when, event.offset, Math.max(.01, event.srcDur));
  return { source, chain, stop() { try { source.stop(); } catch { /* already stopped */ } } };
}

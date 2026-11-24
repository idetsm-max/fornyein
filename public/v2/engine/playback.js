// Audio clock for preview and export. planSchedule() is pure: it turns a project
// and a time into the list of buffer plays that must happen, which keeps the
// maths testable and makes preview and export share the same decisions.
import { findClip } from './model.js';
import { clipMediaId, clipSpeed, sourceRange } from './clip.js';
import { loadMedia } from './storage.js';
import {
  createMixer, createClipChain, applyClipFx, applyEnvelope, gainEnvelope, clipGain, clipPan, startBufferClip,
} from './audio-graph.js';

const ELEMENT_LIMIT = 25 * 1024 * 1024;
const DRIFT_LIMIT = 0.12;

function voiceOverlaps(project, clip) {
  for (const track of project.tracks || []) {
    if (track.kind !== 'audio' || track.muted || track.hidden) continue;
    for (const other of track.clips || []) {
      if (other.role !== 'voice') continue;
      if (other.start < clip.start + clip.dur && other.start + other.dur > clip.start) return true;
    }
  }
  return false;
}

export function planSchedule(project, t = 0, { lookahead = Infinity } = {}) {
  const tracks = (project.tracks || []).filter((tr) => tr.kind === 'audio' && !tr.muted && !tr.hidden);
  const soloed = tracks.some((tr) => tr.solo);
  const events = [];
  for (const track of tracks) {
    if (soloed && !track.solo) continue;
    for (const clip of track.clips || []) {
      const end = clip.start + clip.dur;
      if (end <= t) continue;
      const startAt = Math.max(t, clip.start);
      if (startAt > t + lookahead) continue;
      const { in: tin, out: tout } = sourceRange(clip);
      const speed = clipSpeed(clip), localOffset = startAt - clip.start;
      const span = Math.max(0.01, tout - tin);
      let offset = tin + localOffset * speed;
      if (clip.loop) offset = tin + (localOffset * speed) % span;
      const srcLeft = clip.loop ? span : Math.max(0, tout - offset);
      const srcDur = Math.min(srcLeft, (end - startAt) * speed);
      if (srcDur <= 0) continue;
      const duck = clip.role === 'music' && track.mixer?.ducking && voiceOverlaps(project, clip) ? 0.35 : 1;
      events.push({
        clipId: clip.id, trackId: track.id, when: startAt - t, offset, localOffset,
        dur: srcDur / speed, srcDur, speed, loop: !!clip.loop, loopStart: tin, loopEnd: tout,
        fadeIn: clip.fade?.in || 0, fadeOut: clip.fade?.out || 0,
        gain: clipGain(clip, track, duck), pan: clipPan(clip, track),
      });
    }
  }
  return events;
}

export function fadeAt(event, local = event.localOffset) {
  const fadeIn = event.fadeIn || 0, fadeOut = event.fadeOut || 0;
  const inGain = fadeIn > 0 ? Math.min(1, Math.max(0, local / fadeIn)) : 1;
  const remaining = event.localOffset + event.dur - local;
  const outGain = fadeOut > 0 ? Math.min(1, Math.max(0, remaining / fadeOut)) : 1;
  return Math.min(inGain, outGain);
}

async function startElementClip(ctx, mixer, clip, event, blob) {
  const bus = mixer.buses.get(event.trackId);
  if (!bus) return null;
  const element = new Audio(URL.createObjectURL(blob));
  element.crossOrigin = 'anonymous';
  element.preload = 'auto';
  const chain = createClipChain(ctx, { reverbSeed: mixer.reverbSeed });
  const meta = mixer.media?.[clip.src?.mediaId] || {};
  applyClipFx(chain, clip, { now: ctx.currentTime + event.when + 0.03, peaks: meta.peaks || [], mediaDur: meta.dur || 0, offset: event.offset || 0, dur: event.srcDur });
  chain.input.connect(bus.input);
  chain.pan.pan.value = event.pan;
  const source = ctx.createMediaElementSource(element);
  source.connect(chain.input);
  element.currentTime = event.offset;
  const when = ctx.currentTime + event.when + 0.03;
  applyEnvelope(chain.gain.gain, gainEnvelope({
    when, dur: event.dur, gain: event.gain, fadeIn: event.fadeIn, fadeOut: event.fadeOut, local: event.localOffset,
  }));
  const timer = setTimeout(() => { element.play().catch(() => {}); }, Math.max(0, (when - ctx.currentTime) * 1000));
  return {
    stop() {
      clearTimeout(timer);
      element.pause();
      try { source.disconnect(); } catch { /* already disconnected */ }
      URL.revokeObjectURL(element.src);
    },
  };
}

export function createPlaybackEngine(transport, getProject, store) {
  let ctx = null, mixer = null, handles = [], cache = new Map(), token = 0;
  let wasPlaying = false, lastT = 0, lastTick = 0, editTimer = null, disposed = false, scrubTimer = 0;

  const ensure = () => {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctor();
      mixer = createMixer(ctx, getProject());
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };
  const stopAll = () => { for (const handle of handles) handle.stop?.(); handles = []; };
  const refreshBuses = () => {
    const project = getProject();
    for (const [id, bus] of mixer?.buses || []) bus.apply(project.tracks.find((t) => t.id === id)?.mixer);
  };

  async function scheduleFrom(t, { window: win = Infinity } = {}) {
    const mine = ++token, ac = ensure();
    stopAll();
    refreshBuses();
    const project = getProject(), events = planSchedule(project, t, { lookahead: win });
    let scheduled = 0;
    for (const event of events) {
      const found = findClip(project, event.clipId);
      if (!found) continue;
      const clip = found.clip, mediaId = clipMediaId(clip);
      try {
        let buffer = cache.get(mediaId);
        if (!buffer) {
          const blob = await loadMedia(mediaId);
          if (!blob) continue;
          if (blob.size > ELEMENT_LIMIT) {
            const handle = await startElementClip(ac, mixer, clip, event, blob);
            if (mine !== token) { handle?.stop?.(); return; }
            if (handle) { handles.push(handle); scheduled++; }
            continue;
          }
          buffer = await ac.decodeAudioData(await blob.arrayBuffer());
          cache.set(mediaId, buffer);
        }
        if (mine !== token) return;
        const handle = startBufferClip(ac, mixer, clip, event, buffer, ac.currentTime + event.when + 0.03);
        if (handle) { handles.push(handle); scheduled++; }
      } catch (error) {
        console.warn('playback: clip skipped', clip.id, error?.message || error);
      }
    }
    window.__fnPlayback = { scheduled, active: true, ctxState: ac.state, at: performance.now() };
  }

  const unsubTransport = transport.subscribe(() => {
    if (disposed) return;
    const now = performance.now(), dt = Math.min(0.25, (now - lastTick) / 1000);
    lastTick = now;
    const t = transport.t, playing = transport.playing;
    if (playing && !wasPlaying) {
      wasPlaying = true;
      scheduleFrom(t);
    } else if (!playing && wasPlaying) {
      wasPlaying = false;
      stopAll();
      window.__fnPlayback = { ...(window.__fnPlayback || {}), active: false };
    } else if (playing && Math.abs(t - (lastT + dt)) > DRIFT_LIMIT) {
      scheduleFrom(t);
    }
    lastT = t;
  });

  let lastProject = store?.get().project;
  const unsubStore = store?.subscribe(() => {
    const project = store.get().project;
    if (project === lastProject) return;
    lastProject = project;
    if (!transport.playing) return;
    clearTimeout(editTimer);
    editTimer = setTimeout(() => { if (transport.playing && !disposed) scheduleFrom(transport.t); }, 120);
  });

  const onVisibility = () => { if (document.hidden && transport.playing) transport.pause(); };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    getMeters() {
      const out = {};
      for (const [id, bus] of mixer?.buses || []) {
        const data = new Uint8Array(bus.analyser.frequencyBinCount);
        bus.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const value of data) sum += ((value - 128) / 128) ** 2;
        out[id] = Math.sqrt(sum / data.length);
      }
      return out;
    },
    reschedule: () => scheduleFrom(transport.t),
    scrub(t) {
      if (disposed || transport.playing) return;
      clearTimeout(scrubTimer);
      scheduleFrom(t, { window: 0.14 });
      scrubTimer = setTimeout(stopAll, 170);
    },
    dispose() {
      disposed = true;
      clearTimeout(editTimer);
      clearTimeout(scrubTimer);
      unsubTransport?.();
      unsubStore?.();
      document.removeEventListener('visibilitychange', onVisibility);
      stopAll();
      cache.clear();
      ctx?.close?.().catch(() => {});
      ctx = null;
      mixer = null;
    },
  };
}

export async function renderOfflineAudio(project, config, { sampleRate = 48000, onProgress = () => {}, signal } = {}) {
  if (typeof OfflineAudioContext === 'undefined') throw new Error('OfflineAudioContext is not available');
  const duration = Math.max(0.1, config.duration);
  const offline = new OfflineAudioContext(2, Math.max(1, Math.ceil(duration * sampleRate)), sampleRate);
  const mixer = createMixer(offline, project);
  const events = planSchedule(project, 0, { lookahead: duration + 1 });
  const cache = new Map();
  let done = 0;
  for (const event of events) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
    const found = findClip(project, event.clipId);
    if (!found) continue;
    const clip = found.clip, mediaId = clipMediaId(clip);
    try {
      let buffer = cache.get(mediaId);
      if (!buffer) {
        const blob = await loadMedia(mediaId);
        if (!blob) continue;
        buffer = await offline.decodeAudioData(await blob.arrayBuffer());
        cache.set(mediaId, buffer);
      }
      startBufferClip(offline, mixer, clip, event, buffer, event.when);
    } catch (error) {
      console.warn('export: clip skipped', clip.id, error?.message || error);
    }
    done++;
    onProgress(done / Math.max(1, events.length));
  }
  return offline.startRendering();
}

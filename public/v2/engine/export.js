import { newProject, RATIOS } from './model.js';
import { drawFrame } from './render.js';
import { loadMedia } from './storage.js';

export const EXPORT_PRESETS = {
  '720p': { width: 1280, height: 720, fps: 30, label: '720p' },
  '1080p': { width: 1920, height: 1080, fps: 30, label: '1080p' },
  '9:16': { width: 1080, height: 1920, fps: 30, label: '9:16' },
  '1:1': { width: 1080, height: 1080, fps: 30, label: '1:1' },
};

export function exportConfig(project, preset = '720p') {
  const p = EXPORT_PRESETS[preset] || EXPORT_PRESETS['720p'];
  const ratio = project?.size && RATIOS[project.size];
  const clips = (project?.tracks || []).flatMap((track) => track.clips || []);
  return {
    ...p,
    width: ratio && preset === 'project' ? ratio[0] : p.width,
    height: ratio && preset === 'project' ? ratio[1] : p.height,
    duration: Math.max(0, ...clips.map((clip) => clip.start + clip.dur)),
  };
}

export function exportCapabilities() {
  return {
    webCodecs: typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined',
    offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    worker: typeof Worker !== 'undefined',
    fileSystemAccess: typeof showSaveFilePicker === 'function',
  };
}

export function validateExportConfig(project, preset = '720p') {
  const config = exportConfig(project, preset), errors = [];
  if (!Number.isInteger(config.width) || !Number.isInteger(config.height) || config.width < 2 || config.height < 2) {
    errors.push('Invalid export dimensions');
  }
  if (!Number.isFinite(config.fps) || config.fps <= 0) errors.push('Invalid frame rate');
  if (!Number.isFinite(config.duration) || config.duration < 0) errors.push('Invalid duration');
  const frames = Math.ceil(config.duration * config.fps);
  return { ok: errors.length === 0, errors, config, frames, minutes: config.duration / 60 };
}

export async function saveExportResult(result, filename = 'fornyein.mp4') {
  const type = filename.endsWith('.webm') ? 'video/webm' : 'video/mp4';
  if (typeof showSaveFilePicker === 'function' && result?.buffer) {
    const extension = filename.endsWith('.webm') ? '.webm' : '.mp4';
    const handle = await showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: type === 'video/webm' ? 'WebM video' : 'MP4 video',
        accept: { [type]: [extension] },
      }],
    });
    const writable = await handle.createWritable();
    await writable.write(result.buffer);
    await writable.close();
    return 'filesystem';
  }
  const blob = result?.blob || new Blob([result?.buffer], { type });
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'download';
}

export function createCanvasFrameRenderer(project, config, { canvas } = {}) {
  const cv = canvas || (typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(config.width, config.height)
    : document.createElement('canvas'));
  cv.width = config.width;
  cv.height = config.height;
  const ctx = cv.getContext('2d');
  return {
    canvas: cv,
    async render(time) {
      drawFrame(ctx, config.width, config.height, project, time);
      return cv;
    },
    async videoFrame(time) {
      drawFrame(ctx, config.width, config.height, project, time);
      if (typeof VideoFrame === 'undefined') throw new Error('VideoFrame is not available');
      return new VideoFrame(cv, {
        timestamp: Math.round(time * 1_000_000),
        duration: Math.round(1_000_000 / config.fps),
        visibleRect: { x: 0, y: 0, width: config.width, height: config.height },
      });
    },
  };
}

export async function renderOfflineAudio(project, config, {
  sampleRate = 48000, onProgress = () => {}, signal,
} = {}) {
  if (typeof OfflineAudioContext === 'undefined') throw new Error('OfflineAudioContext is not available');
  const clips = (project.tracks || [])
    .filter((track) => track.kind === 'audio' && !track.muted && !track.hidden)
    .flatMap((track) => track.clips.map((clip) => ({ ...clip, track })));
  const length = Math.max(1, Math.ceil(config.duration * sampleRate));
  const offline = new OfflineAudioContext(2, length, sampleRate);
  const voice = clips.filter((clip) => clip.role === 'voice')
    .map((clip) => [clip.start, clip.start + clip.dur]);
  const overlapsVoice = (clip) => voice.some(([start, end]) =>
    clip.role === 'music' && start < clip.start + clip.dur && end > clip.start);
  let done = 0;
  for (const clip of clips) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
    const blob = await loadMedia(project.media?.[clip.mediaId]?.id || clip.mediaId);
    if (!blob) {
      done++;
      onProgress(done / Math.max(1, clips.length));
      continue;
    }
    const decoded = await offline.decodeAudioData(await blob.arrayBuffer());
    const source = offline.createBufferSource();
    source.buffer = decoded;
    const gain = offline.createGain(), pan = offline.createStereoPanner();
    const duck = overlapsVoice(clip) && clip.track.mixer?.ducking ? .35 : 1;
    const amount = Math.max(0, Math.min(2,
      (clip.gain ?? 1) * (clip.volume ?? 1) * (clip.track.mixer?.volume ?? 1) * duck));
    gain.gain.setValueAtTime(0, clip.start);
    const fadeIn = clip.fade?.in || 0, fadeOut = clip.fade?.out || 0;
    gain.gain.linearRampToValueAtTime(amount, clip.start + (fadeIn || .001));
    if (fadeOut) {
      gain.gain.setValueAtTime(amount, Math.max(
        clip.start + (fadeIn || .001), clip.start + clip.dur - fadeOut));
      gain.gain.linearRampToValueAtTime(0, clip.start + clip.dur);
    } else {
      gain.gain.setValueAtTime(amount, clip.start + clip.dur);
    }
    pan.pan.value = Math.max(-1, Math.min(1,
      (clip.pan || 0) + (clip.track.mixer?.pan || 0)));
    source.connect(gain).connect(pan).connect(offline.destination);
    source.start(clip.start, 0, Math.min(decoded.duration, clip.dur));
    done++;
    onProgress(done / Math.max(1, clips.length));
  }
  return offline.startRendering();
}

export function normalizeImportedProject(input) {
  const source = typeof input === 'string' ? JSON.parse(input) : input;
  const base = newProject();
  if (!source || typeof source !== 'object') return base;
  const tracks = Array.isArray(source.tracks) && source.tracks.length
    ? source.tracks.map((track, index) => ({
      id: track.id || `trk-import-${index}`,
      kind: track.kind || (index === 0 ? 'text' : 'audio'),
      name: track.name || 'Imported',
      hidden: !!track.hidden,
      locked: !!track.locked,
      muted: !!track.muted,
      mixer: { volume: 1, pan: 0, bypass: false, ducking: false, ...(track.mixer || {}) },
      clips: Array.isArray(track.clips) ? track.clips.map((clip) => {
        const rawDur = Number(clip.dur);
        return {
          ...clip,
          id: clip.id || `clip-import-${index}`,
          start: Math.max(0, Number(clip.start) || 0),
          dur: Math.max(.1, Number.isFinite(rawDur) ? rawDur : 1),
        };
      }) : [],
    }))
    : base.tracks;
  return {
    ...base,
    ...source,
    version: 3,
    media: { ...(source.media || {}) },
    tracks,
  };
}

export function createExportJob(project, preset = '720p', {
  onProgress = () => {}, signal,
} = {}) {
  const config = exportConfig(project, preset);
  let cancelled = false;
  return {
    config,
    cancel() { cancelled = true; },
    async run(renderFrame) {
      const total = Math.max(1, Math.ceil(config.duration * config.fps));
      for (let index = 0; index < total; index++) {
        if (cancelled || signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
        await renderFrame(index / config.fps, config);
        onProgress((index + 1) / total);
      }
      return { cancelled: false, frames: total, config };
    },
  };
}

export async function createWebCodecsJob(project, preset = '720p', {
  onProgress = () => {}, signal, codec = 'avc1.4d401f', bitrate = 6_000_000,
} = {}) {
  if (!exportCapabilities().webCodecs) throw new Error('WebCodecs VideoEncoder is not available');
  const config = exportConfig(project, preset), chunks = [];
  let cancelled = false, encoder;
  const supported = await VideoEncoder.isConfigSupported({
    codec, width: config.width, height: config.height, bitrate, framerate: config.fps,
  });
  if (!supported.supported) throw new Error(`Unsupported WebCodecs configuration: ${codec}`);
  encoder = new VideoEncoder({
    output(chunk, metadata) { chunks.push({ chunk, metadata }); },
    error(error) { chunks.error = error; },
  });
  encoder.configure({
    codec, width: config.width, height: config.height, bitrate,
    framerate: config.fps, latencyMode: 'quality',
  });
  return {
    config,
    codec,
    chunks,
    cancel() { cancelled = true; },
    async run(renderFrame) {
      const total = Math.max(1, Math.ceil(config.duration * config.fps));
      for (let index = 0; index < total; index++) {
        if (cancelled || signal?.aborted) {
          encoder.close();
          throw new DOMException('Export cancelled', 'AbortError');
        }
        const source = await renderFrame(index / config.fps, config);
        if (!source) continue;
        const frame = source instanceof VideoFrame ? source : new VideoFrame(source, {
          timestamp: Math.round(index * 1_000_000 / config.fps),
          duration: Math.round(1_000_000 / config.fps),
          visibleRect: { x: 0, y: 0, width: config.width, height: config.height },
        });
        encoder.encode(frame, { keyFrame: index === 0 || index % (config.fps * 2) === 0 });
        if (frame !== source) frame.close();
        else source.close?.();
        await encoder.flush();
        onProgress((index + 1) / total);
      }
      await encoder.flush();
      encoder.close();
      if (chunks.error) throw chunks.error;
      return { codec, chunks, frames: total, config, container: 'elementary-video-chunks' };
    },
  };
}

export async function selectAudioCodec(mb, outputFormat, {
  format = 'mp4', sampleRate = 48000, numberOfChannels = 2, bitrate = 128_000,
} = {}) {
  const containerCodecs = outputFormat.getSupportedAudioCodecs?.() || [];
  const preferred = format === 'webm' ? ['opus'] : ['aac', 'opus'];
  const candidates = preferred.filter((codec) => containerCodecs.includes(codec));
  if (!candidates.length) return null;
  const quality = typeof mb.Quality === 'function' ? new mb.Quality({ bitrate }) : undefined;
  const config = { sampleRate, numberOfChannels };
  if (quality) config.quality = quality;
  if (typeof mb.getFirstEncodableAudioCodec === 'function') {
    const selected = await mb.getFirstEncodableAudioCodec(candidates, config);
    return candidates.includes(selected) ? selected : null;
  }
  const encoder = globalThis.AudioEncoder;
  if (typeof encoder?.isConfigSupported !== 'function') return null;
  for (const codec of candidates) {
    const codecString = codec === 'aac' ? 'mp4a.40.2' : codec;
    const support = await encoder.isConfigSupported({
      codec: codecString, sampleRate, numberOfChannels, bitrate,
    });
    if (support.supported) return codec;
  }
  return null;
}

export async function createMediabunnyJob(project, preset = '720p', {
  onProgress = () => {}, signal, format = 'mp4', bitrate = 6_000_000,
  audioBitrate = 128_000, canvas,
} = {}) {
  const config = exportConfig(project, preset);
  const mb = await import('https://cdn.jsdelivr.net/npm/mediabunny@1/+esm');
  const outputFormat = format === 'webm'
    ? new mb.WebMOutputFormat()
    : new mb.Mp4OutputFormat();
  const output = new mb.Output({ format: outputFormat, target: new mb.BufferTarget() });
  const renderer = createCanvasFrameRenderer(project, config, { canvas });
  const videoSource = new mb.CanvasSource(renderer.canvas, {
    codec: format === 'webm' ? 'vp9' : 'avc', bitrate,
  });
  let cancelled = false, ran = false;
  const job = {
    config,
    format,
    cancel() { cancelled = true; },
    async run() {
      if (ran) throw new Error('Export job can only run once');
      ran = true;
      const total = Math.max(1, Math.ceil(config.duration * config.fps));
      const audioTracks = (project.tracks || []).filter((track) =>
        track.kind === 'audio' && !track.muted && !track.hidden && track.clips.length);
      try {
        const audio = audioTracks.length
          ? await renderOfflineAudio(project, config, {
            signal,
            onProgress: (progress) => onProgress(progress * .1),
          })
          : null;
        if (cancelled || signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
        let audioSource = null;
        if (audio) {
          const codec = await selectAudioCodec(mb, outputFormat, {
            format,
            sampleRate: audio.sampleRate,
            numberOfChannels: audio.numberOfChannels,
            bitrate: audioBitrate,
          });
          if (!codec) throw new Error(`No supported audio encoder for ${format.toUpperCase()}`);
          const quality = new mb.Quality({ bitrate: audioBitrate });
          audioSource = new mb.AudioBufferSource({ codec, quality });
        }
        output.addVideoTrack(videoSource, { frameRate: config.fps });
        if (audioSource) output.addAudioTrack(audioSource);
        await output.start();
        if (audioSource) {
          await audioSource.add(audio);
          await audioSource.close();
        }
        for (let index = 0; index < total; index++) {
          if (cancelled || signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
          await renderer.render(index / config.fps);
          await videoSource.add(index / config.fps, 1 / config.fps);
          onProgress(.1 + ((index + 1) / total) * .9);
        }
        await videoSource.close();
        await output.finalize();
        const buffer = output.target.buffer;
        const mime = format === 'webm' ? 'video/webm' : 'video/mp4';
        return {
          config, format, frames: total, audio: !!audio, buffer,
          blob: new Blob([buffer], { type: mime }),
        };
      } catch (error) {
        throw error;
      }
    },
  };
  return job;
}

// E2E for S4 (audio clock) and S6 (preview/export share one graph):
//   BASE=http://localhost:8765 PUPPETEER=puppeteer-core CHROME=/usr/bin/chromium node public/v2/tests/e2e/audio.js
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const { wavFile } = require('./_media.js');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0; const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME,
    args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    window.__seeks = 0;
    const proto = HTMLMediaElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'currentTime');
    Object.defineProperty(proto, 'currentTime', {
      configurable: true,
      get: desc.get,
      set(value) { window.__seeks++; return desc.set.call(this, value); },
    });
  });

  const input = await page.$('.media input[type=file]');
  await input.uploadFile(wavFile(4)); await sleep(600);

  await page.evaluate(() => document.querySelector('.playbtn').click());
  await sleep(1200);
  const state = await page.evaluate(() => window.__fnPlayback || null);
  ok('playback schedules the audio clip', state && state.scheduled >= 1, JSON.stringify(state));
  ok('playback is still active after 1.2 s', state && state.active === true, JSON.stringify(state));
  ok('AudioContext is running', state && state.ctxState === 'running', state && state.ctxState);
  ok('playback does not seek the media element', (await page.evaluate(() => window.__seeks)) === 0, String(await page.evaluate(() => window.__seeks)));

  await page.evaluate(() => document.querySelector('.playbtn').click());
  await sleep(200);
  ok('pause stops the sources', (await page.evaluate(() => window.__fnPlayback?.active)) === false);
  ok('time advanced while playing', !/^00:00:00:00/.test(await page.evaluate(() => document.querySelector('.tcode').textContent)));

  const parity = await page.evaluate(async () => {
    const { createMixer, startBufferClip } = await import('/v2/engine/audio-graph.js');
    const render = async () => {
      const ctx = new OfflineAudioContext(2, 48000, 48000);
      const project = { tracks: [{ id: 'a', kind: 'audio', mixer: { volume: 0.9, pan: 0.2 }, clips: [] }] };
      const mixer = createMixer(ctx, project);
      const buffer = ctx.createBuffer(1, 24000, 48000);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.sin((i / 48000) * 2 * Math.PI * 220) * 0.5;
      const clip = {
        id: 'c', src: { mediaId: 'm', in: 0, out: 0.5 }, speed: 1, gain: 1, volume: 1, pan: 0,
        fade: { in: 0.1, out: 0.1 }, eq: { low: 3, mid: -2, high: 4 },
        compressor: { enabled: true, threshold: -20, ratio: 4 }, echo: 0.2, reverb: 0.3,
      };
      const event = {
        clipId: 'c', trackId: 'a', when: 0.1, offset: 0, localOffset: 0, dur: 0.5, srcDur: 0.5,
        gain: 1, pan: 0, fadeIn: 0.1, fadeOut: 0.1, loop: false,
      };
      startBufferClip(ctx, mixer, clip, event, buffer, event.when);
      return (await ctx.startRendering()).getChannelData(0).slice();
    };
    const a = await render(), b = await render();
    let peak = 0, sum = 0, diff = 0;
    for (let i = 0; i < a.length; i++) {
      peak = Math.max(peak, Math.abs(a[i]));
      sum += a[i] * a[i];
      diff = Math.max(diff, Math.abs(a[i] - b[i]));
    }
    return { peak, rms: Math.sqrt(sum / a.length), diff };
  });
  ok('shared graph produces audio', parity.rms > 0.02, JSON.stringify(parity));
  ok('limiter keeps the output under 0 dBFS', parity.peak < 1, String(parity.peak));
  ok('two renders are bit-identical', parity.diff < 1e-6, String(parity.diff));

  ok('no page errors', errors.length === 0, JSON.stringify(errors));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

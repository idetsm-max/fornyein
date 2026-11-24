// E2E for export audio parity (B6): the offline mixdown must follow the same
// mixer state as preview — track volume, mute, pan and clip gain.
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const { wavFile } = require('./_media.js');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.setItem('fn.tour.v1', '1'); localStorage.removeItem('fn.recovery.v1'); });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(300);
  const input = await page.$('.media input[type=file]');
  await input.uploadFile(wavFile(2)); await sleep(800);

  await page.evaluate(async () => {
    const mod = await import('/v2/engine/playback.js');
    const peakOf = (data, from = 0) => {
      let p = 0;
      for (let i = from; i < data.length; i++) p = Math.max(p, Math.abs(data[i]));
      return +p.toFixed(4);
    };
    window.__mixdown = async (mutate, duration = 1.2) => {
      const project = structuredClone(window.__store.get().project);
      mutate?.(project);
      const buf = await mod.renderOfflineAudio(project, { duration });
      const left = buf.getChannelData(0), right = buf.getChannelData(1);
      const tailFrom = Math.max(0, Math.floor((duration - 0.35) * buf.sampleRate));
      return { left: peakOf(left), right: peakOf(right), last: Math.max(peakOf(left, tailFrom), peakOf(right, tailFrom)) };
    };
    window.__clip = (patch) => window.__mixdown((p) => Object.assign(p.tracks.find((t) => t.kind === 'audio').clips[0], patch));
  });

  const base = await page.evaluate(() => window.__mixdown());
  ok('offline mixdown renders the clip', base.left > 0.1 && base.left < 0.25, JSON.stringify(base));
  ok('the tone is centred before any pan', Math.abs(base.left - base.right) < 0.01, JSON.stringify(base));

  const half = await page.evaluate(() => window.__mixdown((p) => { p.tracks.find((t) => t.kind === 'audio').mixer.volume = 0.5; }));
  ok('track volume halves the exported level', Math.abs(half.left / base.left - 0.5) < 0.06, (half.left / base.left).toFixed(3));

  const muted = await page.evaluate(() => window.__mixdown((p) => { p.tracks.find((t) => t.kind === 'audio').muted = true; }));
  ok('a muted track exports silence', muted.left < 0.001 && muted.right < 0.001, JSON.stringify(muted));

  const panned = await page.evaluate(() => window.__mixdown((p) => { p.tracks.find((t) => t.kind === 'audio').mixer.pan = -1; }));
  ok('track pan moves the export to the left channel', panned.right < 0.02 && panned.left > base.left * 0.7, JSON.stringify(panned));

  const boosted = await page.evaluate(() => window.__mixdown((p) => {
    p.tracks.find((t) => t.kind === 'audio').clips[0].gain = 2;
  }));
  ok('clip gain is applied in the export', boosted.left > base.left * 1.6, `${base.left} → ${boosted.left}`);

  const clipPan = await page.evaluate(() => window.__mixdown((p) => {
    p.tracks.find((t) => t.kind === 'audio').clips[0].pan = -1;
  }));
  ok('clip pan is applied in the export',
    clipPan.right < 0.02 && clipPan.left > base.left * 0.7, JSON.stringify(clipPan));

  const bypass = await page.evaluate(() => window.__mixdown((p) => {
    p.tracks.find((t) => t.kind === 'audio').clips[0].gain = 0.5;
  }));
  ok('clip gain also works downwards', Math.abs(bypass.left / base.left - 0.5) < 0.06, (bypass.left / base.left).toFixed(3));

  const hp = await page.evaluate(() => window.__clip({ highpass: 1200 }));
  ok('clip high-pass removes the low tone', hp.left < base.left * 0.5, `${base.left} → ${hp.left}`);

  const eq = await page.evaluate(() => window.__clip({ eq: { low: 12 } }));
  ok('clip EQ low shelf lifts the tone', eq.left > base.left * 1.4, `${base.left} → ${eq.left}`);

  const bypassed = await page.evaluate(() => window.__clip({ eq: { low: 12 }, bypass: true }));
  ok('bypass ignores the clip EQ', Math.abs(bypassed.left - base.left) < 0.02, JSON.stringify(bypassed));

  const gated = await page.evaluate(() => window.__clip({ noiseGate: { enabled: true, threshold: 0.5 } }));
  ok('the noise gate closes on quiet material', gated.left < 0.01, JSON.stringify(gated));

  // Chromium's compressor adds makeup gain, so the check is that it changes
  // the level rather than that it lowers it.
  const compressed = await page.evaluate(() => window.__clip({ compressor: { enabled: true, threshold: -34, ratio: 20 } }));
  ok('the compressor changes the output level',
    Math.abs(compressed.left / base.left - 1) > 0.2, `${base.left} → ${compressed.left}`);

  const dry = await page.evaluate(() => window.__mixdown(undefined, 2.6));
  ok('nothing rings after the clip by default', dry.last < 0.01, JSON.stringify(dry));

  const echo = await page.evaluate(() => window.__clip({ echo: 1 }) || null);
  ok('clip echo writes a tail after the clip', !!echo);
  const echoTail = await page.evaluate(() => window.__mixdown((p) => {
    p.tracks.find((t) => t.kind === 'audio').clips[0].echo = 1;
  }, 2.6));
  ok('echo and reverb ring past the clip end', echoTail.last > 0.01, JSON.stringify(echoTail));

  ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

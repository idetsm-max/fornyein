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
    window.__mixdown = async (mutate) => {
      const project = structuredClone(window.__store.get().project);
      mutate?.(project);
      const buf = await mod.renderOfflineAudio(project, { duration: 1.2 });
      const peak = (ch) => {
        const d = buf.getChannelData(ch);
        let p = 0;
        for (let i = 0; i < d.length; i++) p = Math.max(p, Math.abs(d[i]));
        return +p.toFixed(4);
      };
      return { left: peak(0), right: peak(1) };
    };
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

  ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

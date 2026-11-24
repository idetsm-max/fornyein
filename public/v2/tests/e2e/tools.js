// E2E for U7/U8/U9/U13: tool panels, keyframes, safe area, a11y.
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) failed++;
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROME || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
  await sleep(300);

  ok('no horizontal overflow at 1280x720', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok('rail exposes pressed state', (await page.evaluate(() => document.querySelectorAll('.railbtn[aria-pressed]').length)) === 10);

  for (const title of ['Audio', 'Stickers', 'Effects', 'Transitions', 'Filters', 'Adjust', 'Templates', 'More']) {
    await page.click(`.railbtn[aria-label="${title}"]`); await sleep(120);
    const text = await page.evaluate(() => document.querySelector('.panel.tools .phead b')?.textContent || '');
    ok(`${title} panel opens`, text.length > 0, text);
  }

  await page.click('.railbtn[aria-label="Stickers"]'); await sleep(150);
  const before = await page.evaluate(() => document.querySelectorAll('.clip').length);
  await page.click('.stickerbtn'); await sleep(250);
  const after = await page.evaluate(() => document.querySelectorAll('.clip').length);
  ok('sticker adds a clip', after === before + 1, `${before}->${after}`);
  ok('sticker confirms with a toast', (await page.evaluate(() => document.querySelectorAll('.toast').length)) >= 1);

  await page.click('.railbtn[aria-label="Text"]'); await sleep(150);
  const hasKf = await page.evaluate(() => !!document.querySelector('.kfrow .btn'));
  ok('inspector shows keyframe controls', hasKf);
  await page.click('.kfrow .btn'); await sleep(250);
  ok('keyframe diamond appears on the clip', (await page.evaluate(() => document.querySelectorAll('.kfdot').length)) >= 1);

  await page.click('.railbtn[aria-label="Effects"]'); await sleep(120);
  await page.click('.panel.tools .fxtile'); await sleep(200);
  ok('effect tile toggles on', (await page.evaluate(() => document.querySelectorAll('.panel.tools .fxtile.on').length)) >= 1);

  await page.evaluate(() => window.__store.edit((d) => {
    d.media = d.media || {};
    d.media.vid1 = { id: 'vid1', name: 'test.mp4', kind: 'video', dur: 8 };
    d.tracks.find((t) => t.kind === 'video').clips.push({ id: 'vc1', kind: 'video', start: 0, dur: 4, src: { mediaId: 'vid1', in: 0, out: 4 }, pos: { x: 50, y: 50, scale: 1 } });
  }));
  await sleep(250);
  await page.click('.trow.video .clip'); await sleep(200);
  await page.evaluate(() => [...document.querySelectorAll('.inspector .tab')].find((t) => t.textContent === 'Speed')?.click());
  await sleep(200);
  ok('speed tab shows presets', (await page.evaluate(() => document.querySelectorAll('.speedwrap .chipbtn').length)) >= 6);
  const durBefore = await page.evaluate(() => window.__store.get().project.tracks.find((t) => t.kind === 'video').clips[0].dur);
  await page.evaluate(() => [...document.querySelectorAll('.speedwrap .chipbtn')].find((b) => b.textContent === '2×')?.click());
  await sleep(250);
  const spd = await page.evaluate(() => { const c = window.__store.get().project.tracks.find((t) => t.kind === 'video').clips[0]; return { dur: c.dur, speed: c.speed }; });
  ok('2× halves the clip length', Math.abs(spd.dur - durBefore / 2) < 0.01 && spd.speed === 2, `${durBefore}->${spd.dur} @${spd.speed}`);
  await page.click('.speedwrap .switchrow input'); await sleep(200);
  ok('reverse toggle lands on the clip', (await page.evaluate(() => !!window.__store.get().project.tracks.find((t) => t.kind === 'video').clips[0].reverse)) === true);

  await page.evaluate(() => [...document.querySelectorAll('.inspector .tab')].find((t) => t.textContent === 'Mask')?.click());
  await sleep(200);
  await page.evaluate(() => [...document.querySelectorAll('.speedwrap .chipbtn')].find((b) => b.textContent === 'Ellipse')?.click());
  await sleep(250);
  ok('mask shape lands on the clip', (await page.evaluate(() => window.__store.get().project.tracks.find((t) => t.kind === 'video').clips[0].mask?.shape)) === 'ellipse');
  await page.click('.speedwrap .switchrow input'); await sleep(200);
  ok('mask invert toggles', (await page.evaluate(() => !!window.__store.get().project.tracks.find((t) => t.kind === 'video').clips[0].mask?.invert)) === true);
  await page.click('.trow.text .clip'); await sleep(200);

  await page.click('.railbtn[aria-label="Transitions"]'); await sleep(150);
  ok('transitions panel lists nine options', (await page.evaluate(() => document.querySelectorAll('.panel.tools .fxtile').length)) === 9);
  await page.evaluate(() => [...document.querySelectorAll('.panel.tools .fxtile')].find((b) => b.textContent.includes('Wipe'))?.click());
  await sleep(200);
  ok('picking a transition stores it on the clip', (await page.evaluate(() => window.__store?.get()?.project?.tracks?.find((t) => t.kind === 'text')?.clips?.[0]?.transition?.in)) === 'wipe');

  await page.click('button[title="Safe area"]'); await sleep(150);
  ok('safe area overlay toggles', await page.evaluate(() => !!document.querySelector('.safearea')));
  await page.click('button[title="Safe area"]'); await sleep(120);

  const zoomBefore = await page.evaluate(() => [...document.querySelectorAll('.zoomchip')].map((b) => b.textContent).join('|'));
  await page.click('button[title="Preview zoom in"]'); await sleep(120);
  const zoomAfter = await page.evaluate(() => [...document.querySelectorAll('.zoomchip')].map((b) => b.textContent).join('|'));
  ok('preview zoom changes', zoomBefore !== zoomAfter, zoomBefore + ' -> ' + zoomAfter);

  ok('clips are keyboard reachable', (await page.evaluate(() => document.querySelector('.clip')?.tabIndex)) === 0);
  await page.evaluate(() => [...document.querySelectorAll('.inspector .tab')].find((t) => t.textContent === 'Keys')?.click());
  await sleep(250);
  ok('Keys tab renders the curve editor', await page.evaluate(() => !!document.querySelector('.curve')));
  const dotsBefore = await page.evaluate(() => document.querySelectorAll('.cpt').length);
  const box = await page.$eval('.curve', (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.click(box.x + box.w * 0.7, box.y + box.h * 0.35); await sleep(250);
  const dotsAfter = await page.evaluate(() => document.querySelectorAll('.cpt').length);
  ok('clicking the curve adds a keyframe', dotsAfter > dotsBefore, `${dotsBefore}->${dotsAfter}`);
  ok('curve keys reach the timeline', (await page.evaluate(() => document.querySelectorAll('.kfdot').length)) === dotsAfter);

  await page.evaluate(() => {
    window.__store.edit((d) => {
      d.media = { ...(d.media || {}), aud1: { id: 'aud1', name: 'voice.m4a', kind: 'audio', dur: 8, size: 100, type: 'audio/mp4', peaks: [0.02, 0.03, 0.02] } };
      d.tracks.find((t) => t.kind === 'audio').clips.push({ id: 'ac1', kind: 'audio', start: 0, dur: 4, src: { mediaId: 'aud1', in: 0, out: 4 }, gain: 1 });
    });
  });
  await sleep(500);
  await page.click('.trow.audio .clip'); await sleep(300);
  const dbText = await page.evaluate(() => document.querySelector('.inspector .loudval')?.textContent?.trim() || '');
  ok('audio inspector shows the loudness reading', /^-\d/.test(dbText), dbText);
  await page.evaluate(() => [...document.querySelectorAll('.inspector .chipbtn')].find((b) => b.textContent.trim() === 'Normalize')?.click());
  await sleep(400);
  const normGain = await page.evaluate(() => window.__store.get().project.tracks.find((t) => t.kind === 'audio').clips.find((c) => c.id === 'ac1')?.gain);
  ok('normalize raises the clip gain', normGain > 2, String(normGain));

  const qState = await page.evaluate(async () => {
    const { createQualityGovernor } = await import('/v2/engine/perf.js');
    const g = createQualityGovernor({ downAfter: 3 });
    const levels = [];
    for (let i = 0; i < 9; i++) levels.push(g.sample({ ms: 50 }));
    return { levels: levels.join(','), badge: !!document.querySelector('.qbadge') };
  });
  ok('preview quality governor steps 100 -> 75 -> 50%', qState.levels === '1,1,0.75,0.75,0.75,0.5,0.5,0.5,0.5', qState.levels);
  ok('no quality badge while the preview keeps up', qState.badge === false);
  const smallDraw = await page.evaluate(async () => {
    const { drawFrame } = await import('/v2/engine/render.js');
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 135;
    const ctx = cv.getContext('2d');
    drawFrame(ctx, 240, 135, window.__store.get().project, 0);
    return ctx.getImageData(0, 0, 240, 135).data.some((v, i) => i % 4 !== 3 && v > 0);
  });
  ok('drawFrame paints at a reduced preview size', smallDraw);

  await page.evaluate(() => [...document.querySelectorAll('.inspector .tab')].find((b) => /Effects/i.test(b.textContent))?.click());
  await sleep(350);
  await page.evaluate(() => [...document.querySelectorAll('.inspector .frow')].find((r) => /Noise gate/i.test(r.textContent))?.querySelector('input[type=checkbox]')?.click());
  await sleep(400);
  const gateOn = await page.evaluate(() => window.__store.get().project.tracks.find((t) => t.kind === 'audio').clips.find((c) => c.id === 'ac1')?.noiseGate);
  ok('noise gate toggles on the clip', !!gateOn?.enabled, JSON.stringify(gateOn));
  ok('gate threshold slider appears', await page.evaluate(() => [...document.querySelectorAll('.inspector .frow')].some((r) => /Gate threshold/i.test(r.textContent))));
  const gateDsp = await page.evaluate(async () => {
    const { createClipChain, applyClipFx } = await import('/v2/engine/audio-graph.js');
    const ctx = new OfflineAudioContext(1, 48000, 48000);
    const chain = createClipChain(ctx);
    applyClipFx(chain, { noiseGate: { enabled: true, threshold: 0.5 } }, { now: 0, peaks: [1, 0], mediaDur: 1, offset: 0, dur: 1 });
    const src = ctx.createOscillator();
    src.frequency.value = 440;
    src.connect(chain.input); chain.output.connect(ctx.destination); src.start(0);
    const data = (await ctx.startRendering()).getChannelData(0);
    return { head: Math.abs(data[9600]), tail: Math.abs(data[43200]) };
  });
  ok('gate lets loud audio through', gateDsp.head > 0.05, JSON.stringify(gateDsp));
  ok('gate silences the quiet half', gateDsp.tail < 0.01, JSON.stringify(gateDsp));
  await page.evaluate(() => document.querySelectorAll('.inspector .tab')[0]?.click());
  await sleep(300);
  await page.evaluate(() => [...document.querySelectorAll('.inspector .chipbtn.tiny')].find((b) => /Clean voice|အသံသန့်/.test(b.textContent))?.click());
  await sleep(400);
  const cleaned = await page.evaluate(() => {
    const c = window.__store.get().project.tracks.find((t) => t.kind === 'audio').clips.find((x) => x.id === 'ac1');
    return { highpass: c?.highpass, gate: c?.noiseGate };
  });
  ok('clean voice sets a rumble cut and the gate', cleaned.highpass === 80 && cleaned.gate?.enabled === true, JSON.stringify(cleaned));
  await page.evaluate(() => [...document.querySelectorAll('.inspector .tab')].find((t) => /Effects/i.test(t.textContent))?.click());
  await sleep(300);
  ok('rumble cut slider shows the new frequency', await page.evaluate(() => [...document.querySelectorAll('.inspector .frow')].some((r) => /Rumble cut|တုန်ချိုးသံ/.test(r.textContent) && r.querySelector('input[type=range]')?.value === '80')));
  const hpDsp = await page.evaluate(async () => {
    const { createClipChain, applyClipFx } = await import('/v2/engine/audio-graph.js');
    const run = async (highpass) => {
      const ctx = new OfflineAudioContext(1, 48000, 48000);
      const chain = createClipChain(ctx);
      applyClipFx(chain, { highpass }, { now: 0 });
      const src = ctx.createOscillator();
      src.frequency.value = 40;
      src.connect(chain.input); chain.output.connect(ctx.destination); src.start(0);
      const d = (await ctx.startRendering()).getChannelData(0);
      let peak = 0;
      for (let i = 24000; i < 48000; i++) peak = Math.max(peak, Math.abs(d[i]));
      return +peak.toFixed(4);
    };
    return { off: await run(0), on: await run(120) };
  });
  ok('rumble cut attenuates a 40 Hz tone', hpDsp.on < hpDsp.off / 2, JSON.stringify(hpDsp));

  await page.evaluate(() => { window.__store.edit((d) => { d.media = { ...(d.media || {}), ghost1: { id: 'ghost1', name: 'ghost.png', kind: 'image', dur: 5, size: 10, type: 'image/png' } }; }); });
  await page.click('.railbtn[aria-label="Media"]'); await sleep(700);
  ok('missing media shows the relink banner', !!(await page.$('.relinkbar')), await page.evaluate(() => document.querySelector('.panel.media')?.textContent?.slice(0, 60) || 'no panel'));
  const missingCount = await page.evaluate(async () => {
    const { listMediaIds } = await import('/v2/engine/storage.js');
    const ids = await listMediaIds();
    return Object.keys(window.__store.get().project.media).filter((id) => !ids.has(id)).length;
  });
  const probe = path.join(os.tmpdir(), 'relink-probe.png');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const probes = Array.from({ length: Math.max(1, missingCount) }, (_, i) => { const f = path.join(os.tmpdir(), `relink-probe-${i}.png`); fs.writeFileSync(f, png); return f; });
  const picker = await page.$('.relinkbar input[type=file]');
  await picker.uploadFile(...probes);
  await sleep(1200);
  ok('relinking clears the banner', !(await page.$('.relinkbar')), `missing=${missingCount}`);
  ok('relinked blob is stored', await page.evaluate(async () => {
    const { loadMedia } = await import('/v2/engine/storage.js');
    return !!(await loadMedia('ghost1'));
  }));
  for (const f of probes) fs.unlinkSync(f);

  await page.click('.langbtn'); await sleep(250);
  ok('language toggle switches the rail to Burmese', (await page.evaluate(() => document.querySelectorAll('.railbtn span')[0]?.textContent)) === 'မီဒီယာ');
  ok('language choice persists', (await page.evaluate(() => localStorage.getItem('fornyein.locale'))) === 'my');
  const myTiles = await page.evaluate(() => [...document.querySelectorAll('.panel.fxpanel .fxtile em')].map((e) => e.textContent));
  ok('effect tiles turn Burmese', myTiles.includes('အလင်းရောင်') && myTiles.every((t) => /[\u1000-\u109F]/.test(t)), myTiles.join('|'));
  await page.evaluate(() => document.querySelectorAll('.panel.fxpanel .tabs .tab')[1]?.click());
  await sleep(250);
  const myTrans = await page.evaluate(() => [...document.querySelectorAll('.panel.fxpanel .fxtile em')].map((e) => e.textContent));
  ok('transition tiles turn Burmese', myTrans.includes('ဖျော့'), myTrans.join('|'));
  await page.evaluate(() => document.querySelectorAll('.panel.fxpanel .tabs .tab')[0]?.click());
  await sleep(200);
  await page.click('.trow.video .clip'); await sleep(200);
  await page.evaluate(() => [...document.querySelectorAll('.inspector .tab')].find((t) => t.textContent === 'ဗီဒီယို')?.click());
  await sleep(200);
  const myLabels = await page.evaluate(() => [...document.querySelectorAll('.inspector .flabel')].map((n) => n.textContent));
  ok('inspector labels turn Burmese', myLabels.includes('အလင်းဖောက်မှု'), myLabels.slice(0, 5).join('|'));
  await page.click('.trow.text .clip'); await sleep(150);

  await page.click('.langbtn'); await sleep(250);
  ok('language toggles back to English', (await page.evaluate(() => document.querySelectorAll('.railbtn span')[0]?.textContent)) === 'Media');

  await page.select('.topctl select', '150%'); await sleep(200);
  ok('top bar zoom drives the preview', (await page.evaluate(() => [...document.querySelectorAll('.zoomchip')][1]?.textContent)) === '150%');

  await page.click('.stage, .player', { offset: { x: 20, y: 20 } }).catch(() => {});
  await page.keyboard.press('f'); await sleep(350);
  const fsState = await page.evaluate(() => ({ native: !!document.fullscreenElement, fallback: !!document.querySelector('.frame.fsfallback') }));
  ok('F opens fullscreen preview (native or fallback)', fsState.native || fsState.fallback, JSON.stringify(fsState));
  if (fsState.native) { await page.evaluate(() => document.exitFullscreen?.()); } else { await page.keyboard.press('Escape'); }
  await sleep(300);
  ok('Escape leaves the fullscreen fallback', await page.evaluate(() => !document.querySelector('.frame.fsfallback')));
  await page.evaluate(() => { const el = document.querySelector('.frame'); el.requestFullscreen = () => Promise.reject(new Error('denied')); });
  await page.keyboard.press('f'); await sleep(400);
  ok('fullscreen falls back in-app when the API refuses', await page.evaluate(() => !!document.querySelector('.frame.fsfallback')));
  await page.keyboard.press('Escape'); await sleep(300);

  await page.keyboard.press('?'); await sleep(250);
  const scList = await page.evaluate(() => document.querySelector('.shortcutbox')?.textContent || '');
  ok('shortcut dialog lists the fullscreen key', /Fullscreen preview/.test(scList));
  await page.keyboard.press('Escape'); await sleep(200);

  ok('no page errors', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

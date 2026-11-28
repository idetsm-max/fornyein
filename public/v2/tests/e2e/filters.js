// E2E for M4a colour grading: filters and Adjust are stored per clip and must
// reach the shared drawFrame path that preview and export both use.
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const { pngFile } = require('./_media.js');
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
  await input.uploadFile(pngFile()); await sleep(900);

  // drawFrame is the single renderer behind preview and export; sampling it at
  // a given time is the cheapest honest check of what the viewer sees.
  await page.evaluate(() => {
    window.__frame = async (t, points = [[0.2, 0.5], [0.8, 0.5], [0.02, 0.04], [0.5, 0.5]]) => {
      const { drawFrame } = await import('/v2/engine/render.js');
      const { visualCacheStats } = await import('/v2/engine/draw-visual.js');
      const w = 480, h = 270, cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      const project = window.__store.get().project;
      const paint = () => { ctx.fillStyle = '#101014'; ctx.fillRect(0, 0, w, h); drawFrame(ctx, w, h, project, t); };
      paint();
      for (let i = 0; i < 60 && visualCacheStats().ready === 0; i++) { await new Promise((r) => setTimeout(r, 25)); paint(); }
      return points.map(([fx, fy]) => [...ctx.getImageData(Math.floor(fx * (w - 1)), Math.floor(fy * (h - 1)), 1, 1).data].slice(0, 3));
    };
    window.__clips = () => {
      const p = window.__store.get().project;
      const visual = (c) => c.kind === 'image' || c.kind === 'video';
      return p.tracks.flatMap((tr) => tr.clips.filter(visual)
        .map((c) => ({ id: c.id, start: c.start, dur: c.dur, track: tr.id })));
    };
    window.__setSlider = (label, value) => {
      const row = [...document.querySelectorAll('.panel.tools .frow')].find((r) => r.querySelector('.flabel')?.textContent.trim() === label);
      const el = row?.querySelector('input.range');
      if (!el) return false;
      el.value = String(value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    };
  });

  const clips = await page.evaluate(() => window.__clips());
  ok('the photo lands on the timeline', clips.length === 1, JSON.stringify(clips));
  const t1 = clips[0].start + Math.min(1, clips[0].dur / 2);

  const base = await page.evaluate((t) => window.__frame(t), t1);
  ok('the photo renders (warm left, blue right)', base[0][0] > 150 && base[1][2] > 150, JSON.stringify(base));

  await page.click('.rail [data-tool=filters]'); await sleep(150);
  await page.click('[data-filter=mono]'); await sleep(300);
  ok('the mono filter is stored on the clip, not the media', await page.evaluate(() => {
    const p = window.__store.get().project, clip = p.tracks.flatMap((t) => t.clips).find((c) => c.adjust);
    const untouched = (a) => !a || Object.values(a).every((v) => !v);
    return !!clip && clip.adjust.saturation === -100 && Object.values(p.media).every((m) => untouched(m.adjust));
  }));
  const mono = await page.evaluate((t) => window.__frame(t), t1);
  ok('mono collapses the colour channels', Math.abs(mono[0][0] - mono[0][1]) < 14 && Math.abs(mono[0][1] - mono[0][2]) < 14, JSON.stringify(mono[0]));

  ok('the filter intensity slider appears', await page.evaluate(() => window.__setSlider('Intensity', 0)), 'set to 0');
  await sleep(300);
  const zeroed = await page.evaluate((t) => window.__frame(t), t1);
  ok('intensity 0 leaves the photo untouched', Math.abs(zeroed[0][0] - base[0][0]) < 6, JSON.stringify(zeroed[0]));
  await page.evaluate(() => window.__setSlider('Intensity', 50)); await sleep(300);
  const half = await page.evaluate((t) => window.__frame(t), t1);
  ok('intensity 50 halves the effect', half[0][0] < base[0][0] && Math.abs(half[0][1] - half[0][2]) < 8
    && half[0][0] > 100, JSON.stringify(half[0]));
  await page.evaluate(() => window.__setSlider('Intensity', 100)); await sleep(300);

  await page.click('.rail [data-tool=adjust]'); await sleep(150);
  ok('the vignette slider is wired', await page.evaluate(() => window.__setSlider('Vignette', 100)));
  await sleep(300);
  const vig = await page.evaluate((t) => window.__frame(t), t1);
  const lum = (p) => p[0] + p[1] + p[2];
  ok('the vignette darkens the corners but not the centre', lum(vig[2]) < lum(vig[3]) * 0.6, `${lum(vig[2])} vs ${lum(vig[3])}`);

  await page.click('[data-adjust-reset]'); await sleep(300);
  const reset = await page.evaluate((t) => window.__frame(t), t1);
  ok('reset brings the untouched photo back', Math.abs(reset[0][0] - base[0][0]) < 6 && Math.abs(lum(reset[2]) - lum(base[2])) < 20, JSON.stringify(reset[0]));

  await page.click('.rail [data-tool=media]'); await sleep(200);
  await page.evaluate(() => {
    const tile = document.querySelector('.mtile');
    const row = document.querySelector('.trow.video') || document.querySelector('.trow');
    const dt = new DataTransfer();
    tile.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    row.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    row.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await sleep(500);
  const both = await page.evaluate(() => window.__clips());
  ok('a second clip of the same photo can be added', both.length === 2, JSON.stringify(both));

  const second = both.find((c) => c.id !== clips[0].id);
  await page.evaluate((id) => window.__store.select(id), second.id); await sleep(150);
  await page.click('.rail [data-tool=filters]'); await sleep(150);
  await page.click('[data-filter=mono]'); await sleep(300);

  const t2 = second.start + Math.min(1, second.dur / 2);
  const perClip = await page.evaluate(({ t1, t2 }) => Promise.all([window.__frame(t1), window.__frame(t2)]), { t1, t2 });
  ok('the first clip keeps its own look', perClip[0][0][0] > 150 && perClip[0][1][2] > 150, JSON.stringify(perClip[0][0]));
  ok('the second clip is graded on its own', Math.abs(perClip[1][0][0] - perClip[1][0][1]) < 14, JSON.stringify(perClip[1][0]));

  await page.evaluate((id) => window.__store.select(id), clips[0].id); await sleep(150);
  await page.click('.rail [data-tool=transitions]'); await sleep(200);
  await page.click('[data-transition=fade]'); await sleep(300);
  ok('a fade transition is applied to the clip', await page.evaluate((id) => {
    const clip = window.__store.get().project.tracks.flatMap((t) => t.clips).find((c) => c.id === id);
    return clip?.transition?.in === 'fade' && clip.transition.dur === 0.4;
  }, clips[0].id));
  ok('the transition duration slider is wired', await page.evaluate(() => window.__setSlider('Duration', 0.8)));
  await sleep(300);
  ok('the longer duration is stored', await page.evaluate((id) => {
    const clip = window.__store.get().project.tracks.flatMap((t) => t.clips).find((c) => c.id === id);
    return clip?.transition?.dur === 0.8;
  }, clips[0].id));
  const mid = await page.evaluate((t) => window.__frame(t), clips[0].start + 0.2);
  ok('the fade is rendered mid transition', mid[0][0] < base[0][0] * 0.55 && mid[0][0] > 0, JSON.stringify(mid[0]));
  const full = await page.evaluate((t) => window.__frame(t), clips[0].start + 1.5);
  ok('the frame is back to full strength after the fade', Math.abs(full[0][0] - base[0][0]) < 8, JSON.stringify(full[0]));

  await page.evaluate((id) => window.__store.select(id), clips[0].id); await sleep(150);
  await page.click('.rail [data-tool=effects]'); await sleep(200);
  ok('the effects panel lists a full library', await page.evaluate(() => document.querySelectorAll('[data-effect]').length >= 15));
  await page.click('[data-effect=invert]'); await sleep(300);
  ok('the invert effect lands on the clip stack', await page.evaluate((id) => {
    const clip = window.__store.get().project.tracks.flatMap((t) => t.clips).find((c) => c.id === id);
    return clip?.fx?.some((e) => e.id === 'invert' && e.amount === 100);
  }, clips[0].id));
  const inv = await page.evaluate((t) => window.__frame(t), t1);
  ok('invert flips the sampled colour', inv[0][0] < 60 && inv[0][1] > 200, JSON.stringify(inv[0]));
  const other = await page.evaluate((t) => window.__frame(t), t2);
  ok('the other clip keeps its own look', Math.abs(other[0][0] - 74) < 12, JSON.stringify(other[0]));
  await page.click('[data-effect=invert]'); await sleep(300);
  const off = await page.evaluate((t) => window.__frame(t), t1);
  ok('toggling the tile off removes the effect', Math.abs(off[0][0] - base[0][0]) < 8, JSON.stringify(off[0]));
  await page.click('[data-effect=scanlines]'); await sleep(300);
  const scan = await page.evaluate(async (t) => {
    const pts = Array.from({ length: 24 }, (_, i) => [0.1 + (i % 6) * 0.14, 0.2 + Math.floor(i / 6) * 0.2]);
    return window.__frame(t, pts);
  }, t1);
  const avg = (rows) => rows.reduce((s, p) => s + p[0] + p[1] + p[2], 0) / rows.length;
  ok('scanlines darken the frame overall', avg(scan) < avg(base) * 0.92, `${Math.round(avg(scan))} vs ${Math.round(avg(base))}`);
  await page.click('[data-effects-clear]'); await sleep(300);
  ok('clear empties the stack', await page.evaluate((id) => {
    const clip = window.__store.get().project.tracks.flatMap((t) => t.clips).find((c) => c.id === id);
    return Array.isArray(clip?.fx) && clip.fx.length === 0;
  }, clips[0].id));

  await page.click('.rail [data-tool=transitions]'); await sleep(200);
  const dropped = await page.evaluate(() => {
    const tile = document.querySelector('[data-transition=wipe]');
    const row = document.querySelector('.trow.video');
    const clipEl = row?.querySelector('.clip');
    if (!tile || !clipEl) return null;
    const dt = new DataTransfer(), r = clipEl.getBoundingClientRect();
    tile.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    for (const type of ['dragover', 'drop']) {
      row.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 5 }));
    }
    return dt.getData('text/x-fornyein-transition');
  });
  await sleep(300);
  ok('dragging a transition tile carries its id', dropped === 'wipe', String(dropped));
  const bound = await page.evaluate((ids) => {
    const all = window.__store.get().project.tracks.flatMap((t) => t.clips);
    const at = (id) => all.find((c) => c.id === id)?.transition;
    return { first: at(ids[0]), second: at(ids[1]) };
  }, [clips[0].id, second.id]);
  ok('the drop binds the in-side of the clip it landed on', bound.first?.in === 'wipe', JSON.stringify(bound));
  ok('the other clip is untouched by the drop', bound.second?.in !== 'wipe', JSON.stringify(bound.second));
  const early = await page.evaluate((t) => window.__frame(t), clips[0].start + 0.45);
  ok('the dropped wipe repaints only the left strip', early[0][0] > 180 && early[1][0] < 120, JSON.stringify(early));
  await page.evaluate(() => window.__store.undo()); await sleep(250);
  ok('the drop is one undo step', await page.evaluate((id) => {
    const clip = window.__store.get().project.tracks.flatMap((t) => t.clips).find((c) => c.id === id);
    return clip?.transition?.in === 'fade';
  }, clips[0].id));

  await page.evaluate((id) => window.__store.select(id), clips[0].id); await sleep(150);
  await page.click('.inspector [data-tab=mask]'); await sleep(250);
  await page.click('[data-mask=ellipse]'); await sleep(300);
  const masked = await page.evaluate((t) => window.__frame(t), t1);
  ok('an ellipse mask hides the frame corners but keeps the centre', masked[2][0] < 120
    && Math.abs(masked[3][0] - base[3][0]) < 6 && Math.abs(masked[3][2] - base[3][2]) < 10, JSON.stringify(masked));
  await page.click('[data-mask=none]'); await sleep(300);
  const unmasked = await page.evaluate((t) => window.__frame(t), t1);
  ok('clearing the mask restores the corners', unmasked[2][0] > 180, JSON.stringify(unmasked[2]));

  await page.screenshot({ path: process.env.SHOT || '/tmp/filters.png' });
  ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

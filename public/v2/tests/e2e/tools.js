// E2E for U7/U8/U9/U13: tool panels, keyframes, safe area, a11y.
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765';
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

  await page.click('.langbtn'); await sleep(250);
  ok('language toggle switches the rail to Burmese', (await page.evaluate(() => document.querySelectorAll('.railbtn span')[0]?.textContent)) === 'မီဒီယာ');
  ok('language choice persists', (await page.evaluate(() => localStorage.getItem('fornyein.locale'))) === 'my');

  await page.click('.langbtn'); await sleep(250);
  ok('language toggles back to English', (await page.evaluate(() => document.querySelectorAll('.railbtn span')[0]?.textContent)) === 'Media');

  await page.select('.topctl select', '150%'); await sleep(200);
  ok('top bar zoom drives the preview', (await page.evaluate(() => [...document.querySelectorAll('.zoomchip')][1]?.textContent)) === '150%');

  ok('no page errors', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

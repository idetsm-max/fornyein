// E2E for U4 (resizable/collapsible panels), U5 (track header) and U6/T2
// (razor, undo labels): BASE=... PUPPETEER=... CHROME=... node tests/e2e/layout.js
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const { wavFile } = require('./_media.js');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const box = (p, sel) => p.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && { x: r.x, y: r.y, w: r.width, h: r.height }; }, sel);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.removeItem('fn.layout'));
  await page.reload({ waitUntil: 'networkidle0' });

  const before = await box(page, '.media');
  const split = await box(page, '.splitter.v.left');
  await page.mouse.move(split.x + 3, split.y + 100);
  await page.mouse.down();
  await page.mouse.move(split.x + 63, split.y + 100, { steps: 6 });
  await page.mouse.up();
  await sleep(120);
  const after = await box(page, '.media');
  ok('left splitter resizes the media panel', Math.abs(after.w - before.w - 60) < 6, `${before.w} -> ${after.w}`);

  await page.evaluate(() => document.querySelector('.splitter.v.left').dispatchEvent(new MouseEvent('dblclick', { bubbles: true })));
  await sleep(120);
  ok('double-click resets the splitter', Math.abs((await box(page, '.media')).w - 330) < 2);

  await page.click('.topctl .ibtn[title="Show / hide media panel"]');
  await sleep(120);
  const hidden = await page.evaluate(() => ({ media: getComputedStyle(document.querySelector('.media')).display === 'none', saved: JSON.parse(localStorage.getItem('fn.layout') || '{}').leftHidden }));
  ok('panel toggle collapses the media panel', hidden.media === true && hidden.saved === true, JSON.stringify(hidden));
  await page.click('.topctl .ibtn[title="Show / hide media panel"]');
  await sleep(120);
  ok('panel toggle restores the media panel', (await box(page, '.media'))?.w > 200);

  const input = await page.$('.media input[type=file]');
  await input.uploadFile(wavFile(1)); await sleep(500);
  ok('audio track header has mute and solo', (await page.$$('.thead.audio .ibtn[title="Mute"]')).length === 1 && (await page.$$('.thead.audio .ibtn.solo')).length === 1);
  await page.click('.thead.audio .ibtn[title="Mute"]');
  await sleep(80);
  ok('mute toggles the track', await page.evaluate(() => document.querySelector('.thead.audio .ibtn[title="Mute"]').classList.contains('on')));
  await page.click('.thead.audio .ibtn[title="Mute"]');

  await page.evaluate(() => document.querySelector('.thead.audio .tname').dispatchEvent(new MouseEvent('dblclick', { bubbles: true })));
  await sleep(80);
  const rename = await page.$('.trename');
  ok('double-click opens the rename input', !!rename);
  if (rename) {
    await rename.click({ clickCount: 3 });
    await rename.type('Music bed');
    await page.keyboard.press('Enter');
    await sleep(120);
    ok('rename is saved', (await page.evaluate(() => document.querySelector('.thead.audio .tname span:last-child').textContent)) === 'Music bed');
  }

  await page.evaluate(() => document.querySelector('.thead.audio').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 200, clientY: 200 })));
  await sleep(100);
  await page.evaluate(() => [...document.querySelectorAll('.ctxitem')].find((b) => b.textContent.includes('Small height'))?.click());
  await sleep(120);
  ok('track height S is applied', await page.evaluate(() => document.querySelector('.thead.audio').classList.contains('h-s')));

  await page.evaluate(() => document.querySelector('.rail .railbtn:nth-child(3)').click()); await sleep(120);
  await page.click('.uploadbtn'); await sleep(200);
  ok('text clip added', (await page.$$('.trow.text .clip')).length === 1);
  await page.click('.tltools .ibtn[title="Razor · B"]');
  const clip = await box(page, '.trow.text .clip');
  await page.mouse.click(clip.x + clip.w / 2, clip.y + clip.h / 2);
  await sleep(200);
  ok('razor splits at the click point', (await page.$$('.trow.text .clip')).length === 2);
  const undoTitle = await page.evaluate(() => document.querySelector('.topctl .ibtn[title^="Undo"]')?.title || '');
  ok('undo tooltip carries the command label', /Split 1 clip/.test(undoTitle), undoTitle);

  ok('no page errors', errors.length === 0, JSON.stringify(errors));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

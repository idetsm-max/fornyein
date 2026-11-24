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
  await page.evaluate(() => localStorage.removeItem('fn.layout.v1'));
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

  const split2 = await box(page, '.splitter.v.left');
  await page.mouse.move(split2.x + 3, split2.y + 100);
  await page.mouse.down();
  await page.mouse.move(split2.x + 3 + 6, split2.y + 100, { steps: 3 });
  await page.mouse.up();
  await sleep(150);
  ok('splitter snaps back to the default within 12 px', Math.abs((await box(page, '.media')).w - 330) < 2, String((await box(page, '.media')).w));

  await page.evaluate(() => document.querySelector('.splitter.v.left').focus());
  await page.keyboard.press('ArrowRight');
  await sleep(120);
  ok('arrow key nudges the splitter by 16 px', Math.abs((await box(page, '.media')).w - 346) < 2, String((await box(page, '.media')).w));
  await page.keyboard.down('Shift'); await page.keyboard.press('ArrowRight'); await page.keyboard.up('Shift');
  await sleep(120);
  ok('shift+arrow nudges the splitter by 64 px', Math.abs((await box(page, '.media')).w - 410) < 2, String((await box(page, '.media')).w));
  await page.keyboard.press('Home');
  await sleep(120);
  ok('Home restores the default splitter width', Math.abs((await box(page, '.media')).w - 330) < 2);
  const aria = await page.evaluate(() => { const el = document.querySelector('.splitter.v.left'); return { role: el.getAttribute('role'), now: el.getAttribute('aria-valuenow'), ori: el.getAttribute('aria-orientation') }; });
  ok('splitter exposes separator semantics', aria.role === 'separator' && aria.now === '330' && aria.ori === 'vertical', JSON.stringify(aria));

  await page.keyboard.press('Enter');
  await sleep(250);
  const collapsed = await page.evaluate(() => ({ hidden: getComputedStyle(document.querySelector('.media')).display === 'none', handle: !!document.querySelector('.edgehandle.left') }));
  ok('Enter collapses the panel and leaves an edge handle', collapsed.hidden && collapsed.handle, JSON.stringify(collapsed));
  await page.click('.edgehandle.left');
  await sleep(250);
  ok('edge handle reopens the panel', (await box(page, '.media'))?.w > 200);

  const tlSplit = await box(page, '.splitter.h');
  await page.mouse.move(tlSplit.x + 200, tlSplit.y + 3);
  await page.mouse.down();
  await page.mouse.move(tlSplit.x + 200, tlSplit.y - 400, { steps: 8 });
  await page.mouse.up();
  await sleep(200);
  const playerH = (await box(page, '.player'))?.h || 0;
  ok('timeline drag keeps the player at 360 px or more', playerH >= 359, String(playerH));

  await page.click('.topctl .ibtn[title="Show / hide media panel"]');
  await sleep(120);
  const hidden = await page.evaluate(() => ({ media: getComputedStyle(document.querySelector('.media')).display === 'none', saved: JSON.parse(localStorage.getItem('fn.layout.v1') || '{}').leftHidden }));
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

  const sbText = await page.evaluate(() => document.querySelector('.statusbar')?.textContent || '');
  ok('status bar shows fps and duration', /\d+ fps · \d\d:\d\d:\d\d:\d\d/.test(sbText), sbText.slice(0, 90));
  const sbSelect = await page.evaluate(() => document.querySelectorAll('.statusbar .sb-sel').length);
  ok('status bar reports the current selection', sbSelect === 1, String(sbSelect));

  for (const [vw, vh] of [[1440, 900], [1280, 720], [1100, 640]]) {
    await page.setViewport({ width: vw, height: vh });
    await sleep(250);
    const metrics = await page.evaluate(() => ({ sh: document.scrollingElement.scrollHeight, ih: window.innerHeight, sw: document.scrollingElement.scrollWidth, iw: window.innerWidth }));
    ok(`no page scroll at ${vw}x${vh}`, metrics.sh <= metrics.ih + 1 && metrics.sw <= metrics.iw + 1, JSON.stringify(metrics));
  }
  await page.setViewport({ width: 1440, height: 900 });
  await sleep(200);

  await page.evaluate(() => { const el = document.querySelector('.splitter.v.left'); el.focus(); });
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowLeft');
  await sleep(200);
  const beforeReload = (await box(page, '.media'))?.w || 0;
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(300);
  const afterReload = (await box(page, '.media'))?.w || 0;
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fn.layout.v1') || '{}'));
  ok('layout survives a reload (fn.layout.v1)', Math.abs(afterReload - beforeReload) < 3 && typeof stored.left === 'number', `${beforeReload} -> ${afterReload} ${JSON.stringify(stored)}`);

  ok('no page errors', errors.length === 0, JSON.stringify(errors));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

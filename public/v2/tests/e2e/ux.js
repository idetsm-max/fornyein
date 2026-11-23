// E2E for the UX work packages U1 (inspector registry), U2 (context menu +
// clipboard) and U3 (drag & drop). Needs a static server and Chromium:
//   BASE=http://localhost:8765 PUPPETEER=puppeteer-core CHROME=/usr/bin/chromium node public/v2/tests/e2e/ux.js
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0; const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };

const { wavFile } = require('./_media.js');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });

  const tabs = () => page.$$eval('.inspector .tab', (els) => els.map((e) => e.textContent.trim()));
  const clips = (kind) => page.$$eval(`.trow.${kind} .clip`, (els) => els.length);

  ok('no selection shows project settings', (await tabs()).join(',') === 'Project', (await tabs()).join(','));

  await page.evaluate(() => document.querySelector('.rail .railbtn:nth-child(3)').click());
  await sleep(100);
  await page.click('.uploadbtn'); await sleep(200);
  ok('text clip inspector tabs', (await tabs()).join(',') === 'Text,Animation,Keys,Timing', (await tabs()).join(','));

  const clipBox = await (await page.$('.trow.text .clip')).boundingBox();
  await page.mouse.click(clipBox.x + 20, clipBox.y + 10, { button: 'right' }); await sleep(150);
  ok('right-click opens a context menu', (await page.$('.ctxmenu')) !== null);
  const items = await page.$$eval('.ctxitem span', (els) => els.map((e) => e.textContent));
  ok('clip menu has CapCut-style items', items.includes('Duplicate') && items.includes('Split at playhead') && items.includes('Copy'), items.join('|'));

  await page.evaluate(() => [...document.querySelectorAll('.ctxitem')].find((b) => /Duplicate/.test(b.textContent)).click());
  await sleep(200);
  ok('duplicate from the menu adds a clip', (await clips('text')) === 2);

  await page.keyboard.down('Control'); await page.keyboard.press('c'); await page.keyboard.up('Control');
  await page.keyboard.down('Control'); await page.keyboard.press('v'); await page.keyboard.up('Control');
  await sleep(200);
  ok('copy / paste adds a clip', (await clips('text')) === 3);
  ok('pasted clips do not overlap', await page.$$eval('.trow.text .clip', (els) => {
    const r = els.map((e) => [parseFloat(e.style.left), parseFloat(e.style.width)]).sort((a, b) => a[0] - b[0]);
    return r.every((v, i) => i === 0 || v[0] >= r[i - 1][0] + r[i - 1][1] - 1);
  }));

  await page.evaluate(() => document.querySelector('.trow.text').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await sleep(150);
  ok('clearing the selection returns to project settings', (await tabs()).join(',') === 'Project');

  await page.evaluate(() => document.querySelector('.rail .railbtn:nth-child(1)').click()); await sleep(100);
  const input = await page.$('.media input[type=file]');
  await input.uploadFile(wavFile()); await sleep(700);
  ok('imported audio shows a media tile', (await page.$$('.mtile.g-audio')).length === 1);
  ok('upload adds the audio clip to the timeline', (await clips('audio')) === 1);

  await page.evaluate(() => {
    const tile = document.querySelector('.mtile.g-audio');
    const row = document.querySelector('.trow.audio');
    const dt = new DataTransfer();
    tile.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    row.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    row.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  });
  await sleep(400);
  ok('drag & drop adds another audio clip', (await clips('audio')) === 2);
  ok('audio clip inspector tabs', (await tabs()).join(',') === 'Basic,Effects', (await tabs()).join(','));

  await page.screenshot({ path: process.env.SHOT || '/tmp/ux.png' });
  ok('no page errors', errors.length === 0, JSON.stringify(errors));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

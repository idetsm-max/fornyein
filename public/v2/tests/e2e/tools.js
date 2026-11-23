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

  await page.click('button[title="Safe area"]'); await sleep(150);
  ok('safe area overlay toggles', await page.evaluate(() => !!document.querySelector('.safearea')));
  await page.click('button[title="Safe area"]'); await sleep(120);

  const zoomBefore = await page.evaluate(() => [...document.querySelectorAll('.zoomchip')].map((b) => b.textContent).join('|'));
  await page.click('button[title="Preview zoom in"]'); await sleep(120);
  const zoomAfter = await page.evaluate(() => [...document.querySelectorAll('.zoomchip')].map((b) => b.textContent).join('|'));
  ok('preview zoom changes', zoomBefore !== zoomAfter, zoomBefore + ' -> ' + zoomAfter);

  ok('clips are keyboard reachable', (await page.evaluate(() => document.querySelector('.clip')?.tabIndex)) === 0);
  ok('no page errors', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

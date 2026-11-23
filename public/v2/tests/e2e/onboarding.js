// E2E for U12: empty-state card and toasts.
// BASE=... PUPPETEER=... CHROME=... node public/v2/tests/e2e/onboarding.js
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
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });
  await sleep(300);

  ok('first run shows the coach tour', await page.evaluate(() => !!document.querySelector('.tourcard')));
  ok('coach tour has five steps', (await page.evaluate(() => document.querySelectorAll('.tourcard .tdot').length)) === 5);
  await page.click('.tourfoot .btn.primary'); await sleep(120);
  await page.click('.tourfoot .btn.primary'); await sleep(120);
  ok('coach tour advances', (await page.evaluate(() => document.querySelector('.tourcount').textContent.trim())) === '3 / 5');
  await page.keyboard.press('Escape'); await sleep(120);
  ok('Esc closes the coach tour', await page.evaluate(() => !document.querySelector('.tourcard')));
  ok('tour completion is remembered', await page.evaluate(() => localStorage.getItem('fornyein.tour.v1') === '1'));

  ok('empty project shows the start card', await page.evaluate(() => !!document.querySelector('.stageempty .emptycard')));
  const steps = await page.evaluate(() => document.querySelectorAll('.emptycard ol li').length);
  ok('start card lists the first steps', steps === 3, String(steps));

  await page.click('.emptycard .btn.primary');
  await sleep(250);
  ok('start card CTA adds a text clip', (await page.evaluate(() => document.querySelectorAll('.clip').length)) >= 1);
  ok('start card hides once the project has clips', await page.evaluate(() => !document.querySelector('.stageempty')));
  ok('toast confirms the action', (await page.evaluate(() => document.querySelectorAll('.toast.ok').length)) >= 1);

  await page.keyboard.down('Control'); await page.keyboard.press('KeyS'); await page.keyboard.up('Control');
  await sleep(300);
  const savedToast = await page.evaluate(() => [...document.querySelectorAll('.toast')].some((t) => t.textContent.includes('သိမ်းပြီး')));
  ok('Ctrl+S shows a save toast', savedToast);

  await sleep(3200);
  ok('toasts auto-dismiss', (await page.evaluate(() => document.querySelectorAll('.toast').length)) === 0);
  ok('no page errors', errors.length === 0, errors.join(' | '));

  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

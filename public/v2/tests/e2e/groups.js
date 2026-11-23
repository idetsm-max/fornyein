// E2E for T3/T4: link groups, markers and transport keys (Home/End/M).
// BASE=... PUPPETEER=... CHROME=... node public/v2/tests/e2e/groups.js
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const ok = (name, cond, extra = '') => {
  if (!cond) failed++;
  console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : ''));
};
const box = (p, sel) => p.evaluate((s) => {
  const r = document.querySelector(s)?.getBoundingClientRect();
  return r && { x: r.x, y: r.y, w: r.width, h: r.height };
}, sel);

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

  const clipBoxes = () => page.evaluate(() => [...document.querySelectorAll('.trow.text .clip')].map((c) => {
    const r = c.getBoundingClientRect();
    return { id: c.dataset.id, x: r.x, y: r.y, w: r.width, h: r.height, left: parseFloat(c.style.left) };
  }));
  const ruler = await box(page, '.ruler');
  await page.evaluate(() => document.querySelector('.rail .railbtn:nth-child(3)').click()); await sleep(120);
  await page.click('.uploadbtn'); await sleep(150);
  await page.mouse.click(ruler.x + ruler.w * 0.45, ruler.y + ruler.h / 2); await sleep(100);
  await page.click('.uploadbtn'); await sleep(200);
  await page.keyboard.down('Shift'); await page.keyboard.press('z'); await page.keyboard.up('Shift'); await sleep(150);
  let clips = await clipBoxes();
  ok('two text clips exist', clips.length === 2, String(clips.length));

  await page.mouse.click(clips[0].x + clips[0].w / 2, clips[0].y + clips[0].h / 2);
  await page.keyboard.down('Shift');
  await page.mouse.click(clips[1].x + clips[1].w / 2, clips[1].y + clips[1].h / 2);
  await page.keyboard.up('Shift');
  await page.click('.tltools .ibtn[title="Link clips"]'); await sleep(120);
  const before = await clipBoxes();
  await page.mouse.move(before[0].x + before[0].w / 2, before[0].y + before[0].h / 2);
  await page.mouse.down();
  await page.mouse.move(before[0].x + before[0].w / 2 + 50, before[0].y + before[0].h / 2, { steps: 6 });
  await page.mouse.up(); await sleep(150);
  const after = await clipBoxes();
  const byId = (list, id) => list.find((c) => c.id === id).left;
  const d0 = byId(after, before[0].id) - before[0].left, d1 = byId(after, before[1].id) - before[1].left;
  ok('linked clips move together', Math.abs(d0 - d1) < 2 && d0 > 10, `${d0} / ${d1}`);

  await page.keyboard.press('m'); await sleep(120);
  ok('M adds a marker', (await page.$$('.ruler .marker')).length === 1);
  await page.evaluate(() => document.querySelector('.ruler .marker').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })));
  await sleep(120);
  ok('right-click removes the marker', (await page.$$('.ruler .marker')).length === 0);

  await page.keyboard.press('End'); await sleep(120);
  const tcode = () => page.evaluate(() => document.querySelector('.tcode').textContent);
  ok('End seeks to the project end', !/^00:00:00:00/.test(await tcode()));
  await page.keyboard.press('Home'); await sleep(120);
  ok('Home seeks to zero', /^00:00:00:00/.test(await tcode()));

  ok('no page errors', errors.length === 0, JSON.stringify(errors));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

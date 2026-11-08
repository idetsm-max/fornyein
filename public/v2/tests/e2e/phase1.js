// End-to-end check of the editor in headless Chromium (see ../harness.md).
//   BASE=http://localhost:8765 PUPPETEER=<path to puppeteer> CHROME=<path to chrome> SHOT=phase1.png node public/v2/tests/e2e/phase1.js
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0; const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
(async () => {
  const b = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 });
  const errs = []; p.on('pageerror', (e) => errs.push('PAGEERR ' + e)); p.on('console', (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  const count = async (s) => (await p.$$(s)).length;
  const clips = () => p.evaluate(() => [...document.querySelectorAll('.trow.text .clip')].map((c) => ({ l: parseFloat(c.style.left), w: parseFloat(c.style.width) })));
  ok('starts empty', (await count('.clip')) === 0);
  await p.evaluate(() => document.querySelector('.rail .railbtn:nth-child(3)').click()); await sleep(100);        // open the Text tool
  await p.click('.uploadbtn'); await sleep(200);
  ok('Add text creates a clip and selects it', (await count('.clip')) === 1 && (await count('.clip.sel')) === 1);
  await p.click('.uploadbtn'); await sleep(200);
  let c = await clips(); ok('second Add text does not overlap the first', c.length === 2 && c[1].l >= c[0].l + c[0].w - 1, JSON.stringify(c));
  await p.click('.inspector textarea', { clickCount: 3 }); await p.keyboard.type('Hello'); await sleep(200);
  const white = await p.evaluate(() => { const cv = document.querySelector('.stagecanvas'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200) n++; return n; });
  ok('canvas draws the text', white > 50, 'white px ' + white);
  await p.evaluate(() => { const r = document.querySelector('.inspector input.range'); r.value = 150; r.dispatchEvent(new Event('input', { bubbles: true })); }); await sleep(100);
  const size = () => p.evaluate(() => document.querySelector('.inspector .numbox input').value);
  ok('size slider changes the clip', (await size()) === '150');
  await p.evaluate(() => document.querySelector('.topctl .ibtn').click()); await sleep(100);     // undo button
  ok('undo button reverts the slider', (await size()) === '72', await size());
  await p.evaluate(() => document.querySelector('.rail .railbtn:nth-child(3)').click());
  await p.type('.media textarea', 'line one\nline two\nline three');
  await p.evaluate(() => [...document.querySelectorAll('.btn.wide')].find((x) => /lines/i.test(x.textContent)).click()); await sleep(200);
  c = await clips(); ok('poem lines become 3 more clips, no overlaps', c.length === 5 && c.every((x, i) => i === 0 || x.l >= c[i - 1].l + c[i - 1].w - 1), JSON.stringify(c.map((x) => Math.round(x.l))));
  await p.evaluate(() => document.querySelector('.playbtn').click()); await sleep(700);
  const tc = await p.evaluate(() => document.querySelector('.tcode').textContent); ok('Play moves the time', !/^00:00:00:00/.test(tc), tc);
  await p.evaluate(() => document.querySelector('.playbtn').click());
  await p.evaluate(() => document.activeElement && document.activeElement.blur());           // keys are ignored while a text field has focus
  await p.keyboard.press('Delete'); await sleep(150);
  ok('Delete removes the selected clip', (await count('.trow.text .clip')) === 4);
  await sleep(1200); const pill = await p.evaluate(() => document.querySelector('.savedpill').textContent); ok('autosave', /Auto Saved/.test(pill), pill);
  await p.reload({ waitUntil: 'networkidle0' }); ok('reload starts empty', (await count('.clip')) === 0);
  await p.evaluate(() => [...document.querySelectorAll('.navbtn')].find((x) => /Projects/.test(x.textContent)).click()); await sleep(300);
  await p.evaluate(() => document.querySelector('.menu .menuitem .grow').click()); await sleep(300);
  ok('My Projects reopens the saved project', (await count('.trow.text .clip')) === 4);
  await p.evaluate(() => document.querySelector('.themeswitch button').click()); await sleep(100);
  ok('light theme', (await p.evaluate(() => document.documentElement.dataset.theme)) === 'light');
  await p.screenshot({ path: process.env.SHOT || 'phase1.png' });
  ok('no page errors', errs.length === 0, JSON.stringify(errs));
  await b.close(); console.log(failed ? `\n${failed} FAILED` : '\nall passed'); process.exit(failed ? 1 : 0);
})();

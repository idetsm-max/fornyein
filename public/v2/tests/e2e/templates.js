// E2E for the project templates (M6): tiles load a fresh project, guard the
// replace confirm, and keep the text presets working.
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.setItem('fn.tour.v1', '1'); localStorage.removeItem('fn.recovery.v1'); });
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(300);

  await page.click('.railbtn[data-tool="templates"]');
  await sleep(300);
  const tiles = await page.$$('.tplrow');
  ok('the Templates panel lists five project templates', tiles.length === 5, String(tiles.length));

  await page.evaluate(() => document.querySelector('.tplrow[data-tpl="poem-card"]').click());
  await sleep(400);
  const poem = await page.evaluate(() => {
    const p = window.__store.get().project;
    return { name: p.name, size: p.size, clips: p.tracks.reduce((n, t) => n + t.clips.length, 0),
      texts: p.tracks.flatMap((t) => t.clips).map((c) => c.text) };
  });
  ok('a template loads its project and clips', poem.size === '4:5' && poem.clips === 2 && poem.texts[0] === 'ခေါင်းစဉ်', JSON.stringify(poem));
  const bar = await page.evaluate(() => document.querySelector('.projname, .brandname, .topbar')?.textContent);
  ok('the template name shows in the top bar', bar.includes('ကဗျာ'));

  const confirmText = await page.evaluate(() => {
    let asked = '';
    const orig = window.confirm;
    window.confirm = (m) => { asked = m; return false; };
    document.querySelector('.tplrow[data-tpl="credits"]').click();
    window.confirm = orig;
    return asked;
  });
  await sleep(300);
  const afterCancel = await page.evaluate(() => window.__store.get().project.name);
  ok('replacing a non-empty project asks first and honours cancel',
    /clip/.test(confirmText) && afterCancel === 'ကဗျာ ကတ်ပြား', `${confirmText} → ${afterCancel}`);

  await page.evaluate(() => { window.confirm = () => true; document.querySelector('.tplrow[data-tpl="short-9x16"]').click(); window.confirm = undefined; });
  await sleep(400);
  const short = await page.evaluate(() => {
    const p = window.__store.get().project;
    return { size: p.size, clips: p.tracks.reduce((n, t) => n + t.clips.length, 0) };
  });
  ok('confirming swaps in the 9:16 short template', short.size === '9:16' && short.clips === 3, JSON.stringify(short));
  ok('the timeline draws the template clips', (await page.$$('.clip')).length === 3);

  const presets = await page.evaluate(() => {
    const before = window.__store.get().project.tracks.reduce((n, t) => n + t.clips.length, 0);
    [...document.querySelectorAll('.fxtile')].find((b) => /Title card/.test(b.textContent))?.click();
    return { before, after: window.__store.get().project.tracks.reduce((n, t) => n + t.clips.length, 0) };
  });
  await sleep(300);
  ok('text presets still insert a clip', presets.after === presets.before + 1, JSON.stringify(presets));

  ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

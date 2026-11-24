// E2E for the global behaviours: focus mode, window title, force save on hide,
// the cross-tab read-only lock and the crash-recovery dialog.
// BASE=... PUPPETEER=... CHROME=... node tests/e2e/session.js
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const closeTour = async (p) => { await p.evaluate(() => localStorage.setItem('fn.tour.v1', '1')).catch(() => {}); };

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  await closeTour(page);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.removeItem('fn.recovery.v1'); document.activeElement?.blur(); });
  await sleep(200);

  // ---- focus mode
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
  await sleep(300);
  const focus = await page.evaluate(() => ({ cls: document.querySelector('.app').className, rail: getComputedStyle(document.querySelector('.rail')).display, tl: getComputedStyle(document.querySelector('.timeline')).display, pill: !!document.querySelector('.focuspill'), player: document.querySelector('.player').getBoundingClientRect().width, vw: innerWidth }));
  ok('Shift+Tab hides rail, panels and timeline', focus.cls.includes('focusmode') && focus.rail === 'none' && focus.tl === 'none', JSON.stringify(focus));
  ok('focus mode lets the player fill the window', focus.player > focus.vw - 40, `${focus.player}/${focus.vw}`);
  await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
  await sleep(250);
  ok('Shift+Tab again restores the workspace', await page.evaluate(() => !document.querySelector('.app').classList.contains('focusmode') && getComputedStyle(document.querySelector('.rail')).display !== 'none'));

  // ---- window title
  await page.evaluate(() => window.__store.edit((d) => { d.name = 'Title probe'; }));
  await sleep(150);
  const dirtyTitle = await page.evaluate(() => document.title);
  ok('the title marks unsaved work with a dot', dirtyTitle === '● Title probe — For Nyein', dirtyTitle);
  await sleep(1400);
  const savedTitle = await page.evaluate(() => document.title);
  ok('the dot clears once autosave finishes', savedTitle === 'Title probe — For Nyein', savedTitle);
  ok('a finished save clears the recovery flag', await page.evaluate(() => localStorage.getItem('fn.recovery.v1') === null));

  // ---- force save when the tab is hidden
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); window.__store.edit((d) => { d.name = 'Hidden save'; }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(600);
  const hiddenSave = await page.evaluate(async () => { const { listProjects, loadProject } = await import('/v2/engine/storage.js'); const list = await listProjects(); const p = list[0] && await loadProject(list[0].id); return p && p.name; });
  ok('hiding the tab flushes the pending save', hiddenSave === 'Hidden save', String(hiddenSave));
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); });

  // ---- second tab is read-only until it takes over
  const page2 = await ctx.newPage();
  await page2.setViewport({ width: 1280, height: 800 });
  await page2.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  await sleep(700);
  const tab2 = await page2.evaluate(() => ({ banner: !!document.querySelector('.readonlybar'), ro: window.__store.get().readOnly }));
  ok('a second tab shows the read-only banner', tab2.banner && tab2.ro, JSON.stringify(tab2));
  const before = await page2.evaluate(() => window.__store.get().project.name);
  await page2.evaluate(() => window.__store.edit((d) => { d.name = 'should be blocked'; }));
  ok('the read-only tab rejects edits', before === await page2.evaluate(() => window.__store.get().project.name));
  await page2.click('.readonlybar .btn');
  await sleep(500);
  const swapped = { second: await page2.evaluate(() => window.__store.get().readOnly), first: await page.evaluate(() => window.__store.get().readOnly) };
  ok('takeover moves the lock to the other tab', swapped.second === false && swapped.first === true, JSON.stringify(swapped));
  await page2.close();

  // ---- crash recovery
  await page.evaluate(() => localStorage.setItem('fn.recovery.v1', String(Date.now() - 180000)));
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(400);
  const rec = await page.evaluate(() => ({ dlg: !!document.querySelector('.recoverybox'), text: document.querySelector('.recoverybody p')?.textContent || '' }));
  ok('an unfinished session offers recovery', rec.dlg && /3 min ago/.test(rec.text), rec.text.slice(0, 60));
  await page.evaluate(() => [...document.querySelectorAll('.recoverybody .btn')].find((b) => b.textContent.includes('Discard')).click());
  await sleep(300);
  ok('discarding the session clears the flag and the dialog', await page.evaluate(() => !document.querySelector('.recoverybox') && localStorage.getItem('fn.recovery.v1') === null));

  ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

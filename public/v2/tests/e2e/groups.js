// E2E for T3/T4: link groups, markers and transport keys (Home/End/M).
// BASE=... PUPPETEER=... CHROME=... node public/v2/tests/e2e/groups.js
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const fs = require('fs'), os = require('os'), path = require('path');
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
  await page.evaluate(() => localStorage.removeItem('fn.layout.v1'));
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

  await page.keyboard.press('b');
  const first = (await clipBoxes())[0];
  await page.mouse.click(first.x + first.w / 2, first.y + first.h / 2); await sleep(150);
  await page.keyboard.press('v');
  let pair = await clipBoxes();
  ok('razor makes an adjacent pair', pair.length === 3, String(pair.length));
  pair.sort((a, b) => a.left - b.left);
  const left0 = pair[0], right0 = pair[1];
  await page.keyboard.down('Alt');
  await page.mouse.move(right0.x + 2, right0.y + right0.h / 2);
  await page.mouse.down();
  await page.mouse.move(right0.x + 42, right0.y + right0.h / 2, { steps: 5 });
  await page.mouse.up();
  await page.keyboard.up('Alt'); await sleep(150);
  const pair2 = await clipBoxes();
  const left1 = pair2.find((c) => c.id === left0.id), right1 = pair2.find((c) => c.id === right0.id);
  ok('Alt-drag rolls the shared edit point', Math.abs((left1.w - left0.w) - 40) < 3 && Math.abs((right1.left - right0.left) - 40) < 3,
    `${left1.w - left0.w} / ${right1.left - right0.left}`);

  const edge = (await clipBoxes()).find((c) => c.id === right0.id).x;
  const readT = () => page.evaluate(() => document.querySelector('.tcode').textContent);
  await page.mouse.click(edge, ruler.y + ruler.h / 2); await sleep(120);
  const exact = await readT();
  await page.mouse.click(edge + 4, ruler.y + ruler.h / 2); await sleep(120);
  ok('scrub snaps to clip edges', exact === (await readT()), `${exact} vs ${await readT()}`);

  await page.keyboard.press('Home'); await sleep(80);
  await page.keyboard.press('i'); await sleep(80);
  await page.keyboard.press('End'); await sleep(80);
  await page.keyboard.press('o'); await sleep(120);
  const rng = await box(page, '.ruler .range');
  ok('I/O draw the range', !!rng && rng.w > 10, rng && String(rng.w));
  await page.click('.tltools .ibtn[title="Loop in–out"]'); await sleep(100);
  ok('loop toggles', await page.evaluate(() => document.querySelector('.tltools .ibtn[title="Loop in–out"]').classList.contains('on')));

  const row = await box(page, '.trow.text');
  const all = await clipBoxes();
  const head = all.reduce((a, b) => (a.left < b.left ? a : b));
  const tail = all.reduce((a, b) => (a.left > b.left ? a : b));
  await page.mouse.move(head.x + 4, row.y + row.h + 30);
  await page.mouse.down();
  await page.mouse.move(tail.x + tail.w - 4, row.y + 4, { steps: 8 });
  await page.mouse.up(); await sleep(150);
  const boxed = await page.evaluate(() => document.querySelectorAll('.clip.sel').length);
  ok('marquee selects the covered clips', boxed === all.length, String(boxed));
  await page.keyboard.press('Home'); await sleep(60);
  await page.keyboard.down('Alt'); await page.keyboard.press('ArrowRight'); await page.keyboard.up('Alt'); await sleep(120);
  const right = await page.evaluate(() => document.querySelectorAll('.clip.sel').length);
  ok('Alt+→ selects clips to the right', right >= 2, String(right));

  await page.keyboard.press('m'); await sleep(120);
  ok('M adds a marker', (await page.$$('.ruler .marker')).length === 1);
  await page.evaluate(() => document.querySelector('.ruler .marker').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })));
  await sleep(120);
  ok('right-click removes the marker', (await page.$$('.ruler .marker')).length === 0);

  await page.keyboard.press('End'); await sleep(120);
  const tcode = () => page.evaluate(() => document.querySelector('.tcode').textContent);
  await page.evaluate(() => { const el = document.querySelector('.zoomrange'); el.value = 100; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await sleep(150);
  const onScreen = await page.evaluate(() => document.querySelectorAll('.clip').length);
  await page.evaluate(() => { const el = document.querySelector('.tlscroll'); el.scrollLeft = 5000; el.dispatchEvent(new Event('scroll')); });
  await sleep(200);
  const offScreen = await page.evaluate(() => document.querySelectorAll('.clip').length);
  ok('virtualization drops off-screen clips', offScreen < onScreen && offScreen === 0, `${offScreen}/${onScreen}`);
  await page.evaluate(() => { const el = document.querySelector('.tlscroll'); el.scrollLeft = 0; el.dispatchEvent(new Event('scroll')); });
  await page.keyboard.down('Shift'); await page.keyboard.press('z'); await page.keyboard.up('Shift'); await sleep(150);

  ok('End seeks to the project end', !/^00:00:00:00/.test(await tcode()));
  await page.keyboard.press('Home'); await sleep(120);
  ok('Home seeks to zero', /^00:00:00:00/.test(await tcode()));

  await page.evaluate(() => document.querySelector('.rail .railbtn:nth-child(3)').click()); await sleep(150);
  const srtPath = path.join(os.tmpdir(), 'fn-captions.srt');
  fs.writeFileSync(srtPath, '1\n00:00:00,500 --> 00:00:02,000\nပထမ\n\n2\n00:00:02,500 --> 00:00:04,000\nဒုတိယ\n');
  const fileInput = await page.$('.srtimport');
  await fileInput.uploadFile(srtPath);
  await sleep(250);
  const caps = await page.evaluate(() => document.querySelectorAll('.clip.caption').length);
  ok('SRT import adds caption clips', caps === 2, String(caps));
  const reflow = await page.evaluate(async () => {
    const { addAsrLines } = await import('/v2/engine/actions.js');
    const tr = { t: 0, seek(v) { this.t = v; } };
    const text = 'မြန်မာကဗျာတစ်ပုဒ်ကိုရေးပါမည်မြန်မာကဗျာတစ်ပုဒ်ကိုရေးပါမည်';
    const made = addAsrLines(window.__store, tr, [{ text, start: 10, end: 18 }]);
    return made.map((c) => ({ text: c.text, start: c.start, dur: c.dur }));
  });
  ok('ASR rows reflow into short caption cues', reflow.length >= 2 && reflow.every((c) => c.text.length <= 28), JSON.stringify(reflow));
  const reflowTotal = reflow.reduce((n, c) => n + c.dur, 0);
  ok('reflowed cues stay inside the 6s cue cap', reflowTotal > 5.9 && reflowTotal <= 6.01, String(reflowTotal));
  ok('reflowed cues run back to back from the segment start', reflow[0].start === 10 && reflow.every((c, i) => i === 0 || Math.abs(c.start - (reflow[i - 1].start + reflow[i - 1].dur)) < 0.01), JSON.stringify(reflow));


  const clipsBeforeSave = await page.evaluate(() => document.querySelectorAll('.clip').length);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyS'); await page.keyboard.up('Control'); await sleep(300);
  const clipsAfterSave = await page.evaluate(() => document.querySelectorAll('.clip').length);
  ok('Ctrl+S saves without splitting', clipsBeforeSave === clipsAfterSave, `${clipsBeforeSave}/${clipsAfterSave}`);
  await page.keyboard.press('?'); await sleep(200);
  const scGroups = await page.evaluate(() => document.querySelectorAll('.shortcutbox .scgroup').length);
  ok('? opens the shortcut list', scGroups >= 4, String(scGroups));
  await page.keyboard.press('Escape'); await sleep(150);
  const scClosed = await page.evaluate(() => !document.querySelector('.shortcutbox'));
  ok('Esc closes the shortcut list', scClosed);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyE'); await page.keyboard.up('Control'); await sleep(200);
  ok('Ctrl+E opens export', await page.evaluate(() => !!document.querySelector('.exportbox')));
  await page.evaluate(() => document.querySelector('.exportbox .x').click()); await sleep(120);

  await page.evaluate(() => document.querySelector('.topbar .btn.primary').click()); await sleep(200);
  const labels = await page.evaluate(() => [...document.querySelectorAll('.exportbody label')].map((l) => l.textContent.trim()));
  ok('export dialog offers range and captions', labels.some((l) => l.startsWith('Range')) && labels.some((l) => l.startsWith('Captions')), labels.join('|'));
  await page.evaluate(() => document.querySelector('.exportbox .x').click()); await sleep(100);

  ok('no page errors', errors.length === 0, JSON.stringify(errors));
  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

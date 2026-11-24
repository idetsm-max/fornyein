// E2E for the mixer dialog (M5 UX): faders, pan, mute/solo/duck, meters, reset.
// BASE=... PUPPETEER=... CHROME=... node tests/e2e/mixer.js
const puppeteer = require(process.env.PUPPETEER || 'puppeteer');
const BASE = process.env.BASE || 'http://localhost:8765';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) failed++; console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? '  ' + extra : '')); };
const drag = async (page, sel, from, to) => {
  const r = await page.evaluate((s) => {
    const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y + b.height / 2, w: b.width };
  }, sel);
  await page.mouse.move(r.x + r.w * from, r.y); await page.mouse.down();
  await page.mouse.move(r.x + r.w * to, r.y, { steps: 8 }); await page.mouse.up();
  await sleep(250);
};

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

  const track = (kind) => page.evaluate((k) => window.__store.get().project.tracks.find((t) => t.kind === k), kind);

  await page.click('.tltools [title^="Mixer"]');
  await sleep(300);
  const opened = await page.evaluate(() => ({ dlg: !!document.querySelector('.mixerbox'),
    rows: [...document.querySelectorAll('.mixrow')].map((r) => r.className) }));
  ok('the timeline toolbar opens the mixer', opened.dlg && opened.rows.length === 2, JSON.stringify(opened.rows));

  await drag(page, '.mixrow.audio .mixfader', 0.9, 0.5);
  const vol = await track('audio');
  const volLabel = await page.evaluate(() => document.querySelector('.mixrow.audio .mixdb').textContent);
  ok('dragging the fader sets the track volume', Math.abs(vol.mixer.volume - 0.75) < 0.08, `${vol.mixer.volume} ${volLabel}`);
  ok('the fader shows the level in dB', /-\d/.test(volLabel) && /dB/.test(volLabel), volLabel);
  const label = await page.evaluate(() => window.__store.get().undoLabel);
  ok('the drag is a single undoable step', label === 'Volume Audio', label);

  await drag(page, '.mixrow.audio .mixpanin', 0.5, 0.2);
  const pan = await track('audio');
  const panLabel = await page.evaluate(() => document.querySelector('.mixrow.audio .mixpanout').textContent);
  ok('the pan slider pans left', pan.mixer.pan < -0.3 && /^L\d+$/.test(panLabel), `${pan.mixer.pan} ${panLabel}`);

  await page.click('.mixrow.audio .mixm'); await sleep(200);
  ok('M mutes the track', (await track('audio')).muted === true);
  await page.click('.mixrow.audio .mixs'); await sleep(200);
  ok('S solos the track', (await track('audio')).solo === true);
  await page.click('.mixrow.audio .mixd'); await sleep(200);
  ok('D turns on ducking for audio tracks', (await track('audio')).mixer.ducking === true);
  ok('video rows have no ducking button', (await page.$$('.mixrow.video .mixd')).length === 0);

  await page.evaluate(async () => {
    const { setMeterSource } = await import('/v2/engine/meters.js');
    const id = window.__store.get().project.tracks.find((t) => t.kind === 'audio').id;
    const analyser = { fftSize: 4, getFloatTimeDomainData: (b) => b.set([0.5, 0.5, 0.5, 0.5]) };
    setMeterSource({ buses: new Map([[id, { analyser }]]) });
  });
  await sleep(250);
  const meter = await page.evaluate(() => document.querySelector('.mixrow.audio .mixmeter .lvl')?.style.width);
  ok('the level meter follows the bus analyser', meter === '100%', String(meter));

  await page.evaluate(() => [...document.querySelectorAll('.mixfoot .btn')]
    .find((b) => /Reset/.test(b.textContent)).click());
  await sleep(250);
  const reset = await track('audio');
  ok('Reset all restores unity gain and centre pan', reset.mixer.volume === 1 && reset.mixer.pan === 0, JSON.stringify(reset.mixer));

  await page.keyboard.press('Escape'); await sleep(250);
  ok('Escape closes the mixer', await page.evaluate(() => !document.querySelector('.mixerbox')));
  await page.keyboard.down('Control'); await page.keyboard.down('Shift');
  await page.keyboard.press('M'); await page.keyboard.up('Shift'); await page.keyboard.up('Control');
  await sleep(300);
  ok('Ctrl+Shift+M reopens the mixer', await page.evaluate(() => !!document.querySelector('.mixerbox')));
  await page.keyboard.press('Escape'); await sleep(200);

  const zoom = await page.evaluate(() => {
    const st = getComputedStyle(document.querySelector('.zoomrange')); return { pos: st.position, pe: st.pointerEvents };
  });
  await drag(page, '.zoomrange', 0.5, 0.8);
  const zoomVal = await page.evaluate(() => +document.querySelector('.zoomrange').value);
  ok('every range slider stays a real slider (no overlay rule)',
    zoom.pos === 'static' && zoom.pe === 'auto' && zoomVal > 55, JSON.stringify({ ...zoom, zoomVal }));

  ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})();

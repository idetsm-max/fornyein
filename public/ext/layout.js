// Layout module (loaded LAST): CapCut-style single-screen editor. The page itself never scrolls and no scrollbars are shown.
//   Top bar  : brand · frame size · status · project · EXPORT
//   Upper row: LEFT  = TOOLS   (audio, text + subtitle list, music, background/logo)
//              CENTER= PREVIEW in a fixed frame (the frame never changes size, only the picture inside is letter-boxed)
//              RIGHT = EFFECTS (style, effects/animation/presets, audio effects, credits, export)
//   Bottom   : TIMELINE (transport, Tap-sync, auto-draft, split/merge, undo, waveform with subtitle blocks)
// It moves the elements the other modules created into place, so every handler / id keeps working.
// Every step is wrapped: if one piece fails the rest still works and a red banner says which one.
const FN = window.FN, $ = (id) => document.getElementById(id);
const P = () => FN.P;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => k && e.append(k)); return e; }
const short = (s) => (s || '').replace(/^(local:|Music\/|BG\/|Logo\/)/, '');
const errs = [];
const safe = (name, fn, fallback) => { try { return fn(); } catch (e) { errs.push(name + ': ' + e.message); console.error('[layout]', name, e); return fallback; } };

// ---------- grab EVERY element we need while the old page is still in the document ----------
// (getElementById returns null for nodes that were already moved into a detached container)
const playBtn = $('play'), timeEl = $('time'), wfEl = $('wf'), cvEl = FN.cv;
const playRow = playBtn.closest('.row'), wfHint = wfEl.nextElementSibling;
const oldHeader = document.querySelector('header'), oldMain = document.querySelector('main');
const cards = [...document.querySelectorAll('.card')];
const byText = (s) => cards.find((c) => c.textContent.trim().startsWith(s));
const byTitle = (s) => cards.find((c) => { const b = c.querySelector('b'); return b && b.textContent.trim() === s; });   // exact first-heading match
const previewCard = cvEl.closest('.card') || cvEl.parentElement;
const timelineCard = byText('Timeline ကိရိယာ'), textCard = $('txt').closest('.card'), listCard = $('list').closest('.card');
const effectsCard = byText('Effect / Animation / Preset'), creditsCard = byText('Credits'), mixerCard = byTitle('Audio Mixer');
const musicCard = $('card-music'), bgCard = $('card-bg'), logoCard = $('card-logo');
const srtBtn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'SRT export');
const safeLbl = [...document.querySelectorAll('label')].find((l) => l.textContent.includes('Safe area'));
const tlTools = timelineCard && timelineCard.querySelector('.row'), tlSettings = $('lead').closest('.row');
const fileLbl = $('file').closest('label'), importLbl = $('loadJson').closest('label');
const card = (title, ...kids) => { const c = mk('div', { className: 'card' }); if (title) c.append(mk('b', { textContent: title })); kids.forEach((k) => k && c.append(k)); return c; };
const row = (...kids) => mk('div', { className: 'row' }, kids);
[['effects', effectsCard], ['credits', creditsCard], ['mixer', mixerCard], ['music', musicCard], ['background', bgCard], ['logo', logoCard], ['text', textCard], ['list', listCard], ['timeline', timelineCard]]
  .forEach(([n, c]) => { if (!c) errs.push(n + ' card မတွေ့'); });

// ---------- cards that are new / re-assembled ----------
const fileInfo = mk('span', { className: 'mut' });
const inputCard = safe('inputCard', () => {
  if (fileLbl.childNodes[0] && fileLbl.childNodes[0].nodeType === 3) fileLbl.childNodes[0].textContent = '';
  fileLbl.classList.add('bigbtn'); fileLbl.prepend(mk('span', { textContent: '📂 ဖိုင်ရွေးမယ် (Audio / Video)' })); $('file').style.display = 'none';
  return card('ကဗျာဖတ်သံ', row(fileLbl), row(fileInfo),
    mk('div', { className: 'mut', style: 'margin-top:10px;line-height:1.7;font-size:13px', textContent: 'Audio ရွေးရင် နောက်ခံကို "နောက်ခံ" tab မှာ သီးသန့်ရွေးပါမယ်။ Video ရွေးရင် Video ထဲက ပုံကို နောက်ခံ၊ အသံကို ပင်မအသံအဖြစ် သုံးပြီး နောက်ခံ ရွေးခွင့်ကို ပိတ်ထားပါမယ်။ Frame size ကို အပေါ်ဆုံး bar မှာ ရွေးပါ။' }));
});
const styleCard = safe('styleCard', () => card('စာတန်း ပုံစံ', $('fsz').closest('.row'), $('extra')));
const checkBox = mk('div', { className: 'check' });
const exportCard = card('စစ်ပြီး ထုတ်မယ်', checkBox, row(srtBtn, mk('span', { className: 'mut', textContent: 'SRT = စာတန်းဖိုင် (YouTube/VLC အတွက်)' })),
  mk('div', { className: 'mut', style: 'margin-top:10px;font-size:13px;line-height:1.7', textContent: 'MP4 ထုတ်ခလုတ်က အပေါ်ဆုံး bar ညာဘက်မှာ ရှိပါတယ်။ ထုတ်နေတုန်း tab ကို မပိတ်ပါနဲ့။' }));

// ---------- tab groups ----------
function group(title, defs) {
  const tabs = mk('div', { className: 'tabs' }), body = mk('div', { className: 'pbody' }), btns = [], panes = [];
  defs.forEach((d, i) => {
    btns.push(mk('button', { onclick: () => go(i), title: d.name }, [mk('span', { className: 'ic', textContent: d.ic }), mk('span', { className: 'tn', textContent: d.name })])); tabs.append(btns[i]);
    const p = mk('section', { className: 'pane' }, d.els); panes.push(p); body.append(p);
  });
  function go(i) { panes.forEach((p, j) => p.classList.toggle('on', j === i)); btns.forEach((b, j) => b.classList.toggle('on', j === i)); body.scrollTop = 0; refresh(); }
  return { btns, panes, go, el: mk('div', { className: 'side' }, [mk('div', { className: 'sidehead', textContent: title }), tabs, body]) };
}
const left = group('TOOLS', [
  { ic: '🎵', name: 'အသံ', els: [inputCard] },
  { ic: '✍️', name: 'စာသား', els: [textCard, listCard] },
  { ic: '🎶', name: 'Music', els: [musicCard] },
  { ic: '🖼', name: 'နောက်ခံ', els: [bgCard, logoCard] },
]);
const right = group('EFFECTS', [
  { ic: '🎨', name: 'ပုံစံ', els: [styleCard] },
  { ic: '✨', name: 'Effect', els: [effectsCard] },
  { ic: '🎚', name: 'အသံ', els: [mixerCard] },
  { ic: '🏷', name: 'Credits', els: [creditsCard] },
  { ic: '📤', name: 'ထုတ်', els: [exportCard] },
]);

// ---------- top bar ----------
const top = safe('topbar', () => {
  if (importLbl.childNodes[0] && importLbl.childNodes[0].nodeType === 3) importLbl.childNodes[0].textContent = 'Project import';
  importLbl.classList.add('btnlike'); $('loadJson').style.display = 'none'; $('saveJson').classList.add('btnlike'); $('prog').style.width = '110px';
  return mk('header', { className: 'topbar' }, [mk('span', { className: 'brand', textContent: 'For Nyein' }), $('size'), mk('span', { className: 'grow' }), $('status'), $('saveJson'), importLbl, $('export'), $('cancel'), $('prog')]);
}) || mk('header', { className: 'topbar' }, [mk('span', { className: 'brand', textContent: 'For Nyein' })]);

// ---------- timeline (bottom) ----------
const timeline = mk('div', { className: 'tl' });
safe('timeline', () => {
  tlSettings.classList.remove('mut');
  const settings = mk('details', { className: 'tlset' }, [mk('summary', { textContent: '⚙ ချိန်ညှိ' }), tlSettings]);
  const bar = mk('div', { className: 'bar' }, [playBtn, timeEl, safeLbl, mk('span', { className: 'sep' }), ...(tlTools ? [...tlTools.children] : []), mk('span', { className: 'sep' }), settings]);
  const hint = mk('div', { className: 'hint', textContent: 'Space = Play · T = Tap-sync (စာကြောင်းတစ်ကြောင်း ဖတ်နေစဉ် နှိပ်ထား) · A = audition · S/M = split/merge · Del · ←/→ = ၁၀ms (Shift ၁၀၀ms၊ Alt = အဆုံး) · R/V/L = review/verify/lock · Ctrl+Z/Y' });
  timeline.append(bar, wfEl, hint);
});

// ---------- preview (fixed frame; the same card element is kept so the safe-area overlay + drag-to-position still work) ----------
const stage = previewCard;
stage.classList.remove('card'); stage.classList.add('stage'); stage.style.padding = '';
safe('stageClean', () => { playRow && playRow.remove(); wfHint && wfHint.remove(); });
const center = mk('div', { className: 'center' }, [stage]);

// ---------- assemble ----------
document.body.prepend(mk('div', { className: 'app' }, [top, mk('div', { className: 'mid' }, [left.el, center, right.el]), timeline]));
safe('removeOld', () => { oldHeader && oldHeader.remove(); oldMain && oldMain.remove(); });

// ---------- design (injected last, so a failure above never leaves a half-styled page) ----------
document.head.append(mk('style', { textContent: `
:root{--bg:#0b0e14;--bg2:#10141d;--card:#161b26;--line:#262e42;--tx:#e9edf6;--mut:#8b96b0;--ac:#5b9dff;--ac2:#7c6cff;--ok:#3ddc84}
html,body{height:100%;overflow:hidden;margin:0}
body{background:var(--bg);color:var(--tx)}
.app{height:100vh;height:100dvh;display:grid;grid-template-rows:52px minmax(0,1fr) 232px}
.topbar{display:flex;align-items:center;gap:10px;padding:0 14px;background:var(--bg2);border-bottom:1px solid var(--line);min-width:0}
.brand{font-weight:700;font-size:17px;background:linear-gradient(135deg,var(--ac),var(--ac2));-webkit-background-clip:text;background-clip:text;color:transparent;white-space:nowrap}
.grow{flex:1;min-width:0}
.topbar #status{color:var(--mut);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:30vw}
.topbar select{max-width:170px}
.mid{display:grid;grid-template-columns:clamp(300px,25vw,400px) minmax(0,1fr) clamp(300px,27vw,420px);min-height:0}
.side{display:grid;grid-template-rows:auto auto minmax(0,1fr);min-height:0;background:var(--bg2)}
.mid>.side:first-child{border-right:1px solid var(--line)}.mid>.side:last-child{border-left:1px solid var(--line)}
.sidehead{padding:8px 14px 0;font-size:10.5px;letter-spacing:1.6px;color:var(--mut);font-weight:700}
.tabs{display:flex;gap:3px;padding:6px 8px 0;border-bottom:1px solid var(--line);overflow:hidden}
.tabs button{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 2px;font-size:11px;line-height:1.3;border-radius:8px 8px 0 0;border:1px solid transparent;border-bottom:none;background:transparent;color:var(--mut);position:relative}
.tabs button .ic{font-size:17px}.tabs button .tn{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tabs button.on{background:var(--card);color:#fff;border-color:var(--line);box-shadow:inset 0 2px 0 var(--ac)}
.tabs button.done::after{content:'';position:absolute;top:4px;right:6px;width:6px;height:6px;border-radius:50%;background:var(--ok)}
.pbody{overflow:auto;padding:12px;min-height:0;scrollbar-width:none}
.pbody::-webkit-scrollbar,.tabs::-webkit-scrollbar,.pane::-webkit-scrollbar,#list::-webkit-scrollbar{display:none}
.pane{display:none}.pane.on{display:block}
.pbody .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;margin:0 0 12px}
.center{min-width:0;min-height:0;padding:12px;display:flex}
.stage{position:relative;flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;min-width:0;min-height:0;padding:12px;border:1px solid var(--line);border-radius:14px;background:radial-gradient(800px 400px at 50% 40%,#151b2b,#0a0d13)}
.stage canvas#cv{flex:none;border-radius:6px;box-shadow:0 8px 40px rgba(0,0,0,.55)}
.tl{display:grid;grid-template-rows:auto minmax(80px,1fr) auto;gap:6px;padding:8px 14px;background:var(--bg2);border-top:1px solid var(--line);min-height:0}
.tl .bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;position:relative}
.tl .bar .sep{width:1px;height:22px;background:var(--line);margin:0 2px}
.tl .row{margin:0}
.tlset{position:relative}
.tlset>summary{cursor:pointer;list-style:none;padding:6px 11px;border:1px solid var(--line);border-radius:8px;background:#1d2434;font-size:13px;white-space:nowrap}
.tlset>summary::-webkit-details-marker{display:none}
.tlset>.row{position:absolute;left:0;bottom:calc(100% + 8px);z-index:20;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px;min-width:520px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.tl canvas#wf{width:100%;height:100%;min-height:0;border-radius:8px;border:1px solid var(--line)}
.tl .hint{color:var(--mut);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
button,select,input,textarea{border-radius:8px}
button{background:#1d2434;border:1px solid var(--line);padding:6px 11px;color:var(--tx)}
button:hover:not(:disabled){border-color:var(--ac)}
button.pri,.bigbtn{background:linear-gradient(135deg,var(--ac),var(--ac2));border-color:transparent;color:#fff}
.tabs button{padding:6px 2px}
.bigbtn{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border-radius:12px;font-weight:600;cursor:pointer;font-size:14px}
.btnlike{border:1px solid var(--line);padding:6px 11px;border-radius:8px;cursor:pointer;color:var(--tx);background:#1d2434;font-size:13px;white-space:nowrap}
#export{padding:8px 18px;font-weight:600}
#list{max-height:none;scrollbar-width:none}
.check{display:grid;grid-template-columns:22px 1fr;gap:4px 8px;align-items:center;font-size:14px;margin-bottom:10px}
.check .ok{color:var(--ok)}.check .no{color:#f5b83d}
.lbanner{position:fixed;left:0;right:0;top:0;z-index:99;background:#7a1f2b;color:#fff;font:12px/1.5 system-ui;padding:6px 12px}
@media(max-width:900px){
  html,body{overflow:auto}.app{height:auto;display:block}.mid{display:block}.side{max-height:70vh}
  .stage{height:56vw;min-height:240px}.center{padding:8px}.tl{height:240px}
}
` }));

// ---------- fit the preview + waveform to the space ----------
function fit() {
  const cs = getComputedStyle(stage);
  const w = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), h = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  if (w > 20 && h > 20) {
    const ar = cvEl.width / cvEl.height; let cw = w, ch = w / ar; if (ch > h) { ch = h; cw = h * ar; }
    cvEl.style.width = Math.floor(cw) + 'px'; cvEl.style.height = Math.floor(ch) + 'px';
  }
  const ww = Math.round(wfEl.clientWidth);
  if (ww > 50 && wfEl.width !== ww) { wfEl.width = ww; FN.redraw(); }
}
safe('observers', () => { new ResizeObserver(() => safe('fit', fit)).observe(stage); new ResizeObserver(() => safe('fit', fit)).observe(timeline); window.addEventListener('resize', () => safe('fit', fit)); setInterval(() => safe('fit', fit), 400); });

// ---------- live state: ticks, file info, readiness list ----------
function refresh() {
  safe('refresh', () => {
    const p = P(), md = p.media || {}, subs = p.subtitles.length, cr = p.credits || {};
    fileInfo.textContent = FN.audio ? `${short(md.main) || 'ဖိုင်'} · ${FN.audio.duration.toFixed(1)} s${md.mainIsVideo ? ' · Video' : ''}` : (md.main ? `${short(md.main)} — ဖိုင်ကို ပြန်ရွေးပါ` : 'မရွေးရသေးပါ');
    const dl = [!!FN.audio, subs > 0, !!md.music, !!(md.bg || md.mainIsVideo)];
    left.btns.forEach((b, i) => b.classList.toggle('done', dl[i]));
    if (right.panes[4].classList.contains('on')) {
      const items = [
        [!!FN.audio, 'အသံ', FN.audio ? FN.audio.duration.toFixed(1) + ' s' + (md.mainIsVideo ? ' (Video)' : '') : 'မရွေးရသေး'],
        [subs > 0, 'စာတန်း', subs ? subs + ' ကြောင်း' : 'မရှိသေး'],
        [true, 'နောက်ခံ', md.mainIsVideo ? 'Video ရဲ့ ပုံ' : (md.bg ? short(md.bg) : 'မရွေး (အနက်ရောင်)')],
        [true, 'Music', md.music ? short(md.music) : 'မရှိ'],
        [true, 'Credits', cr.titleCard && (cr.author || cr.reader || cr.poem) ? 'Title card ' + cr.titleDur + ' s' : (cr.corner ? 'ထောင့်မှာ' : 'မရှိ')],
        [true, 'Frame size', p.output.size],
      ];
      checkBox.textContent = '';
      for (const [ok, k, v] of items) checkBox.append(mk('span', { className: ok ? 'ok' : 'no', textContent: ok ? '✔' : '○' }), mk('span', { textContent: `${k}: ${v}` }));
    }
  });
}
setInterval(refresh, 500);
left.go(0); right.go(0); safe('fit', fit); safe('redraw', () => FN.redraw());

if (errs.length) document.body.append(mk('div', { className: 'lbanner', textContent: 'Layout error — ' + errs.join(' | '), onclick: (e) => e.currentTarget.remove() }));

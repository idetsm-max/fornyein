// Timeline zoom controls (CapCut style): − / slider / + / Fit in the timeline toolbar. Mouse: Ctrl+wheel = zoom, wheel = scroll, + / - keys.
const FN = window.FN;
function mk(tag, props = {}, kids = []) { const e = Object.assign(document.createElement(tag), props); kids.forEach((k) => e.append(k)); return e; }
document.head.append(mk('style', { textContent: '.app{grid-template-rows:52px minmax(0,1fr) 300px}.tlzoom{display:flex;align-items:center;gap:6px;margin-left:auto}.tlzoom input[type=range]{width:120px;padding:0}.tlzoom button{padding:4px 10px}' }));
const bar = document.querySelector('.tl .bar');
if (bar) {
  const MIN = 5, RATIO = 120;                                          // slider covers 5 … 600 pixels per second
  const slider = mk('input', { type: 'range', min: 0, max: 100, step: 1, title: 'Zoom (Ctrl + wheel)' });
  slider.oninput = () => FN.setPps(MIN * Math.pow(RATIO, +slider.value / 100));
  const box = mk('div', { className: 'tlzoom' }, [
    mk('button', { textContent: '−', title: 'Zoom out ( - )', onclick: () => FN.zoomBy(1 / 1.4) }), slider,
    mk('button', { textContent: '+', title: 'Zoom in ( + )', onclick: () => FN.zoomBy(1.4) }),
    mk('button', { textContent: 'Fit', title: 'Timeline တစ်ခုလုံး မြင်ရအောင်', onclick: () => FN.zoomFit() }),
  ]);
  bar.append(box);
  setInterval(() => { if (document.activeElement !== slider) slider.value = Math.round(100 * Math.log(Math.max(MIN, FN.view.pps) / MIN) / Math.log(RATIO)); }, 250);
}
